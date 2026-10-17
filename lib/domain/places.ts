import { L, type Localized } from './types';

export interface Place {
  name: Localized;
  /** Height for peaks, distance for lakes, in meters. */
  v: number;
  region: Localized;
  /** Google Maps query, always in Polish. */
  q: string;
}

export interface Lake extends Place {
  how: Localized;
}

const R = {
  gubalowka: L('Pogórze Gubałowskie', 'Gubałówka Foothills'),
  bieszczady: L('Bieszczady', 'Bieszczady Mountains'),
  karkonosze: L('Karkonosze', 'Giant Mountains'),
  tatry: L('Tatry', 'Tatra Mountains'),
  swietokrzyskie: L('Góry Świętokrzyskie', 'Holy Cross Mountains'),
  sleza: L('Masyw Ślęży', 'Ślęża Massif'),
  kaczawskie: L('Góry Kaczawskie', 'Kaczawskie Mountains'),
  bardzkie: L('Góry Bardzkie', 'Bardo Mountains'),
  walbrzyskie: L('Góry Wałbrzyskie', 'Wałbrzych Mountains'),
  opawskie: L('Góry Opawskie', 'Opawskie Mountains'),
  makowski: L('Beskid Makowski', 'Maków Beskids'),
  stolowe: L('Góry Stołowe', 'Table Mountains'),
  maly: L('Beskid Mały', 'Little Beskids'),
  kamienne: L('Góry Kamienne', 'Stone Mountains'),
  rudawy: L('Rudawy Janowickie'),
  bystrzyckie: L('Góry Bystrzyckie', 'Bystrzyckie Mountains'),
  zlote: L('Góry Złote', 'Golden Mountains'),
  niski: L('Beskid Niski', 'Low Beskids'),
  sowie: L('Góry Sowie', 'Owl Mountains'),
  pieniny: L('Pieniny', 'Pieniny Mountains'),
  orlickie: L('Góry Orlickie', 'Orlické Mountains'),
  bialskie: L('Góry Bialskie', 'Bialskie Mountains'),
  izerskie: L('Góry Izerskie', 'Jizera Mountains'),
  wyspowy: L('Beskid Wyspowy', 'Island Beskids'),
  slaski: L('Beskid Śląski', 'Silesian Beskids'),
  sadecki: L('Beskid Sądecki', 'Sącz Beskids'),
  gorce: L('Gorce', 'Gorce Mountains'),
  snieznik: L('Masyw Śnieżnika', 'Śnieżnik Massif'),
  zywiecki: L('Beskid Żywiecki', 'Żywiec Beskids'),
  australia: L('Australia'),
  antarktyda: L('Antarktyda', 'Antarctica'),
  europa: L('Europa', 'Europe'),
  afryka: L('Afryka', 'Africa'),
  amerykaPn: L('Ameryka Północna', 'North America'),
  amerykaPd: L('Ameryka Południowa', 'South America'),
  azja: L('Azja', 'Asia'),
  gostynin: L('Pojezierze Gostynińskie', 'Gostynin Lake District'),
  mazury: L('Mazury', 'Masuria'),
  deser: L('na deser', 'for dessert'),
} satisfies Record<string, Localized>;

const PEAK_GEO: Record<string, string> = { 'Gubałówka': '49.30750,19.93583' };

const peak = (name: Localized, v: number, region: Localized): Place => ({
  name,
  v,
  region,
  q: PEAK_GEO[name.pl] ?? `${name.pl} ${region.pl}`,
});

// Our mountains first: Bieszczady, Karkonosze, Tatry, from lowest to highest.
export const NASZE: Place[] = [
  peak(L('Gubałówka'), 1126, R.gubalowka),
  peak(L('Smerek'), 1222, R.bieszczady),
  peak(L('Połonina Wetlińska'), 1255, R.bieszczady),
  peak(L('Połonina Caryńska'), 1297, R.bieszczady),
  peak(L('Wielka Rawka'), 1307, R.bieszczady),
  peak(L('Halicz'), 1333, R.bieszczady),
  peak(L('Tarnica'), 1346, R.bieszczady),
  peak(L('Szrenica'), 1362, R.karkonosze),
  peak(L('Wielki Szyszak'), 1509, R.karkonosze),
  peak(L('Śnieżka'), 1603, R.karkonosze),
  peak(L('Giewont'), 1894, R.tatry),
  peak(L('Kasprowy Wierch'), 1987, R.tatry),
  peak(L('Kozi Wierch'), 2291, R.tatry),
  peak(L('Rysy'), 2500, R.tatry),
];

// Then Korona Gór Polski, from lowest to highest.
export const PEAKS: Place[] = [
  peak(L('Łysica'), 614, R.swietokrzyskie),
  peak(L('Ślęża'), 718, R.sleza),
  peak(L('Skopiec'), 724, R.kaczawskie),
  peak(L('Kłodzka Góra'), 765, R.bardzkie),
  peak(L('Chełmiec'), 851, R.walbrzyskie),
  peak(L('Biskupia Kopa'), 889, R.opawskie),
  peak(L('Lubomir'), 904, R.makowski),
  peak(L('Szczeliniec Wielki'), 919, R.stolowe),
  peak(L('Czupel'), 933, R.maly),
  peak(L('Waligóra'), 936, R.kamienne),
  peak(L('Skalnik'), 945, R.rudawy),
  peak(L('Jagodna'), 977, R.bystrzyckie),
  peak(L('Kowadło'), 989, R.zlote),
  peak(L('Lackowa'), 997, R.niski),
  peak(L('Wielka Sowa'), 1015, R.sowie),
  peak(L('Wysoka'), 1050, R.pieniny),
  peak(L('Orlica'), 1084, R.orlickie),
  peak(L('Rudawiec'), 1112, R.bialskie),
  peak(L('Wysoka Kopa'), 1126, R.izerskie),
  peak(L('Mogielica'), 1171, R.wyspowy),
  peak(L('Skrzyczne'), 1257, R.slaski),
  peak(L('Radziejowa'), 1262, R.sadecki),
  peak(L('Turbacz'), 1310, R.gorce),
  peak(L('Tarnica'), 1346, R.bieszczady),
  peak(L('Śnieżnik'), 1426, R.snieznik),
  peak(L('Śnieżka'), 1603, R.karkonosze),
  peak(L('Babia Góra'), 1725, R.zywiecki),
  peak(L('Rysy'), 2500, R.tatry),
];

// Korona Ziemi, after the Polish crown.
export const SEVEN: Place[] = [
  peak(L('Góra Kościuszki', 'Mount Kosciuszko'), 2228, R.australia),
  peak(L('Masyw Vinsona', 'Vinson Massif'), 4892, R.antarktyda),
  peak(L('Elbrus'), 5642, R.europa),
  peak(L('Kilimandżaro', 'Kilimanjaro'), 5895, R.afryka),
  peak(L('Denali'), 6190, R.amerykaPn),
  peak(L('Aconcagua'), 6961, R.amerykaPd),
  peak(L('Mount Everest'), 8849, R.azja),
];

export const CLIMB: Place[] = [...NASZE, ...PEAKS, ...SEVEN];

export const PHASES = [
  { id: 'ours', items: NASZE },
  { id: 'crown', items: PEAKS },
  { id: 'seven', items: SEVEN },
] as const;
export type PhaseId = (typeof PHASES)[number]['id'];

const ALONG = L('wzdłuż', 'lengthwise');
const ACROSS = L('wszerz', 'across');

const lake = (name: Localized, how: Localized, v: number, region: Localized, q = name.pl): Lake => ({ name, how, v, region, q });

export const LAKES: Lake[] = [
  lake(L('Morskie Oko'), ALONG, 862, R.tatry),
  lake(L('Jezioro Lucieńskie', 'Lake Lucieńskie'), ACROSS, 930, R.gostynin),
  lake(L('Jezioro Zdworskie', 'Lake Zdworskie'), ACROSS, 1400, R.gostynin),
  lake(L('Jezioro Mikołajskie', 'Lake Mikołajskie'), ACROSS, 1600, R.mazury),
  lake(L('Jezioro Lucieńskie', 'Lake Lucieńskie'), ALONG, 3385, R.gostynin),
  lake(L('Jezioro Zdworskie', 'Lake Zdworskie'), ALONG, 3500, R.gostynin),
  lake(L('Niegocin', 'Lake Niegocin'), ACROSS, 4800, R.mazury, 'Jezioro Niegocin'),
  lake(L('Jezioro Mikołajskie', 'Lake Mikołajskie'), ALONG, 5800, R.mazury),
  lake(L('Niegocin', 'Lake Niegocin'), ALONG, 10800, R.mazury, 'Jezioro Niegocin'),
  lake(L('Śniardwy', 'Lake Śniardwy'), ACROSS, 13400, R.mazury, 'Jezioro Śniardwy'),
  lake(L('Śniardwy', 'Lake Śniardwy'), ALONG, 22100, R.mazury, 'Jezioro Śniardwy'),
  lake(L('Kanał La Manche', 'English Channel'), L('z Anglii do Francji', 'from England to France'), 33000, R.deser),
];
