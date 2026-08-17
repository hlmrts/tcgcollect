// api/onepiece.js
// Anbindung an die kostenlose OPTCG API (https://optcgapi.com) für
// One Piece Kartendaten.
//
// WICHTIG: Diese API ist weniger standardisiert dokumentiert als die
// Pokémon TCG API und konnte aus dieser Sandbox-Umgebung heraus nicht
// live gegen echte Antworten getestet werden (die Umgebung hat keinen
// Zugriff auf beliebige externe Hosts). Der Code unten ist daher bewusst
// defensiv geschrieben: er probiert mehrere plausible Feldnamen aus.
//
// -> Bitte nach dem ersten Start im Browser die Netzwerk-Konsole (F12)
//    prüfen. Falls Karten/Preise nicht korrekt angezeigt werden, einfach
//    die Funktion `normalizeCard` unten an die tatsächliche Antwort
//    anpassen (Struktur der Rohdaten wird dort mit `console.debug`
//    ausgegeben, wenn `DEBUG = true` gesetzt ist).

const BASE = "https://optcgapi.com/api";
const DEBUG = false;

const SETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const setsCacheKey = "cardvault:cache:onepiece:sets:v1";
const cardsCachePrefix = "cardvault:cache:onepiece:cards:";

// Offizielle One-Piece-TCG-Setcodes als Fallback, falls der Sets-Endpunkt
// der API nicht erreichbar ist oder ein anderes Format liefert.
const FALLBACK_SETS = [
  { id: "OP01", name: "Romance Dawn (OP-01)" },
  { id: "OP02", name: "Paramount War (OP-02)" },
  { id: "OP03", name: "Pillars of Strength (OP-03)" },
  { id: "OP04", name: "Kingdoms of Intrigue (OP-04)" },
  { id: "OP05", name: "Awakening of the New Era (OP-05)" },
  { id: "OP06", name: "Wings of the Captain (OP-06)" },
  { id: "OP07", name: "500 Years in the Future (OP-07)" },
  { id: "OP08", name: "Two Legends (OP-08)" },
  { id: "OP09", name: "The New Emperor (OP-09)" },
  { id: "OP10", name: "Royal Bloodline (OP-10)" },
  { id: "ST01", name: "Straw Hat Crew (Starter Deck)" },
];

export async function fetchSets() {
  try {
    const cached = readCache(setsCacheKey, SETS_CACHE_TTL_MS);
    if (cached) return cached;

    const res = await fetch(`${BASE}/sets/`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.data || json.sets || [];
    if (!list.length) throw new Error("Leere Set-Liste");

    const sets = list.map((s) => ({
      id: pick(s, ["set_id", "id", "code", "set_code"]) ?? "",
      name: pick(s, ["set_name", "name", "title"]) ?? pick(s, ["set_id", "id"]),
    })).filter((s) => s.id);

    writeCache(setsCacheKey, sets);
    return sets;
  } catch (err) {
    console.warn("One-Piece-Sets konnten nicht geladen werden, nutze Fallback-Liste:", err);
    return FALLBACK_SETS;
  }
}

/**
 * Lädt (und cached) alle Karten eines Sets.
 */
async function fetchSetCards(setId) {
  const cacheKey = cardsCachePrefix + setId;
  const cached = readCache(cacheKey, SETS_CACHE_TTL_MS);
  if (cached) return cached;

  const candidates = [
    `${BASE}/sets/${encodeURIComponent(setId)}/`,
    `${BASE}/sets/${encodeURIComponent(setId)}`,
    `${BASE}/cards/${encodeURIComponent(setId)}/`,
  ];

  let lastError;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        lastError = new Error(`Status ${res.status} bei ${url}`);
        continue;
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || json.cards || [];
      if (DEBUG) console.debug("[onepiece] rohe Set-Antwort:", url, list.slice(0, 2));
      if (list.length) {
        writeCache(cacheKey, list);
        return list;
      }
    } catch (err) {
      lastError = new Error(
        "Netzwerkfehler: Die One-Piece-Karten-API war nicht erreichbar. Bitte Internetverbindung prüfen."
      );
    }
  }
  throw lastError || new Error("Set konnte nicht geladen werden.");
}

/**
 * Sucht eine Karte anhand von Set-ID und Kartennummer, z. B.
 * setId="OP01", number="001" oder number="OP01-001".
 */
export async function fetchCardByNumber(setId, number) {
  const cleanNumber = String(number).trim().toUpperCase();
  const cards = await fetchSetCards(setId);

  const match = cards.find((raw) => cardMatchesNumber(raw, setId, cleanNumber));
  if (!match) {
    throw new Error(
      `Keine Karte mit Nummer "${number}" in Set "${setId}" gefunden. ` +
      `Tipp: Manche Sets erwarten das Format "${setId}-001".`
    );
  }
  return normalizeCard(match, setId);
}

function cardMatchesNumber(raw, setId, cleanNumber) {
  const idFields = [
    pick(raw, ["card_set_id", "card_id", "id", "number", "card_number"]),
  ]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase());

  const paddedShort = cleanNumber.padStart(3, "0");
  const fullId = `${setId}-${paddedShort}`.toUpperCase();

  return idFields.some(
    (v) =>
      v === cleanNumber ||
      v === paddedShort ||
      v === fullId ||
      v.endsWith(`-${cleanNumber}`) ||
      v.endsWith(`-${paddedShort}`)
  );
}

function normalizeCard(raw, setId) {
  if (DEBUG) console.debug("[onepiece] rohe Karte:", raw);

  const priceRaw = pick(raw, [
    "market_price",
    "price",
    "tcgplayer_price",
    "avg_price",
    "cardmarket_price",
  ]);
  const price = typeof priceRaw === "number" ? priceRaw : parseFloat(priceRaw) || null;

  return {
    number: cardNumber(raw),
    name: pick(raw, ["card_name", "name"]) || "Unbekannte Karte",
    setName: pick(raw, ["set_name"]) || setId,
    imageUrl: pick(raw, ["card_image", "image", "image_url", "img"]) || null,
    // Für One Piece ist mir aktuell keine kostenlose API mit echten
    // Cardmarket-EUR-Preisen bekannt -> nur USD befüllt. Sobald eine
    // bessere Quelle angebunden wird, hier zusätzlich "EUR" befüllen.
    prices: { EUR: null, USD: price },
    sourceUrl: null,
    priceUpdatedAt: new Date().toISOString(),
  };
}

function cardNumber(raw) {
  return pick(raw, ["card_set_id", "card_number", "number", "id"]) || String(raw.number || "");
}

/**
 * Lädt alle Karten (Nummer + Name) eines Sets, für Fortschrittsanzeige
 * und "fehlende Karten"-Liste. Nutzt denselben gecachten Set-Abruf wie
 * die Einzelkartensuche.
 */
export async function fetchSetCardList(setId) {
  const cards = await fetchSetCards(setId);
  return cards.map((raw) => ({
    number: cardNumber(raw),
    name: pick(raw, ["card_name", "name"]) || "",
  }));
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return obj[k];
    }
  }
  return undefined;
}

function readCache(key, ttl) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* Speicher evtl. voll – ignorieren */
  }
}
