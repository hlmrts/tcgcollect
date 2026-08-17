// api/pokemon.js
// Anbindung an die Pokémon TCG API (https://pokemontcg.io).
// Kostenlos nutzbar, ein optionaler API-Key erhöht das Rate-Limit deutlich.
// Registrierung: https://dev.pokemontcg.io/

const BASE = "https://api.pokemontcg.io/v2";

// Optional: eigenen kostenlosen API-Key eintragen für höhere Rate-Limits.
// Siehe README.md -> "API-Keys".
const API_KEY = "";

const SETS_CACHE_KEY = "cardvault:cache:pokemon:sets:v1";
const SETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function headers() {
  const h = { Accept: "application/json" };
  if (API_KEY) h["X-Api-Key"] = API_KEY;
  return h;
}

// Kleine, kuratierte Fallback-Liste bekannter Sets, falls die Live-API
// (z. B. wegen Netzwerkproblemen) nicht erreichbar ist.
const FALLBACK_SETS = [
  { id: "base1", name: "Base Set", series: "Base", logo: null, total: 102 },
  { id: "sv8", name: "Surging Sparks", series: "Scarlet & Violet", logo: null, total: 191 },
  { id: "sv7", name: "Stellar Crown", series: "Scarlet & Violet", logo: null, total: 142 },
  { id: "swsh12", name: "Silver Tempest", series: "Sword & Shield", logo: null, total: 195 },
  { id: "xy1", name: "XY", series: "XY", logo: null, total: 146 },
];

export async function fetchSets() {
  try {
    const cached = readSetsCache();
    if (cached) return cached;

    const res = await fetch(
      `${BASE}/sets?orderBy=-releaseDate&pageSize=250`,
      { headers: headers() }
    );
    if (!res.ok) throw new Error(`API antwortete mit Status ${res.status}`);
    const json = await res.json();
    const sets = (json.data || []).map((s) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      logo: s.images?.logo || null,
      releaseDate: s.releaseDate,
      total: s.printedTotal || s.total || null,
    }));
    writeSetsCache(sets);
    return sets;
  } catch (err) {
    console.warn("Pokémon-Sets konnten nicht geladen werden, nutze Fallback-Liste:", err);
    return FALLBACK_SETS;
  }
}

function readSetsCache() {
  try {
    const raw = localStorage.getItem(SETS_CACHE_KEY);
    if (!raw) return null;
    const { ts, sets } = JSON.parse(raw);
    if (Date.now() - ts > SETS_CACHE_TTL_MS) return null;
    return sets;
  } catch {
    return null;
  }
}

function writeSetsCache(sets) {
  try {
    localStorage.setItem(
      SETS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), sets })
    );
  } catch {
    /* Speicher evtl. voll – ignorieren */
  }
}

/**
 * Sucht eine Karte anhand von Set-ID und Kartennummer.
 * Gibt ein normalisiertes Kartenobjekt zurück oder wirft einen Fehler,
 * wenn keine Karte gefunden wurde.
 */
export async function fetchCardByNumber(setId, number) {
  const cleanNumber = String(number).trim();
  const query = encodeURIComponent(`set.id:${setId} number:${cleanNumber}`);

  let res;
  try {
    res = await fetch(`${BASE}/cards?q=${query}`, { headers: headers() });
  } catch (err) {
    throw new Error(
      "Netzwerkfehler: Die Pokémon TCG API war nicht erreichbar. Bitte Internetverbindung prüfen."
    );
  }

  if (!res.ok) {
    throw new Error(
      `Pokémon TCG API Fehler (${res.status}). Bitte später erneut versuchen.`
    );
  }

  const json = await res.json();
  const raw = json.data && json.data[0];
  if (!raw) {
    throw new Error(
      `Keine Karte mit Nummer "${cleanNumber}" in diesem Set gefunden.`
    );
  }

  return normalizeCard(raw);
}

function normalizeCard(raw) {
  return {
    number: raw.number,
    name: raw.name,
    setName: raw.set?.name || null,
    imageUrl: raw.images?.large || raw.images?.small || null,
    prices: extractPrices(raw),
    sourceUrl: raw.cardmarket?.url || raw.tcgplayer?.url || null,
    priceUpdatedAt: new Date().toISOString(),
  };
}

// Liefert beide Preise, sofern vorhanden: Cardmarket (EUR) und TCGplayer (USD).
function extractPrices(raw) {
  let eur = null;
  const cm = raw.cardmarket?.prices;
  if (cm) {
    const amount = cm.trendPrice ?? cm.averageSellPrice ?? cm.suggestedPrice ?? cm.lowPrice ?? null;
    if (typeof amount === "number") eur = amount;
  }

  let usd = null;
  const tp = raw.tcgplayer?.prices;
  if (tp) {
    const variant = tp.holofoil || tp.normal || tp.reverseHolofoil || tp["1stEditionHolofoil"];
    if (variant && typeof variant.market === "number") usd = variant.market;
  }

  return { EUR: eur, USD: usd };
}

const CARD_LIST_CACHE_PREFIX = "cardvault:cache:pokemon:setcards:";
const CARD_LIST_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

/**
 * Lädt alle Karten (Nummer + Name) eines Sets, für Fortschrittsanzeige
 * und "fehlende Karten"-Liste. Wird gecached, da Sets sich selten ändern.
 */
export async function fetchSetCardList(setId) {
  const cacheKey = CARD_LIST_CACHE_PREFIX + setId;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { ts, list } = JSON.parse(raw);
      if (Date.now() - ts < CARD_LIST_TTL_MS) return list;
    }
  } catch {
    /* Cache ignorieren bei Fehler */
  }

  const res = await fetch(
    `${BASE}/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=300&orderBy=number`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`Kartenliste konnte nicht geladen werden (Status ${res.status}).`);
  const json = await res.json();
  const list = (json.data || []).map((raw) => ({ number: raw.number, name: raw.name }));

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), list }));
  } catch {
    /* Speicher evtl. voll - ignorieren */
  }
  return list;
}
