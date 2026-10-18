'use client';

import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Award, FamilyState, Member, Prize, Session, Spin } from '@/lib/domain/types';
import type { MemberInput, MemberPatch, PrizeInput } from '@/lib/validation';
import { api, ApiError } from './api';

const STATE = ['state'] as const;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // No polling: refetch when the app comes back to the foreground. An iPad left open on the
        // screen must not keep the (free-tier, auto-suspending) database awake all day.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 15_000,
        retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
      },
    },
  });
}

export const useFamily = (enabled: boolean) =>
  useQuery({ queryKey: STATE, queryFn: () => api<FamilyState>('/api/state'), enabled });

/** Optimistic cache edit with rollback; the server state is refetched afterwards either way. */
function useOptimistic<V>(fn: (v: V) => Promise<unknown>, apply: (s: FamilyState, v: V) => FamilyState) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: STATE });
      const prev = qc.getQueryData<FamilyState>(STATE);
      if (prev) qc.setQueryData(STATE, apply(prev, v));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(STATE, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: STATE }),
  });
}

export function useSaveSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (added: Session[]) =>
      api<{ sessions: Session[] }>('/api/sessions', {
        method: 'POST',
        body: { sessions: added.map(({ id, swimmerId, date, lengths, pool }) => ({ id, swimmerId, date, lengths, pool })) },
      }),
    // Ids are fixed per draft, so retrying after a dropped connection can't duplicate anything.
    retry: (n, e) => e instanceof ApiError && e.code === 'offline' && n < 2,
    onSuccess: ({ sessions }) => {
      const ids = new Set(sessions.map((s) => s.id));
      qc.setQueryData<FamilyState>(STATE, (s) => s && { ...s, sessions: s.sessions.filter((x) => !ids.has(x.id)).concat(sessions) });
      return qc.invalidateQueries({ queryKey: STATE });
    },
  });
}

export const useDeleteSession = () =>
  useOptimistic(
    (id: string) => api(`/api/sessions/${id}`, { method: 'DELETE' }),
    (s, id) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }),
  );

export const useSetAvatar = () =>
  useOptimistic(
    ({ id, avatar }: { id: string; avatar: string }) => api(`/api/members/${id}`, { method: 'PATCH', body: { avatar } }),
    (s, { id, avatar }) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, avatar } : m)) }),
  );

export const useToggleAward = () =>
  useOptimistic(
    ({ memberId, badgeId, award }: { memberId: string; badgeId: string; award: Award | null }) =>
      award
        ? api(`/api/awards/${memberId}/${badgeId}`, { method: 'PUT', body: { givenOn: award.givenOn } })
        : api(`/api/awards/${memberId}/${badgeId}`, { method: 'DELETE' }),
    (s, { memberId, badgeId, award }) => ({
      ...s,
      awards: s.awards.filter((a) => !(a.memberId === memberId && a.badgeId === badgeId)).concat(award ? [award] : []),
    }),
  );

function useMemberMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: STATE }) });
}

export const useCreateMember = () =>
  useMemberMutation((input: MemberInput) => api<{ member: Member }>('/api/members', { method: 'POST', body: input }));

export const useUpdateMember = () =>
  useMemberMutation(({ id, patch }: { id: string; patch: MemberPatch }) => api<{ member: Member }>(`/api/members/${id}`, { method: 'PATCH', body: patch }));

export const useDeleteMember = () => useMemberMutation((id: string) => api(`/api/members/${id}`, { method: 'DELETE' }));

export const useCreatePrize = () => useMemberMutation((input: PrizeInput) => api<{ prize: Prize }>('/api/prizes', { method: 'POST', body: input }));

export const useUpdatePrize = () =>
  useMemberMutation(({ id, patch }: { id: string; patch: Partial<PrizeInput> }) => api<{ prize: Prize }>(`/api/prizes/${id}`, { method: 'PATCH', body: patch }));

export const useDeletePrize = () => useMemberMutation((id: string) => api(`/api/prizes/${id}`, { method: 'DELETE' }));

export interface SpinResult {
  spin: Spin;
  /** The prize list the server drew from, for drawing the wheel the result lands on. */
  prizes: Prize[];
}

/** Draws a prize on the server. The cache is updated by the caller once the wheel stops. */
export const useSpin = () =>
  useMutation({
    mutationFn: ({ memberId, badgeId }: { memberId: string; badgeId: string }) => api<SpinResult>(`/api/spins/${memberId}/${badgeId}`, { method: 'POST' }),
  });

export function useStoreSpin() {
  const qc = useQueryClient();
  return (spin: Spin) => {
    qc.setQueryData<FamilyState>(STATE, (s) =>
      s && { ...s, spins: s.spins.filter((x) => !(x.memberId === spin.memberId && x.badgeId === spin.badgeId)).concat(spin) },
    );
    return qc.invalidateQueries({ queryKey: STATE });
  };
}

export const useResetSpin = () =>
  useOptimistic(
    ({ memberId, badgeId }: { memberId: string; badgeId: string }) => api(`/api/spins/${memberId}/${badgeId}`, { method: 'DELETE' }),
    (s, { memberId, badgeId }) => ({ ...s, spins: s.spins.filter((x) => !(x.memberId === memberId && x.badgeId === badgeId)) }),
  );
