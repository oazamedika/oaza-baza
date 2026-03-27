/**
 * client-card.js — REVAMPED v4
 * - Tasks tab added: shows tasks & requests linked to client
 * - Photo shown from profile_pic_url
 * - Logs tab: pagination at 10, full supervizornega card rendering
 * - "Барања и задачи" section in Медицинско досие wired to Tasks tab
 * Call: openClientCard(clientId)
 * Requires: auth-guard.js (window._sb, window._username, window._userId)
 */

(function(){

// ── Styles ────────────────────────────────────────────────────────────
const STYLE = `
<style id="cc-styles">
#cc-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,0.65);z-index:200;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px)}
#cc-backdrop.open{display:flex}
#cc-modal{background:#fff;border-radius:14px;width:100%;max-width:1060px;max-height:95vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden}
#cc-header{padding:1.25rem 1.5rem 0;background:#fff;flex-shrink:0}
.cc-hero{display:flex;align-items:flex-start;gap:1.1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.cc-avatar{width:88px;height:88px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;flex-shrink:0;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,0.16)}
.cc-avatar img{width:100%;height:100%;object-fit:cover}
.cc-hero-info{flex:1;min-width:0}
.cc-hero-row1{display:flex;align-items:center;justify-content:space-between;gap:0.75rem}
.cc-name{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:600;color:var(--dark);line-height:1.2}
.cc-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s;flex-shrink:0}
.cc-close:hover{color:var(--dark)}
.cc-hero-badges{display:flex;align-items:center;flex-wrap:wrap;gap:0.3rem;margin-top:0.35rem}
.cc-hbadge{display:inline-flex;align-items:center;gap:0.3rem;padding:0.2rem 0.6rem;background:var(--cream);border:1px solid var(--border);border-radius:20px;font-size:0.77rem;font-weight:600;color:var(--dark)}
.cc-hbadge.green{background:#e6f4ec;border-color:#b5d5c0;color:#2a6e3a}
.cc-dot{width:4px;height:4px;border-radius:50%;background:var(--gray);opacity:0.4;margin:0 0.2rem;flex-shrink:0}
.cc-hero-pills{display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.45rem}
.cc-pill{display:inline-flex;align-items:center;gap:0.25rem;padding:0.18rem 0.6rem;border-radius:10px;background:var(--cream);border:1px solid var(--border);font-size:0.74rem;color:var(--dark)}
.cc-pill-lbl{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);margin-right:0.1rem}
.cc-tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin-top:0.85rem;overflow:hidden}
.cc-tab{flex:1;padding:0.6rem 0.5rem;font-family:'Lato',sans-serif;font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--gray);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s,background 0.15s;background:none;border-top:none;border-left:none;border-right:none;white-space:nowrap;text-align:center;min-width:0}
.cc-tab:hover{color:var(--dark);background:rgba(0,0,0,0.025)}
.cc-tab.active{color:var(--olive);border-bottom-color:var(--olive);background:rgba(107,130,40,0.04)}
#cc-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem}
.cc-section{margin-bottom:1.5rem}
.cc-section-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem 1.5rem}
.cc-field{display:flex;flex-direction:column;gap:0.1rem}
.cc-label{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.cc-value{font-size:0.88rem;color:var(--dark);line-height:1.5}
.cc-full{grid-column:1/-1}
.cc-empty{text-align:center;padding:2rem;color:var(--gray);font-size:0.85rem}
.cc-edit-btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.4rem 0.8rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.cc-edit-btn:hover{border-color:var(--olive);color:var(--olive)}
.dosie-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
@media(max-width:720px){.dosie-layout{grid-template-columns:1fr}}
.vitals-view-tabs{display:flex;gap:0.3rem;margin-bottom:0.75rem}
.vtab{padding:0.28rem 0.8rem;font-size:0.72rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:var(--cream);color:var(--gray);transition:all 0.15s;display:inline-flex;align-items:center;gap:0.3rem}
.vtab.active{background:var(--olive);color:#fff;border-color:var(--olive)}
.vitals-chart-wrap{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:0.75rem}
.vpills{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.6rem}
.vpill{padding:0.2rem 0.6rem;font-size:0.7rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:#fff;color:var(--gray);transition:all 0.15s}
.vpill.active{background:var(--olive);color:#fff;border-color:var(--olive)}
.chart-canvas-wrap{position:relative;height:155px}
.chart-canvas-wrap canvas{display:block}
.chart-note{font-size:0.71rem;color:var(--gray);text-align:right;margin-top:0.3rem}
.vitals-list-wrap{border:1px solid var(--border);border-radius:6px;overflow:hidden;max-height:300px;overflow-y:auto}
.vitals-list{display:flex;flex-direction:column}
.vl-row{display:grid;grid-template-columns:1.4fr repeat(8,1fr);gap:0;align-items:center;padding:0.38rem 0.6rem;border-bottom:1px solid var(--border);font-size:0.75rem}
.vl-row:last-child{border-bottom:none}
.vl-row.hdr{background:var(--cream);font-size:0.64rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);position:sticky;top:0;z-index:1}
.vl-cell{text-align:center}
.vl-cell.date{text-align:left;color:var(--gray);font-size:0.73rem}
.vl-cell.has{color:var(--dark);font-weight:600}
.vl-cell.empty{color:#ccc}
.therapy-tbl{width:100%;border-collapse:collapse;font-size:0.83rem}
.therapy-tbl th{text-align:left;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);padding:0.4rem 0.65rem;border-bottom:2px solid var(--border)}
.therapy-tbl td{padding:0.5rem 0.65rem;border-bottom:1px solid var(--border);vertical-align:middle}
.therapy-tbl tr:last-child td{border-bottom:none}
.badge-cc{display:inline-block;padding:0.12rem 0.45rem;border-radius:20px;font-size:0.64rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase}
.badge-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.badge-stopped{background:#f0ece2;color:#8a7a55}

/* Therapy session cards */
.therapy-session{border:1px solid var(--border);border-radius:7px;overflow:hidden;margin-bottom:0.65rem}
.therapy-session:last-child{margin-bottom:0}
.therapy-session-hdr{display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.85rem;background:var(--cream);border-bottom:1px solid var(--border);gap:0.5rem;flex-wrap:wrap}
.therapy-session-dates{font-size:0.78rem;font-weight:700;color:var(--dark)}
.therapy-session-dates span{font-weight:400;color:var(--gray)}
.therapy-session-status{display:inline-block;padding:0.1rem 0.5rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase}
.tss-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.tss-ended{background:#f0ece2;color:#8a7a55;border:1px solid #d5c5a5}
.therapy-session-note{font-size:0.78rem;color:var(--gray);padding:0.35rem 0.85rem;border-bottom:1px solid var(--border);font-style:italic}
.therapy-drugs-list{padding:0.4rem 0}
.therapy-drug-row{display:grid;grid-template-columns:1fr auto auto;gap:0.5rem 1rem;align-items:center;padding:0.35rem 0.85rem;border-bottom:1px solid var(--border);font-size:0.83rem}
.therapy-drug-row:last-child{border-bottom:none}
.drug-name{font-weight:700;color:var(--dark)}
.drug-form{font-size:0.75rem;color:var(--gray)}
.drug-dosage{font-size:0.8rem;color:var(--olive);font-weight:700;white-space:nowrap}
.diag-list{display:flex;flex-direction:column;gap:0.35rem}
.diag-item{display:flex;align-items:center;gap:0.65rem;padding:0.45rem 0.7rem;background:var(--cream);border:1px solid var(--border);border-radius:4px}
.diag-kod{font-family:monospace;font-size:0.8rem;font-weight:700;color:var(--olive);flex-shrink:0}
.diag-opis{font-size:0.83rem}

/* Dosie tasks mini link */
.tasks-mini-link{display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.85rem;background:#f0f4e8;border:1px solid #c5d88a;border-radius:8px;cursor:pointer;transition:background .14s}
.tasks-mini-link:hover{background:#e6efce}
.tasks-mini-left{display:flex;align-items:center;gap:0.55rem;font-size:0.83rem;color:#4a6a10;font-weight:600}
.tasks-mini-count{font-size:0.72rem;background:#4a6a10;color:#fff;border-radius:20px;padding:0.1rem 0.5rem;font-weight:700}
.tasks-mini-arrow{font-size:0.8rem;color:#4a6a10;opacity:0.7}

/* Logs tab */
.logs-toolbar-cc{display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem;flex-wrap:wrap}
.logs-month-sel{padding:0.38rem 0.7rem;border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.82rem;background:#fff;color:var(--dark);cursor:pointer;outline:none}
.logs-type-chips{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.85rem}
.ltchip{display:inline-flex;align-items:center;gap:0.25rem;padding:0.2rem 0.55rem;border-radius:20px;font-size:0.68rem;font-weight:700;letter-spacing:0.04em;cursor:pointer;border:2px solid transparent;transition:all 0.13s;user-select:none}
.ltchip-dot{width:6px;height:6px;border-radius:50%;display:inline-block;flex-shrink:0}
.ltchip-all{background:#f0ece2;color:#8a7a55;border-color:#d8d0bc}
.ltchip-all.active,.ltchip-all:hover{background:#e8e0d0;border-color:#8a7a55}
.ltchip-doctor{background:#e8ecf5;color:#2e4a8a}.ltchip-doctor.active,.ltchip-doctor:hover{border-color:#2e4a8a}
.ltchip-nurse{background:#f0e8f5;color:#6a3a8a}.ltchip-nurse.active,.ltchip-nurse:hover{border-color:#6a3a8a}
.ltchip-social{background:#e8f0e8;color:#3a6e3a}.ltchip-social.active,.ltchip-social:hover{border-color:#3a6e3a}
.ltchip-fizio{background:#fdf0e0;color:#c07028}.ltchip-fizio.active,.ltchip-fizio:hover{border-color:#c07028}
.ltchip-sup{background:#fce8f0;color:#b03060}.ltchip-sup.active,.ltchip-sup:hover{border-color:#b03060}

/* Log entry card */
.log-entry{background:#fff;border:1px solid var(--border);border-radius:7px;padding:0.85rem 1rem 0.85rem 1.1rem;border-left:3px solid var(--le-accent,var(--border));margin-bottom:0.6rem;transition:box-shadow 0.13s}
.log-entry:hover{box-shadow:0 2px 8px rgba(0,0,0,0.07)}
.log-entry[data-type="doctor"]        {--le-accent:#2e4a8a}
.log-entry[data-type="nurse"]         {--le-accent:#6a3a8a}
.log-entry[data-type="social"]        {--le-accent:#3a6e3a}
.log-entry[data-type="fizioterapevt"] {--le-accent:#c07028}
.log-entry[data-type="supervizornega"]{--le-accent:#b03060}
.le-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem;flex-wrap:wrap;gap:0.3rem}
.le-left{display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap}
.le-diag{font-family:monospace;font-size:0.81rem;font-weight:700;color:var(--olive)}
.le-date{font-size:0.71rem;color:var(--gray)}
.le-type{display:inline-block;padding:0.1rem 0.42rem;border-radius:10px;font-size:0.63rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em}
.le-smena{display:inline-block;padding:0.1rem 0.4rem;border-radius:10px;font-size:0.62rem;font-weight:700;text-transform:uppercase;background:#fff3cd;color:#856404;border:1px solid #ffe69c}
.lt-doctor{background:#e8ecf5;color:#2e4a8a}
.lt-nurse{background:#f0e8f5;color:#6a3a8a}
.lt-social{background:#e8f0e8;color:#3a6e3a}
.lt-fizio{background:#fdf0e0;color:#c07028}
.lt-supervizornega{background:#fce8f0;color:#b03060}
.lt-other{background:#f0ece2;color:#8a7a55}
.le-field{margin-top:0.35rem}
.le-fl{font-size:0.63rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray)}
.le-fv{font-size:0.82rem;color:var(--dark);line-height:1.5}
.vital-chips{display:flex;flex-wrap:wrap;gap:0.35rem 0.9rem;padding:0.5rem 0.7rem;background:var(--cream);border-radius:5px;border:1px solid var(--border);margin:0.35rem 0}
.vc{font-size:0.8rem;color:var(--dark)}.vc span{font-weight:700}
.le-sup-section{margin-top:0.5rem}
.le-sup-title{font-size:0.61rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);display:flex;align-items:center;gap:0.4rem;margin-bottom:0.3rem}
.le-sup-title::after{content:'';flex:1;height:1px;background:var(--border)}
.le-sup-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.3rem}
.le-sup-kv{background:var(--cream);border:1px solid var(--border);border-radius:4px;padding:0.35rem 0.55rem}
.le-sup-kv .k{font-size:0.6rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);margin-bottom:0.08rem}
.le-sup-kv .v{font-size:0.79rem;color:var(--dark);line-height:1.4}

/* Pagination */
.cc-pagination{display:flex;align-items:center;justify-content:center;gap:0.35rem;margin-top:1rem;flex-wrap:wrap}
.cc-page-btn{min-width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:4px;background:#fff;font-family:'Lato',sans-serif;font-size:0.78rem;cursor:pointer;color:var(--gray);transition:all 0.13s;padding:0 0.45rem}
.cc-page-btn:hover{border-color:var(--dark);color:var(--dark)}
.cc-page-btn.active{background:var(--dark);color:#fff;border-color:var(--dark);font-weight:700}
.cc-page-btn:disabled{opacity:0.35;cursor:default}
.cc-page-info{font-size:0.72rem;color:var(--gray);padding:0 0.25rem}
.cc-btn-outline{display:block;width:100%;padding:0.55rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.81rem;font-weight:700;color:var(--gray);cursor:pointer;text-align:center;transition:background 0.15s;margin-top:0.5rem}
.cc-btn-outline:hover{background:var(--cream2,#f0ece2)}
.cc-btn-olive{background:var(--olive)!important;color:#fff!important;border-color:var(--olive)!important}
.cc-btn-olive:hover{opacity:0.88}
.srodstvo-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;padding:0.6rem 0.8rem;background:var(--cream);border:1px solid var(--border);border-radius:5px;font-size:0.84rem;margin-bottom:0.4rem}

/* ── Tasks tab styles ── */
.cct-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
.cct-btn-group{display:flex;gap:.4rem;flex-wrap:wrap}
.cct-btn{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .85rem;border-radius:5px;font-family:'Lato',sans-serif;font-size:.74rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;border:none;transition:all .14s;white-space:nowrap}
.cct-btn-task{background:var(--dark);color:#fff}
.cct-btn-task:hover{background:var(--olive)}
.cct-btn-req{background:#2e4a8a;color:#fff}
.cct-btn-req:hover{background:#1a3060}
.cct-empty{text-align:center;padding:2rem 1rem;color:var(--gray);font-size:.84rem}
.cct-feed{display:flex;flex-direction:column;gap:.5rem}
.cct-card{background:#fff;border:1px solid var(--border);border-radius:7px;padding:.75rem .95rem .75rem 1.05rem;border-left:3px solid var(--cct-accent,var(--border));display:flex;align-items:flex-start;justify-content:space-between;gap:.65rem;transition:box-shadow .13s}
.cct-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.07)}
.cct-card.ct-task{--cct-accent:var(--olive)}
.cct-card.ct-request{--cct-accent:#2e4a8a}
.cct-card.ct-completed{--cct-accent:#81c784;opacity:.8}
.cct-card.ct-rejected{--cct-accent:#ef5350;opacity:.75}
.cct-card.ct-overdue{--cct-accent:#c0392b}
.cct-card-main{flex:1;min-width:0}
.cct-top{display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem;flex-wrap:wrap}
.cct-type-pill{font-size:.62rem;font-weight:700;padding:.08rem .4rem;border-radius:8px;letter-spacing:.05em;text-transform:uppercase;display:inline-flex;align-items:center;gap:.25rem}
.ctp-task{background:#f0f4e8;color:#4a6a10}
.ctp-req{background:#e8ecf5;color:#2e4a8a}
.cct-title{font-weight:700;font-size:.84rem;color:var(--dark);line-height:1.35;margin-bottom:.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cct-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.3rem;font-size:.68rem;color:var(--gray)}
.cct-st{display:inline-flex;align-items:center;gap:.2rem;padding:.07rem .4rem;border-radius:8px;font-size:.63rem;font-weight:700}
.cs-pending{background:#fff3e0;color:#e65100}
.cs-inprogress{background:#e3f2fd;color:#1565c0}
.cs-completed{background:#e8f5e9;color:#2e7d32}
.cs-rejected{background:#fce4ec;color:#c62828}
.cct-due.overdue{color:#c0392b;font-weight:700}
.cct-view-btn{flex-shrink:0;padding:.38rem .75rem;border:1px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.73rem;font-weight:700;color:var(--gray);background:#fff;cursor:pointer;transition:all .14s;white-space:nowrap}
.cct-view-btn:hover{border-color:var(--olive);color:var(--olive)}
.cct-section-label{font-size:.63rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);margin:1rem 0 .45rem;display:flex;align-items:center;gap:.5rem}
.cct-section-label::after{content:'';flex:1;height:1px;background:var(--border)}
</style>`;

// ── DOM ────────────────────────────────────────────────────────────────
function injectDOM(){
  if(document.getElementById('cc-backdrop'))return;
  document.head.insertAdjacentHTML('beforeend',STYLE);
  document.body.insertAdjacentHTML('beforeend',`
  <div id="cc-backdrop">
    <div id="cc-modal" role="dialog" aria-modal="true">
      <div id="cc-header">
        <div class="cc-hero">
          <div class="cc-avatar" id="cc-avatar">?</div>
          <div class="cc-hero-info">
            <div class="cc-hero-row1">
              <div class="cc-name" id="cc-name">…</div>
              <button class="cc-close" id="cc-close">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="cc-hero-badges" id="cc-hero-badges"></div>
            <div class="cc-hero-pills" id="cc-hero-pills"></div>
          </div>
        </div>
        <div class="cc-tabs">
          <button class="cc-tab" data-tab="social">Социјално досие</button>
          <button class="cc-tab active" data-tab="dosie">Медицинско досие</button>
          <button class="cc-tab" data-tab="logs">Записи</button>
          <button class="cc-tab" data-tab="tasks">Задачи</button>
          <button class="cc-tab" data-tab="info">Лични податоци</button>
        </div>
      </div>
      <div id="cc-body"><div class="cc-empty">Се вчитува…</div></div>
    </div>
  </div>`);

  document.getElementById('cc-close').addEventListener('click', closeClientCard);
  document.getElementById('cc-backdrop').addEventListener('click', ev => {
    if(ev.target===document.getElementById('cc-backdrop')) closeClientCard();
  });
  document.querySelectorAll('.cc-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab);
    });
  });
}

// ── State ──────────────────────────────────────────────────────────────
let _client=null, _therapySessions=[], _logs=[], _vitals=[], _srodstvo=[];
let _logsMonth=null;
let _logsTypeFilter='all';
let _logsPage=1;
const LOGS_PAGE_SIZE=10;
let _vitalsView='chart';
let _activeParam='temperatura';
let _therapyShowPast=0;
const LOGS_FETCH_MAX=300;
let _currentClientId=null;

// ── Helpers ────────────────────────────────────────────────────────────
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function ageDetailFromEmbg(embg){
  if(!embg||String(embg).length<7)return null;
  const d=String(embg).padStart(13,'0');
  const day=parseInt(d.slice(0,2),10),mon=parseInt(d.slice(2,4),10)-1;
  let yr=parseInt(d.slice(4,7),10);yr=yr<100?2000+yr:1000+yr;
  try{
    const bd=new Date(yr,mon,day);if(isNaN(bd.getTime()))return null;
    const today=new Date();let years=today.getFullYear()-bd.getFullYear();
    let months=today.getMonth()-bd.getMonth(),days=today.getDate()-bd.getDate();
    if(days<0){months--;const pm=new Date(today.getFullYear(),today.getMonth(),0);days+=pm.getDate();}
    if(months<0){years--;months+=12;}
    if(years<0||years>130)return null;
    return{years,months,days};
  }catch{return null;}
}

function ageFromEmbg(embg){
  if(!embg||String(embg).length<7)return null;
  const d=String(embg).padStart(13,'0');
  const day=parseInt(d.slice(0,2),10),mon=parseInt(d.slice(2,4),10)-1;
  let yr=parseInt(d.slice(4,7),10);yr=yr<100?2000+yr:1000+yr;
  try{
    const bd=new Date(yr,mon,day);if(isNaN(bd.getTime()))return null;
    const today=new Date();let age=today.getFullYear()-bd.getFullYear();
    if(today.getMonth()<mon||(today.getMonth()===mon&&today.getDate()<day))age--;
    return(age>0&&age<130)?age:null;
  }catch{return null;}
}

function fmtDate(ts){return ts?new Date(ts).toLocaleDateString('mk-MK'):'—';}
function fmtDateTime(ts){return ts?new Date(ts).toLocaleString('mk-MK'):'—';}

function isPrivileged(){const u=(window._username||'').toLowerCase();return u==='menadzer'||u==='glavnasestra';}
function isDoctor(){return(window._username||'').toLowerCase()==='doktor';}
function canSeeAll(){return isPrivileged()||isDoctor();}

function canSeeLogType(logType){
  const u=(window._username||'').toLowerCase();
  if(u==='menadzer')return true;
  if(logType==='doctor'||logType==='nurse')return u==='doktor'||u==='glavnasestra';
  if(logType==='social')return u==='socijalenrabotnik'||u==='doktor'||u==='glavnasestra';
  if(logType==='fizioterapevt')return u==='fizioterapevt'||u==='doktor'||u==='glavnasestra';
  if(logType==='supervizornega')return u==='supervizornega'||u==='doktor'||u==='glavnasestra';
  return isPrivileged();
}

function getMyRole(){
  const u=(window._username||'').toLowerCase();
  if(u.startsWith('doktor'))             return 'doktor';
  if(u.startsWith('fizioterapevt'))      return 'fizioterapevt';
  if(u.startsWith('glavnasestra'))       return 'glavna_sestra';
  if(u.startsWith('menadzer'))           return 'menadzer';
  if(u.startsWith('socijalonrabotnik'))  return 'socijalen';
  if(u.startsWith('supervizornega'))     return 'supervizor';
  return 'other';
}

const CAN_CREATE_REQUEST_ROLES=['menadzer','glavna_sestra','doktor','medicinska_sestra'];

// ── Open ────────────────────────────────────────────────────────────────
window.openClientCard = async function(clientId){
  injectDOM();
  _currentClientId=clientId;
  window._ccCurrentClientId=clientId;
  _logsMonth=null; _logsTypeFilter='all'; _logsPage=1;
  _vitalsView='chart'; _activeParam='temperatura'; _therapyShowPast=0;
  document.getElementById('cc-body').innerHTML='<div class="cc-empty">Се вчитува…</div>';
  document.getElementById('cc-hero-badges').innerHTML='';
  document.getElementById('cc-hero-pills').innerHTML='';
  document.getElementById('cc-name').textContent='…';
  const av=document.getElementById('cc-avatar');
  av.innerHTML=''; av.textContent='?';
  document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.cc-tab[data-tab="dosie"]').classList.add('active');
  document.getElementById('cc-backdrop').classList.add('open');
  document.body.style.overflow='hidden';

  const [clientRes, therapySessionsRes, logsRes, vitalsRes, srodRes] = await Promise.all([
    window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,licna_karta_broj,
      adresa,telefon,floor_number,room_number,bed_number,
      profile_pic_url,status,client_status,created_at,updated_at,
      social_notes,social_completed_at,
      doctor_notes,doctor_completed_at,
      priem_dijagnoza_kod,priem_dijagnoza_opis,
      priem_anamneza,priem_naod,priem_notes,
      priem_kp_sistolicen,priem_kp_dijastolicen,priem_puls,
      priem_temperatura,priem_spo2,priem_respiracii,
      priem_tezina,priem_seker,priem_bolka,
      client_chronic_diagnoses(id,kod,opis,added_at)
    `).eq('id',clientId).single(),

    window._sb.from('chronic_therapy_sessions')
      .select(`id,started_at,ended_at,note,created_at,chronic_therapy_drugs(id,generic_name,form,dosage,sort_order)`)
      .eq('client_id',clientId).order('started_at',{ascending:false}),

    window._sb.from('client_logs')
      .select(`id,created_at,log_type,created_by,
        dijagnoza_kod,dijagnoza_opis,anamneza,naod,parenteralna,zabeleski,
        kp_sistolicen,kp_dijastolicen,puls,temperatura,spo2,respiracii,
        tezina,seker,bolka,diureza,stolica,
        smena,higijenska_nega,ishrana,mobilnost,psihosocijalno`)
      .eq('client_id',clientId).order('created_at',{ascending:false}).limit(LOGS_FETCH_MAX),

    window._sb.from('client_logs')
      .select('created_at,kp_sistolicen,kp_dijastolicen,puls,temperatura,spo2,respiracii,tezina,seker,bolka,diureza,stolica')
      .eq('client_id',clientId).order('created_at',{ascending:false}).limit(25),

    window._sb.from('client_srodstvo')
      .select('id,ime_prezime,adresa,telefon').eq('client_id',clientId),
  ]);

  _client = clientRes.data;

  if(clientRes.error)       console.error('[client-card] client:',      clientRes.error);
  if(therapySessionsRes.error)console.error('[client-card] therapy:',  therapySessionsRes.error);
  if(logsRes.error)         console.error('[client-card] logs:',        logsRes.error);
  if(vitalsRes.error)       console.error('[client-card] vitals:',      vitalsRes.error);
  if(srodRes.error)         console.error('[client-card] srodstvo:',    srodRes.error);

  _therapySessions = (therapySessionsRes.data||[]).map(s=>({
    ...s,
    chronic_therapy_drugs:(s.chronic_therapy_drugs||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  }));
  _logs     = logsRes.data||[];
  _vitals   = (vitalsRes.data||[]).filter(v=>
    v.kp_sistolicen||v.puls||v.temperatura||v.spo2||v.respiracii||v.tezina||v.seker||v.bolka!=null||v.diureza!=null||v.stolica
  );
  _srodstvo = srodRes.data||[];

  if(!_client){
    document.getElementById('cc-body').innerHTML='<div class="cc-empty">Корисникот не е пронајден.</div>';
    return;
  }

  const c=_client;

  const avEl=document.getElementById('cc-avatar');
  if(c.profile_pic_url){
    const img=document.createElement('img');
    img.src=c.profile_pic_url; img.alt='Профилна слика';
    img.style.cssText='width:100%;height:100%;object-fit:cover';
    img.onerror=()=>{ avEl.innerHTML=''; avEl.textContent=(c.ime_prezime||'?').charAt(0).toUpperCase(); };
    avEl.innerHTML=''; avEl.appendChild(img);
  }else{
    avEl.innerHTML=''; avEl.textContent=(c.ime_prezime||'?').charAt(0).toUpperCase();
  }

  document.getElementById('cc-name').textContent=(c.obrakanje?c.obrakanje+' ':'')+(c.ime_prezime||'');

  const bp=[];
  const ageDetail=ageDetailFromEmbg(c.embg);
  if(ageDetail!==null){
    const parts=[];
    if(ageDetail.years>0) parts.push(`${ageDetail.years} год`);
    if(ageDetail.months>0)parts.push(`${ageDetail.months} мес`);
    if(ageDetail.days>0||parts.length===0)parts.push(`${ageDetail.days} ден`);
    bp.push(`<span class="cc-hbadge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>${parts.join(' ')}</span>`);
  }
  if(c.room_number){
    if(bp.length)bp.push('<span class="cc-dot"></span>');
    bp.push(`<span class="cc-hbadge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Соба ${c.room_number} / Кревет ${c.bed_number}</span>`);
  }
  const fl=c.floor_number||(window.roomToFloor?window.roomToFloor(c.room_number):null);
  if(fl){bp.push('<span class="cc-dot"></span>');bp.push(`<span class="cc-hbadge">Кат ${fl}</span>`);}

  const cst=c.client_status||c.status||'active';
  if(cst==='odjavен'){bp.push('<span class="cc-dot"></span><span class="cc-hbadge" style="background:#e8ecf5;color:#2e4a8a;border-color:#c0ccdf">Одјавен</span>');}
  else if(cst==='pocinat'){bp.push('<span class="cc-dot"></span><span class="cc-hbadge" style="background:#f5e8e8;color:#8a3a3a;border-color:#dfc0c0">Починат</span>');}
  else{bp.push('<span class="cc-dot"></span><span class="cc-hbadge green">Активен</span>');}

  document.getElementById('cc-hero-badges').innerHTML=bp.join('');

  const pp=[];
  if(c.maticen_broj)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Мат.</span>${e(c.maticen_broj)}</span>`);
  if(c.telefon)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Тел.</span>${e(c.telefon)}</span>`);
  if(c.adresa)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Адреса</span>${e(c.adresa)}</span>`);
  document.getElementById('cc-hero-pills').innerHTML=pp.join('');

  renderTab('dosie');
};

window.closeClientCard=function(){
  const bd=document.getElementById('cc-backdrop');
  if(bd)bd.classList.remove('open');
  document.body.style.overflow='';
};

// ── Tab router ─────────────────────────────────────────────────────────
function renderTab(tab){
  const body=document.getElementById('cc-body');
  if(tab==='social')     body.innerHTML=renderSocial();
  else if(tab==='dosie') {body.innerHTML=renderDosie();scheduleChart();}
  else if(tab==='logs')  {body.innerHTML=renderLogs();bindLogsControls();}
  else if(tab==='info')  body.innerHTML=renderInfo();
  else if(tab==='tasks') {body.innerHTML='';renderTasksTab(body);}
}
window._ccTab=renderTab;

// ══════════════════════════════════════════════════════════════════════
// Социјално досие
// ══════════════════════════════════════════════════════════════════════
function renderSocial(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Уреди</button>`:'';
  const hasSocial=c.social_notes||c.social_completed_at;
  const socialHtml=hasSocial?`<div class="cc-grid">
    ${c.social_notes?`<div class="cc-field cc-full"><div class="cc-label">Белешки</div><div class="cc-value">${e(c.social_notes)}</div></div>`:''}
    ${c.social_completed_at?`<div class="cc-field"><div class="cc-label">Комплетирано на</div><div class="cc-value">${fmtDate(c.social_completed_at)}</div></div>`:''}
  </div>`:'<div class="cc-empty" style="padding:0.5rem">Нема внесени социјални информации.</div>';
  const srodHtml=_srodstvo.length
    ?_srodstvo.map(s=>`<div class="srodstvo-row">
        <div><div class="cc-label">Ime и Презиме</div><div>${e(s.ime_prezime||'—')}</div></div>
        <div><div class="cc-label">Адреса</div><div>${e(s.adresa||'—')}</div></div>
        <div><div class="cc-label">Телефон</div><div>${e(s.telefon||'—')}</div></div>
      </div>`).join('')
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесено сродство.</div>';
  return`
  <div class="cc-section"><div class="cc-section-title"><span>Социјално досие</span>${editBtn}</div>${socialHtml}</div>
  <div class="cc-section"><div class="cc-section-title"><span>Сродство / Контакт лица</span></div>${srodHtml}</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// Медицинско досие
// ══════════════════════════════════════════════════════════════════════
function renderDosie(){
  if(!canSeeAll())return'<div class="cc-empty">Немате пристап до медицинското досие.</div>';
  const c=_client;
  const diags=c.client_chronic_diagnoses||[];
  const activeSessions=_therapySessions.filter(s=>!s.ended_at);
  const endedSessions =_therapySessions.filter(s=> s.ended_at);

  const leftCol=`<div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Витални знаци</span></div>
      ${renderVitalsWidget()}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронична терапија</span></div>
      ${renderTherapySessions(activeSessions,endedSessions)}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронични дијагнози</span></div>
      ${!diags.length?'<div class="cc-empty" style="padding:0.5rem">Нема хронични дијагнози.</div>'
        :`<div class="diag-list">${diags.map(d=>`<div class="diag-item"><span class="diag-kod">${e(d.kod)}</span><span class="diag-opis">${e(d.opis||'—')}</span></div>`).join('')}</div>`}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Преглед на прием</span></div>
      <button class="cc-btn-outline" id="cc-priem-toggle" style="margin-bottom:0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.35rem"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Прикажи преглед на прием
      </button>
      <div id="cc-priem-body" style="display:none;margin-top:0.75rem">
        ${c.priem_dijagnoza_kod?`<div style="display:flex;align-items:center;gap:0.7rem;margin-bottom:0.6rem">
          <span style="font-family:monospace;font-size:0.95rem;font-weight:700;color:var(--olive)">${e(c.priem_dijagnoza_kod)}</span>
          <span style="font-size:0.87rem">${e(c.priem_dijagnoza_opis||'')}</span></div>`
          :''}
        ${renderAdmissionVitals(c)}
        ${c.priem_anamneza?`<div class="cc-field" style="margin-top:0.5rem"><div class="cc-label">Анамнеза</div><div class="cc-value">${e(c.priem_anamneza)}</div></div>`:''}
        ${c.priem_naod?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Наод</div><div class="cc-value">${e(c.priem_naod)}</div></div>`:''}
        ${c.priem_notes?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Белешки на прием</div><div class="cc-value">${e(c.priem_notes)}</div></div>`:''}
        ${c.doctor_notes?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Белешки на доктор</div><div class="cc-value">${e(c.doctor_notes)}</div></div>`:''}
        ${(!c.priem_dijagnoza_kod&&!c.priem_anamneza&&!c.priem_naod&&!c.priem_notes&&!c.doctor_notes&&!renderAdmissionVitals(c))?'<div class="cc-empty" style="padding:0.4rem">Нема внесен преглед на прием.</div>':''}
      </div>
    </div>
  </div>`;

  const miniLogs=_logs.filter(l=>canSeeLogType(l.log_type||'doctor')).slice(0,3);
  const rightCol=`<div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Задачи и барања</span></div>
      <div id="cc-dosie-tasks-widget"><div style="font-size:0.82rem;color:var(--gray)">Се вчитува…</div></div>
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Последни записи</span></div>
      ${miniLogs.length?miniLogs.map(l=>renderLogEntry(l)).join(''):'<div class="cc-empty" style="padding:0.5rem">Нема записи.</div>'}
      ${_logs.length?`<button class="cc-btn-outline cc-btn-olive" onclick="document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));document.querySelector('.cc-tab[data-tab=\\'logs\\']').classList.add('active');window._ccTab('logs')">Отвори ги сите записи →</button>`:''}
    </div>
  </div>`;

  return`<div class="dosie-layout">${leftCol}${rightCol}</div>`;
}

function renderTherapySessions(active, ended){
  if(!active.length&&!ended.length)return'<div class="cc-empty" style="padding:0.5rem">Нема внесена хронична терапија.</div>';
  function sessionHtml(s){
    const isActive=!s.ended_at;
    const dateRange=isActive
      ?`<span>Од</span> ${fmtDate(s.started_at)} <span>— тековна</span>`
      :`<span>Од</span> ${fmtDate(s.started_at)} <span>до</span> ${fmtDate(s.ended_at)}`;
    const drugs=s.chronic_therapy_drugs||[];
    const drugsHtml=drugs.length
      ?drugs.map(d=>`<div class="therapy-drug-row">
          <div><div class="drug-name">${e(d.generic_name||'—')}</div>${d.form?`<div class="drug-form">${e(d.form)}</div>`:''}</div>
          <div class="drug-dosage">${e(d.dosage||'—')}</div>
        </div>`).join('')
      :'<div style="padding:0.5rem 0.85rem;font-size:0.78rem;color:var(--gray)">Нема лекови во оваа сесија.</div>';
    return`<div class="therapy-session">
      <div class="therapy-session-hdr">
        <div class="therapy-session-dates">${dateRange}</div>
        <span class="therapy-session-status ${isActive?'tss-active':'tss-ended'}">${isActive?'Активна':'Завршена'}</span>
      </div>
      ${s.note?`<div class="therapy-session-note">${e(s.note)}</div>`:''}
      <div class="therapy-drugs-list">${drugsHtml}</div>
    </div>`;
  }
  let html='';
  if(active.length) html+=active.map(sessionHtml).join('');

  const showEnded=ended.slice(0,_therapyShowPast);
  const hasMore=ended.length>_therapyShowPast;

  if(showEnded.length){
    if(active.length)html+=`<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);margin:0.75rem 0 0.4rem">Претходни сесии</div>`;
    html+=showEnded.map(sessionHtml).join('');
  }
  if(hasMore){
    html+=`<button class="cc-btn-outline" id="cc-therapy-load-more" style="margin-top:0.4rem">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.3rem"><polyline points="7 10 12 15 17 10"/></svg>
      Вчитај уште 5 претходни терапии
    </button>`;
  }
  return`<div id="cc-therapy-wrap">${html}</div>`;
}

// ── Admission vitals ───────────────────────────────────────────────────
function renderAdmissionVitals(c){
  const v=[];
  if(c.priem_temperatura) v.push(`Т°: <span>${c.priem_temperatura}°C</span>`);
  if(c.priem_puls)         v.push(`Пулс: <span>${c.priem_puls} bpm</span>`);
  if(c.priem_spo2)         v.push(`SpO2: <span>${c.priem_spo2}%</span>`);
  if(c.priem_kp_sistolicen&&c.priem_kp_dijastolicen)v.push(`КП: <span>${c.priem_kp_sistolicen}/${c.priem_kp_dijastolicen}</span>`);
  if(c.priem_respiracii)   v.push(`Респ: <span>${c.priem_respiracii}/мин</span>`);
  if(c.priem_tezina)       v.push(`Тежина: <span>${c.priem_tezina} kg</span>`);
  if(c.priem_seker)        v.push(`Шеќер: <span>${c.priem_seker} mmol/L</span>`);
  if(c.priem_bolka!=null)  v.push(`Болка: <span>${c.priem_bolka}/10</span>`);
  return v.length?`<div class="vital-chips" style="margin-top:0.5rem">${v.map(x=>`<div class="vc">${x}</div>`).join('')}</div>`:'';
}

// ══════════════════════════════════════════════════════════════════════
// Записи
// ══════════════════════════════════════════════════════════════════════
const _TL={doctor:'Доктор',nurse:'Сестра',social:'Социјален',fizioterapevt:'Физиотерапевт',supervizornega:'Супервизор за нега',other:'Друго'};
const _TC={doctor:'lt-doctor',nurse:'lt-nurse',social:'lt-social',fizioterapevt:'lt-fizio',supervizornega:'lt-supervizornega',other:'lt-other'};

function getFilteredLogs(){
  let logs=_logs.filter(l=>canSeeLogType(l.log_type||'doctor'));
  if(_logsMonth)logs=logs.filter(l=>l.created_at.startsWith(_logsMonth));
  if(_logsTypeFilter!=='all')logs=logs.filter(l=>(l.log_type||'doctor')===_logsTypeFilter);
  return logs;
}

function renderLogs(){
  const months=[...new Set(_logs.map(l=>l.created_at.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const monthOpts=months.map(m=>{
    const lbl=new Date(m+'-01T12:00:00').toLocaleDateString('mk-MK',{month:'long',year:'numeric'});
    return`<option value="${m}" ${_logsMonth===m?'selected':''}>${lbl}</option>`;
  }).join('');

  const allVisible=_logs.filter(l=>canSeeLogType(l.log_type||'doctor'));
  const typeCount={};
  allVisible.forEach(l=>{const t=l.log_type||'doctor';typeCount[t]=(typeCount[t]||0)+1;});

  const filtered=getFilteredLogs();
  const totalPages=Math.ceil(filtered.length/LOGS_PAGE_SIZE)||1;
  if(_logsPage>totalPages)_logsPage=totalPages;
  const slice=filtered.slice((_logsPage-1)*LOGS_PAGE_SIZE,_logsPage*LOGS_PAGE_SIZE);

  const typeChips=[
    {type:'all',label:'Сите',cls:'ltchip-all'},
    {type:'doctor',label:'Доктор',cls:'ltchip-doctor',dot:'#2e4a8a'},
    {type:'nurse',label:'Сестра',cls:'ltchip-nurse',dot:'#6a3a8a'},
    {type:'social',label:'Социјален',cls:'ltchip-social',dot:'#3a6e3a'},
    {type:'fizioterapevt',label:'Физио',cls:'ltchip-fizio',dot:'#c07028'},
    {type:'supervizornega',label:'Супервизор',cls:'ltchip-sup',dot:'#b03060'},
  ].filter(ch=>ch.type==='all'||typeCount[ch.type]>0)
   .map(ch=>{
    const dotHtml=ch.dot?`<span class="ltchip-dot" style="background:${ch.dot}"></span>`:'';
    const cnt=ch.type==='all'?allVisible.length:(typeCount[ch.type]||0);
    return`<span class="ltchip ${ch.cls} ${_logsTypeFilter===ch.type?'active':''}" data-type="${ch.type}">${dotHtml}${ch.label} <span style="opacity:0.65;font-weight:400">${cnt}</span></span>`;
  }).join('');

  return`
    <div class="logs-toolbar-cc">
      <span class="cc-label" style="margin:0;white-space:nowrap">Месец:</span>
      <select class="logs-month-sel" id="cc-logs-month">
        <option value="">Сите месеци</option>${monthOpts}
      </select>
      <span style="font-size:0.75rem;color:var(--gray);margin-left:auto">${filtered.length} записи</span>
    </div>
    <div class="logs-type-chips" id="cc-logs-type-chips">${typeChips}</div>
    <div id="cc-logs-list">
      ${slice.length?slice.map(l=>renderLogEntry(l)).join(''):'<div class="cc-empty">Нема записи за избраниот период/тип.</div>'}
    </div>
    ${totalPages>1?renderLogsPagination(totalPages,filtered.length):''}`;
}

function renderLogsPagination(totalPages,total){
  let btns=`<button class="cc-page-btn" id="cc-pg-prev" ${_logsPage===1?'disabled':''}>‹</button>`;
  const pages=new Set([1,totalPages,_logsPage,_logsPage-1,_logsPage+1].filter(p=>p>=1&&p<=totalPages));
  let prev=0;
  Array.from(pages).sort((a,b)=>a-b).forEach(p=>{
    if(prev&&p-prev>1)btns+=`<span class="cc-page-info">…</span>`;
    btns+=`<button class="cc-page-btn ${p===_logsPage?'active':''}" data-pg="${p}">${p}</button>`;
    prev=p;
  });
  btns+=`<button class="cc-page-btn" id="cc-pg-next" ${_logsPage===totalPages?'disabled':''}>›</button>`;
  const start=(_logsPage-1)*LOGS_PAGE_SIZE+1,end=Math.min(_logsPage*LOGS_PAGE_SIZE,total);
  btns+=`<span class="cc-page-info">${start}–${end} / ${total}</span>`;
  return`<div class="cc-pagination" id="cc-logs-pagination">${btns}</div>`;
}

function bindLogsControls(){
  const sel=document.getElementById('cc-logs-month');
  if(sel){sel.addEventListener('change',()=>{_logsMonth=sel.value||null;_logsPage=1;refreshLogs();});}
  const chips=document.getElementById('cc-logs-type-chips');
  if(chips){chips.addEventListener('click',ev=>{
    const chip=ev.target.closest('[data-type]');
    if(!chip)return;
    _logsTypeFilter=chip.dataset.type;_logsPage=1;refreshLogs();
  });}
  bindPagination();
}

function bindPagination(){
  const bar=document.getElementById('cc-logs-pagination');
  if(!bar)return;
  bar.addEventListener('click',ev=>{
    const btn=ev.target.closest('[data-pg]');
    if(btn){_logsPage=parseInt(btn.dataset.pg);refreshLogs();return;}
    if(ev.target.id==='cc-pg-prev'&&_logsPage>1){_logsPage--;refreshLogs();}
    if(ev.target.id==='cc-pg-next'){const t=Math.ceil(getFilteredLogs().length/LOGS_PAGE_SIZE);if(_logsPage<t){_logsPage++;refreshLogs();}}
  });
}

function refreshLogs(){
  document.getElementById('cc-body').innerHTML=renderLogs();
  bindLogsControls();
  document.getElementById('cc-body').scrollTop=0;
}

// ══════════════════════════════════════════════════════════════════════
// Log entry card renderer
// ══════════════════════════════════════════════════════════════════════
function renderLogEntry(l){
  const type=l.log_type||'doctor';
  const time=new Date(l.created_at).toLocaleTimeString('mk-MK',{hour:'2-digit',minute:'2-digit'});
  const dateStr=new Date(l.created_at).toLocaleDateString('mk-MK');
  const smenaHtml=l.smena?`<span class="le-smena">${e(l.smena)}</span>`:'';
  const v=[];
  if(l.temperatura) v.push(`Т°: <span>${l.temperatura}°C</span>`);
  if(l.puls)        v.push(`Пулс: <span>${l.puls} bpm</span>`);
  if(l.spo2)        v.push(`SpO2: <span>${l.spo2}%</span>`);
  if(l.kp_sistolicen&&l.kp_dijastolicen)v.push(`КП: <span>${l.kp_sistolicen}/${l.kp_dijastolicen} mmHg</span>`);
  if(l.respiracii)  v.push(`Респ: <span>${l.respiracii}/мин</span>`);
  if(l.tezina)      v.push(`Тежина: <span>${l.tezina} kg</span>`);
  if(l.seker)       v.push(`Шеќер: <span>${l.seker} mmol/L</span>`);
  if(l.bolka!=null) v.push(`Болка: <span>${l.bolka}/10</span>`);
  if(l.diureza!=null)v.push(`Диуреза: <span>${l.diureza} ml</span>`);
  if(l.stolica)     v.push(`Столица: <span>${e(l.stolica)}</span>`);
  const vitalsHtml=v.length?`<div class="vital-chips">${v.map(x=>`<div class="vc">${x}</div>`).join('')}</div>`:'';
  const diagHtml=l.dijagnoza_kod?`<div style="margin:0.3rem 0 0.2rem"><span class="le-diag">${e(l.dijagnoza_kod)}${l.dijagnoza_opis?' — '+e(l.dijagnoza_opis):''}</span></div>`:'';
  const bodyHtml=type==='supervizornega'?renderSupBody(l):renderStdBody(l);
  return`<div class="log-entry" data-type="${e(type)}">
    <div class="le-top">
      <div class="le-left">
        <span class="le-type ${_TC[type]||'lt-other'}">${_TL[type]||'Друго'}</span>
        ${smenaHtml}
      </div>
      <span class="le-date">${time} · ${dateStr}</span>
    </div>
    ${diagHtml}
    ${vitalsHtml}
    ${bodyHtml}
  </div>`;
}

function renderStdBody(l){
  const rows=[['anamneza','Анамнеза'],['naod','Наод'],['parenteralna','Парентерална'],['zabeleski','Забелешки']];
  const html=rows.filter(([k])=>l[k]).map(([k,lb])=>`<div class="le-field"><div class="le-fl">${lb}</div><div class="le-fv">${e(l[k])}</div></div>`).join('');
  return html?`<div style="margin-top:0.25rem">${html}</div>`:'';
}

function parsePipe(raw){
  if(!raw)return[];
  return raw.split('|').map(s=>{const i=s.indexOf(':');if(i===-1)return{k:s.trim(),v:''};return{k:s.slice(0,i).trim(),v:s.slice(i+1).trim()};}).filter(p=>p.k);
}

function renderSupBody(l){
  const sections=[
    {title:'Хигиенска нега',raw:l.higijenska_nega},
    {title:'Исхрана',raw:l.ishrana},
    {title:'Мобилност',raw:l.mobilnost},
    {title:'Психосоцијално',raw:l.psihosocijalno},
  ].filter(s=>s.raw);
  const sectHtml=sections.map(s=>{
    const pairs=parsePipe(s.raw);
    const cells=pairs.map(p=>`<div class="le-sup-kv"><div class="k">${e(p.k)}</div><div class="v">${e(p.v)||'—'}</div></div>`).join('');
    return`<div class="le-sup-section"><div class="le-sup-title">${s.title}</div><div class="le-sup-grid">${cells}</div></div>`;
  }).join('');
  const zabHtml=l.zabeleski?`<div class="le-field" style="margin-top:0.4rem"><div class="le-fl">Забелешки</div><div class="le-fv">${e(l.zabeleski)}</div></div>`:'';
  return sectHtml+zabHtml||'';
}

// ══════════════════════════════════════════════════════════════════════
// Лични податоци
// ══════════════════════════════════════════════════════════════════════
function renderInfo(){
  const c=_client;
  const age=ageFromEmbg(c.embg);
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="openClientEdit('${e(c.id)}',()=>openClientCard('${e(c.id)}'))"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Уреди</button>`:'';
  const srodHtml=_srodstvo.length
    ?_srodstvo.map(s=>`<div class="srodstvo-row">
        <div><div class="cc-label">Ime и Презиме</div><div>${e(s.ime_prezime||'—')}</div></div>
        <div><div class="cc-label">Адреса</div><div>${e(s.adresa||'—')}</div></div>
        <div><div class="cc-label">Телефон</div><div>${e(s.telefon||'—')}</div></div>
      </div>`).join('')
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесено сродство.</div>';
  return`
  <div class="cc-section">
    <div class="cc-section-title"><span>Лични податоци</span>${editBtn}</div>
    <div class="cc-grid">
      <div class="cc-field"><div class="cc-label">Обраќање</div><div class="cc-value">${e(c.obrakanje||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Матичен број</div><div class="cc-value">${e(c.maticen_broj||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Ime и Презиме</div><div class="cc-value">${e(c.ime_prezime||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Адреса</div><div class="cc-value">${e(c.adresa||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Телефон</div><div class="cc-value">${e(c.telefon||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">ЕМБГ</div><div class="cc-value" style="font-family:monospace">${e(c.embg||'—')}</div></div>
      ${age!==null?`<div class="cc-field"><div class="cc-label">Возраст</div><div class="cc-value">${age} години</div></div>`:''}
      <div class="cc-field"><div class="cc-label">Лична карта / Пасош</div><div class="cc-value">${e(c.licna_karta_broj||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Датум на прием</div><div class="cc-value">${fmtDate(c.created_at)}</div></div>
    </div>
  </div>
  <div class="cc-section">
    <div class="cc-section-title"><span>Сродство / Контакт лица</span></div>
    ${srodHtml}
  </div>`;
}

window.editClientData=function(clientId){
  if(typeof window.openClientEdit==='function'){
    window.openClientEdit(clientId,()=>window.openClientCard(clientId));
  }else{
    closeClientCard();
    window.location.href=`clients.html?edit=${clientId}`;
  }
};

// ══════════════════════════════════════════════════════════════════════
// Задачи tab — inline renderer (no external file needed)
// ══════════════════════════════════════════════════════════════════════
async function renderTasksTab(container){
  container.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--gray)">Се вчитува…</div>';
  const clientId=_currentClientId;

  const [{data:tasks},{data:requests}] = await Promise.all([
    window._sb.from('tasks').select('*').eq('client_id',clientId).order('created_at',{ascending:false}),
    window._sb.from('requests').select('*').eq('client_id',clientId).order('created_at',{ascending:false}),
  ]);

  const allTasks=tasks||[], allRequests=requests||[];

  async function refresh(){ await renderTasksTab(document.getElementById('cc-body')); }

  // Build combined list based on filter
  function getItems(filter){
    const combined=[
      ...allTasks.map(t=>({...t,_k:'task'})),
      ...allRequests.map(r=>({...r,_k:'request'})),
    ];
    if(filter==='tasks') return combined.filter(i=>i._k==='task'&&!i.archived);
    if(filter==='requests') return combined.filter(i=>i._k==='request'&&!i.archived);
    if(filter==='archived') return combined.filter(i=>i.archived);
    // active (default)
    return combined.filter(i=>!i.archived&&(i._k==='task'?i.status!=='completed':i.status!=='completed'&&i.status!=='rejected'));
  }

  let _tFilter='active';
  let _tPage=1;
  const T_PAGE=10;

  function renderTasksContent(){
    container.innerHTML='';

    // Filter tabs
    const tabsDiv=document.createElement('div');
    tabsDiv.style.cssText='display:flex;gap:0.3rem;margin-bottom:1rem;flex-wrap:wrap';
    [
      {id:'active',label:'Активни'},
      {id:'tasks',label:'Задачи'},
      {id:'requests',label:'Барања'},
      {id:'archived',label:'Архивирани'},
    ].forEach(tab=>{
      const btn=document.createElement('button');
      btn.className=`vtab ${_tFilter===tab.id?'active':''}`;
      btn.textContent=tab.label;
      btn.addEventListener('click',()=>{_tFilter=tab.id;_tPage=1;renderTasksContent();});
      tabsDiv.appendChild(btn);
    });
    container.appendChild(tabsDiv);

    const items=getItems(_tFilter).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    const totalPages=Math.ceil(items.length/T_PAGE)||1;
    if(_tPage>totalPages)_tPage=totalPages;
    const slice=items.slice((_tPage-1)*T_PAGE,_tPage*T_PAGE);

    const countEl=document.createElement('div');
    countEl.style.cssText='font-size:.75rem;color:var(--gray);margin-bottom:0.6rem';
    countEl.textContent=`${items.length} ставк${items.length===1?'а':'и'}`;
    container.appendChild(countEl);

    if(!items.length){
      const empty=document.createElement('div');
      empty.className='cct-empty';
      empty.innerHTML=`<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.2;margin:0 auto .5rem;display:block"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
      Нема ставки за избраниот филтер.`;
      container.appendChild(empty);
      return;
    }

    const feed=document.createElement('div');feed.className='cct-feed';
    slice.forEach(item=>feed.appendChild(makeCctCard(item,refresh)));
    container.appendChild(feed);

    if(totalPages>1){
      const pgDiv=document.createElement('div');pgDiv.className='cc-pagination';
      let btns=`<button class="cc-page-btn" id="tp-prev" ${_tPage===1?'disabled':''}>‹</button>`;
      const pages=new Set([1,totalPages,_tPage,_tPage-1,_tPage+1].filter(p=>p>=1&&p<=totalPages));
      let prev=0;
      Array.from(pages).sort((a,b)=>a-b).forEach(p=>{
        if(prev&&p-prev>1)btns+=`<span class="cc-page-info">…</span>`;
        btns+=`<button class="cc-page-btn ${p===_tPage?'active':''}" data-pg="${p}">${p}</button>`;
        prev=p;
      });
      btns+=`<button class="cc-page-btn" id="tp-next" ${_tPage===totalPages?'disabled':''}>›</button>`;
      const s=(_tPage-1)*T_PAGE+1,en=Math.min(_tPage*T_PAGE,items.length);
      btns+=`<span class="cc-page-info">${s}–${en} / ${items.length}</span>`;
      pgDiv.innerHTML=btns;
      pgDiv.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-pg]');
        if(btn){_tPage=parseInt(btn.dataset.pg);renderTasksContent();return;}
        if(ev.target.id==='tp-prev'&&_tPage>1){_tPage--;renderTasksContent();}
        if(ev.target.id==='tp-next'&&_tPage<totalPages){_tPage++;renderTasksContent();}
      });
      container.appendChild(pgDiv);
    }
  }

  renderTasksContent();
}

function makeCctCard(item,onRefresh){
  const isTask=item._k==='task';
  const now=new Date();
  const isOverdue=item.due_datetime&&new Date(item.due_datetime)<now
    &&item.status!=='completed'&&item.status!=='rejected';
  const stMap={
    pending:`<span class="cct-st cs-pending">На чекање</span>`,
    in_progress:`<span class="cct-st cs-inprogress">Во тек</span>`,
    completed:`<span class="cct-st cs-completed">Завршено</span>`,
    rejected:`<span class="cct-st cs-rejected">Одбиено</span>`,
  };
  const due=item.due_datetime?new Date(item.due_datetime).toLocaleDateString('mk-MK',{day:'numeric',month:'short'}):null;

  const cls=['cct-card',
    isTask?'ct-task':'ct-request',
    item.status==='completed'?'ct-completed':'',
    item.status==='rejected'?'ct-rejected':'',
    isOverdue?'ct-overdue':'',
  ].filter(Boolean).join(' ');

  const card=document.createElement('div');
  card.className=cls;
  card.innerHTML=`
    <div class="cct-card-main">
      <div class="cct-top">
        <span class="cct-type-pill ${isTask?'ctp-task':'ctp-req'}">
          ${isTask
            ?`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 12 11 14 15 10"/></svg> Задача`
            :`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m15 6 6 6-6 6"/></svg> Барање`}
        </span>
        ${stMap[item.status]||''}
      </div>
      <div class="cct-title" title="${e(item.title)}">${e(item.title)}</div>
      <div class="cct-meta">
        ${due?`<span class="cct-due ${isOverdue?'overdue':''}"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${due}</span>`:''}
        ${item.priority==='urgent'?'<span style="color:#c62828;font-size:.63rem;font-weight:700">Итно</span>':''}
        ${item.priority==='high'?'<span style="color:#e65100;font-size:.63rem">Висок</span>':''}
      </div>
    </div>
    <button class="cct-view-btn">Преглед →</button>`;

  card.querySelector('.cct-view-btn').addEventListener('click',ex=>{
    ex.stopPropagation();
    if(typeof openViewTskReq==='function') openViewTskReq({...item},item._k,onRefresh);
  });
  return card;
}

// ══════════════════════════════════════════════════════════════════════
// Витали widget
// ══════════════════════════════════════════════════════════════════════
function renderVitalsWidget(){
  if(!_vitals.length)return'<div class="cc-empty" style="padding:0.5rem">Нема витални знаци.</div>';
  const params=[
    {key:'temperatura',  label:'Т°',      unit:'°C',  color:'#e67e22'},
    {key:'puls',         label:'Пулс',    unit:'bpm', color:'#c0392b'},
    {key:'spo2',         label:'SpO2',    unit:'%',   color:'#2980b9'},
    {key:'kp_sistolicen',label:'КП',      unit:'mmHg',color:'#8e44ad', paired:'kp_dijastolicen', pairedColor:'#c39bd3'},
    {key:'respiracii',   label:'Респ.',   unit:'/мин',color:'#27ae60'},
    {key:'tezina',       label:'Тежина',  unit:'kg',  color:'#7f8c8d'},
    {key:'seker',        label:'Шеќер',   unit:'mmol',color:'#f39c12'},
  ];
  const available=params.filter(p=>_vitals.some(v=>v[p.key]!=null));
  if(!available.length)return'<div class="cc-empty" style="padding:0.5rem">Нема доволно витални податоци.</div>';
  if(!available.find(p=>p.key===_activeParam))_activeParam=available[0].key;

  if(_vitalsView==='chart'){
    const pillsHtml=available.map(p=>`<span class="vpill ${p.key===_activeParam?'active':''}" data-vparam="${p.key}">${p.label}</span>`).join('');
    return`<div>
      <div class="vitals-view-tabs">
        <span class="vtab active" data-vview="chart">Графикон</span>
        <span class="vtab" data-vview="list">Табела</span>
      </div>
      <div class="vitals-chart-wrap">
        <div class="vpills" id="cc-vpills">${pillsHtml}</div>
        <div class="chart-canvas-wrap"><canvas id="cc-vitals-canvas"></canvas></div>
        <div class="chart-note" id="cc-chart-note"></div>
      </div>
    </div>`;
  }else{
    const hdr=`<div class="vl-row hdr"><div class="vl-cell date">Датум</div>${available.map(p=>`<div class="vl-cell">${p.label}</div>`).join('')}</div>`;
    const rows=_vitals.map(v=>`<div class="vl-row">
      <div class="vl-cell date">${fmtDate(v.created_at)}</div>
      ${available.map(p=>{
        if(p.paired){
          const sys=v[p.key],dia=v[p.paired];
          if(sys!=null&&dia!=null)return`<div class="vl-cell has">${sys}/${dia}</div>`;
          if(sys!=null)           return`<div class="vl-cell has">${sys}/—</div>`;
          return`<div class="vl-cell empty">—</div>`;
        }
        return`<div class="vl-cell ${v[p.key]!=null?'has':'empty'}">${v[p.key]!=null?v[p.key]:'—'}</div>`;
      }).join('')}
    </div>`).join('');
    return`<div>
      <div class="vitals-view-tabs">
        <span class="vtab" data-vview="chart">Графикон</span>
        <span class="vtab active" data-vview="list">Табела</span>
      </div>
      <div class="vitals-list-wrap"><div class="vitals-list">${hdr}${rows}</div></div>
    </div>`;
  }
}

function scheduleChart(){
  setTimeout(()=>{
    bindVitalsControls();
    if(_vitalsView==='chart')drawChart();
    populateDosieTasksWidget();
    // Bind priem toggle
    const priemBtn=document.getElementById('cc-priem-toggle');
    if(priemBtn){
      priemBtn.addEventListener('click',()=>{
        const body=document.getElementById('cc-priem-body');
        if(!body)return;
        const isOpen=body.style.display!=='none';
        body.style.display=isOpen?'none':'block';
        priemBtn.innerHTML=isOpen
          ?`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.35rem"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Прикажи преглед на прием`
          :`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:0.35rem"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M1 1l22 22"/></svg>Скриј преглед на прием`;
      });
    }
    // Bind therapy load-more button
    const therapyBtn=document.getElementById('cc-therapy-load-more');
    if(therapyBtn){
      therapyBtn.addEventListener('click',()=>{
        _therapyShowPast+=5;
        const activeSessions=_therapySessions.filter(s=>!s.ended_at);
        const endedSessions=_therapySessions.filter(s=>s.ended_at);
        const wrap=document.getElementById('cc-therapy-wrap');
        if(wrap){
          const parent=wrap.parentElement;
          parent.innerHTML=renderTherapySessions(activeSessions,endedSessions);
          scheduleChart();
        }
      });
    }
  },50);
}

async function populateDosieTasksWidget(){
  const el=document.getElementById('cc-dosie-tasks-widget');
  if(!el)return;
  const clientId=_currentClientId;
  const [{data:tasks},{data:requests}]=await Promise.all([
    window._sb.from('tasks').select('id,title,status,priority,due_datetime,created_at').eq('client_id',clientId).eq('archived',false).order('created_at',{ascending:false}),
    window._sb.from('requests').select('id,title,status,priority,due_datetime,created_at').eq('client_id',clientId).eq('archived',false).order('created_at',{ascending:false}),
  ]);
  const active=[
    ...(tasks||[]).filter(t=>t.status!=='completed').map(t=>({...t,_k:'task'})),
    ...(requests||[]).filter(r=>r.status!=='completed'&&r.status!=='rejected').map(r=>({...r,_k:'request'})),
  ].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));

  if(!active.length){
    el.innerHTML='<div class="cc-empty" style="padding:0.5rem">Нема активни задачи или барања.</div>';
    return;
  }

  const show=active.slice(0,2);
  const rest=active.length-2;
  const stMap={pending:'На чекање',in_progress:'Во тек',completed:'Завршено',rejected:'Одбиено'};
  const cards=show.map(item=>{
    const isTask=item._k==='task';
    const isOverdue=item.due_datetime&&new Date(item.due_datetime)<new Date();
    return`<div class="cct-card ${isTask?'ct-task':'ct-request'} ${isOverdue?'ct-overdue':''}" style="margin-bottom:0.4rem;cursor:pointer" data-tid="${e(item.id)}" data-tk="${e(item._k)}">
      <div class="cct-card-main">
        <div class="cct-top">
          <span class="cct-type-pill ${isTask?'ctp-task':'ctp-req'}">${isTask?'Задача':'Барање'}</span>
          <span class="cct-st ${item.status==='in_progress'?'cs-inprogress':'cs-pending'}">${stMap[item.status]||''}</span>
        </div>
        <div class="cct-title" title="${e(item.title)}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e(item.title)}</div>
      </div>
    </div>`;
  }).join('');

  const viewAllBtn=rest>0
    ?`<button class="cc-btn-outline cc-btn-olive" id="cc-dosie-tasks-all">Прикажи ги сите задачи и барања (${active.length}) →</button>`
    :'';

  el.innerHTML=`<div class="cct-feed">${cards}</div>${viewAllBtn}`;

  el.querySelectorAll('.cct-card[data-tid]').forEach(card=>{
    card.addEventListener('click',()=>{
      document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
      document.querySelector('.cc-tab[data-tab="tasks"]').classList.add('active');
      window._ccTab('tasks');
    });
  });
  const allBtn=document.getElementById('cc-dosie-tasks-all');
  if(allBtn){allBtn.addEventListener('click',()=>{
    document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
    document.querySelector('.cc-tab[data-tab="tasks"]').classList.add('active');
    window._ccTab('tasks');
  });}
}

function bindVitalsControls(){
  document.querySelectorAll('[data-vview]').forEach(el=>{
    el.addEventListener('click',()=>{
      _vitalsView=el.dataset.vview;
      document.querySelectorAll('.cc-tab').forEach(b=>{if(b.classList.contains('active'))renderTab(b.dataset.tab);});
    });
  });
  document.querySelectorAll('[data-vparam]').forEach(el=>{
    el.addEventListener('click',()=>{
      _activeParam=el.dataset.vparam;
      document.querySelectorAll('[data-vparam]').forEach(x=>x.classList.toggle('active',x.dataset.vparam===_activeParam));
      drawChart();
    });
  });
}

function drawChart(){
  const canvas=document.getElementById('cc-vitals-canvas');
  if(!canvas)return;
  const params=[
    {key:'temperatura',color:'#e67e22'},
    {key:'puls',color:'#c0392b'},
    {key:'spo2',color:'#2980b9'},
    {key:'kp_sistolicen',color:'#8e44ad', paired:'kp_dijastolicen', pairedColor:'#c39bd3'},
    {key:'respiracii',color:'#27ae60'},
    {key:'tezina',color:'#7f8c8d'},
    {key:'seker',color:'#f39c12'},
  ];
  const param=params.find(p=>p.key===_activeParam)||params[0];
  const pts=_vitals.filter(v=>v[param.key]!=null).map(v=>({
    x:new Date(v.created_at).getTime(),v:parseFloat(v[param.key]),lbl:fmtDate(v.created_at),
    v2:param.paired&&v[param.paired]!=null?parseFloat(v[param.paired]):null
  })).reverse();
  if(!pts.length)return;
  const wrap=canvas.parentElement;
  canvas.width=wrap.offsetWidth||320;canvas.height=wrap.offsetHeight||155;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const pad={t:20,r:12,b:30,l:38};
  const W=canvas.width-pad.l-pad.r,H=canvas.height-pad.t-pad.b;
  const allVals=pts.flatMap(p=>param.paired&&p.v2!=null?[p.v,p.v2]:[p.v]);
  const mn=Math.min(...allVals),mx=Math.max(...allVals),range=mx-mn||1;
  function cx(i){return pad.l+(i/(pts.length-1||1))*W;}
  function cy(v){return pad.t+H-(((v-mn)/range)*H);}
  ctx.strokeStyle='#e8e4de';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=pad.t+(H/4)*i;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(pad.l+W,y);ctx.stroke();
    const val=mx-(range/4)*i;ctx.fillStyle='#9a968e';ctx.font='10px Lato,sans-serif';ctx.textAlign='right';
    ctx.fillText(val%1===0?val:val.toFixed(1),pad.l-4,y+4);
  }

  // Draw dotted connector lines between systolic and diastolic dots
  if(param.paired){
    ctx.save();
    ctx.strokeStyle='#cbb8e0';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    pts.forEach((p,i)=>{
      if(p.v2!=null){
        ctx.beginPath();ctx.moveTo(cx(i),cy(p.v));ctx.lineTo(cx(i),cy(p.v2));ctx.stroke();
      }
    });
    ctx.restore();
  }

  // Area fill for primary
  if(pts.length>1){
    ctx.beginPath();ctx.moveTo(cx(0),cy(pts[0].v));
    pts.forEach((p,i)=>{if(i>0)ctx.lineTo(cx(i),cy(p.v));});
    ctx.lineTo(cx(pts.length-1),pad.t+H);ctx.lineTo(cx(0),pad.t+H);ctx.closePath();
    ctx.fillStyle=param.color+'22';ctx.fill();
  }

  // Primary line
  ctx.beginPath();ctx.strokeStyle=param.color;ctx.lineWidth=2;ctx.lineJoin='round';
  pts.forEach((p,i)=>{if(i===0)ctx.moveTo(cx(0),cy(p.v));else ctx.lineTo(cx(i),cy(p.v));});
  ctx.stroke();

  // Paired (diastolic) dashed line
  if(param.paired){
    const pairedPts=pts.filter(p=>p.v2!=null);
    if(pairedPts.length>1){
      ctx.save();ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.strokeStyle=param.pairedColor||'#c39bd3';ctx.lineWidth=2;ctx.lineJoin='round';
      pairedPts.forEach((p,i)=>{
        const idx=pts.indexOf(p);
        if(i===0)ctx.moveTo(cx(idx),cy(p.v2));else ctx.lineTo(cx(idx),cy(p.v2));
      });
      ctx.stroke();ctx.restore();
    }
  }

  // Dots for primary
  pts.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(cx(i),cy(p.v),3.5,0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=param.color;ctx.lineWidth=2;ctx.stroke();
    if(pts.length<=8||i===0||i===pts.length-1||i%Math.ceil(pts.length/6)===0){
      ctx.fillStyle=param.color;ctx.font='bold 10px Lato,sans-serif';ctx.textAlign='center';
      ctx.fillText(p.v%1===0?p.v:parseFloat(p.v).toFixed(1),cx(i),cy(p.v)-9);
    }
  });

  // Dots for paired (diastolic)
  if(param.paired){
    pts.forEach((p,i)=>{
      if(p.v2==null)return;
      ctx.beginPath();ctx.arc(cx(i),cy(p.v2),3,0,Math.PI*2);
      ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle=param.pairedColor||'#c39bd3';ctx.lineWidth=2;ctx.stroke();
      if(pts.length<=8||i===0||i===pts.length-1||i%Math.ceil(pts.length/6)===0){
        ctx.fillStyle=param.pairedColor||'#c39bd3';ctx.font='bold 10px Lato,sans-serif';ctx.textAlign='center';
        ctx.fillText(p.v2%1===0?p.v2:parseFloat(p.v2).toFixed(1),cx(i),cy(p.v2)+16);
      }
    });
  }

  const noteEl=document.getElementById('cc-chart-note');
  if(param.paired){
    const hasPaired=pts.some(p=>p.v2!=null);
    if(noteEl&&pts.length)noteEl.innerHTML=`${pts[0].lbl} – ${pts[pts.length-1].lbl}${hasPaired?` &nbsp;·&nbsp; <span style="color:${param.color}">●</span> Систоличен &nbsp;<span style="color:${param.pairedColor}">●</span> <span style="border-bottom:2px dashed ${param.pairedColor}">Дијастоличен</span>`:''}`;
  } else {
    if(noteEl&&pts.length)noteEl.textContent=`${pts[0].lbl} – ${pts[pts.length-1].lbl}`;
  }
}

})();
