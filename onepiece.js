:root {
  --bg: #0b0d14;
  --bg-elevated: #12151f;
  --bg-card: #161a26;
  --border: #242938;
  --text: #eef0f6;
  --text-muted: #8a90a6;
  --accent-pokemon: #ffcb05;
  --accent-pokemon-2: #3d7dca;
  --accent-onepiece: #e0302d;
  --accent-onepiece-2: #f2c14e;
  --accent: var(--accent-pokemon);
  --danger: #ef5350;
  --radius-lg: 20px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --shadow-soft: 0 8px 30px rgba(0, 0, 0, 0.35);
  --font-display: "Sora", "Inter", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

/* Stellt sicher, dass das hidden-Attribut immer greift, auch wenn eine
   Komponentenklasse (z. B. display:grid/flex) sonst Vorrang hätte. */
[hidden] {
  display: none !important;
}

html, body {
  margin: 0;
  padding: 0;
}

body {
  background:
    radial-gradient(circle at 15% -10%, rgba(255, 203, 5, 0.08), transparent 40%),
    radial-gradient(circle at 85% 0%, rgba(61, 125, 202, 0.10), transparent 45%),
    var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

body[data-active-game="onepiece"] {
  --accent: var(--accent-onepiece);
}
body[data-active-game="pokemon"] {
  --accent: var(--accent-pokemon);
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  margin: 0;
  letter-spacing: -0.01em;
}

p {
  margin: 0;
}

.muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.app-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 28px 80px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== Topbar ===== */
.topbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(to bottom, var(--bg) 70%, transparent);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
}
.brand-mark {
  background: linear-gradient(135deg, var(--accent-pokemon), var(--accent-onepiece));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.4rem;
}

.game-switch {
  display: flex;
  gap: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px;
  margin-left: auto;
}

.game-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.game-tab:hover {
  color: var(--text);
}
.game-tab.active {
  background: var(--bg-card);
  color: var(--text);
  box-shadow: 0 0 0 1px var(--border);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot-pokemon { background: var(--accent-pokemon); }
.dot-onepiece { background: var(--accent-onepiece); }

/* ===== Currency switch (topbar) ===== */
.currency-switch {
  padding: 3px;
}
.currency-switch .segmented-btn {
  font-size: 0.78rem;
  padding: 6px 12px;
}

/* ===== Buttons ===== */
.btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  padding: 10px 18px;
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.15s ease, background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.btn:active { transform: scale(0.97); }

.btn-primary {
  background: linear-gradient(135deg, var(--accent-pokemon), #f5a623);
  color: #171200;
}
body[data-active-game="onepiece"] .btn-primary {
  background: linear-gradient(135deg, var(--accent-onepiece), #c81d1a);
  color: #fff2f1;
}
.btn-primary:hover { filter: brightness(1.08); }

.btn-ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text);
}
.btn-ghost:hover { background: var(--bg-elevated); }

.btn-danger-ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--danger);
  padding: 10px 14px;
}
.btn-danger-ghost:hover { background: rgba(239, 83, 80, 0.1); }

/* ===== Views ===== */
.view { display: none; }
.view.active { display: block; }

.view-header {
  margin: 12px 0 28px;
}
.view-header h1 {
  font-size: 2rem;
  font-weight: 800;
}
.view-header p { margin-top: 6px; }

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dashboard-actions {
  display: flex;
  gap: 10px;
}

/* ===== Dashboard ===== */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}

.collection-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-soft);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
}
.collection-card.game-pokemon:hover { border-color: var(--accent-pokemon); }
.collection-card.game-onepiece:hover { border-color: var(--accent-onepiece); }

.collection-card-cover {
  height: 130px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.collection-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.05);
}
.cover-placeholder {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.collection-card-body {
  padding: 16px 18px 18px;
}
.collection-card-body h3 {
  font-size: 1.05rem;
  margin-bottom: 4px;
}
.collection-card-value {
  margin-top: 10px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
}

/* ===== Empty state ===== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
}
.empty-emblem { font-size: 2.4rem; margin-bottom: 12px; }
.empty-state h2 { margin-bottom: 8px; }
.empty-state .btn { margin-top: 20px; }

/* ===== Collection detail header ===== */
.collection-header {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.collection-title-block { flex: 1; min-width: 200px; }
.collection-title-block h1 { font-size: 1.6rem; }

.collection-value {
  text-align: right;
  padding: 10px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.value-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.value-amount {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.3rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-pokemon-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* ===== Value trend sparkline (im Gesamtwert-Kasten) ===== */
.value-trend {
  margin-top: 6px;
  height: 28px;
  min-width: 100px;
}
.value-trend svg { display: block; overflow: visible; }
.value-trend .trend-line {
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.value-trend .trend-area {
  stroke: none;
}
.value-trend .trend-dot {
  fill: var(--accent);
  stroke: var(--bg-card);
  stroke-width: 2;
}
.value-trend .trend-empty {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* ===== Set-Fortschritt ===== */
.progress-row {
  margin-top: 18px;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.progress-track {
  height: 8px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-pokemon-2));
  border-radius: 999px;
  transition: width 0.3s ease;
}
body[data-active-game="onepiece"] .progress-fill {
  background: linear-gradient(90deg, var(--accent-onepiece), var(--accent-onepiece-2));
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover { text-decoration: underline; }

.missing-panel {
  margin-top: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  max-height: 220px;
  overflow-y: auto;
}
.missing-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 4px 12px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.missing-list li span {
  color: var(--text);
  font-weight: 600;
  margin-right: 6px;
}

/* ===== Tabs (Sammlung / Wunschliste) ===== */
.tabs {
  display: flex;
  gap: 4px;
  margin-top: 22px;
  border-bottom: 1px solid var(--border);
}
.tab-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 10px 4px;
  margin-right: 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transform: translateY(1px);
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active {
  color: var(--text);
  border-bottom-color: var(--accent);
}
.wishlist-hint {
  margin-top: 10px;
  font-size: 0.82rem;
}
.wishlist-hint span { color: var(--text); font-weight: 600; }

/* ===== Add card bar ===== */
.add-card-bar {
  display: flex;
  gap: 10px;
  margin: 24px 0 8px;
  flex-wrap: wrap;
}
.add-card-bar input[type="text"] {
  flex: 1;
  min-width: 220px;
}
.qty-input { width: 90px; }

input, select {
  font-family: var(--font-body);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 11px 14px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s ease;
}
input:focus, select:focus {
  border-color: var(--accent);
}

.error-text {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 8px 0 0;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.25);
  border-top-color: currentColor;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Cards grid ===== */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.card-tile {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card-tile:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-soft);
}

.card-tile-image {
  position: relative;
  aspect-ratio: 5 / 7;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-tile-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.card-qty-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}

.card-tile-body { padding: 12px 14px 14px; }
.card-tile-body h4 {
  font-size: 0.9rem;
  line-height: 1.25;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-price {
  font-family: var(--font-display);
  font-weight: 700;
  margin-top: 6px;
  color: var(--accent);
}

.qty-controls {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.qty-controls button {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
}
.qty-controls button:hover { border-color: var(--accent); }
.qty-controls span { min-width: 14px; text-align: center; font-size: 0.85rem; }
.remove-btn {
  margin-left: auto;
  width: auto !important;
  border-radius: 999px !important;
  padding: 0 10px;
  font-size: 0.72rem !important;
  color: var(--danger);
  height: 24px !important;
}

.move-btn {
  width: auto !important;
  border-radius: 999px !important;
  padding: 0 10px;
  font-size: 0.72rem !important;
  color: var(--accent);
  height: 24px !important;
}

.card-tile-body .qty-controls.wishlist-controls {
  justify-content: space-between;
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 10, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  padding: 24px 26px 28px;
  box-shadow: var(--shadow-soft);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
}

.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin: 16px 0 6px;
}
.field-label:first-of-type { margin-top: 0; }

#createCollectionForm select,
#createCollectionForm input {
  width: 100%;
}

.segmented {
  display: flex;
  gap: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px;
}
.segmented-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 8px 0;
  border-radius: 999px;
  cursor: pointer;
}
.segmented-btn.active {
  background: var(--bg-card);
  color: var(--text);
  box-shadow: 0 0 0 1px var(--border);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 12px 20px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 200;
  box-shadow: var(--shadow-soft);
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ===== Footer ===== */
.app-footer {
  margin-top: auto;
  padding-top: 40px;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.6;
}
.app-footer a { color: var(--text-muted); }

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .app-shell { padding: 0 16px 60px; }
  .topbar { flex-wrap: wrap; gap: 12px; }
  .game-switch { order: 3; width: 100%; justify-content: center; margin-left: 0; }
  .collection-header { flex-direction: column; align-items: stretch; }
  .collection-value { text-align: left; }
}
