/**
 * new-log.js — Standalone "Нов Запис" modal
 * Requires: auth-guard.js, sidebar.js (window._sb, window._user, window._username, window.roomToFloor)
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
/* ── Chronic therapy ── */
.nl-ct-active{margin-bottom:0.5rem}
.nl-ct-row{display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.65rem;border-radius:4px;font-size:0.83rem;border:1px solid var(--border);margin-bottom:0.3rem}
.nl-ct-staged{background:rgba(122,122,46,0.07);border-color:var(--olive)}
.nl-ct-past{opacity:0.6;text-decoration:line-through}
.nl-ct-drug{font-weight:700;color:var(--dark);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nl-ct-dose{color:var(--gray);font-size:0.78rem;flex-shrink:0}
.nl-ct-since{color:var(--gray);font-size:0.72rem;flex-shrink:0;margin-left:auto}
.nl-rm-btn{background:none;border:none;cursor:pointer;color:var(--gray);font-size:1.1rem;line-height:1;padding:0 0.2rem;flex-shrink:0}.nl-rm-btn:hover{color:#c0392b}
.nl-ct-add-row{display:flex;gap:0.5rem;align-items:flex-end;margin-top:0.5rem}
.nl-btn-add{display:inline-flex;align-items:center;gap:0.35rem;padding:0.55rem 0.85rem;background:transparent;border:1px dashed var(--olive);border-radius:4px;color:var(--olive);font-family:'Lato',sans-serif;font-size:0.8rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.15s;flex-shrink:0}
.nl-btn-add:hover{background:rgba(122,122,46,0.07)}
.nl-drug-dd{position:absolute;top:calc(100% + 3px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:5px;box-shadow:0 6px 22px rgba(0,0,0,0.16);z-index:400;max-height:220px;overflow-y:auto;display:none}
.nl-drug-dd.show{display:block}
.nl-drug-item{padding:0.55rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.84rem}
.nl-drug-item:last-child{border-bottom:none}.nl-drug-item:hover{background:var(--cream)}
.nl-ddi-name{font-weight:700;color:var(--dark)}.nl-ddi-meta{font-size:0.74rem;color:var(--gray);margin-top:0.1rem}
.nl-past-details{margin-top:0.6rem;font-size:0.82rem}
.nl-past-details summary{cursor:pointer;color:var(--olive);font-weight:700;font-size:0.78rem;padding:0.25rem 0;list-style:none}
.nl-past-details summary::before{content:'▸ '}
.nl-past-details[open] summary::before{content:'▾ '}
.nl-past-list{margin-top:0.4rem}
/* ── Form footer ── */
.nl-form-ftr{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.75rem;padding-top:1rem;border-top:1px solid var(--border)}
.nl-err{font-size:0.82rem;color:#c0392b;flex:1}
.nl-btn-prim{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.6rem;background:var(--dark);border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:0.88rem;font-weight:700;letter-spacing:0.08em;color:#fff;cursor:pointer;transition:background 0.15s}
.nl-btn-prim:hover{background:var(--olive)}.nl-btn-prim:disabled{opacity:0.45;pointer-events:none}
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
  let _therapy = [];
  let _newTherapyItems = [];
  let _ptTimer = null;
  let _drugTimer = null;
  let _drugObj = null;
  let _injected = false;

  // ── Role helpers ─────────────────────────────────────────────────
  function u() { return (window._username || '').toLowerCase(); }
  function isDoctor()  { return u() === 'doktor'; }

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
    _client = null; _therapy = []; _newTherapyItems = []; _drugObj = null;
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
    // Focus after render
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
      // Three separate queries to avoid broken .or() syntax
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
    // c is a plain object passed directly from the event listener — no JSON.parse needed
    const dd = document.getElementById('nl_pt_dd');
    if (dd) dd.classList.remove('show');
    // Show loading state
    document.getElementById('nl-body').innerHTML = `<div style="padding:3rem;text-align:center;color:var(--gray)">Се вчитува…</div>`;
    const [clientRes, diagRes, therapyRes] = await Promise.all([
      window._sb.from('clients').select(`
        id,ime_prezime,obrakanje,maticen_broj,embg,adresa,telefon,
        floor_number,room_number,bed_number,profile_pic_url,status,created_at,
        priem_dijagnoza_kod,priem_dijagnoza_opis
      `).eq('id', c.id).single(),
      window._sb.from('client_chronic_diagnoses')
        .select('kod,opis,added_at').eq('client_id', c.id),
      window._sb.from('client_chronic_therapy')
        .select('*').eq('client_id', c.id).order('added_at', { ascending: false }),
    ]);
    _client = { ...clientRes.data, client_chronic_diagnoses: diagRes.data || [] };
    _therapy = therapyRes.data || [];
    _newTherapyItems = [];
    _drugObj = null;
    showLogForm();
  };

  // ══════════════════════════════════════════════════════════════════
  //  STEP 2 — LOG FORM (doctor view)
  // ══════════════════════════════════════════════════════════════════
  function showLogForm() {
    const c = _client;
    const fl = c.floor_number || (window.roomToFloor ? window.roomToFloor(c.room_number) : '?');
    const loc = c.room_number ? `Соба ${c.room_number} / Кревет ${c.bed_number} · Кат ${fl}` : '—';
    const diags = (c.client_chronic_diagnoses || []);

    document.getElementById('nl-title').textContent = 'Нов Клинички Запис';

    // Current chronic therapy (active = no ended_at)
    const activeTherapy = _therapy.filter(t => !t.ended_at);

    document.getElementById('nl-body').innerHTML = `
      <!-- Client preview bar -->
      <div class="nl-client-bar">
        ${c.profile_pic_url
          ? `<div class="nl-av"><img src="${esc(c.profile_pic_url)}" alt=""/></div>`
          : `<div class="nl-av">${esc((c.ime_prezime||'?').charAt(0))}</div>`}
        <div class="nl-cb-info">
          <div class="nl-cb-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime)}</div>
          <div class="nl-cb-meta">${esc(loc)} · ЕМБГ: ${esc(c.embg||'—')} · Матичен: ${esc(c.maticen_broj||'—')}</div>
        </div>
        <button class="nl-change-btn" onclick="nlChangePatient()">Промени</button>
      </div>

      <!-- Chronic diagnoses preview -->
      ${diags.length ? `
      <div class="nl-info-block">
        <div class="nl-ib-title">Хронични дијагнози</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem">
          ${diags.map(d=>`<span class="nl-diag-chip"><span style="font-family:monospace;font-weight:700;color:var(--olive);margin-right:0.3rem">${esc(d.kod)}</span>${esc(d.opis||'')}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Two-column form -->
      <div class="nl-form-cols">

        <!-- LEFT column -->
        <div class="nl-col">

          <!-- Current diagnosis -->
          <div class="nl-sect-title">Дијагноза <span class="req">*</span></div>
          <div class="nl-mkb-row">
            <div style="flex:0 0 110px;position:relative">
              <label class="nl-lbl">МКБ-10 код</label>
              <input class="nl-inp" id="l_kod" placeholder="A00.1" style="text-transform:uppercase" autocomplete="off" oninput="nlMKBLive('l_kod','l_opis','l_kod_dd')"/>
              <div class="nl-mkb-dd" id="l_kod_dd"></div>
            </div>
            <div style="flex:1;min-width:0">
              <label class="nl-lbl">Опис</label>
              <input class="nl-inp" id="l_opis" readonly placeholder="По пребарување…"/>
            </div>
            <div style="flex-shrink:0;align-self:flex-end">
              <button class="nl-btn-mkb" onclick="nlMKB('l_kod','l_opis','l_kod_dd')">Барај</button>
            </div>
          </div>

          <!-- Anamneza -->
          <div class="nl-sect-title" style="margin-top:1.1rem">Анамнеза</div>
          <textarea class="nl-ta" id="l_anamneza" rows="4" placeholder="Анамнестички податоци…"></textarea>

          <!-- Naod -->
          <div class="nl-sect-title" style="margin-top:1.1rem">Наод</div>
          <textarea class="nl-ta" id="l_naod" rows="4" placeholder="Клинички наод…"></textarea>

        </div><!-- /LEFT -->

        <!-- RIGHT column -->
        <div class="nl-col">

          <!-- Vitals -->
          <div class="nl-sect-title">Витални параметри</div>
          <div class="nl-vitals-grid">
            <!-- BP row — sys/dias side by side with slash -->
            <div class="nl-bp-row">
              <div class="nl-fg">
                <label class="nl-lbl">Систоличен</label>
                <input class="nl-inp nl-bp-inp" id="l_kp_s" type="number" placeholder="120"/>
              </div>
              <div class="nl-bp-slash">/</div>
              <div class="nl-fg">
                <label class="nl-lbl">Дијастоличен</label>
                <input class="nl-inp nl-bp-inp" id="l_kp_d" type="number" placeholder="80"/>
              </div>
              <div class="nl-bp-unit">mmHg</div>
            </div>
            <div class="nl-fg"><label class="nl-lbl">Пулс (bpm)</label><input class="nl-inp" id="l_puls" type="number" placeholder="72"/></div>
            <div class="nl-fg"><label class="nl-lbl">Температура (°C)</label><input class="nl-inp" id="l_temp" type="number" step="0.1" placeholder="36.6"/></div>
            <div class="nl-fg"><label class="nl-lbl">SpO2 (%)</label><input class="nl-inp" id="l_spo2" type="number" placeholder="98"/></div>
            <div class="nl-fg"><label class="nl-lbl">Респирации (/мин)</label><input class="nl-inp" id="l_resp" type="number" placeholder="16"/></div>
            <div class="nl-fg"><label class="nl-lbl">Тежина (kg)</label><input class="nl-inp" id="l_tezina" type="number" step="0.1" placeholder="72.5"/></div>
            <div class="nl-fg"><label class="nl-lbl">Крвен шеќер (mmol/L)</label><input class="nl-inp" id="l_seker" type="number" step="0.1" placeholder="5.4"/></div>
            <div class="nl-fg"><label class="nl-lbl">Болка (0–10)</label><input class="nl-inp" id="l_bolka" type="number" min="0" max="10" placeholder="0"/></div>
          </div>

          <!-- Chronic therapy -->
          <div class="nl-sect-title" style="margin-top:1.25rem">Хронична терапија</div>
          <div id="nl-ct-block">${renderChronicTherapyBlock()}</div>

          <!-- Parenteral -->
          <div class="nl-sect-title" style="margin-top:1.1rem">Парентерална терапија</div>
          <textarea class="nl-ta" id="l_parenteralna" rows="2" placeholder="нпр. NaCl 0.9% 500ml iv…"></textarea>

        </div><!-- /RIGHT -->

      </div><!-- /cols -->

      <!-- Footer save button area -->
      <div class="nl-form-ftr">
        <div class="nl-err" id="nl-err"></div>
        <button class="nl-btn-prim" id="nl-save-btn" onclick="nlSave()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Зачувај запис
        </button>
      </div>`;

    // Wire MKB enter — also fires immediately on Enter without waiting for debounce
    document.getElementById('l_kod').addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(_mkbTimer); nlMKB('l_kod','l_opis','l_kod_dd'); }
    });
    // Wire drug search
    const drugInp = document.getElementById('nl_drug');
    if (drugInp) drugInp.addEventListener('input', e => nlDrugSearch(e.target.value));
    // Focus diagnosis
    setTimeout(() => document.getElementById('l_kod')?.focus(), 60);
  }

  window.nlChangePatient = function () { reset(); showSearchStep(); };

  // ── Chronic therapy block renderer ──────────────────────────────
  function renderChronicTherapyBlock() {
    const active = _therapy.filter(t => !t.ended_at);
    const past   = _therapy.filter(t => t.ended_at);

    let html = '';

    // Active therapy list (read-only display)
    if (active.length) {
      html += `<div class="nl-ct-active">${active.map(t =>
        `<div class="nl-ct-row">
          <span class="nl-ct-drug">${esc(t.drug_name)}</span>
          <span class="nl-ct-dose">${esc(t.dosage)}</span>
          <span class="nl-ct-since">од ${fmt(t.added_at)}</span>
        </div>`).join('')}</div>`;
    } else {
      html += `<div style="font-size:0.8rem;color:var(--gray);margin-bottom:0.5rem">Нема активна хронична терапија.</div>`;
    }

    // New therapy items staged this session
    if (_newTherapyItems.length) {
      html += `<div class="nl-ct-new-list" id="nl-ct-new-list">${renderNewTherapyItems()}</div>`;
    } else {
      html += `<div id="nl-ct-new-list"></div>`;
    }

    // Add new drug row
    html += `
      <div class="nl-ct-add-row" id="nl-ct-add-row">
        <div style="flex:1;min-width:0;position:relative">
          <input class="nl-inp" id="nl_drug" placeholder="Додај лек (мин. 3 знаци)…" autocomplete="off" oninput="nlDrugSearch(this.value)"/>
          <div class="nl-drug-dd" id="nl_drug_dd"></div>
        </div>
        <div style="flex:0 0 130px">
          <input class="nl-inp" id="nl_dose" placeholder="Доза…"/>
        </div>
        <button class="nl-btn-add" onclick="nlAddTherapy()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Додај
        </button>
      </div>`;

    // Past therapy accordion
    if (past.length) {
      html += `
        <details class="nl-past-details">
          <summary>Поранешна терапија (${past.length})</summary>
          <div class="nl-past-list">${past.map(t => `
            <div class="nl-ct-row nl-ct-past">
              <span class="nl-ct-drug">${esc(t.drug_name)}</span>
              <span class="nl-ct-dose">${esc(t.dosage)}</span>
              <span class="nl-ct-since">${fmt(t.added_at)} – ${fmt(t.ended_at)}</span>
            </div>`).join('')}
          </div>
        </details>`;
    }

    return html;
  }

  function renderNewTherapyItems() {
    return _newTherapyItems.map((t, i) => `
      <div class="nl-ct-row nl-ct-staged">
        <span class="nl-ct-drug">${esc(t.drug_name)}</span>
        <span class="nl-ct-dose">${esc(t.dosage)}</span>
        <span class="nl-ct-since" style="color:var(--olive)">Ново</span>
        <button class="nl-rm-btn" onclick="nlRemTherapy(${i})">×</button>
      </div>`).join('');
  }

  function refreshCtBlock() {
    const block = document.getElementById('nl-ct-block');
    if (!block) return;
    block.innerHTML = renderChronicTherapyBlock();
    // Rewire drug input
    const drugInp = document.getElementById('nl_drug');
    if (drugInp) drugInp.addEventListener('input', e => nlDrugSearch(e.target.value));
  }

  window.nlRemTherapy = function (i) {
    _newTherapyItems.splice(i, 1);
    const el = document.getElementById('nl-ct-new-list');
    if (el) el.innerHTML = renderNewTherapyItems();
  };

  window.nlAddTherapy = function () {
    const drugVal = (document.getElementById('nl_drug')?.value || '').trim();
    const dose    = (document.getElementById('nl_dose')?.value || '').trim();
    if (!drugVal) { setErr('Внесете лек.'); return; }
    if (!dose)    { setErr('Внесете доза.'); return; }
    clearErr();
    const name = _drugObj ? _drugObj.latin_name : drugVal;
    _newTherapyItems.push({ drug_name: name, dosage: dose });
    _drugObj = null;
    // Refresh the new list + clear inputs
    const el = document.getElementById('nl-ct-new-list');
    if (el) el.innerHTML = renderNewTherapyItems();
    const d = document.getElementById('nl_drug'); if (d) d.value = '';
    const ds = document.getElementById('nl_dose'); if (ds) ds.value = '';
    const dd = document.getElementById('nl_drug_dd'); if (dd) dd.classList.remove('show');
  };

  // ── Drug autocomplete ────────────────────────────────────────────
  window.nlDrugSearch = function (val) {
    clearTimeout(_drugTimer);
    _drugObj = null;
    const dd = document.getElementById('nl_drug_dd');
    if (!val || val.trim().length < 3) { if (dd) dd.classList.remove('show'); return; }
    _drugTimer = setTimeout(async () => {
      const [byLatin, byGeneric] = await Promise.all([
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form')
          .ilike('latin_name', `%${val}%`).limit(8),
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form')
          .ilike('generic_name', `%${val}%`).limit(8),
      ]);
      const seen = new Set();
      const data = [...(byLatin.data||[]), ...(byGeneric.data||[])].filter(d => {
        if (seen.has(d.id)) return false; seen.add(d.id); return true;
      }).slice(0, 12);
      if (!dd) return;
      dd.innerHTML = '';
      if (!data.length) {
        const empty = document.createElement('div');
        empty.className = 'nl-drug-item';
        empty.style.cssText = 'color:var(--gray);cursor:default';
        empty.textContent = `Нема резултати за „${val}"`;
        dd.appendChild(empty);
        dd.classList.add('show'); return;
      }
      data.forEach(d => {
        const item = document.createElement('div');
        item.className = 'nl-drug-item';
        item.innerHTML = `<div class="nl-ddi-name">${esc(d.latin_name)}</div><div class="nl-ddi-meta">${esc(d.generic_name||'')}${d.strength?' · '+esc(d.strength):''}${d.form?' · '+esc(d.form):''}</div>`;
        item.addEventListener('click', () => {
          _drugObj = d;
          const inp = document.getElementById('nl_drug');
          if (inp) inp.value = d.latin_name + (d.strength ? ' ' + d.strength : '') + (d.form ? ' (' + d.form + ')' : '');
          dd.classList.remove('show');
        });
        dd.appendChild(item);
      });
      dd.classList.add('show');
    }, 300);
  };

  window.nlPickDrug = function (jsonStr) {
    const d = JSON.parse(jsonStr);
    _drugObj = d;
    const inp = document.getElementById('nl_drug');
    if (inp) inp.value = d.latin_name + (d.strength ? ' ' + d.strength : '') + (d.form ? ' (' + d.form + ')' : '');
    const dd = document.getElementById('nl_drug_dd'); if (dd) dd.classList.remove('show');
  };

  // ── MKB lookup ───────────────────────────────────────────────────
  let _mkbTimer = null;

  window.nlMKB = async function (codeId, opisId, ddId) {
    const codeEl = document.getElementById(codeId);
    const opisEl = document.getElementById(opisId);
    const dd     = document.getElementById(ddId);
    if (!codeEl) return;
    const raw = (codeEl.value || '').trim().toUpperCase();
    codeEl.value = raw;
    if (!raw) { if (opisEl) opisEl.value = ''; if (dd) dd.classList.remove('show'); return; }
    // Exact match first
    const { data: ex } = await window._sb.from('mkb10').select('code,description').eq('code', raw).maybeSingle();
    if (ex) { if (opisEl) opisEl.value = ex.description; if (dd) dd.classList.remove('show'); return; }
    // Two separate ilike queries — avoids broken .or() syntax
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

  // Live-typing trigger with debounce
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
    const kod = (document.getElementById('l_kod')?.value || '').trim().toUpperCase();
    if (!kod) { setErr('Дијагнозата е задолжителна.'); return; }

    const btn = document.getElementById('nl-save-btn');
    btn.disabled = true;

    function nv(id) { const v = document.getElementById(id)?.value; return (v && v.trim()) ? parseFloat(v) : null; }

    const payload = {
      client_id:     _client.id,
      created_by:    window._user.id,
      log_type:      'doctor',
      dijagnoza_kod: kod,
      dijagnoza_opis:    document.getElementById('l_opis')?.value || null,
      anamneza:          document.getElementById('l_anamneza')?.value || null,
      naod:              document.getElementById('l_naod')?.value || null,
      parenteralna:      document.getElementById('l_parenteralna')?.value || null,
      kp_sistolicen:     nv('l_kp_s'),
      kp_dijastolicen:   nv('l_kp_d'),
      puls:              nv('l_puls'),
      temperatura:       nv('l_temp'),
      spo2:              nv('l_spo2'),
      respiracii:        nv('l_resp'),
      tezina:            nv('l_tezina'),
      seker:             nv('l_seker'),
      bolka:             nv('l_bolka') != null ? parseInt(document.getElementById('l_bolka')?.value) : null,
    };

    const { error: logErr } = await window._sb.from('client_logs').insert([payload]);
    if (logErr) { setErr('Грешка при зачувување: ' + logErr.message); btn.disabled = false; return; }

    // Insert new chronic therapy items
    if (_newTherapyItems.length) {
      const rows = _newTherapyItems.map(t => ({
        client_id:  _client.id,
        drug_name:  t.drug_name,
        dosage:     t.dosage,
        added_by:   window._user.id,
      }));
      await window._sb.from('client_chronic_therapy').insert(rows);
    }

    btn.disabled = false;
    close();
  };

  // ── Helpers ──────────────────────────────────────────────────────
  function setErr(msg) { const el = document.getElementById('nl-err'); if (el) el.textContent = msg; }
  function clearErr()  { const el = document.getElementById('nl-err'); if (el) el.textContent = ''; }
  function esc(s)      { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmt(iso)    { return iso ? new Date(iso).toLocaleDateString('mk-MK') : '—'; }

})();
