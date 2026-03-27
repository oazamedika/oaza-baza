/**
 * new-log-social.js — "Нов Социјален Запис" modal
 * Used by: menadzer, socijalenrabotnik
 * Requires: auth-guard.js (window._sb, window._user, window._username)
 * Public API:
 *   window.openNewLogSocial(callback)
 */
(function () {

  // ══════════════════════════════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════════════════════════════
  const CSS = `<style id="nls-styles">
#nls-bd{display:none;position:fixed;inset:0;background:rgba(47,42,36,0.65);z-index:300;align-items:flex-start;justify-content:center;padding:1.25rem;overflow-y:auto}
#nls-bd.open{display:flex}
#nls-box{background:#fff;border-radius:12px;width:100%;max-width:780px;min-height:0;box-shadow:0 28px 72px rgba(0,0,0,0.24);display:flex;flex-direction:column;margin:auto}
#nls-hdr{padding:1.1rem 1.5rem;border-bottom:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;border-radius:12px 12px 0 0;flex-shrink:0}
#nls-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:600;color:var(--dark)}
#nls-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s}
#nls-close:hover{color:var(--dark)}
#nls-body{padding:1.5rem;flex:1;min-height:0}
/* Search step — identical to new-log.js */
.nls-search-wrap{max-width:520px;margin:2rem auto}
.nls-search-hero{display:flex;align-items:center;gap:0.9rem;margin-bottom:1.25rem}
.nls-pt-search-wrap{position:relative}
.nls-search-icon{position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);color:var(--gray);pointer-events:none;display:flex}
.nls-search-inp{width:100%;padding:0.75rem 0.9rem 0.75rem 2.4rem;border:1.5px solid var(--border);border-radius:7px;font-family:'Lato',sans-serif;font-size:0.95rem;color:var(--dark);outline:none;box-sizing:border-box;transition:border-color 0.15s,box-shadow 0.15s}
.nls-search-inp:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nls-pt-dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,0.16);z-index:400;max-height:300px;overflow-y:auto;display:none}
.nls-pt-dd.show{display:block}
.nls-pt-item{display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.1s}
.nls-pt-item:last-child{border-bottom:none}.nls-pt-item:hover{background:var(--cream)}
.nls-pt-av{width:28px;height:28px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nls-pt-av img{width:100%;height:100%;object-fit:cover}
.nls-pt-name{font-weight:700;font-size:0.88rem;color:var(--dark)}
.nls-pt-meta{font-size:0.72rem;color:var(--gray)}
/* Client bar */
.nls-client-bar{display:flex;align-items:center;gap:0.85rem;padding:0.85rem 1.1rem;background:var(--cream);border:1px solid var(--border);border-radius:8px;margin-bottom:1.25rem}
.nls-av{width:42px;height:42px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nls-av img{width:100%;height:100%;object-fit:cover}
.nls-cb-info{flex:1;min-width:0}
.nls-cb-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)}
.nls-cb-meta{font-size:0.75rem;color:var(--gray);margin-top:0.1rem}
.nls-change-btn{padding:0.38rem 0.85rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s;flex-shrink:0}
.nls-change-btn:hover{border-color:var(--dark);color:var(--dark)}
/* Form */
.nls-lbl{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:0.25rem}
.nls-inp,.nls-ta{padding:0.6rem 0.75rem;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.88rem;color:var(--dark);background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;width:100%;box-sizing:border-box}
.nls-inp:focus,.nls-ta:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nls-ta{resize:vertical}
.nls-fg{display:flex;flex-direction:column;margin-bottom:1rem}
.nls-sect-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.5rem;border-bottom:1px solid var(--border);padding-bottom:0.35rem}
/* Footer */
.nls-form-ftr{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)}
.nls-err{font-size:0.82rem;color:#c0392b;flex:1}
.nls-btn-prim{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.6rem;background:var(--dark);border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:0.88rem;font-weight:700;letter-spacing:0.08em;color:#fff;cursor:pointer;transition:background 0.15s}
.nls-btn-prim:hover{background:var(--olive)}.nls-btn-prim:disabled{opacity:0.45;pointer-events:none}
/* Social accent */
.nls-accent-bar{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.85rem;background:#e8f0e8;border:1px solid #b5d5b5;border-radius:6px;margin-bottom:1.25rem;font-size:0.8rem;color:#2a6e3a;font-weight:600}
</style>`;

  const HTML = `
<div id="nls-bd">
  <div id="nls-box" role="dialog" aria-modal="true">
    <div id="nls-hdr">
      <span id="nls-title">Нов Социјален Запис</span>
      <button id="nls-close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="nls-body"></div>
  </div>
</div>`;

  // ── State ──────────────────────────────────────────────────────────
  let _cb = null;
  let _client = null;
  let _ptTimer = null;
  let _injected = false;

  // ── Inject once ────────────────────────────────────────────────────
  function inject() {
    if (_injected || document.getElementById('nls-bd')) return;
    _injected = true;
    document.head.insertAdjacentHTML('beforeend', CSS);
    document.body.insertAdjacentHTML('beforeend', HTML);
    document.getElementById('nls-close').addEventListener('click', close);
    document.getElementById('nls-bd').addEventListener('click', e => { if (e.target.id === 'nls-bd') close(); });
  }

  // ── Public API ─────────────────────────────────────────────────────
  window.openNewLogSocial = function (cb) {
    _cb = cb || null;
    inject();
    _client = null;
    showSearchStep();
    document.getElementById('nls-bd').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function close() {
    document.getElementById('nls-bd').classList.remove('open');
    document.body.style.overflow = '';
    if (typeof _cb === 'function') _cb();
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 1 — SEARCH (identical UX to new-log.js)
  // ══════════════════════════════════════════════════════════════════
  function showSearchStep() {
    document.getElementById('nls-title').textContent = 'Нов Социјален Запис';
    document.getElementById('nls-body').innerHTML = `
      <div class="nls-search-wrap">
        <div class="nls-search-hero">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)">Изберете корисник</div>
            <div style="font-size:0.8rem;color:var(--gray);margin-top:0.15rem">Пребарајте по ime, ЕМБГ или матичен број</div>
          </div>
        </div>
        <div class="nls-pt-search-wrap">
          <div class="nls-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input class="nls-search-inp" id="nls_pt_search" placeholder="Пребарај…" autocomplete="off"/>
          <div class="nls-pt-dd" id="nls_pt_dd"></div>
        </div>
      </div>`;
    setTimeout(() => document.getElementById('nls_pt_search')?.focus(), 60);
    document.getElementById('nls_pt_search').addEventListener('input', e => searchPatient(e.target.value));
    document.getElementById('nls_pt_search').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#nls_pt_dd .nls-pt-item');
        if (first) first.click();
      }
    });
  }

  function searchPatient(val) {
    clearTimeout(_ptTimer);
    const dd = document.getElementById('nls_pt_dd');
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
        empty.className = 'nls-pt-item';
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
        item.className = 'nls-pt-item';
        item.innerHTML = `
          <div class="nls-pt-av">${esc((c.ime_prezime||'?').charAt(0))}</div>
          <div>
            <div class="nls-pt-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime)}</div>
            <div class="nls-pt-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
          </div>`;
        item.addEventListener('click', () => nlsPickPatient(c));
        dd.appendChild(item);
      });
      dd.classList.add('show');
    }, 280);
  }

  window.nlsPickPatient = async function (c) {
    const dd = document.getElementById('nls_pt_dd');
    if (dd) dd.classList.remove('show');
    document.getElementById('nls-body').innerHTML = `<div style="padding:3rem;text-align:center;color:var(--gray)">Се вчитува…</div>`;

    const { data: clientData } = await window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,
      floor_number,room_number,bed_number,profile_pic_url
    `).eq('id', c.id).single();

    _client = clientData;
    showForm();
  };

  window.nlsChangePatient = function () { _client = null; showSearchStep(); };

  // ══════════════════════════════════════════════════════════════════
  //  STEP 2 — SOCIAL FORM
  // ══════════════════════════════════════════════════════════════════
  function showForm() {
    const c = _client;
    const fl = c.floor_number || (window.roomToFloor ? window.roomToFloor(c.room_number) : '?');
    const loc = c.room_number ? `Соба ${c.room_number} / Кревет ${c.bed_number} · Кат ${fl}` : '—';

    const av = c.profile_pic_url
      ? `<div class="nls-av"><img src="${esc(c.profile_pic_url)}" alt=""/></div>`
      : `<div class="nls-av">${esc((c.ime_prezime||'?').charAt(0))}</div>`;

    document.getElementById('nls-title').textContent = 'Нов Социјален Запис';
    document.getElementById('nls-body').innerHTML = `
      <div class="nls-client-bar">
        ${av}
        <div class="nls-cb-info">
          <div class="nls-cb-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime||'')}</div>
          <div class="nls-cb-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
        </div>
        <button class="nls-change-btn" onclick="nlsChangePatient()">Промени корисник</button>
      </div>

      <div class="nls-accent-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Социјален запис
      </div>

      <div class="nls-fg">
        <label class="nls-lbl">Содржина на посета / разговор <span style="color:#c0392b">*</span></label>
        <textarea class="nls-ta" id="nls_anamneza" rows="5" placeholder="Опишете ја содржината на посетата, разговорот или интервенцијата…"></textarea>
      </div>

      <div class="nls-fg">
        <label class="nls-lbl">Состојба на корисникот</label>
        <textarea class="nls-ta" id="nls_naod" rows="3" placeholder="Психосоцијална состојба, расположение, соработка…"></textarea>
      </div>

      <div class="nls-fg">
        <label class="nls-lbl">Семејство / контакт лица</label>
        <textarea class="nls-ta" id="nls_familija" rows="2" placeholder="Контакт со семејство, информации, посети…"></textarea>
      </div>

      <div class="nls-fg">
        <label class="nls-lbl">План / следни чекори</label>
        <textarea class="nls-ta" id="nls_plan" rows="3" placeholder="Планирани активности, упатување, следна посета…"></textarea>
      </div>

      <div class="nls-fg">
        <label class="nls-lbl">Забелешки</label>
        <textarea class="nls-ta" id="nls_zabeleski" rows="2" placeholder="Дополнителни напомени…"></textarea>
      </div>

      <div class="nls-form-ftr">
        <span class="nls-err" id="nls-err"></span>
        <button class="nls-btn-prim" id="nls-save-btn" onclick="nlsSave()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Зачувај запис
        </button>
      </div>`;
  }

  // ── Save ───────────────────────────────────────────────────────────
  window.nlsSave = async function () {
    const errEl = document.getElementById('nls-err');
    if (errEl) errEl.textContent = '';
    if (!_client) { if (errEl) errEl.textContent = 'Нема избран корисник.'; return; }

    function sv(id) { const v = document.getElementById(id)?.value; return (v && v.trim()) ? v.trim() : null; }

    const anamneza = sv('nls_anamneza');
    if (!anamneza) { if (errEl) errEl.textContent = 'Содржината на посетата е задолжителна.'; return; }

    // Combine familija and plan into the naod field for storage
    const naodParts = [];
    const naod = sv('nls_naod'); if (naod) naodParts.push(naod);
    const familija = sv('nls_familija'); if (familija) naodParts.push(`Семејство: ${familija}`);
    const plan = sv('nls_plan'); if (plan) naodParts.push(`План: ${plan}`);

    const btn = document.getElementById('nls-save-btn');
    btn.disabled = true;

    const payload = {
      client_id:      _client.id,
      created_by:     window._user.id,
      log_type:       'social',
      anamneza:       anamneza,
      naod:           naodParts.join('\n\n') || null,
      zabeleski:      sv('nls_zabeleski'),
    };

    const { error } = await window._sb.from('client_logs').insert([payload]);
    if (error) {
      if (errEl) errEl.textContent = 'Грешка при зачувување: ' + error.message;
      btn.disabled = false;
      return;
    }

    btn.disabled = false;
    close();
  };

  function esc(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

})();
