// storage.js
// Persistiert Sammlungen im localStorage des Browsers.
//
// Datenmodell:
// Collection {
//   id, name, game ('pokemon' | 'onepiece'), setId, setName, setLogo,
//   createdAt,
//   setTotal: number|null,          // bekannte Gesamtzahl Karten im Set (Fortschritt)
//   setCardListCache: [{number,name}]|null,  // für "fehlende Karten" (lazy geladen)
//   valueHistory: [{ date:'YYYY-MM-DD', amount, currency }],
//   cards: [ CardEntry ],           // eigene Sammlung
//   wishlist: [ CardEntry ],        // Wunschliste
// }
// CardEntry {
//   number, name, imageUrl, quantity,
//   prices: { EUR: number|null, USD: number|null },
//   sourceUrl, priceUpdatedAt, addedAt
// }

const STORAGE_KEY = "cardvault:collections:v2";
const CURRENCY_KEY = "cardvault:preferredCurrency";
const LEGACY_KEY = "cardvault:collections:v1";
const MAX_HISTORY_POINTS = 120;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ---------- Migration von v1 (falls vorhanden) ----------
function migrateLegacyIfNeeded() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  const legacyRaw = localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return;
  try {
    const legacy = JSON.parse(legacyRaw);
    const migrated = legacy.map((c) => ({
      ...c,
      setTotal: null,
      setCardListCache: null,
      valueHistory: [],
      wishlist: [],
      cards: (c.cards || []).map((card) => ({
        ...card,
        prices: { EUR: card.currency === "EUR" ? card.price : null, USD: card.currency === "USD" ? card.price : null },
      })),
    }));
    saveCollections(migrated);
  } catch (err) {
    console.warn("Migration von v1-Daten fehlgeschlagen:", err);
  }
}

export function getCollections() {
  migrateLegacyIfNeeded();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Konnte Sammlungen nicht laden:", err);
    return [];
  }
}

function saveCollections(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getCollection(id) {
  return getCollections().find((c) => c.id === id) || null;
}

export function createCollection({ name, game, setId, setName, setLogo, setTotal }) {
  const collections = getCollections();
  const collection = {
    id: uid(),
    name: name.trim(),
    game,
    setId,
    setName,
    setLogo: setLogo || null,
    setTotal: typeof setTotal === "number" ? setTotal : null,
    setCardListCache: null,
    createdAt: new Date().toISOString(),
    valueHistory: [],
    cards: [],
    wishlist: [],
  };
  collections.unshift(collection);
  saveCollections(collections);
  return collection;
}

export function deleteCollection(id) {
  saveCollections(getCollections().filter((c) => c.id !== id));
}

export function updateCollectionMeta(id, patch) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === id);
  if (!collection) return null;
  Object.assign(collection, patch);
  saveCollections(collections);
  return collection;
}

// ---------- Karten (Sammlung / Wunschliste) ----------

function listKey(wishlist) {
  return wishlist ? "wishlist" : "cards";
}

export function upsertCard(collectionId, cardData, quantity, { wishlist = false } = {}) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error("Sammlung nicht gefunden");

  const key = listKey(wishlist);
  if (!Array.isArray(collection[key])) collection[key] = [];
  const list = collection[key];

  const existing = list.find((c) => c.number === cardData.number);
  if (existing) {
    const newQty = existing.quantity + quantity;
    Object.assign(existing, cardData, { quantity: newQty });
  } else {
    list.push({ ...cardData, quantity, addedAt: new Date().toISOString() });
  }
  saveCollections(collections);
  return collection;
}

export function updateCardQuantity(collectionId, number, quantity, { wishlist = false } = {}) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return;
  const key = listKey(wishlist);
  const list = collection[key] || [];
  const card = list.find((c) => c.number === number);
  if (!card) return;
  card.quantity = Math.max(0, quantity);
  if (card.quantity === 0) {
    collection[key] = list.filter((c) => c.number !== number);
  }
  saveCollections(collections);
}

export function removeCard(collectionId, number, { wishlist = false } = {}) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return;
  const key = listKey(wishlist);
  collection[key] = (collection[key] || []).filter((c) => c.number !== number);
  saveCollections(collections);
}

/** Verschiebt eine Karte von der Wunschliste in die eigene Sammlung (oder umgekehrt). */
export function moveCard(collectionId, number, { toWishlist }) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return;
  const fromKey = listKey(!toWishlist);
  const toKey = listKey(toWishlist);
  const fromList = collection[fromKey] || [];
  const idx = fromList.findIndex((c) => c.number === number);
  if (idx === -1) return;
  const [card] = fromList.splice(idx, 1);
  if (!Array.isArray(collection[toKey])) collection[toKey] = [];
  const existing = collection[toKey].find((c) => c.number === number);
  if (existing) {
    existing.quantity += card.quantity;
  } else {
    collection[toKey].push(card);
  }
  saveCollections(collections);
}

// ---------- Preis-Präferenz (EUR/USD) ----------

export function getPreferredCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || "EUR";
}

export function setPreferredCurrency(currency) {
  localStorage.setItem(CURRENCY_KEY, currency);
}

/** Liefert den anzuzeigenden Preis einer Karte in der bevorzugten Währung,
 *  fällt auf die jeweils andere verfügbare Währung zurück. */
export function resolveCardPrice(card, preferred = getPreferredCurrency()) {
  const prices = card.prices || {};
  if (typeof prices[preferred] === "number") {
    return { amount: prices[preferred], currency: preferred, isFallback: false };
  }
  const other = preferred === "EUR" ? "USD" : "EUR";
  if (typeof prices[other] === "number") {
    return { amount: prices[other], currency: other, isFallback: true };
  }
  return { amount: null, currency: null, isFallback: false };
}

export function collectionTotalValue(collection, { wishlist = false } = {}) {
  const preferred = getPreferredCurrency();
  const list = collection[listKey(wishlist)] || [];
  let amount = 0;
  let hasAnyPrice = false;
  let mixed = false;

  for (const card of list) {
    const resolved = resolveCardPrice(card, preferred);
    if (typeof resolved.amount === "number") {
      hasAnyPrice = true;
      if (resolved.currency !== preferred) mixed = true;
      amount += resolved.amount * card.quantity;
    }
  }

  return { amount, currency: preferred, mixed, hasAnyPrice };
}

// ---------- Wertverlauf ----------

export function recordValueSnapshot(collectionId) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return;

  const { amount, currency, hasAnyPrice } = collectionTotalValue(collection, { wishlist: false });
  if (!hasAnyPrice) return; // keine Snapshot ohne Preisdaten

  if (!Array.isArray(collection.valueHistory)) collection.valueHistory = [];
  const today = todayStr();
  const last = collection.valueHistory[collection.valueHistory.length - 1];

  if (last && last.date === today) {
    last.amount = amount;
    last.currency = currency;
  } else {
    collection.valueHistory.push({ date: today, amount, currency });
  }

  if (collection.valueHistory.length > MAX_HISTORY_POINTS) {
    collection.valueHistory = collection.valueHistory.slice(-MAX_HISTORY_POINTS);
  }
  saveCollections(collections);
}

// ---------- Set-Fortschritt ----------

export function setSetCardListCache(collectionId, list) {
  const collections = getCollections();
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) return;
  collection.setCardListCache = list;
  if (!collection.setTotal) collection.setTotal = list.length;
  saveCollections(collections);
}

export function setProgress(collection) {
  const owned = new Set((collection.cards || []).map((c) => c.number));
  const ownedUniqueCount = owned.size;
  const total = collection.setTotal;
  if (!total) return { owned: ownedUniqueCount, total: null, percent: null };
  return {
    owned: ownedUniqueCount,
    total,
    percent: Math.min(100, Math.round((ownedUniqueCount / total) * 100)),
  };
}

export function missingCards(collection) {
  const cache = collection.setCardListCache;
  if (!cache) return null;
  const owned = new Set((collection.cards || []).map((c) => c.number));
  return cache.filter((c) => !owned.has(c.number));
}

// ---------- Export / Import ----------

export function exportAllData() {
  const payload = {
    app: "CardVault",
    exportedAt: new Date().toISOString(),
    version: 2,
    collections: getCollections(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Importiert Sammlungen aus einem zuvor exportierten JSON-String.
 * mode "merge": bestehende Sammlungen bleiben, importierte werden ergänzt (neue IDs bei Konflikt).
 * mode "replace": bestehende Sammlungen werden komplett ersetzt.
 */
export function importAllData(jsonString, mode = "merge") {
  let payload;
  try {
    payload = JSON.parse(jsonString);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  const incoming = Array.isArray(payload) ? payload : payload.collections;
  if (!Array.isArray(incoming)) {
    throw new Error("Unerwartetes Datenformat: keine Sammlungen gefunden.");
  }

  if (mode === "replace") {
    saveCollections(incoming);
    return { imported: incoming.length, mode };
  }

  const existing = getCollections();
  const existingIds = new Set(existing.map((c) => c.id));
  const toAdd = incoming.map((c) => {
    if (existingIds.has(c.id)) {
      return { ...c, id: uid() };
    }
    return c;
  });
  saveCollections([...toAdd, ...existing]);
  return { imported: toAdd.length, mode };
}

// ---------- Formatierung ----------

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ""}`;
  }
}
