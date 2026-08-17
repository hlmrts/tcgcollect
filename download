import * as storage from "./storage.js";
import * as pokemonApi from "./api/pokemon.js";
import * as onepieceApi from "./api/onepiece.js";

const apiByGame = { pokemon: pokemonApi, onepiece: onepieceApi };
const gameLabel = { pokemon: "Pokémon", onepiece: "One Piece" };

const state = {
  activeGame: "pokemon", // Filter für das Dashboard
  currentCollectionId: null,
  modalGame: "pokemon",
  setsCache: {}, // { pokemon: [...], onepiece: [...] }
  activeTab: "owned", // "owned" | "wishlist" in der Sammlungsansicht
  missingVisible: false,
  missingLoading: false,
  missingError: null,
};

// ---------- DOM refs ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const dashboardView = $("#view-dashboard");
const collectionView = $("#view-collection");
const collectionsGrid = $("#collectionsGrid");
const emptyState = $("#emptyState");

const createModal = $("#createModal");
const setSelect = $("#setSelect");
const setLoadError = $("#setLoadError");
const collectionNameInput = $("#collectionNameInput");
const createCollectionForm = $("#createCollectionForm");

const cardsGrid = $("#cardsGrid");
const collectionEmptyState = $("#collectionEmptyState");
const addCardForm = $("#addCardForm");
const cardNumberInput = $("#cardNumberInput");
const cardQtyInput = $("#cardQtyInput");
const addCardError = $("#addCardError");
const addCardBtn = $("#addCardBtn");

const progressRow = $("#progressRow");
const progressLabel = $("#progressLabel");
const progressFill = $("#progressFill");
const toggleMissingBtn = $("#toggleMissingBtn");
const missingPanel = $("#missingPanel");
const missingPanelHint = $("#missingPanelHint");
const missingListEl = $("#missingList");

const wishlistHint = $("#wishlistHint");
const wishlistTotalHint = $("#wishlistTotalHint");

const toast = $("#toast");

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", init);

function init() {
  bindTopNav();
  bindCurrencySwitch();
  bindDashboard();
  bindExportImport();
  bindModal();
  bindCollectionView();
  renderDashboard();
}

// ---------- Top navigation (Dashboard-Filter Pokémon/One Piece) ----------
function bindTopNav() {
  $$(".game-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".game-tab").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      state.activeGame = btn.dataset.game;
      renderDashboard();
    });
  });

  $("#newCollectionBtn").addEventListener("click", () => openCreateModal(state.activeGame));
}

function bindCurrencySwitch() {
  const wrap = $("#currencySwitch");
  const sync = () => {
    const pref = storage.getPreferredCurrency();
    $$(".segmented-btn", wrap).forEach((b) => b.classList.toggle("active", b.dataset.currency === pref));
  };
  sync();
  $$(".segmented-btn", wrap).forEach((btn) => {
    btn.addEventListener("click", () => {
      storage.setPreferredCurrency(btn.dataset.currency);
      sync();
      // Neu rendern, egal in welcher Ansicht wir gerade sind
      if (collectionView.classList.contains("active")) {
        renderCollectionDetail();
      } else {
        renderDashboard();
      }
    });
  });
}

// ---------- Export / Import ----------
function bindExportImport() {
  $("#exportBtn").addEventListener("click", () => {
    const json = storage.exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cardvault-export-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Export heruntergeladen");
  });

  const fileInput = $("#importFileInput");
  $("#importBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    const text = await file.text();
    const replace = confirm(
      "Import-Modus wählen:\n\n" +
        "OK = Bestehende Sammlungen ERSETZEN\n" +
        "Abbrechen = Mit vorhandenen Sammlungen ZUSAMMENFÜHREN"
    );
    try {
      const result = storage.importAllData(text, replace ? "replace" : "merge");
      renderDashboard();
      showToast(`${result.imported} Sammlung(en) importiert (${result.mode === "replace" ? "ersetzt" : "zusammengeführt"})`);
    } catch (err) {
      alert("Import fehlgeschlagen: " + err.message);
    }
  });
}

// ---------- Dashboard ----------
function bindDashboard() {
  emptyState.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="open-create"]')) {
      openCreateModal(state.activeGame);
    }
  });
}

function renderDashboard() {
  showView("dashboard");
  document.body.dataset.activeGame = state.activeGame;
  const all = storage.getCollections();
  const filtered = all.filter((c) => c.game === state.activeGame);

  collectionsGrid.innerHTML = "";
  emptyState.hidden = filtered.length > 0;
  collectionsGrid.hidden = filtered.length === 0;

  for (const collection of filtered) {
    collectionsGrid.appendChild(renderCollectionCard(collection));
  }
}

function renderCollectionCard(collection) {
  const { amount, currency, hasAnyPrice } = storage.collectionTotalValue(collection, { wishlist: false });
  const cover = collection.cards.find((c) => c.imageUrl)?.imageUrl;
  const progress = storage.setProgress(collection);

  const el = document.createElement("article");
  el.className = `collection-card game-${collection.game}`;
  el.innerHTML = `
    <div class="collection-card-cover">
      ${
        cover
          ? `<img src="${escapeAttr(cover)}" alt="" loading="lazy" />`
          : `<div class="cover-placeholder">${gameLabel[collection.game]}</div>`
      }
    </div>
    <div class="collection-card-body">
      <h3>${escapeHtml(collection.name)}</h3>
      <p class="muted">${escapeHtml(collection.setName || "")} · ${
        progress.total ? `${progress.owned}/${progress.total} Karten` : `${collection.cards.length} Karte(n)`
      }</p>
      <p class="collection-card-value">
        ${hasAnyPrice ? storage.formatMoney(amount, currency) : "–"}
      </p>
    </div>
  `;
  el.addEventListener("click", () => openCollection(collection.id));
  return el;
}

// ---------- Create-Collection Modal ----------
function bindModal() {
  $("#closeModalBtn").addEventListener("click", closeCreateModal);
  $("#cancelCreateBtn").addEventListener("click", closeCreateModal);
  createModal.addEventListener("click", (e) => {
    if (e.target === createModal) closeCreateModal();
  });

  $$(".segmented-btn", $("#modalGameSwitch")).forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".segmented-btn", $("#modalGameSwitch")).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.modalGame = btn.dataset.game;
      loadSetsIntoSelect(state.modalGame);
    });
  });

  createCollectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const setId = setSelect.value;
    const setName = setSelect.options[setSelect.selectedIndex]?.text || setId;
    const name = collectionNameInput.value.trim();
    if (!setId || !name) return;

    const setMeta = (state.setsCache[state.modalGame] || []).find((s) => s.id === setId);

    const collection = storage.createCollection({
      name,
      game: state.modalGame,
      setId,
      setName,
      setTotal: setMeta?.total ?? null,
    });
    closeCreateModal();
    state.activeGame = state.modalGame;
    syncTopNavToActiveGame();
    openCollection(collection.id);
  });
}

function openCreateModal(game) {
  state.modalGame = game || "pokemon";
  $$(".segmented-btn", $("#modalGameSwitch")).forEach((b) =>
    b.classList.toggle("active", b.dataset.game === state.modalGame)
  );
  collectionNameInput.value = "";
  createModal.hidden = false;
  loadSetsIntoSelect(state.modalGame);
}

function closeCreateModal() {
  createModal.hidden = true;
}

async function loadSetsIntoSelect(game) {
  setSelect.disabled = true;
  setSelect.innerHTML = `<option value="" disabled selected>Sets werden geladen…</option>`;
  setLoadError.hidden = true;

  try {
    let sets = state.setsCache[game];
    if (!sets) {
      sets = await apiByGame[game].fetchSets();
      state.setsCache[game] = sets;
    }
    setSelect.innerHTML =
      `<option value="" disabled selected>Set wählen…</option>` +
      sets.map((s) => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join("");
  } catch (err) {
    console.error(err);
    setLoadError.textContent =
      "Sets konnten nicht geladen werden. Bitte Internetverbindung prüfen und erneut versuchen.";
    setLoadError.hidden = false;
  } finally {
    setSelect.disabled = false;
  }
}

// ---------- Collection Detail View ----------
function bindCollectionView() {
  $("#backToDashboard").addEventListener("click", () => renderDashboard());

  $("#deleteCollectionBtn").addEventListener("click", () => {
    if (!state.currentCollectionId) return;
    const collection = storage.getCollection(state.currentCollectionId);
    if (!collection) return;
    if (confirm(`Sammlung "${collection.name}" wirklich löschen?`)) {
      storage.deleteCollection(collection.id);
      renderDashboard();
      showToast("Sammlung gelöscht");
    }
  });

  addCardForm.addEventListener("submit", handleAddCard);

  $$(".tab-btn", $("#cardTabs")).forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      $$(".tab-btn", $("#cardTabs")).forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      renderCollectionDetail();
    });
  });

  toggleMissingBtn.addEventListener("click", async () => {
    state.missingVisible = !state.missingVisible;
    if (state.missingVisible) {
      await ensureSetCardList();
    }
    renderMissingPanel();
  });
}

function openCollection(id) {
  state.currentCollectionId = id;
  state.activeTab = "owned";
  state.missingVisible = false;
  state.missingError = null;
  showView("collection");
  renderCollectionDetail();
}

function renderCollectionDetail() {
  const collection = storage.getCollection(state.currentCollectionId);
  if (!collection) {
    renderDashboard();
    return;
  }

  document.body.dataset.activeGame = collection.game;
  $("#collectionTitle").textContent = collection.name;
  $("#collectionSubtitle").textContent = `${collection.setName || ""} · ${collection.cards.length} Karte(n)`;

  // Gesamtwert + Trend (nur eigene Sammlung, nicht Wunschliste)
  storage.recordValueSnapshot(collection.id);
  const freshCollection = storage.getCollection(collection.id); // nach Snapshot neu laden
  const { amount, currency, hasAnyPrice, mixed } = storage.collectionTotalValue(freshCollection, { wishlist: false });
  $("#collectionTotalValue").textContent = hasAnyPrice
    ? storage.formatMoney(amount, currency) + (mixed ? " *" : "")
    : "–";
  renderTrend(freshCollection.valueHistory || []);

  // Set-Fortschritt
  renderProgress(freshCollection);
  renderMissingPanel();

  // Tabs
  $$(".tab-btn", $("#cardTabs")).forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === state.activeTab);
    b.setAttribute("aria-selected", String(b.dataset.tab === state.activeTab));
  });
  const isWishlistTab = state.activeTab === "wishlist";
  wishlistHint.hidden = !isWishlistTab;
  if (isWishlistTab) {
    const { amount: wAmount, currency: wCurrency, hasAnyPrice: wHas } = storage.collectionTotalValue(freshCollection, {
      wishlist: true,
    });
    wishlistTotalHint.textContent = wHas ? `Potenzieller Wert: ${storage.formatMoney(wAmount, wCurrency)}` : "";
  }
  addCardBtn.querySelector(".btn-label").textContent = isWishlistTab
    ? "Zur Wunschliste hinzufügen"
    : "Karte hinzufügen";
  cardNumberInput.placeholder = isWishlistTab
    ? "Kartennummer der gewünschten Karte"
    : "Kartennummer eingeben (z. B. 4 oder 004/102)";

  // Kartenliste
  const list = isWishlistTab ? freshCollection.wishlist || [] : freshCollection.cards || [];
  cardsGrid.innerHTML = "";
  const sorted = [...list].sort((a, b) => String(a.number).localeCompare(String(b.number), "de", { numeric: true }));
  collectionEmptyState.hidden = sorted.length > 0;
  cardsGrid.hidden = sorted.length === 0;
  $("h2", collectionEmptyState).textContent = isWishlistTab ? "Wunschliste ist leer" : "Noch keine Karten";
  $("p", collectionEmptyState).textContent = isWishlistTab
    ? "Trage oben eine Kartennummer ein, um sie auf deine Wunschliste zu setzen."
    : "Gib oben eine Kartennummer ein, um deine erste Karte hinzuzufügen.";

  for (const card of sorted) {
    cardsGrid.appendChild(renderCardTile(freshCollection, card, isWishlistTab));
  }
}

function renderProgress(collection) {
  const progress = storage.setProgress(collection);
  if (!progress.total) {
    progressRow.hidden = collection.cards.length === 0;
    progressLabel.textContent = `${progress.owned} einzigartige Karte(n)`;
    progressFill.style.width = "0%";
    toggleMissingBtn.textContent = "Set-Größe laden";
    return;
  }
  progressRow.hidden = false;
  progressLabel.textContent = `${progress.owned} / ${progress.total} Karten (${progress.percent}%)`;
  progressFill.style.width = `${progress.percent}%`;
  toggleMissingBtn.textContent = state.missingVisible ? "Fehlende Karten ausblenden" : "Fehlende Karten anzeigen";
}

async function ensureSetCardList() {
  const collection = storage.getCollection(state.currentCollectionId);
  if (!collection || collection.setCardListCache) return;
  state.missingLoading = true;
  state.missingError = null;
  missingPanelHint.textContent = "Lade vollständige Kartenliste…";
  missingPanel.hidden = false;
  try {
    const api = apiByGame[collection.game];
    const list = await api.fetchSetCardList(collection.setId);
    storage.setSetCardListCache(collection.id, list);
  } catch (err) {
    console.error(err);
    state.missingError = "Kartenliste konnte nicht geladen werden. Bitte später erneut versuchen.";
  } finally {
    state.missingLoading = false;
  }
}

function renderMissingPanel() {
  missingPanel.hidden = !state.missingVisible;
  if (!state.missingVisible) return;

  const collection = storage.getCollection(state.currentCollectionId);
  if (!collection) return;

  const missing = storage.missingCards(collection);
  renderProgress(collection); // Button-Label ggf. aktualisieren

  if (state.missingError) {
    missingPanelHint.textContent = state.missingError;
    missingListEl.innerHTML = "";
    return;
  }

  if (!missing) {
    missingPanelHint.textContent = state.missingLoading
      ? "Lade vollständige Kartenliste…"
      : "Kartenliste noch nicht geladen.";
    missingListEl.innerHTML = "";
    return;
  }

  if (missing.length === 0) {
    missingPanelHint.textContent = "🎉 Set vollständig! Keine fehlenden Karten.";
    missingListEl.innerHTML = "";
    return;
  }

  missingPanelHint.textContent = `${missing.length} fehlende Karte(n):`;
  missingListEl.innerHTML = missing
    .map((c) => `<li><span>#${escapeHtml(String(c.number))}</span>${escapeHtml(c.name || "")}</li>`)
    .join("");
}

// ---------- Trend-Sparkline ----------
// Nach dataviz-Skill "Stat-tile trend": gedeckte (de-emphasis) Linie,
// aktueller Punkt in Akzentfarbe hervorgehoben, kein Chart-Chrome (Achsen/Legende)
// nötig, da einzelne Serie und der Titel ("Gesamtwert") die Bedeutung trägt.
function renderTrend(history) {
  const container = $("#collectionTrend");
  if (!history || history.length < 2) {
    container.innerHTML = `<span class="trend-empty">Verlauf ab morgen sichtbar</span>`;
    return;
  }

  const width = 130;
  const height = 28;
  const padding = 3;
  const values = history.map((h) => h.amount);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.amount - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath =
    `M${points[0][0].toFixed(1)},${height} ` +
    points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L${points[points.length - 1][0].toFixed(1)},${height} Z`;

  const [lastX, lastY] = points[points.length - 1];
  const last = history[history.length - 1];
  const first = history[0];
  const deltaTitle = `Verlauf: ${storage.formatMoney(first.amount, first.currency)} → ${storage.formatMoney(
    last.amount,
    last.currency
  )} (${history.length} Tage)`;

  container.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(
      deltaTitle
    )}">
      <title>${escapeHtml(deltaTitle)}</title>
      <path class="trend-area" d="${areaPath}" fill="var(--accent)" opacity="0.1"></path>
      <path class="trend-line" d="${linePath}"></path>
      <circle class="trend-dot" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4"></circle>
    </svg>
  `;
}

function renderCardTile(collection, card, isWishlist) {
  const resolved = storage.resolveCardPrice(card);
  const priceText =
    typeof resolved.amount === "number"
      ? storage.formatMoney(resolved.amount, resolved.currency) + (resolved.isFallback ? " *" : "")
      : "Preis unbekannt";

  const el = document.createElement("article");
  el.className = "card-tile";
  el.innerHTML = `
    <div class="card-tile-image">
      ${
        card.imageUrl
          ? `<img src="${escapeAttr(card.imageUrl)}" alt="${escapeAttr(card.name)}" loading="lazy" />`
          : `<div class="cover-placeholder">${escapeHtml(card.name || "?")}</div>`
      }
      <span class="card-qty-badge">×${card.quantity}</span>
    </div>
    <div class="card-tile-body">
      <h4>${escapeHtml(card.name || "Unbekannt")}</h4>
      <p class="muted">#${escapeHtml(String(card.number))}</p>
      <p class="card-price">${priceText}</p>
      <div class="qty-controls">
        <button type="button" data-action="dec" aria-label="Menge verringern">−</button>
        <span>${card.quantity}</span>
        <button type="button" data-action="inc" aria-label="Menge erhöhen">+</button>
      </div>
      <div class="qty-controls">
        <button type="button" data-action="move" class="move-btn">
          ${isWishlist ? "✓ Habe ich" : "☆ Wunschliste"}
        </button>
        <button type="button" data-action="remove" class="remove-btn" aria-label="Karte entfernen">Entfernen</button>
      </div>
    </div>
  `;

  el.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "inc") {
      storage.updateCardQuantity(collection.id, card.number, card.quantity + 1, { wishlist: isWishlist });
    } else if (action === "dec") {
      storage.updateCardQuantity(collection.id, card.number, card.quantity - 1, { wishlist: isWishlist });
    } else if (action === "remove") {
      storage.removeCard(collection.id, card.number, { wishlist: isWishlist });
    } else if (action === "move") {
      storage.moveCard(collection.id, card.number, { toWishlist: !isWishlist });
      showToast(isWishlist ? "In Sammlung verschoben" : "Auf Wunschliste verschoben");
    }
    renderCollectionDetail();
  });

  return el;
}

async function handleAddCard(e) {
  e.preventDefault();
  const collection = storage.getCollection(state.currentCollectionId);
  if (!collection) return;

  const number = cardNumberInput.value.trim();
  const qty = Math.max(1, parseInt(cardQtyInput.value, 10) || 1);
  if (!number) return;

  const isWishlistTab = state.activeTab === "wishlist";

  addCardError.hidden = true;
  setAddCardLoading(true);

  try {
    const api = apiByGame[collection.game];
    const cardData = await api.fetchCardByNumber(collection.setId, number);
    storage.upsertCard(collection.id, cardData, qty, { wishlist: isWishlistTab });
    cardNumberInput.value = "";
    cardQtyInput.value = "1";
    renderCollectionDetail();
    showToast(`"${cardData.name}" ${isWishlistTab ? "zur Wunschliste hinzugefügt" : "hinzugefügt"}`);
  } catch (err) {
    console.error(err);
    addCardError.textContent = err.message || "Karte konnte nicht gefunden werden.";
    addCardError.hidden = false;
  } finally {
    setAddCardLoading(false);
  }
}

function setAddCardLoading(loading) {
  addCardBtn.disabled = loading;
  $(".btn-label", addCardBtn).hidden = loading;
  $(".btn-spinner", addCardBtn).hidden = !loading;
}

// ---------- View switching ----------
function showView(name) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  if (name === "dashboard") dashboardView.classList.add("active");
  if (name === "collection") collectionView.classList.add("active");
}

function syncTopNavToActiveGame() {
  $$(".game-tab").forEach((b) => {
    const active = b.dataset.game === state.activeGame;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
  });
}

// ---------- Utils ----------
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 200);
  }, 2200);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}
