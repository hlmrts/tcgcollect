<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CardVault – TCG Sammlungs-Tracker</title>
  <meta name="description" content="Verwalte deine Pokémon- und One-Piece-Kartensammlungen: Fortschritt, Wert und Wunschliste." />
  <link rel="manifest" href="site.webmanifest" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="icon-32.png" sizes="32x32" type="image/png" />
  <link rel="icon" href="icon-16.png" sizes="16x16" type="image/png" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
  <meta name="theme-color" content="#0b0d14" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">🗂️</span>
        <span>CardVault</span>
      </div>

      <div class="game-switch" role="tablist" aria-label="Spiel wählen">
        <button type="button" class="game-tab active" data-game="pokemon" role="tab" aria-selected="true">
          <span class="dot dot-pokemon"></span> Pokémon
        </button>
        <button type="button" class="game-tab" data-game="onepiece" role="tab" aria-selected="false">
          <span class="dot dot-onepiece"></span> One Piece
        </button>
      </div>

      <div class="currency-switch segmented" id="currencySwitch">
        <button type="button" class="segmented-btn" data-currency="EUR">EUR</button>
        <button type="button" class="segmented-btn" data-currency="USD">USD</button>
      </div>
    </header>

    <!-- ================= Dashboard-Ansicht ================= -->
    <main id="view-dashboard" class="view active">
      <div class="view-header dashboard-header">
        <div>
          <h1>Meine Sammlungen</h1>
          <p class="muted">Behalte den Überblick über Wert, Fortschritt und Wunschliste.</p>
        </div>
        <div class="dashboard-actions">
          <button type="button" id="importBtn" class="btn btn-ghost">Importieren</button>
          <input type="file" id="importFileInput" accept="application/json" hidden />
          <button type="button" id="exportBtn" class="btn btn-ghost">Exportieren</button>
          <button type="button" id="newCollectionBtn" class="btn btn-primary">+ Neue Sammlung</button>
        </div>
      </div>

      <div id="emptyState" class="empty-state" hidden>
        <div class="empty-emblem">📦</div>
        <h2>Noch keine Sammlung</h2>
        <p class="muted">Lege deine erste Sammlung an, um Karten zu erfassen.</p>
        <button type="button" class="btn btn-primary" data-action="open-create">+ Neue Sammlung</button>
      </div>

      <div id="collectionsGrid" class="collections-grid" hidden></div>
    </main>

    <!-- ================= Sammlungs-Detailansicht ================= -->
    <main id="view-collection" class="view">
      <div class="collection-header">
        <button type="button" id="backToDashboard" class="btn btn-ghost">← Zurück</button>

        <div class="collection-title-block">
          <h1 id="collectionTitle">–</h1>
          <p id="collectionSubtitle" class="muted">–</p>
        </div>

        <div class="collection-value">
          <div>
            <div class="value-label">Gesamtwert</div>
            <div class="value-amount" id="collectionTotalValue">–</div>
          </div>
          <div class="value-trend" id="collectionTrend"></div>
        </div>

        <button type="button" id="deleteCollectionBtn" class="btn btn-danger-ghost">Löschen</button>
      </div>

      <div id="progressRow" class="progress-row" hidden>
        <div class="progress-info">
          <span id="progressLabel">0 / 0 Karten</span>
          <button type="button" id="toggleMissingBtn" class="link-btn">Fehlende Karten anzeigen</button>
        </div>
        <div class="progress-track">
          <div id="progressFill" class="progress-fill" style="width: 0%"></div>
        </div>
      </div>

      <div id="missingPanel" class="missing-panel" hidden>
        <p id="missingPanelHint" class="muted">–</p>
        <ul id="missingList" class="missing-list"></ul>
      </div>

      <div class="tabs" id="cardTabs" role="tablist">
        <button type="button" class="tab-btn active" data-tab="owned" role="tab" aria-selected="true">Sammlung</button>
        <button type="button" class="tab-btn" data-tab="wishlist" role="tab" aria-selected="false">Wunschliste</button>
      </div>

      <p id="wishlistHint" class="wishlist-hint" hidden>
        Karten auf der Wunschliste zählen nicht zum Sammlungswert. <span id="wishlistTotalHint"></span>
      </p>

      <div class="card-search-bar">
        <input type="text" id="cardSearchInput" placeholder="Karte nach Namen suchen…" />
        <button type="button" id="cardSearchBtn" class="btn btn-ghost">Suchen</button>
      </div>
      <p id="cardSearchHint" class="muted" hidden></p>
      <div id="cardSearchResults" class="search-results" hidden></div>

      <form id="addCardForm" class="add-card-bar">
        <input type="text" id="cardNumberInput" placeholder="…oder Kartennummer eingeben (z. B. 4 oder 004/102)" required />
        <input type="number" id="cardQtyInput" class="qty-input" min="1" value="1" aria-label="Menge" />
        <button type="submit" id="addCardBtn" class="btn btn-primary">
          <span class="btn-label">Karte hinzufügen</span>
          <span class="btn-spinner" hidden>…</span>
        </button>
      </form>
      <p id="addCardError" class="error-text" hidden></p>

      <div id="collectionEmptyState" class="empty-state" hidden>
        <h2>Noch keine Karten</h2>
        <p class="muted">Gib oben eine Kartennummer ein, um deine erste Karte hinzuzufügen.</p>
      </div>

      <div id="cardsGrid" class="cards-grid" hidden></div>
    </main>

    <footer class="app-footer">
      <p>CardVault · Kartendaten via <a href="https://pokemontcg.io" target="_blank" rel="noopener">pokemontcg.io</a> &amp; <a href="https://optcgapi.com" target="_blank" rel="noopener">optcgapi.com</a></p>
    </footer>
  </div>

  <!-- ================= Modal: Neue Sammlung erstellen ================= -->
  <div id="createModal" class="modal-overlay" hidden>
    <div class="modal">
      <div class="modal-head">
        <h2>Neue Sammlung</h2>
        <button type="button" id="closeModalBtn" class="modal-close" aria-label="Schließen">×</button>
      </div>

      <form id="createCollectionForm">
        <label class="field-label" for="modalGameSwitch">Spiel</label>
        <div class="segmented" id="modalGameSwitch">
          <button type="button" class="segmented-btn active" data-game="pokemon">Pokémon</button>
          <button type="button" class="segmented-btn" data-game="onepiece">One Piece</button>
        </div>

        <label class="field-label" for="modalTypeSwitch">Art der Sammlung</label>
        <div class="segmented" id="modalTypeSwitch">
          <button type="button" class="segmented-btn active" data-type="set">Set-gebunden</button>
          <button type="button" class="segmented-btn" data-type="free">Freie Sammlung</button>
        </div>

        <div id="setPickerGroup">
          <label class="field-label" for="setSelect">Set</label>
          <select id="setSelect">
            <option value="" disabled selected>Sets werden geladen…</option>
          </select>
          <p id="setLoadError" class="error-text" hidden></p>
        </div>
        <p id="freeHint" class="muted" hidden>Lege Karten frei zusammen, unabhängig vom Set – ideal für eine gemischte Lieblingssammlung.</p>

        <label class="field-label" for="collectionNameInput">Name der Sammlung</label>
        <input type="text" id="collectionNameInput" placeholder="z. B. Meine Base-Set-Sammlung" required />

        <div class="modal-actions">
          <button type="button" id="cancelCreateBtn" class="btn btn-ghost">Abbrechen</button>
          <button type="submit" class="btn btn-primary">Erstellen</button>
        </div>
      </form>
    </div>
  </div>

  <div id="toast" class="toast" hidden></div>

  <script type="module" src="app.js"></script>
</body>
</html>
