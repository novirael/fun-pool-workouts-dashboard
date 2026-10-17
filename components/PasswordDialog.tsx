'use client';

import { useState, type FormEvent } from 'react';
import { login } from '@/lib/client/api';
import { useI18n } from '@/lib/i18n/context';
import { errorText } from './Toast';

export default function PasswordDialog() {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(password);
    } catch (err) {
      setError(errorText(t, err, t.errors.server_error));
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={submit}>
        <p className="lead" aria-hidden="true">
          🏊🔑
        </p>
        <h1>{t.auth.title}</h1>
        <p className="sub">{t.auth.hint}</p>
        <div className="pw">
          <input
            className="input"
            type={show ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t.auth.placeholder}
            aria-label={t.auth.title}
            aria-invalid={!!error}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="button" className="btn ghost" onClick={() => setShow(!show)} aria-pressed={show}>
            {show ? t.auth.hide : t.auth.show}
          </button>
        </div>
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        <button className="btn wide" type="submit" disabled={busy || !password.trim()}>
          {busy ? t.auth.checking : t.auth.submit}
        </button>
      </form>
    </main>
  );
}
