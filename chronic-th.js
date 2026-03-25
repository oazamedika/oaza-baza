/**
 * chronic-th.js — Chronic Therapy Session Modal
 *
 * Opens as an overlay when the doctor wants to create a new therapy block.
 * Shows the history of past sessions (read-only), lets them copy one as a
 * starting point or start from scratch, then saves the new session.
 *
 * Public API:
 *   window.openChronicTherapy(clientId, clientName, onSaved)
 *     — onSaved(newSessionId) is called after successful save
 *
 * Requires: window._sb, window._user
 */

(function () {

  // ── State ──────────────────────────────────────────────────────────
  let _clientId   = null;
  let _clientName = '';
  let _onSaved    = null;
  let _sessions   = [];      // past sessions (newest first)
  let _drugs      = [];      // drugs being edited for the NEW session
  let _drugObj    = null;    // selected drug from autocomplete
  let _drugTimer  = null;
  let _injected   = false;

  // ── CSS ────────────────────────────────────────────────────────────
  const CT_CSS = `<style id="ct-styles">
#ct-bd{display:none;position:fixed;inset:0;background:rgba(30,26,22,0.72);z-index:500;align-items:flex-start;justify-content:center;padding:1.25rem;overflow-y:auto;backdrop-filter:blur(3px)}
#ct-bd.open{display:flex}
#ct-box{background:#fff;border-radius:14px;width:100%;max-width:1000px;box-shadow:0 32px 80px rgba(0,0,0,0.28);display:flex;flex-direction:column;margin:auto;overflow:hidden}
#ct-hdr{padding:1.1rem 1.5rem;border-bottom:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.ct-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:600;color:var(--dark)}
.ct-title small{font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:400;color:var(--gray);margin-left:0.5rem}
#ct-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s}
#ct-close:hover{color:var(--dark)}
#ct-body{display:grid;grid-template-columns:300px 1fr;min-height:0;max-height:80vh}
@media(max-width:760px){#ct-body{grid-template-columns:1fr;max-height:none}}
/* ── Left: history panel ── */
#ct-history{border-right:1px solid var(--border);overflow-y:auto;background:var(--cream,#faf9f7)}
.ct-hist-hdr{padding:0.75rem 1rem;font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.ct-session{border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.12s}
.ct-session:hover{background:#fff}
.ct-session.active-session{background:#fff;border-left:3px solid var(--olive)}
.ct-sess-hdr{display:flex;align-items:center;justify-content:space-between;padding:0.65rem 0.9rem 0.3rem}
.ct-sess-dates{font-size:0.73rem;color:var(--gray)}
.ct-sess-badge{display:inline-block;padding:0.1rem 0.4rem;border-radius:20px;font-size:0.62rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase}
.ct-badge-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.ct-badge-old{background:var(--cream,#faf9f7);color:var(--gray);border:1px solid var(--border)}
.ct-sess-drugs{padding:0 0.9rem 0.6rem;display:flex;flex-direction:column;gap:0.25rem}
.ct-sd-row{font-size:0.78rem;color:var(--dark);display:flex;align-items:baseline;gap:0.35rem}
.ct-sd-name{font-weight:700}
.ct-sd-form{color:var(--gray);font-size:0.72rem}
.ct-sd-dose{color:var(--gray);font-size:0.72rem}
.ct-copy-btn{margin:0 0.9rem 0.65rem;padding:0.35rem 0.75rem;background:transparent;border:1px dashed var(--olive);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.74rem;font-weight:700;color:var(--olive);cursor:pointer;transition:background 0.15s;display:inline-flex;align-items:center;gap:0.35rem}
.ct-copy-btn:hover{background:rgba(122,122,46,0.08)}
.ct-hist-empty{padding:2rem 1rem;text-align:center;font-size:0.82rem;color:var(--gray)}
/* ── Right: editor ── */
#ct-editor{padding:1.25rem 1.5rem;overflow-y:auto;display:flex;flex-direction:column;gap:0}
.ct-ed-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark);margin-bottom:0.25rem}
.ct-ed-sub{font-size:0.78rem;color:var(--gray);margin-bottom:1rem;line-height:1.5}
/* ── Drug list being built ── */
.ct-drug-list{display:flex;flex-direction:column;gap:0.35rem;margin-bottom:0.75rem;min-height:2rem}
.ct-drug-row{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:var(--cream,#faf9f7);border:1px solid var(--border);border-radius:5px}
.ct-dr-name{font-weight:700;font-size:0.85rem;color:var(--dark)}
.ct-dr-form{font-size:0.75rem;color:var(--gray)}
.ct-dr-dose{font-size:0.82rem;color:var(--dark)}
.ct-dr-rm{background:none;border:none;cursor:pointer;color:var(--gray);font-size:1.1rem;line-height:1;padding:0 0.2rem;transition:color 0.15s}
.ct-dr-rm:hover{color:#c0392b}
.ct-drug-empty{font-size:0.8rem;color:var(--gray);padding:0.5rem 0;font-style:italic}
/* ── Add drug form ── */
.ct-add-form{background:var(--cream,#faf9f7);border:1px solid var(--border);border-radius:7px;padding:0.85rem 1rem;margin-top:0.25rem}
.ct-add-title{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);margin-bottom:0.6rem}
.ct-add-grid{display:grid;grid-template-columns:1fr 140px 140px auto;gap:0.5rem;align-items:flex-end}
@media(max-width:640px){.ct-add-grid{grid-template-columns:1fr 1fr;}.ct-add-grid>*:last-child{grid-column:1/-1}}
.ct-lbl{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:0.22rem}
.ct-inp{padding:0.55rem 0.7rem;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.87rem;color:var(--dark);background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;width:100%;box-sizing:border-box}
.ct-inp:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.ct-drug-dd{position:absolute;top:calc(100% + 3px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:5px;box-shadow:0 6px 22px rgba(0,0,0,0.16);z-index:600;max-height:220px;overflow-y:auto;display:none}
.ct-drug-dd.show{display:block}
.ct-dd-item{padding:0.55rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.84rem}
.ct-dd-item:last-child{border-bottom:none}.ct-dd-item:hover{background:var(--cream,#faf9f7)}
.ct-ddi-name{font-weight:700;color:var(--dark)}.ct-ddi-meta{font-size:0.73rem;color:var(--gray);margin-top:0.1rem}
.ct-btn-add{padding:0.55rem 1rem;background:var(--olive);border:none;border-radius:4px;font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;color:#fff;cursor:pointer;white-space:nowrap;transition:background 0.15s;align-self:flex-end}
.ct-btn-add:hover{background:#5a5a1e}
/* ── Note field ── */
.ct-note-wrap{margin-top:1rem}
/* ── Footer ── */
#ct-ftr{padding:0.85rem 1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#fff;flex-shrink:0}
.ct-err{font-size:0.82rem;color:#c0392b;flex:1}
.ct-btn-prim{padding:0.65rem 1.5rem;background:var(--dark);border:none;border-radius:4px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;letter-spacing:0.07em;color:#fff;cursor:pointer;transition:background 0.15s}
.ct-btn-prim:hover{background:var(--olive)}.ct-btn-prim:disabled{opacity:0.45;pointer-events:none}
.ct-btn-sec{padding:0.65rem 1.2rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.ct-btn-sec:hover{border-color:var(--dark);color:var(--dark)}
</style>`;

  // ── HTML skeleton ──────────────────────────────────────────────────
  const CT_HTML = `<div id="ct-bd">
  <div id="ct-box" role="dialog" aria-modal="true">
    <div id="ct-hdr">
      <div class="ct-title">Хронична терапија<small id="ct-client-name"></small></div>
      <button id="ct-close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div id="ct-body">
      <div id="ct-history"></div>
      <div id="ct-editor"></div>
    </div>
    <div id="ct-ftr">
      <span class="ct-err" id="ct-err"></span>
      <div style="display:flex;gap:0.75rem">
        <button class="ct-btn-sec" id="ct-cancel">Откажи</button>
        <button class="ct-btn-prim" id="ct-save">Зачувај нова терапија</button>
      </div>
    </div>
  </div>
</div>`;

  // ── Inject once ────────────────────────────────────────────────────
  function inject() {
    if (_injected || document.getElementById('ct-bd')) return;
    _injected = true;
    document.head.insertAdjacentHTML('beforeend', CT_CSS);
    document.body.insertAdjacentHTML('beforeend', CT_HTML);
    document.getElementById('ct-close').addEventListener('click', close);
    document.getElementById('ct-cancel').addEventListener('click', close);
    document.getElementById('ct-bd').addEventListener('click', ev => { if (ev.target.id === 'ct-bd') close(); });
    document.getElementById('ct-save').addEventListener('click', save);
  }

  // ── Public API ─────────────────────────────────────────────────────
  window.openChronicTherapy = async function (clientId, clientName, onSaved) {
    _clientId   = clientId;
    _clientName = clientName || '';
    _onSaved    = onSaved || null;
    _drugs      = [];
    _drugObj    = null;

    inject();
    document.getElementById('ct-client-name').textContent = _clientName ? ' — ' + _clientName : '';
    document.getElementById('ct-bd').classList.add('open');
    document.body.style.overflow = 'hidden';
    clearErr();

    // Load sessions + their drugs
    document.getElementById('ct-history').innerHTML = '<div class="ct-hist-empty">Се вчитува…</div>';
    renderEditor();

    const { data: sessData } = await window._sb
      .from('chronic_therapy_sessions')
      .select('id,started_at,ended_at,note,created_by')
      .eq('client_id', _clientId)
      .order('started_at', { ascending: false });

    if (sessData && sessData.length) {
      // Fetch all drugs for these sessions in one query
      const sessIds = sessData.map(s => s.id);
      const { data: drugData } = await window._sb
        .from('chronic_therapy_drugs')
        .select('id,session_id,generic_name,form,dosage,sort_order')
        .in('session_id', sessIds)
        .order('sort_order', { ascending: true });

      const drugsBySession = {};
      (drugData || []).forEach(d => {
        if (!drugsBySession[d.session_id]) drugsBySession[d.session_id] = [];
        drugsBySession[d.session_id].push(d);
      });
      _sessions = sessData.map(s => ({ ...s, drugs: drugsBySession[s.id] || [] }));
    } else {
      _sessions = [];
    }

    renderHistory();
  };

  function close() {
    document.getElementById('ct-bd').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── History panel ──────────────────────────────────────────────────
  function renderHistory() {
    const panel = document.getElementById('ct-history');
    if (!_sessions.length) {
      panel.innerHTML = `
        <div class="ct-hist-hdr"><span>Историја</span></div>
        <div class="ct-hist-empty">Нема претходни терапии.</div>`;
      return;
    }

    const rows = _sessions.map((s, idx) => {
      const isActive = !s.ended_at;
      const dateRange = isActive
        ? `од ${fmt(s.started_at)}`
        : `${fmt(s.started_at)} – ${fmt(s.ended_at)}`;
      const badge = isActive
        ? `<span class="ct-sess-badge ct-badge-active">Активна</span>`
        : `<span class="ct-sess-badge ct-badge-old">Завршена</span>`;
      const drugs = s.drugs.map(d =>
        `<div class="ct-sd-row">
          <span class="ct-sd-name">${esc(d.generic_name)}</span>
          ${d.form ? `<span class="ct-sd-form">${esc(d.form)}</span>` : ''}
          <span class="ct-sd-dose">— ${esc(d.dosage)}</span>
        </div>`).join('');

      return `<div class="ct-session">
        <div class="ct-sess-hdr">
          <span class="ct-sess-dates">${dateRange}</span>
          ${badge}
        </div>
        <div class="ct-sess-drugs">
          ${drugs || '<span style="font-size:0.75rem;color:var(--gray)">Нема лекови.</span>'}
        </div>
        <button class="ct-copy-btn" onclick="ctCopySession(${idx})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Копирај и уреди
        </button>
      </div>`;
    }).join('');

    panel.innerHTML = `<div class="ct-hist-hdr"><span>Историја (${_sessions.length})</span></div>${rows}`;
  }

  window.ctCopySession = function (idx) {
    const s = _sessions[idx];
    if (!s) return;
    _drugs = s.drugs.map(d => ({
      drug_id:      d.drug_id || null,
      generic_name: d.generic_name,
      form:         d.form || '',
      dosage:       d.dosage,
    }));
    renderEditor();
    clearErr();
    // Scroll editor into view on mobile
    document.getElementById('ct-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Editor panel ───────────────────────────────────────────────────
  function renderEditor() {
    const el = document.getElementById('ct-editor');
    if (!el) return;

    const drugRows = _drugs.length
      ? _drugs.map((d, i) => `
          <div class="ct-drug-row">
            <div>
              <div class="ct-dr-name">${esc(d.generic_name)}</div>
              ${d.form ? `<div class="ct-dr-form">${esc(d.form)}</div>` : ''}
            </div>
            <div class="ct-dr-dose">${esc(d.dosage)}</div>
            <div></div>
            <button class="ct-dr-rm" onclick="ctRemDrug(${i})" title="Отстрани">×</button>
          </div>`).join('')
      : `<div class="ct-drug-empty">Нема додадени лекови. Додајте лек подолу или копирајте претходна терапија.</div>`;

    el.innerHTML = `
      <div class="ct-ed-title">Нова терапија</div>
      <div class="ct-ed-sub">Составете ја листата на лекови за новата хронична терапија. Оваа акција ќе ја затвори тековната активна терапија и ќе ја постави оваа како активна.</div>

      <div style="font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);margin-bottom:0.45rem">Лекови во терапијата</div>
      <div class="ct-drug-list" id="ct-drug-list">${drugRows}</div>

      <div class="ct-add-form">
        <div class="ct-add-title">Додај лек</div>
        <div class="ct-add-grid">
          <div>
            <label class="ct-lbl">Лек (генеричко иm — мин. 3 знаци)</label>
            <div style="position:relative">
              <input class="ct-inp" id="ct_drug_inp" placeholder="нпр. Metformin…" autocomplete="off" oninput="ctDrugSearch(this.value)"/>
              <div class="ct-drug-dd" id="ct_drug_dd"></div>
            </div>
          </div>
          <div>
            <label class="ct-lbl">Форма</label>
            <input class="ct-inp" id="ct_form_inp" placeholder="tabl. / caps. / amp."/>
          </div>
          <div>
            <label class="ct-lbl">Доза / режим</label>
            <input class="ct-inp" id="ct_dose_inp" placeholder="500mg 1×2"/>
          </div>
          <button class="ct-btn-add" onclick="ctAddDrug()">+ Додај</button>
        </div>
      </div>

      <div class="ct-note-wrap">
        <label class="ct-lbl">Белешка за оваа верзија на терапија (опционално)</label>
        <textarea class="ct-inp" id="ct_note_inp" rows="2" placeholder="нпр. Промена поради интолеранција на Metformin…" style="resize:vertical"></textarea>
      </div>`;
  }

  // ── Drug autocomplete ──────────────────────────────────────────────
  window.ctDrugSearch = function (val) {
    clearTimeout(_drugTimer);
    _drugObj = null;
    const dd = document.getElementById('ct_drug_dd');
    if (!val || val.trim().length < 3) { if (dd) dd.classList.remove('show'); return; }
    _drugTimer = setTimeout(async () => {
      const [byLatin, byGeneric] = await Promise.all([
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form').ilike('latin_name', `%${val}%`).limit(8),
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form').ilike('generic_name', `%${val}%`).limit(8),
      ]);
      const seen = new Set();
      const data = [...(byLatin.data || []), ...(byGeneric.data || [])].filter(d => {
        if (seen.has(d.id)) return false; seen.add(d.id); return true;
      }).slice(0, 12);
      if (!dd) return;
      dd.innerHTML = '';
      if (!data.length) {
        const empty = document.createElement('div');
        empty.className = 'ct-dd-item';
        empty.style.cssText = 'color:var(--gray);cursor:default';
        empty.textContent = `Нема резултати за „${val}"`;
        dd.appendChild(empty); dd.classList.add('show'); return;
      }
      data.forEach(d => {
        const item = document.createElement('div');
        item.className = 'ct-dd-item';
        item.innerHTML = `<div class="ct-ddi-name">${esc(d.latin_name)}</div><div class="ct-ddi-meta">${esc(d.generic_name || '')}${d.strength ? ' · ' + esc(d.strength) : ''}${d.form ? ' · ' + esc(d.form) : ''}</div>`;
        item.addEventListener('click', () => {
          _drugObj = d;
          const inp = document.getElementById('ct_drug_inp');
          const formInp = document.getElementById('ct_form_inp');
          if (inp) inp.value = d.generic_name || d.latin_name;
          if (formInp && d.form && !formInp.value) formInp.value = d.form;
          dd.classList.remove('show');
        });
        dd.appendChild(item);
      });
      dd.classList.add('show');
    }, 300);
  };

  window.ctAddDrug = function () {
    const nameEl  = document.getElementById('ct_drug_inp');
    const formEl  = document.getElementById('ct_form_inp');
    const doseEl  = document.getElementById('ct_dose_inp');
    const name = (nameEl?.value || '').trim();
    const form = (formEl?.value || '').trim();
    const dose = (doseEl?.value || '').trim();
    if (!name) { setErr('Внесете или изберете лек.'); return; }
    if (!dose) { setErr('Внесете доза / режим.'); return; }
    clearErr();
    _drugs.push({
      drug_id:      _drugObj?.id || null,
      generic_name: _drugObj?.generic_name || name,
      form:         form,
      dosage:       dose,
    });
    _drugObj = null;
    if (nameEl) nameEl.value = '';
    if (formEl) formEl.value = '';
    if (doseEl) doseEl.value = '';
    const dd = document.getElementById('ct_drug_dd'); if (dd) dd.classList.remove('show');
    refreshDrugList();
  };

  window.ctRemDrug = function (idx) {
    _drugs.splice(idx, 1);
    refreshDrugList();
  };

  function refreshDrugList() {
    const el = document.getElementById('ct-drug-list');
    if (!el) return;
    if (!_drugs.length) {
      el.innerHTML = `<div class="ct-drug-empty">Нема додадени лекови.</div>`;
      return;
    }
    el.innerHTML = _drugs.map((d, i) => `
      <div class="ct-drug-row">
        <div>
          <div class="ct-dr-name">${esc(d.generic_name)}</div>
          ${d.form ? `<div class="ct-dr-form">${esc(d.form)}</div>` : ''}
        </div>
        <div class="ct-dr-dose">${esc(d.dosage)}</div>
        <div></div>
        <button class="ct-dr-rm" onclick="ctRemDrug(${i})" title="Отстрани">×</button>
      </div>`).join('');
  }

  // ── Save ───────────────────────────────────────────────────────────
  async function save() {
    clearErr();
    if (!_drugs.length) { setErr('Додајте барем еден лек во терапијата.'); return; }

    const btn = document.getElementById('ct-save');
    btn.disabled = true;
    btn.textContent = 'Се зачувува…';

    const note = (document.getElementById('ct_note_inp')?.value || '').trim() || null;
    const now  = new Date().toISOString();

    try {
      // 1. Close current active session for this client
      const { error: closeErr } = await window._sb.rpc('close_active_therapy_session', {
        p_client_id: _clientId,
        p_ended_at: now,
      });
      if (closeErr) throw closeErr;

      // 2. Insert new session
      const { data: sessData, error: sessErr } = await window._sb
        .from('chronic_therapy_sessions')
        .insert([{
          client_id:  _clientId,
          started_at: now,
          note:       note,
          created_by: window._user.id,
        }])
        .select('id')
        .single();
      if (sessErr) throw sessErr;

      const sessionId = sessData.id;

      // 3. Insert drugs
      const rows = _drugs.map((d, i) => ({
        session_id:   sessionId,
        drug_id:      d.drug_id || null,
        generic_name: d.generic_name,
        form:         d.form || null,
        dosage:       d.dosage,
        sort_order:   i,
      }));
      const { error: drugErr } = await window._sb.from('chronic_therapy_drugs').insert(rows);
      if (drugErr) throw drugErr;

      // Success
      close();
      if (typeof _onSaved === 'function') _onSaved(sessionId);

    } catch (err) {
      setErr('Грешка: ' + (err.message || String(err)));
      btn.disabled = false;
      btn.textContent = 'Зачувај нова терапија';
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────
  function setErr(msg)  { const el = document.getElementById('ct-err'); if (el) el.textContent = msg; }
  function clearErr()   { const el = document.getElementById('ct-err'); if (el) el.textContent = ''; }
  function fmt(iso)     { return iso ? new Date(iso).toLocaleDateString('mk-MK') : '—'; }
  function esc(s)       { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

})();
