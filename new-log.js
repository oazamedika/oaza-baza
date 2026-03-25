/**
 * new-log.js — Standalone "Нов Запис" modal
 * Requires: auth-guard.js, sidebar.js (window._sb, window._user, window._username, window.roomToFloor)
 * Requires: chronic-th.js (window.openChronicTherapy)
 * Public API:
 *   window.openNewLog(callback)   — opens the search-first modal
 */
(function () {

  // ══════════════════════════════════════════════════════════════════
  //  TEMPLATES — must be defined first (const is not hoisted)
  // ══════════════════════════════════════════════════════════════════
  const NL_CSS = `<style id="nl-styles">
/* ── Backdrop & box ── */
#nl-bd{display:none;position:fixed;inset:0;background:rgba(47,42,36,0.65);z-index:300;align-items:flex-start;justify-content:center;padding:1.25rem;overflow-y:auto}
#nl-bd.open{display:flex}
#nl-box{background:#fff;border-radius:12px;width:100%;max-width:1100px;min-height:0;box-shadow:0 28px 72px rgba(0,0,0,0.24);display:flex;flex-direction:column;margin:auto}
#nl-hdr{padding:1.1rem 1.5rem;border-bottom:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;border-radius:12px 12px 0 0;flex-shrink:0}
#nl-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:600;color:var(--dark)}
#nl-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s}
#nl-close:hover{color:var(--dark)}
#nl-body{padding:1.5rem;flex:1;min-height:0}
/* ── Search step ── */
.nl-search-wrap{max-width:520px;margin:2rem auto}
.nl-search-hero{display:flex;align-items:center;gap:0.9rem;margin-bottom:1.25rem}
.nl-pt-search-wrap{position:relative}
.nl-search-icon{position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);color:var(--gray);pointer-events:none;display:flex}
.nl-search-inp{width:100%;padding:0.75rem 0.9rem 0.75rem 2.4rem;border:1.5px solid var(--border);border-radius:7px;font-family:'Lato',sans-serif;font-size:0.95rem;color:var(--dark);outline:none;box-sizing:border-box;transition:border-color 0.15s,box-shadow 0.15s}
.nl-search-inp:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nl-pt-dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,0.16);z-index:400;max-height:300px;overflow-y:auto;display:none}
.nl-pt-dd.show{display:block}
.nl-pt-item{display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.1s}
.nl-pt-item:last-child{border-bottom:none}.nl-pt-item:hover{background:var(--cream)}
.nl-pt-av{width:28px;height:28px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nl-pt-av img{width:100%;height:100%;object-fit:cover}
.nl-pt-name{font-weight:700;font-size:0.88rem;color:var(--dark)}
.nl-pt-meta{font-size:0.72rem;color:var(--gray)}
/* ── Client bar ── */
.nl-client-bar{display:flex;align-items:center;gap:0.85rem;padding:0.85rem 1.1rem;background:var(--cream);border:1px solid var(--border);border-radius:8px;margin-bottom:1.25rem}
.nl-av{width:42px;height:42px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nl-av img{width:100%;height:100%;object-fit:cover}
.nl-cb-info{flex:1;min-width:0}
.nl-cb-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)}
.nl-cb-meta{font-size:0.75rem;color:var(--gray);margin-top:0.1rem}
.nl-change-btn{padding:0.38rem 0.85rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s;flex-shrink:0}
.nl-change-btn:hover{border-color:var(--dark);color:var(--dark)}
/* ── Info block ── */
.nl-info-block{padding:0.75rem 1rem;background:var(--cream2);border:1px solid var(--border);border-radius:6px;margin-bottom:1.25rem}
.nl-ib-title{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.nl-diag-chip{display:inline-flex;align-items:center;padding:0.2rem 0.6rem;background:#fff;border:1px solid var(--border);border-radius:4px;font-size:0.8rem}
/* ── Two-column form ── */
.nl-form-cols{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
@media(max-width:800px){.nl-form-cols{grid-template-columns:1fr}}
.nl-col{display:flex;flex-direction:column;gap:0}
/* ── Section title ── */
.nl-sect-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.5rem;padding-top:0;border-bottom:1px solid var(--border);padding-bottom:0.35rem}
.req{color:#c0392b;margin-left:2px}
/* ── Inputs ── */
.nl-lbl{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:0.25rem}
.nl-inp,.nl-ta{padding:0.6rem 0.75rem;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.88rem;color:var(--dark);background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;width:100%;box-sizing:border-box}
.nl-inp:focus,.nl-ta:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nl-inp[readonly]{background:var(--cream);cursor:default}
.nl-ta{resize:vertical}
.nl-fg{display:flex;flex-direction:column}
/* ── MKB row ── */
.nl-mkb-row{display:flex;gap:0.5rem;align-items:flex-end}
.nl-mkb-dd{position:absolute;top:calc(100% + 3px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:5px;box-shadow:0 6px 22px rgba(0,0,0,0.16);z-index:400;max-height:220px;overflow-y:auto;display:none}
.nl-mkb-dd.show{display:block}
.nl-mkb-item{padding:0.5rem 0.8rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.83rem}
.nl-mkb-item:last-child{border-bottom:none}.nl-mkb-item:hover{background:var(--cream)}
.nl-mkb-code{font-family:monospace;font-weight:700;color:var(--olive);margin-right:0.4rem}
.nl-btn-mkb{padding:0.6rem 0.85rem;background:var(--olive);color:#fff;border:none;border-radius:4px;font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.15s}
.nl-btn-mkb:hover{background:#5a5a1e}
/* ── Vitals grid ── */
.nl-vitals-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.65rem}
.nl-bp-row{display:flex;align-items:flex-end;gap:0.3rem;grid-column:1/-1}
.nl-bp-inp{max-width:90px}
.nl-bp-slash{font-size:1.4rem;font-weight:300;color:var(--gray);line-height:1;padding-bottom:0.55rem;flex-shrink:0}
.nl-bp-unit{font-size:0.75rem;color:var(--gray);padding-bottom:0.6rem;flex-shrink:0;margin-left:0.2rem}
/* ── Chronic therapy block ── */
.nl-ct-active{margin-bottom:0.5rem}
.nl-ct-row{display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.65rem;border-radius:4px;font-size:0.83rem;border:1px solid var(--border);margin-bottom:0.3rem}
.nl-ct-drug{font-weight:700;color:var(--dark);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nl-ct-form{color:var(--gray);font-size:0.76rem;flex-shrink:0}
.nl-ct-dose{color:var(--gray);font-size:0.78rem;flex-shrink:0}
.nl-btn-add{display:inline-flex;align-items:center;gap:0.35rem;padding:0.55rem 0.85rem;background:transparent;border:1px dashed var(--olive);border-radius:4px;color:var(--olive);font-family:'Lato',sans-serif;font-size:0.8rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.15s;flex-shrink:0}
.nl-btn-add:hover{background:rgba(122,122,46,0.07)}
/* ── Form footer ── */
.nl-form-ftr{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.75rem;padding-top:1rem;border-top:1px solid var(--border)}
.nl-err{font-size:0.82rem;color:#c0392b;flex:1}
.nl-btn-prim{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.6rem;background:var(--dark);border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:0.88rem;font-weight:700;letter-spacing:0.08em;color:#fff;cursor:pointer;transition:background 0.15s}
.nl-btn-prim:hover{background:var(--olive)}.nl-btn-prim:disabled{opacity:0.45;pointer-events:none}
/* ── Caregiver form ── */
.nl-care-form{display:flex;flex-direction:column;gap:1.1rem}
.nl-care-group{background:#fff;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.nl-care-group-hdr{display:flex;align-items:center;gap:0.6rem;padding:0.6rem 1rem;background:var(--cream);border-bottom:1px solid var(--border)}
.nl-care-group-icon{width:22px;height:22px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700}
.nl-care-group-title{font-family:'Playfair Display',serif;font-size:0.9rem;font-weight:600;color:var(--dark)}
.nl-care-group-body{padding:0.75rem 1rem;display:grid;grid-template-columns:1fr 1fr;gap:0.65rem}
.nl-care-group-body.full{grid-template-columns:1fr}
.nl-care-field{display:flex;flex-direction:column;gap:0.25rem}
.nl-smena-row{display:flex;gap:0.5rem;margin-bottom:1rem}
.nl-smena-btn{flex:1;padding:0.6rem;border:1.5px solid var(--border);border-radius:6px;background:#fff;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s;text-align:center}
.nl-smena-btn.active{border-color:var(--olive);background:rgba(122,122,46,0.08);color:var(--olive)}
</style>`;

  const NL_HTML = `
<div id="nl-bd">
  <div id="nl-box" role="dialog" aria-modal="true">
    <div id="nl-hdr">
      <span id="nl-title">Нов Клинички Запис</span>
      <button id="nl-close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="nl-body"></div>
  </div>
</div>`;

  // ── State ────────────────────────────────────────────────────────
  let _cb = null;
  let _client = null;
  let _therapy = [];          // drugs from active session (display only)
  let _activeSession = null;  // active session object
  let _ptTimer = null;
  let _mkbTimer = null;
  let _injected = false;

  // ── Role helpers ─────────────────────────────────────────────────
  function u() { return (window._username || '').toLowerCase(); }
  function isDoctor()    { return u() === 'doktor'; }
  function isNurse()     { return u() === 'glavnasestra'; }
  function isCaregiver() { return u() === 'supervizornega'; }

  // ── Inject once ──────────────────────────────────────────────────
  function inject() {
    if (_injected || document.getElementById('nl-bd')) return;
    _injected = true;
    document.head.insertAdjacentHTML('beforeend', NL_CSS);
    document.body.insertAdjacentHTML('beforeend', NL_HTML);
    document.getElementById('nl-close').addEventListener('click', close);
    document.getElementById('nl-bd').addEventListener('click', e => { if (e.target.id === 'nl-bd') close(); });
  }

  // ── Public API ───────────────────────────────────────────────────
  window.openNewLog = function (cb) {
    _cb = cb || null;
    inject();
    reset();
    showSearchStep();
    open();
  };

  function open()  { document.getElementById('nl-bd').classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close() {
    document.getElementById('nl-bd').classList.remove('open');
    document.body.style.overflow = '';
    if (typeof _cb === 'function') _cb();
  }

  function reset() {
    _client = null; _therapy = []; _activeSession = null;
    clearErr();
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 1 — SEARCH
  // ══════════════════════════════════════════════════════════════════
  function showSearchStep() {
    document.getElementById('nl-title').textContent = 'Нов Клинички Запис';
    document.getElementById('nl-body').innerHTML = `
      <div class="nl-search-wrap">
        <div class="nl-search-hero">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)">Изберете корисник</div>
            <div style="font-size:0.8rem;color:var(--gray);margin-top:0.15rem">Пребарајте по ime, ЕМБГ или матичен број</div>
          </div>
        </div>
        <div class="nl-pt-search-wrap">
          <div class="nl-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input class="nl-search-inp" id="nl_pt_search" placeholder="Пребарај…" autocomplete="off"/>
          <div class="nl-pt-dd" id="nl_pt_dd"></div>
        </div>
      </div>`;
    setTimeout(() => document.getElementById('nl_pt_search')?.focus(), 60);
    document.getElementById('nl_pt_search').addEventListener('input', e => searchPatient(e.target.value));
    document.getElementById('nl_pt_search').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#nl_pt_dd .nl-pt-item');
        if (first) first.click();
      }
    });
  }

  // ── Patient search ───────────────────────────────────────────────
  function searchPatient(val) {
    clearTimeout(_ptTimer);
    const dd = document.getElementById('nl_pt_dd');
    if (!val || val.trim().length < 2) { dd.classList.remove('show'); return; }
    _ptTimer = setTimeout(async () => {
      const [byName, byEmbg, byMat] = await Promise.all([
        window._sb.from('clients')
          .select('id,ime_prezime,obrakanje,embg,maticen_broj,room_number,bed_number,floor_number,profile_pic_url')
          .neq('status','discharged').ilike('ime_prezime', `%${val}%`).limit(6),
        window._sb.from('clients')
          .select('id,ime_prezime,obrakanje,embg,maticen_broj,room_number,bed_number,floor_number,profile_pic_url')
          .neq('status','discharged').ilike('embg', `%${val}%`).limit(4),
        window._sb.from('clients')
          .select('id,ime_prezime,obrakanje,embg,maticen_broj,room_number,bed_number,floor_number,profile_pic_url')
          .neq('status','discharged').ilike('maticen_broj', `%${val}%`).limit(4),
      ]);
      const seen = new Set();
      const data = [...(byName.data||[]), ...(byEmbg.data||[]), ...(byMat.data||[])].filter(c => {
        if (seen.has(c.id)) return false; seen.add(c.id); return true;
      }).slice(0, 10);

      if (!dd) return;
      dd.innerHTML = '';
      if (!data.length) {
        const empty = document.createElement('div');
        empty.className = 'nl-pt-item';
        empty.style.cssText = 'color:var(--gray);cursor:default;justify-content:center';
        empty.textContent = 'Нема резултати';
        dd.appendChild(empty);
        dd.classList.add('show');
        return;
      }
      data.forEach(c => {
        const fl = c.floor_number || (window.roomToFloor ? window.roomToFloor(c.room_number) : '?');
        const loc = c.room_number ? `С${c.room_number} / Кр${c.bed_number} (Кат ${fl})` : '—';
        const item = document.createElement('div');
        item.className = 'nl-pt-item';
        item.innerHTML = `
          <div class="nl-pt-av">${esc((c.ime_prezime||'?').charAt(0))}</div>
          <div>
            <div class="nl-pt-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime)}</div>
            <div class="nl-pt-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
          </div>`;
        item.addEventListener('click', () => nlPickPatient(c));
        dd.appendChild(item);
      });
      dd.classList.add('show');
    }, 280);
  }

  window.nlPickPatient = async function (c) {
    const dd = document.getElementById('nl_pt_dd');
    if (dd) dd.classList.remove('show');
    document.getElementById('nl-body').innerHTML = `<div style="padding:3rem;text-align:center;color:var(--gray)">Се вчитува…</div>`;

    const [clientRes, diagRes, sessionRes] = await Promise.all([
      window._sb.from('clients').select(`
        id,ime_prezime,obrakanje,maticen_broj,embg,adresa,telefon,
        floor_number,room_number,bed_number,profile_pic_url,status,created_at,
        priem_dijagnoza_kod,priem_dijagnoza_opis
      `).eq('id', c.id).single(),

      window._sb.from('client_chronic_diagnoses')
        .select('kod,opis,added_at').eq('client_id', c.id),

      // Active session only
      window._sb.from('chronic_therapy_sessions')
        .select('id,started_at,chronic_therapy_drugs(id,generic_name,form,dosage,sort_order)')
        .eq('client_id', c.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    _client = { ...clientRes.data, client_chronic_diagnoses: diagRes.data || [] };
    _activeSession = sessionRes.data || null;
    _therapy = (_activeSession?.chronic_therapy_drugs || [])
      .sort((a, b) => a.sort_order - b.sort_order);

    showLogForm();
  };

  // ══════════════════════════════════════════════════════════════════
  //  STEP 2 — LOG FORM (role-aware)
  // ══════════════════════════════════════════════════════════════════
  function clientBar(c, loc) {
    const av = c.profile_pic_url
      ? `<div class="nl-av"><img src="${esc(c.profile_pic_url)}" alt=""/></div>`
      : `<div class="nl-av">${esc((c.ime_prezime||'?').charAt(0))}</div>`;
    return `<div class="nl-client-bar">
      ${av}
      <div class="nl-cb-info">
        <div class="nl-cb-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime||'')}</div>
        <div class="nl-cb-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
      </div>
      <button class="nl-change-btn" onclick="nlChangePatient()">Промени корисник</button>
    </div>`;
  }

  function saveFtrHtml() {
    return `<div class="nl-form-ftr">
      <span class="nl-err" id="nl-err"></span>
      <button class="nl-btn-prim" id="nl-save-btn" onclick="nlSave()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Зачувај запис
      </button>
    </div>`;
  }

  function vitalsGridHtml() {
    return `<div class="nl-vitals-grid">
      <div class="nl-bp-row">
        <div class="nl-fg" style="flex:0 0 auto">
          <label class="nl-lbl">КП (mmHg)</label>
          <div style="display:flex;align-items:flex-end;gap:0.3rem">
            <input class="nl-inp nl-bp-inp" id="l_kp_s" type="number" placeholder="120"/>
            <span class="nl-bp-slash">/</span>
            <input class="nl-inp nl-bp-inp" id="l_kp_d" type="number" placeholder="80"/>
            <span class="nl-bp-unit">mmHg</span>
          </div>
        </div>
      </div>
      <div class="nl-fg"><label class="nl-lbl">Пулс (bpm)</label><input class="nl-inp" id="l_puls" type="number" placeholder="72"/></div>
      <div class="nl-fg"><label class="nl-lbl">Температура (°C)</label><input class="nl-inp" id="l_temp" type="number" step="0.1" placeholder="36.6"/></div>
      <div class="nl-fg"><label class="nl-lbl">SpO2 (%)</label><input class="nl-inp" id="l_spo2" type="number" placeholder="98"/></div>
      <div class="nl-fg"><label class="nl-lbl">Респирации (/мин)</label><input class="nl-inp" id="l_resp" type="number" placeholder="16"/></div>
      <div class="nl-fg"><label class="nl-lbl">Тежина (kg)</label><input class="nl-inp" id="l_tezina" type="number" step="0.1" placeholder="72.5"/></div>
      <div class="nl-fg"><label class="nl-lbl">Крвен шеќер (mmol/L)</label><input class="nl-inp" id="l_seker" type="number" step="0.1" placeholder="5.4"/></div>
      <div class="nl-fg"><label class="nl-lbl">Болка (0–10)</label><input class="nl-inp" id="l_bolka" type="number" min="0" max="10" placeholder="0"/></div>
      <div class="nl-fg"><label class="nl-lbl">Диуреза (ml)</label><input class="nl-inp" id="l_diureza" type="number" placeholder="1500"/></div>
      <div class="nl-fg">
        <label class="nl-lbl">Столица</label>
        <select class="nl-inp" id="l_stolica">
          <option value="">—</option>
          <option value="-">— (нема)</option>
          <option value="+">+</option>
          <option value="++">++</option>
          <option value="+++">+++</option>
          <option value="дијареа">Дијареа</option>
        </select>
      </div>
    </div>`;
  }

  function showLogForm() {
    const c = _client;
    const fl = c.floor_number || (window.roomToFloor ? window.roomToFloor(c.room_number) : '?');
    const loc = c.room_number ? `Соба ${c.room_number} / Кревет ${c.bed_number} · Кат ${fl}` : '—';
    const diags = (c.client_chronic_diagnoses || []);
    document.getElementById('nl-title').textContent = 'Нов Клинички Запис';

    if (isNurse()) {
      document.getElementById('nl-body').innerHTML =
        clientBar(c, loc) + `
        <div class="nl-form-cols">
          <div class="nl-col">
            <div class="nl-sect-title">Витални параметри</div>
            ${vitalsGridHtml()}
          </div>
          <div class="nl-col">
            <div class="nl-sect-title">Забелешки</div>
            <textarea class="nl-ta" id="l_zabeleski" rows="8" placeholder="Напомени, забелешки…"></textarea>
          </div>
        </div>` + saveFtrHtml();

    } else if (isCaregiver()) {
      document.getElementById('nl-body').innerHTML =
        clientBar(c, loc) + `

        <!-- Смена picker -->
        <div style="margin-bottom:1rem">
          <label class="nl-lbl">Смена <span class="req">*</span></label>
          <div class="nl-smena-row">
            <button type="button" class="nl-smena-btn" data-smena="утро"   onclick="nlPickSmena(this)">🌅 Утро</button>
            <button type="button" class="nl-smena-btn" data-smena="пладне" onclick="nlPickSmena(this)">☀️ Пладне</button>
            <button type="button" class="nl-smena-btn" data-smena="вечер"  onclick="nlPickSmena(this)">🌙 Вечер</button>
          </div>
          <input type="hidden" id="l_smena" value=""/>
        </div>

        <div class="nl-care-form">

          <div class="nl-care-group">
            <div class="nl-care-group-hdr">
              <div class="nl-care-group-icon">1</div>
              <span class="nl-care-group-title">Општа хигиена</span>
            </div>
            <div class="nl-care-group-body full">
              <div class="nl-care-field"><label class="nl-lbl">Миење на лице и раце / Орална хигиена</label><input class="nl-inp" id="cg_lice_race" placeholder="нпр. извршено / со помош…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Менување на облека</label><input class="nl-inp" id="cg_obleka" placeholder="нпр. целосно / горен дел…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Менување на пелена / долна облека</label><input class="nl-inp" id="cg_pelena" placeholder="нпр. 2× / нема потреба…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Капење</label><input class="nl-inp" id="cg_kapenje" placeholder="нпр. туш со помош / не денес…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Сечење на нокти (раце / нозе)</label><input class="nl-inp" id="cg_nokti" placeholder="нпр. раце сечени / не…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Менување на постелнина</label><input class="nl-inp" id="cg_postelnina" placeholder="нпр. извршено / не денес…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Проверка на crвенила / рани / модринки</label><input class="nl-inp" id="cg_rani" placeholder="нпр. нема / видено црвенило на…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Премачкување (со што / каде)</label><input class="nl-inp" id="cg_premackување" placeholder="нпр. Bepanthen на лактите…"/></div>
            </div>
          </div>

          <div class="nl-care-group">
            <div class="nl-care-group-hdr">
              <div class="nl-care-group-icon">2</div>
              <span class="nl-care-group-title">Исхрана и хидратација</span>
            </div>
            <div class="nl-care-group-body">
              <div class="nl-care-field"><label class="nl-lbl">Вид на храна</label><input class="nl-inp" id="cg_vid_hrana" placeholder="нпр. нормална / мека / каша…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Начин на исхрана</label><input class="nl-inp" id="cg_nacin_ishrana" placeholder="нпр. самостојно / со помош / сонда…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Внес на течности</label><input class="nl-inp" id="cg_tecnosti" placeholder="нпр. 1200 ml / добар внес…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Апетит</label>
                <select class="nl-inp" id="cg_apetit">
                  <option value="">—</option>
                  <option>Добар</option><option>Намален</option><option>Лош</option><option>Одбива храна</option>
                </select>
              </div>
            </div>
          </div>

          <div class="nl-care-group">
            <div class="nl-care-group-hdr">
              <div class="nl-care-group-icon">3</div>
              <span class="nl-care-group-title">Елиминација</span>
            </div>
            <div class="nl-care-group-body">
              <div class="nl-care-field"><label class="nl-lbl">Диуреза (ml)</label><input class="nl-inp" id="l_diureza" type="number" placeholder="нпр. 1200"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Дефекација</label>
                <select class="nl-inp" id="l_stolica">
                  <option value="">—</option>
                  <option value="-">— (нема)</option><option value="+">+</option><option value="++">++</option><option value="+++">+++</option><option value="дијареа">Дијареа</option>
                </select>
              </div>
            </div>
          </div>

          <div class="nl-care-group">
            <div class="nl-care-group-hdr">
              <div class="nl-care-group-icon">4</div>
              <span class="nl-care-group-title">Мобилност и позиционирање</span>
            </div>
            <div class="nl-care-group-body">
              <div class="nl-care-field"><label class="nl-lbl">Подигање и позиционирање</label><input class="nl-inp" id="cg_pozicioniranje" placeholder="нпр. во кревет / количка, 2h…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Одење / помош при движење</label><input class="nl-inp" id="cg_odenje" placeholder="нпр. 2× 10 мин со помош…"/></div>
              <div class="nl-care-field" style="grid-column:1/-1"><label class="nl-lbl">Помагало</label><input class="nl-inp" id="cg_pomagalo" placeholder="нпр. количка / патерици / без…"/></div>
            </div>
          </div>

          <div class="nl-care-group">
            <div class="nl-care-group-hdr">
              <div class="nl-care-group-icon">5</div>
              <span class="nl-care-group-title">Психосоцијална состојба</span>
            </div>
            <div class="nl-care-group-body">
              <div class="nl-care-field"><label class="nl-lbl">Расположение</label><input class="nl-inp" id="cg_raspolozenie" placeholder="нпр. смирен / вознемирен…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Комуникација</label><input class="nl-inp" id="cg_komunikacija" placeholder="нпр. соработлив / конфузен…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Активности</label><input class="nl-inp" id="cg_aktivnosti" placeholder="нпр. гледа ТВ / чита…"/></div>
              <div class="nl-care-field"><label class="nl-lbl">Посета</label><input class="nl-inp" id="cg_poseta" placeholder="нпр. ќерка 1h / без посета…"/></div>
            </div>
          </div>

        </div>` + saveFtrHtml();

    } else {
      // ── DOCTOR FORM (full) ──
      document.getElementById('nl-body').innerHTML =
        clientBar(c, loc) +
        (diags.length ? `<div class="nl-info-block">
          <div class="nl-ib-title">Хронични дијагнози</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem">
            ${diags.map(d=>`<span class="nl-diag-chip"><span style="font-family:monospace;font-weight:700;color:var(--olive);margin-right:0.3rem">${esc(d.kod)}</span>${esc(d.opis||'')}</span>`).join('')}
          </div></div>` : '') + `
        <div class="nl-form-cols">
          <div class="nl-col">
            <div class="nl-sect-title">Дијагноза <span class="req">*</span></div>
            <div style="position:relative;margin-bottom:0.5rem">
              <input class="nl-inp" id="l_kod" placeholder="Внеси МКБ-10 код или опис…" style="text-transform:uppercase" autocomplete="off"/>
              <div class="nl-mkb-dd" id="l_kod_dd"></div>
            </div>
            <input class="nl-inp" id="l_opis" readonly placeholder="Опис — се пополнува по избор" style="margin-bottom:0.25rem"/>
            <div class="nl-sect-title" style="margin-top:1.1rem">Анамнеза</div>
            <textarea class="nl-ta" id="l_anamneza" rows="4" placeholder="Анамнестички податоци…"></textarea>
            <div class="nl-sect-title" style="margin-top:1.1rem">Наод</div>
            <textarea class="nl-ta" id="l_naod" rows="4" placeholder="Клинички наод…"></textarea>
          </div>
          <div class="nl-col">
            <div class="nl-sect-title">Витални параметри</div>
            ${vitalsGridHtml()}
            <div class="nl-sect-title" style="margin-top:1.25rem">Хронична терапија</div>
            <div id="nl-ct-block">${renderChronicTherapyBlock()}</div>
            <div class="nl-sect-title" style="margin-top:1.1rem">Парентерална терапија</div>
            <textarea class="nl-ta" id="l_parenteralna" rows="2" placeholder="нпр. NaCl 0.9% 500ml iv…"></textarea>
            <div class="nl-sect-title" style="margin-top:1.1rem">Забелешки</div>
            <textarea class="nl-ta" id="l_zabeleski" rows="2" placeholder="Напомени, забелешки…"></textarea>
          </div>
        </div>` + saveFtrHtml();

      // Wire MKB
      const kodInp = document.getElementById('l_kod');
      kodInp.addEventListener('input', () => nlMKBLive('l_kod', 'l_opis', 'l_kod_dd'));
      kodInp.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(_mkbTimer); nlMKB('l_kod','l_opis','l_kod_dd'); }
      });
      setTimeout(() => document.getElementById('l_kod')?.focus(), 60);
    }
  }

  window.nlChangePatient = function () { reset(); showSearchStep(); };

  // ── Смена picker ─────────────────────────────────────────────────
  window.nlPickSmena = function(btn) {
    document.querySelectorAll('.nl-smena-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const inp = document.getElementById('l_smena');
    if (inp) inp.value = btn.dataset.smena;
  };

  // ── Chronic therapy block renderer ──────────────────────────────
  function renderChronicTherapyBlock() {
    let html = '';

    if (_therapy.length) {
      html += `<div class="nl-ct-active">${_therapy.map(t =>
        `<div class="nl-ct-row">
          <span class="nl-ct-drug">${esc(t.generic_name)}</span>
          ${t.form ? `<span class="nl-ct-form">${esc(t.form)}</span>` : ''}
          <span class="nl-ct-dose">${esc(t.dosage)}</span>
        </div>`).join('')}</div>`;
    } else {
      html += `<div style="font-size:0.8rem;color:var(--gray);margin-bottom:0.5rem">Нема активна хронична терапија.</div>`;
    }

    html += `
      <button class="nl-btn-add" style="margin-top:0.35rem" onclick="nlOpenChronicTh()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Промени хронична терапија
      </button>`;

    return html;
  }

  window.nlOpenChronicTh = function () {
    if (!_client) return;
    window.openChronicTherapy(
      _client.id,
      (_client.obrakanje ? _client.obrakanje + ' ' : '') + (_client.ime_prezime || ''),
      async function (newSessionId) {
        const { data } = await window._sb
          .from('chronic_therapy_drugs')
          .select('id,generic_name,form,dosage,sort_order')
          .eq('session_id', newSessionId)
          .order('sort_order', { ascending: true });
        _therapy = data || [];
        _activeSession = { id: newSessionId };
        const block = document.getElementById('nl-ct-block');
        if (block) block.innerHTML = renderChronicTherapyBlock();
      }
    );
  };

  // ── MKB lookup ───────────────────────────────────────────────────
  window.nlMKB = async function (codeId, opisId, ddId) {
    const codeEl = document.getElementById(codeId);
    const opisEl = document.getElementById(opisId);
    const dd     = document.getElementById(ddId);
    if (!codeEl) return;
    const raw = (codeEl.value || '').trim().toUpperCase();
    codeEl.value = raw;
    if (!raw) { if (opisEl) opisEl.value = ''; if (dd) dd.classList.remove('show'); return; }
    const { data: ex } = await window._sb.from('mkb10').select('code,description').eq('code', raw).maybeSingle();
    if (ex) { if (opisEl) opisEl.value = ex.description; if (dd) dd.classList.remove('show'); return; }
    const [byCode, byDesc] = await Promise.all([
      window._sb.from('mkb10').select('code,description').ilike('code', `${raw}%`).limit(8),
      window._sb.from('mkb10').select('code,description').ilike('description', `%${raw}%`).limit(8),
    ]);
    const seen = new Set();
    const fz = [...(byCode.data||[]), ...(byDesc.data||[])].filter(r => {
      if (seen.has(r.code)) return false; seen.add(r.code); return true;
    }).slice(0, 12);
    if (!dd) return;
    if (!fz.length) { if (opisEl) opisEl.value = ''; dd.classList.remove('show'); return; }
    dd.innerHTML = '';
    fz.forEach(r => {
      const item = document.createElement('div');
      item.className = 'nl-mkb-item';
      item.innerHTML = `<span class="nl-mkb-code">${esc(r.code)}</span>${esc(r.description)}`;
      item.addEventListener('click', () => {
        if (codeEl) codeEl.value = r.code;
        if (opisEl) opisEl.value = r.description;
        dd.classList.remove('show');
      });
      dd.appendChild(item);
    });
    dd.classList.add('show');
  };

  window.nlMKBLive = function(codeId, opisId, ddId) {
    clearTimeout(_mkbTimer);
    const codeEl = document.getElementById(codeId);
    if (!codeEl || codeEl.value.trim().length < 1) {
      const dd = document.getElementById(ddId);
      if (dd) dd.classList.remove('show');
      return;
    }
    _mkbTimer = setTimeout(() => window.nlMKB(codeId, opisId, ddId), 350);
  };

  window.nlMKBPick = function (codeId, opisId, ddId, code, desc) {
    const c = document.getElementById(codeId); if (c) c.value = code;
    const o = document.getElementById(opisId); if (o) o.value = desc;
    const d = document.getElementById(ddId);   if (d) d.classList.remove('show');
  };

  // ── Save ─────────────────────────────────────────────────────────
  window.nlSave = async function () {
    clearErr();
    if (!_client) { setErr('Нема избран корисник.'); return; }
    if (_client.client_status !== 'active') {
    alert('Не може да се додаде запис за одјавен или починат корисник.');
    return;
  }

    const nurse     = isNurse();
    const caregiver = isCaregiver();

    if (caregiver) {
      const smena = (document.getElementById('l_smena')?.value || '').trim();
      if (!smena) { setErr('Изберете смена (утро / пладне / вечер).'); return; }
    }

    const kod = (document.getElementById('l_kod')?.value || '').trim().toUpperCase();
    if (!nurse && !caregiver && !kod) { setErr('Дијагнозата е задолжителна.'); return; }

    const btn = document.getElementById('nl-save-btn');
    btn.disabled = true;

    function nv(id) { const v = document.getElementById(id)?.value; return (v && v.trim()) ? parseFloat(v) : null; }
    function sv(id) { const v = document.getElementById(id)?.value; return (v && v.trim()) ? v.trim() : null; }

    function caregiverHigijenska() {
      const parts = [];
      const add = (lbl, id) => { const v = sv(id); if (v) parts.push(`${lbl}: ${v}`); };
      add('Миење лице/раце + орална хигиена', 'cg_lice_race');
      add('Менување облека', 'cg_obleka');
      add('Менување пелена', 'cg_pelena');
      add('Капење', 'cg_kapenje');
      add('Сечење нокти', 'cg_nokti');
      add('Менување постелнина', 'cg_postelnina');
      add('Проверка рани/црвенила', 'cg_rani');
      add('Премачкување', 'cg_premackување');
      return parts.length ? parts.join(' | ') : null;
    }

    function caregiverIshrana() {
      const parts = [];
      const add = (lbl, id) => { const v = sv(id); if (v) parts.push(`${lbl}: ${v}`); };
      add('Вид храна', 'cg_vid_hrana');
      add('Начин', 'cg_nacin_ishrana');
      add('Течности', 'cg_tecnosti');
      add('Апетит', 'cg_apetit');
      return parts.length ? parts.join(' | ') : null;
    }

    function caregiverMobilnost() {
      const parts = [];
      const add = (lbl, id) => { const v = sv(id); if (v) parts.push(`${lbl}: ${v}`); };
      add('Позиционирање', 'cg_pozicioniranje');
      add('Одење', 'cg_odenje');
      add('Помагало', 'cg_pomagalo');
      return parts.length ? parts.join(' | ') : null;
    }

    function caregiverPsiho() {
      const parts = [];
      const add = (lbl, id) => { const v = sv(id); if (v) parts.push(`${lbl}: ${v}`); };
      add('Расположение', 'cg_raspolozenie');
      add('Комуникација', 'cg_komunikacija');
      add('Активности', 'cg_aktivnosti');
      add('Посета', 'cg_poseta');
      return parts.length ? parts.join(' | ') : null;
    }

    const logType = caregiver ? 'supervizornega' : nurse ? 'nurse' : 'doctor';

    const payload = {
      client_id:        _client.id,
      created_by:       window._user.id,
      log_type:         logType,
      dijagnoza_kod:    kod || null,
      dijagnoza_opis:   sv('l_opis'),
      anamneza:         sv('l_anamneza'),
      naod:             sv('l_naod'),
      parenteralna:     sv('l_parenteralna'),
      zabeleski:        sv('l_zabeleski'),
      kp_sistolicen:    nv('l_kp_s'),
      kp_dijastolicen:  nv('l_kp_d'),
      puls:             nv('l_puls'),
      temperatura:      nv('l_temp'),
      spo2:             nv('l_spo2'),
      respiracii:       nv('l_resp'),
      tezina:           nv('l_tezina'),
      seker:            nv('l_seker'),
      bolka:            nv('l_bolka') != null ? parseInt(document.getElementById('l_bolka')?.value) : null,
      diureza:          nv('l_diureza') != null ? parseInt(document.getElementById('l_diureza')?.value) : null,
      stolica:          sv('l_stolica'),
      smena:            sv('l_smena'),
      higijenska_nega:  caregiver ? caregiverHigijenska() : null,
      ishrana:          caregiver ? caregiverIshrana()    : null,
      mobilnost:        caregiver ? caregiverMobilnost()  : null,
      psihosocijalno:   caregiver ? caregiverPsiho()      : null,
    };

    const { error: logErr } = await window._sb.from('client_logs').insert([payload]);
    if (logErr) { setErr('Грешка при зачувување: ' + logErr.message); btn.disabled = false; return; }

    btn.disabled = false;
    close();
  };

  // ── Helpers ──────────────────────────────────────────────────────
  function setErr(msg) { const el = document.getElementById('nl-err'); if (el) el.textContent = msg; }
  function clearErr()  { const el = document.getElementById('nl-err'); if (el) el.textContent = ''; }
  function esc(s)      { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

})();
