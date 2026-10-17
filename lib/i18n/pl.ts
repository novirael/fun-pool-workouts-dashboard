import type { ApiErrorCode } from '@/lib/api-errors';
import type { Dim } from '@/lib/domain/compare';
import type { SeasonKey } from '@/lib/domain/stats';

const rules = new Intl.PluralRules('pl-PL');
/** Polish plural: 1 długość, 2–4 długości, 5+ długości (12–14 count as "many"). */
export const plural = (n: number, one: string, few: string, many: string) => {
  const c = rules.select(n);
  return c === 'one' ? one : c === 'few' ? few : many;
};

const DIM: Record<Dim, string> = { height: 'wysokość', length: 'długość', width: 'szerokość' };
const DIM_GEN: Record<Dim, string> = { height: 'wysokości', length: 'długości', width: 'szerokości' };

export const pl = {
  appName: 'Pływackie wyprawy',
  appShortName: 'Pływanie',
  appDescription: 'Rodzinny dziennik pływania: treningi, odznaki i wielka wyprawa.',

  units: {
    lengths: (n: number) => plural(n, 'długość', 'długości', 'długości'),
    sessions: (n: number) => plural(n, 'trening', 'treningi', 'treningów'),
    weeks: (n: number) => plural(n, 'tydzień', 'tygodnie', 'tygodni'),
  },

  common: {
    loading: 'Ładuję…',
    loadFailed: 'Nie udało się wczytać danych.',
    retry: 'Spróbuj ponownie',
    save: 'Zapisz',
    saving: 'Zapisuję…',
    cancel: 'Anuluj',
    delete: 'Usuń',
    sure: 'Na pewno?',
    back: '← Wróć',
    saveFailed: 'Nie udało się zapisać, spróbuj jeszcze raz',
    deleteFailed: 'Nie udało się usunąć',
    offline: 'Brak połączenia z internetem',
  },

  errors: {
    unauthorized: 'Trzeba ponownie podać hasło.',
    invalid_password: 'Złe hasło, spróbuj jeszcze raz',
    not_configured: 'Aplikacja nie jest jeszcze skonfigurowana: na serwerze brakuje hasła.',
    member_unknown: 'Wybierz, kto korzysta z tego urządzenia.',
    forbidden: 'Tylko rodzic może to zrobić.',
    not_found: 'Tego już nie ma.',
    last_parent: 'Musi zostać przynajmniej jeden rodzic.',
    in_use: 'Ta osoba ma treningi lub odznaki. Możesz ją ukryć.',
    too_many: 'Osiągnięto limit osób w rodzinie.',
    validation: 'Sprawdź wpisane dane.',
    bad_request: 'Coś poszło nie tak.',
    server_error: 'Błąd serwera, spróbuj za chwilę.',
    rate_limited: 'Za dużo prób. Odczekaj kilka minut.',
  } satisfies Record<ApiErrorCode | 'rate_limited', string>,

  auth: {
    title: 'Hasło rodzinne',
    hint: 'Wpisz hasło, żeby wejść. To urządzenie je zapamięta.',
    placeholder: 'hasło',
    show: 'Pokaż',
    hide: 'Ukryj',
    submit: 'Wejdź',
    checking: 'Sprawdzam…',
  },

  who: {
    title: 'Kto tu jest?',
    hint: 'Wybierz siebie. To urządzenie zapamięta wybór.',
    kids: 'Dzieci',
    parents: 'Rodzice',
    switch: (name: string) => `Teraz: ${name}. Zmień osobę`,
    change: 'zmień',
    settings: 'Ustawienia rodziny',
  },

  tabs: { log: 'Trening', trip: 'Wyprawa', nav: 'Ekrany' },

  log: {
    title: 'Trening',
    today: (date: string) => `Dzisiaj, ${date}`,
    changeDate: 'zmień datę',
    dateLabel: 'Data treningu',
    notSwimming: 'Dziś nie pływa, stuknij, żeby dodać',
    minus: (n: number) => `minus ${n}`,
    plus: (n: number) => `plus ${n}`,
    equals: (lengthsWord: string, dist: string) => `${lengthsWord} = ${dist}`,
    pools: 'Basen',
    pool: { 15: 'Mały basen', 25: 'Głęboki basen' } as Record<15 | 25, string>,
    save: 'Zapisz trening',
    pickSomeone: 'Zaznacz, kto dziś pływał',
    noSwimmers: 'Nie ma jeszcze pływaków. Rodzic może ich dodać w ustawieniach rodziny ⚙️.',
    familyFrom: (dist: string) => `Rodzina: ${dist} z Gostynina`,
    stageNext: (stage: string, next: string) => `Etap: ${stage}. Następny przystanek: ${next}`,
    tripDone: 'Wyprawa skończona, jesteście w domu!',
  },

  profile: {
    changeAnimal: 'Zmień zwierzaka',
    pickAnimal: 'Wybierz swojego zwierzaka:',
    empty1: 'Jeszcze nie ma treningów.',
    empty2: 'Dodaj pierwszy na ekranie Trening.',
    ofPool: (dl: string) => `czyli ${dl} basenu`,
    bestSession: 'rekord na treningu',
    inARow: (weeksWord: string) => `${weeksWord} z rzędu`,
    phases: { ours: '⛰️ Nasze góry', crown: '👑 Korona Gór Polski', seven: '🌍 Korona Ziemi' },
    phaseDone: (title: string, n: number) => `✓ ${title}: wszystkie ${n} zdobyte!`,
    lakes: '🏞️ Nasze jeziora',
    badgesTitle: '🏅 Odznaki',
    toGive: (n: number) => `🎁 ${n} do wręczenia`,
    giveHint: 'Stuknij zdobytą odznakę, kiedy wręczysz prawdziwą.',
    giveHintKid: 'Rodzic zaznacza odznaki, kiedy wręczy prawdziwe.',
    earnedOn: (date: string) => `zdobyta ${date}`,
    given: '✓ wręczona',
    toGiveOne: '🎁 do wręczenia',
    history: 'Ostatnie treningi',
    poolLabel: { 15: 'mały basen 15 m', 25: 'głęboki basen 25 m' } as Record<15 | 25, string>,
    addedBy: (name: string) => `dodane przez: ${name}`,
  },

  ladder: {
    allDone: 'Wszystko zdobyte! 🎉',
    nowLake: 'Teraz przepływasz',
    nowPeak: 'Teraz wspinasz się na',
    showOnMap: '📍 Pokaż na mapie',
    left: (dl: string, pool: number, toPeak: boolean) => `Zostało ${dl} (basen ${pool} m) do ${toPeak ? 'szczytu' : 'brzegu'}`,
  },

  badges: {
    nextTitle: '🎖️ Następna odznaka',
    allTitle: '🎖️ Odznaki',
    allDone: 'Wszystkie odznaki zdobyte! 🏆',
    names: {
      seria4: 'Miesiąc bez przerwy',
      kijanka: 'Kijanka',
      tr12: 'Stały bywalec',
      rek1: 'Brązowy rekord',
      krewetka: 'Krewetka',
      tr24: 'Dwa tuziny',
      rybka: 'Złota rybka',
      seria12: 'Kwartał bez przerwy',
      pory: 'Cztery pory roku',
      rek2: 'Srebrny rekord',
      osmiornica: 'Ośmiornica',
      tr48: 'Rok w basenie',
      rok: 'Okrągły rok',
      zolw: 'Żółw morski',
      foka: 'Foka',
      seria26: 'Pół roku bez przerwy',
      rek3: 'Złoty rekord',
      tr72: 'Półtora roku',
      pingwin: 'Pingwin',
      delfin: 'Delfin',
      rekin: 'Rekin',
      wieloryb: 'Wieloryb',
      rek4: 'Mistrz rekordów',
      pletwal: 'Płetwal błękitny',
      setka: 'Setka!',
    } as Record<string, string>,
    desc: {
      dist: (d: string) => `Razem ${d}`,
      best: (d: string) => `${d} na jednym treningu`,
      count: (n: number) => `${n} ${plural(n, 'trening', 'treningi', 'treningów')}`,
      streak: (n: number) => `Co tydzień przez ${n} ${plural(n, 'tydzień', 'tygodnie', 'tygodni')}`,
      seasons: 'Trenuj wiosną, latem, jesienią i zimą',
      months: 'Trenuj w każdym z 12 miesięcy',
    },
    left: {
      dist: (d: string, n: number) => `Zostało ${d}, czyli około ${n} ${plural(n, 'trening', 'treningi', 'treningów')}.`,
      count: (n: number) => `Zostało ${n} ${plural(n, 'trening', 'treningi', 'treningów')}.`,
      streak: (n: number) => `Teraz ${n} ${plural(n, 'tydzień', 'tygodnie', 'tygodni')} z rzędu. Nie opuść żadnego tygodnia!`,
      best: (best: string, deep: string, small: string) => `Twój rekord to ${best}. Cel to ${deep} w głębokim basenie albo ${small} w małym.`,
      seasons: (missing: string) => `Brakuje: ${missing}.`,
      months: (n: number) => `Masz ${n} z 12 miesięcy.`,
    },
  },

  seasons: { spring: 'wiosna', summer: 'lato', autumn: 'jesień', winter: 'zima' } satisfies Record<SeasonKey, string>,

  trip: {
    title: 'Wielka wyprawa',
    sub: 'Z Gostynina na Mazury, w Bieszczady, Tatry i Karkonosze, a potem z powrotem do domu.',
    ofKm: (km: number) => `z ${km} km`,
    stageOf: (k: number, n: number) => `Etap ${k} z ${n}`,
    toStop: (stop: string, dist: string, dl: string) => `Do przystanku ${stop} zostało ${dist}, czyli ${dl}.`,
    stageFinish: (name: string, dist: string) => `Meta etapu: ${name}, za ${dist}.`,
    stageRoute: '🗺️ Trasa tego etapu w Google Maps',
    done: 'Cała wyprawa skończona, jesteście w domu! 🎉',
    who: 'Kto ile dołożył',
    stages: 'Trasy etapów',
    route: 'Trasa',
    stageEnd: (stage: string) => `meta etapu: ${stage}`,
    leg: 'trasa ↗',
    note: 'Odległości liczone w linii prostej między przystankami. Stuknij nazwę miejsca, żeby zobaczyć je na mapie. Trasy w Google Maps prowadzą drogami, więc wyjdą trochę dłuższe.',
  },

  cele: {
    title: 'Brawo! 🎉',
    inPool: (dl: string, pool: number) => `${dl} w basenie ${pool} m.`,
    record: '🏆 Nowy rekord!',
    newBadge: 'Nowa odznaka!',
    toPeak: (name: string, dl: string) => `Do szczytu ${name} zostało ${dl}.`,
    family: (dist: string) => `🗺️ Rodzina ma już ${dist} z Gostynina.`,
    reached: (stops: string) => `Dopłynęliście do: ${stops}!`,
    stageDone: (e: string, name: string) => `${e} Etap ${name} ukończony!`,
    ok: 'Super!',
  },

  compare: {
    pct: (pct: number, dim: Dim, of: string, v: string) => `To ${pct}% ${DIM_GEN[dim]} ${of} (${v})!`,
    almost: (dim: Dim, of: string, v: string) => `To prawie dokładnie ${DIM[dim]} ${of} (${v})!`,
    times: (n: string, dim: Dim, of: string, v: string) => `To ${n} razy ${DIM[dim]} ${of} (${v})!`,
  },

  family: {
    title: 'Rodzina',
    welcome: 'Witaj! 👋',
    welcomeText: 'Najpierw dodaj siebie jako rodzica. Potem dodasz resztę rodziny.',
    add: '+ Dodaj osobę',
    newTitle: 'Nowa osoba',
    editTitle: (name: string) => `Edycja: ${name}`,
    edit: 'Edytuj',
    you: '(Ty)',
    hidden: 'Ukryte',
    hide: 'Ukryj',
    restore: 'Przywróć',
    parent: 'Rodzic',
    child: 'Dziecko',
    swims: 'Pływa',
    notSwims: 'Nie pływa',
    name: 'Imię',
    subtitle: 'Podpis, np. „7 lat”',
    role: 'Rola',
    color: 'Kolor',
    avatar: 'Zwierzak',
    swimming: 'Pływanie',
    defaultLengths: 'Długości na start',
    pace: 'Cel: metrów w miesiącu',
    paceHint: 'Od tego zależą odznaki za dystans. Na przykład ok. 2500 m dla 7-latka, 3500 m dla 9-latka, 6000 m dla dorosłego.',
    records: 'Cele rekordów (metry na jednym treningu)',
    recordsHint: 'Rosnąco: brąz, srebro, złoto, mistrz.',
    export: 'Pobierz kopię danych',
    field: {
      name_required: 'Wpisz imię.',
      records_not_ascending: 'Każdy kolejny cel musi być większy.',
      number: 'Wpisz liczbę z dozwolonego zakresu.',
    },
  },
};

export type Messages = typeof pl;
