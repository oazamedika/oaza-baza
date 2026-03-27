/**
 * new-log-fizio.js — "Нов Физиотерапевтски Запис" modal
 * Used by: fizioterapevt
 * Requires: auth-guard.js (window._sb, window._user, window._username)
 * Public API:
 *   window.openNewLogFizio(callback)
 */
(function () {

  // ══════════════════════════════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════════════════════════════
  const CSS = `<style id="nlf-styles">
#nlf-bd{display:none;position:fixed;inset:0;background:rgba(47,42,36,0.65);z-index:300;align-items:flex-start;justify-content:center;padding:1.25rem;overflow-y:auto}
#nlf-bd.open{display:flex}
#nlf-box{background:#fff;border-radius:12px;width:100%;max-width:860px;min-height:0;box-shadow:0 28px 72px rgba(0,0,0,0.24);display:flex;flex-direction:column;margin:auto}
#nlf-hdr{padding:1.1rem 1.5rem;border-bottom:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:space-between;border-radius:12px 12px 0 0;flex-shrink:0}
#nlf-title{font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:600;color:var(--dark)}
#nlf-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s}
#nlf-close:hover{color:var(--dark)}
#nlf-body{padding:1.5rem;flex:1;min-height:0}
/* Search step */
.nlf-search-wrap{max-width:520px;margin:2rem auto}
.nlf-search-hero{display:flex;align-items:center;gap:0.9rem;margin-bottom:1.25rem}
.nlf-pt-search-wrap{position:relative}
.nlf-search-icon{position:absolute;left:0.8rem;top:50%;transform:translateY(-50%);color:var(--gray);pointer-events:none;display:flex}
.nlf-search-inp{width:100%;padding:0.75rem 0.9rem 0.75rem 2.4rem;border:1.5px solid var(--border);border-radius:7px;font-family:'Lato',sans-serif;font-size:0.95rem;color:var(--dark);outline:none;box-sizing:border-box;transition:border-color 0.15s,box-shadow 0.15s}
.nlf-search-inp:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nlf-pt-dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid var(--olive);border-radius:6px;box-shadow:0 8px 28px rgba(0,0,0,0.16);z-index:400;max-height:300px;overflow-y:auto;display:none}
.nlf-pt-dd.show{display:block}
.nlf-pt-item{display:flex;align-items:center;gap:0.65rem;padding:0.65rem 1rem;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.1s}
.nlf-pt-item:last-child{border-bottom:none}.nlf-pt-item:hover{background:var(--cream)}
.nlf-pt-av{width:28px;height:28px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nlf-pt-av img{width:100%;height:100%;object-fit:cover}
.nlf-pt-name{font-weight:700;font-size:0.88rem;color:var(--dark)}
.nlf-pt-meta{font-size:0.72rem;color:var(--gray)}
/* Client bar */
.nlf-client-bar{display:flex;align-items:center;gap:0.85rem;padding:0.85rem 1.1rem;background:var(--cream);border:1px solid var(--border);border-radius:8px;margin-bottom:1.25rem}
.nlf-av{width:42px;height:42px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;flex-shrink:0;overflow:hidden}
.nlf-av img{width:100%;height:100%;object-fit:cover}
.nlf-cb-info{flex:1;min-width:0}
.nlf-cb-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)}
.nlf-cb-meta{font-size:0.75rem;color:var(--gray);margin-top:0.1rem}
.nlf-change-btn{padding:0.38rem 0.85rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s;flex-shrink:0}
.nlf-change-btn:hover{border-color:var(--dark);color:var(--dark)}
/* Form */
.nlf-lbl{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:0.25rem}
.nlf-inp,.nlf-ta{padding:0.6rem 0.75rem;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.88rem;color:var(--dark);background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;width:100%;box-sizing:border-box}
.nlf-inp:focus,.nlf-ta:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.nlf-ta{resize:vertical}
.nlf-fg{display:flex;flex-direction:column;margin-bottom:1rem}
.nlf-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem 1.5rem}
@media(max-width:640px){.nlf-grid{grid-template-columns:1fr}}
.nlf-full{grid-column:1/-1}
.nlf-sect-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin:1.1rem 0 0.6rem;border-bottom:1px solid var(--border);padding-bottom:0.35rem}
.nlf-sect-title:first-child{margin-top:0}
/* Footer */
.nlf-form-ftr{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)}
.nlf-err{font-size:0.82rem;color:#c0392b;flex:1}
.nlf-btn-prim{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.6rem;background:var(--dark);border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:0.88rem;font-weight:700;letter-spacing:0.08em;color:#fff;cursor:pointer;transition:background 0.15s}
.nlf-btn-prim:hover{background:var(--olive)}.nlf-btn-prim:disabled{opacity:0.45;pointer-events:none}
/* Fizio accent */
.nlf-accent-bar{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.85rem;background:#fdf0e0;border:1px solid #e8c890;border-radius:6px;margin-bottom:1.25rem;font-size:0.8rem;color:#c07028;font-weight:600}
/* Pain scale */
.nlf-pain-row{display:flex;gap:0.35rem;flex-wrap:wrap}
.nlf-pain-btn{width:36px;height:36px;border-radius:6px;border:1.5px solid var(--border);background:#fff;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.13s;display:flex;align-items:center;justify-content:center}
.nlf-pain-btn.active{border-color:#c07028;background:#fdf0e0;color:#c07028}
</style>`;

  const HTML = `
<div id="nlf-bd">
  <div id="nlf-box" role="dialog" aria-modal="true">
    <div id="nlf-hdr">
      <span id="nlf-title">Нов Физиотерапевтски Запис</span>
      <button id="nlf-close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="nlf-body"></div>
  </div>
</div>`;

  // ── State ──────────────────────────────────────────────────────────
  let _cb = null;
  let _client = null;
  let _ptTimer = null;
  let _injected = false;
  let _pain = null;

  // ── Inject once ────────────────────────────────────────────────────
  function inject() {
    if (_injected || document.getElementById('nlf-bd')) return;
    _injected = true;
    document.head.insertAdjacentHTML('beforeend', CSS);
    document.body.insertAdjacentHTML('beforeend', HTML);
    document.getElementById('nlf-close').addEventListener('click', close);
    document.getElementById('nlf-bd').addEventListener('click', e => { if (e.target.id === 'nlf-bd') close(); });
  }

  // ── Public API ─────────────────────────────────────────────────────
  window.openNewLogFizio = function (cb) {
    _cb = cb || null;
    inject();
    _client = null;
    _pain = null;
    showSearchStep();
    document.getElementById('nlf-bd').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function close() {
    document.getElementById('nlf-bd').classList.remove('open');
    document.body.style.overflow = '';
    if (typeof _cb === 'function') _cb();
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 1 — SEARCH (identical UX to new-log.js)
  // ══════════════════════════════════════════════════════════════════
  function showSearchStep() {
    document.getElementById('nlf-title').textContent = 'Нов Физиотерапевтски Запис';
    document.getElementById('nlf-body').innerHTML = `
      <div class="nlf-search-wrap">
        <div class="nlf-search-hero">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark)">Изберете корисник</div>
            <div style="font-size:0.8rem;color:var(--gray);margin-top:0.15rem">Пребарајте по ime, ЕМБГ или матичен број</div>
          </div>
        </div>
        <div class="nlf-pt-search-wrap">
          <div class="nlf-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input class="nlf-search-inp" id="nlf_pt_search" placeholder="Пребарај…" autocomplete="off"/>
          <div class="nlf-pt-dd" id="nlf_pt_dd"></div>
        </div>
      </div>`;
    setTimeout(() => document.getElementById('nlf_pt_search')?.focus(), 60);
    document.getElementById('nlf_pt_search').addEventListener('input', e => searchPatient(e.target.value));
    document.getElementById('nlf_pt_search').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#nlf_pt_dd .nlf-pt-item');
        if (first) first.click();
      }
    });
  }

  function searchPatient(val) {
    clearTimeout(_ptTimer);
    const dd = document.getElementById('nlf_pt_dd');
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
        empty.className = 'nlf-pt-item';
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
        item.className = 'nlf-pt-item';
        item.innerHTML = `
          <div class="nlf-pt-av">${esc((c.ime_prezime||'?').charAt(0))}</div>
          <div>
            <div class="nlf-pt-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime)}</div>
            <div class="nlf-pt-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
          </div>`;
        item.addEventListener('click', () => nlfPickPatient(c));
        dd.appendChild(item);
      });
      dd.classList.add('show');
    }, 280);
  }

  window.nlfPickPatient = async function (c) {
    const dd = document.getElementById('nlf_pt_dd');
    if (dd) dd.classList.remove('show');
    document.getElementById('nlf-body').innerHTML = `<div style="padding:3rem;text-align:center;color:var(--gray)">Се вчитува…</div>`;

    const { data: clientData } = await window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,
      floor_number,room_number,bed_number,profile_pic_url
    `).eq('id', c.id).single();

    _client = clientData;
    _pain = null;
    showForm();
  };

  window.nlfChangePatient = function () { _client = null; _pain = null; showSearchStep(); };

  // ── Pain scale picker ──────────────────────────────────────────────
  window.nlfPickPain = function (btn, val) {
    _pain = val;
    document.querySelectorAll('.nlf-pain-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };

  // ══════════════════════════════════════════════════════════════════
  //  STEP 2 — FIZIO FORM
  // ══════════════════════════════════════════════════════════════════
  function showForm() {
    const c = _client;
    const fl = c.floor_number || (window.roomToFloor ? window.roomToFloor(c.room_number) : '?');
    const loc = c.room_number ? `Соба ${c.room_number} / Кревет ${c.bed_number} · Кат ${fl}` : '—';

    const av = c.profile_pic_url
      ? `<div class="nlf-av"><img src="${esc(c.profile_pic_url)}" alt=""/></div>`
      : `<div class="nlf-av">${esc((c.ime_prezime||'?').charAt(0))}</div>`;

    const painBtns = Array.from({length:11},(_,i) =>
      `<button type="button" class="nlf-pain-btn" onclick="nlfPickPain(this,${i})">${i}</button>`
    ).join('');

    document.getElementById('nlf-title').textContent = 'Нов Физиотерапевтски Запис';
    document.getElementById('nlf-body').innerHTML = `
      <div class="nlf-client-bar">
        ${av}
        <div class="nlf-cb-info">
          <div class="nlf-cb-name">${esc(c.obrakanje ? c.obrakanje+' ' : '')}${esc(c.ime_prezime||'')}</div>
          <div class="nlf-cb-meta">${esc(c.maticen_broj||c.embg||'—')} · ${esc(loc)}</div>
        </div>
        <button class="nlf-change-btn" onclick="nlfChangePatient()">Промени корисник</button>
      </div>

      <div class="nlf-accent-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>
        Физиотерапевтски запис
      </div>

      <div class="nlf-sect-title">Состојба на корисникот</div>
      <div class="nlf-grid">
        <div class="nlf-fg nlf-full">
          <label class="nlf-lbl">Анамнеза / Тековна состојба <span style="color:#c0392b">*</span></label>
          <textarea class="nlf-ta" id="nlf_anamneza" rows="3" placeholder="Опишете ја тековната состојба, поплаки, ограничувања…"></textarea>
        </div>
        <div class="nlf-fg nlf-full">
          <label class="nlf-lbl">Болка (0 – 10)</label>
          <div class="nlf-pain-row">${painBtns}</div>
        </div>
        <div class="nlf-fg">
          <label class="nlf-lbl">Мобилност / Опсег на движење</label>
          <input class="nlf-inp" id="nlf_mobilnost" placeholder="нпр. флексија колк 80°, екстензија ограничена…"/>
        </div>
        <div class="nlf-fg">
          <label class="nlf-lbl">Мускулна сила</label>
          <input class="nlf-inp" id="nlf_sila" placeholder="нпр. МРЦ 3/5 лева рака…"/>
        </div>
      </div>

      <div class="nlf-sect-title">Спроведена терапија</div>
      <div class="nlf-grid">
        <div class="nlf-fg nlf-full">
          <label class="nlf-lbl">Процедури и техники <span style="color:#c0392b">*</span></label>
          <textarea class="nlf-ta" id="nlf_naod" rows="3" placeholder="нпр. кинезитерапија, масажа, електротерапија, вежби…"></textarea>
        </div>
        <div class="nlf-fg">
          <label class="nlf-lbl">Траење (мин)</label>
          <input class="nlf-inp" id="nlf_trajanje" type="number" placeholder="30"/>
        </div>
        <div class="nlf-fg">
          <label class="nlf-lbl">Соработка на корисникот</label>
          <select class="nlf-inp" id="nlf_sorabotka">
            <option value="">—</option>
            <option>Одлична</option>
            <option>Добра</option>
            <option>Умерена</option>
            <option>Слаба</option>
            <option>Одбива</option>
          </select>
        </div>
      </div>

      <div class="nlf-sect-title">Прогрес и план</div>
      <div class="nlf-grid">
        <div class="nlf-fg">
          <label class="nlf-lbl">Прогрес во однос на претходниот запис</label>
          <select class="nlf-inp" id="nlf_progres">
            <option value="">—</option>
            <option>Значително подобрување</option>
            <option>Умерено подобрување</option>
            <option>Без промена</option>
            <option>Влошување</option>
            <option>Прв запис</option>
          </select>
        </div>
        <div class="nlf-fg">
          <label class="nlf-lbl">Следна сесија / план</label>
          <input class="nlf-inp" id="nlf_plan" placeholder="нпр. продолжи со план / зголеми интензитет…"/>
        </div>
        <div class="nlf-fg nlf-full">
          <label class="nlf-lbl">Забелешки</label>
          <textarea class="nlf-ta" id="nlf_zabeleski" rows="2" placeholder="Дополнителни напомени…"></textarea>
        </div>
      </div>

      <div class="nlf-form-ftr">
        <span class="nlf-err" id="nlf-err"></span>
        <button class="nlf-btn-prim" id="nlf-save-btn" onclick="nlfSave()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Зачувај запис
        </button>
      </div>`;
  }

  // ── Save ───────────────────────────────────────────────────────────
  window.nlfSave = async function () {
    const errEl = document.getElementById('nlf-err');
    if (errEl) errEl.textContent = '';
    if (!_client) { if (errEl) errEl.textContent = 'Нема избран корисник.'; return; }

    function sv(id) { const v = document.getElementById(id)?.value; return (v && v.trim()) ? v.trim() : null; }

    const anamneza = sv('nlf_anamneza');
    const naod     = sv('nlf_naod');
    if (!anamneza) { if (errEl) errEl.textContent = 'Состојбата на корисникот е задолжителна.'; return; }
    if (!naod)     { if (errEl) errEl.textContent = 'Спроведената терапија е задолжителна.'; return; }

    // Build a rich naod by combining all fizio fields
    const naodParts = [naod];
    const mobilnost = sv('nlf_mobilnost'); if (mobilnost) naodParts.push(`Мобилност: ${mobilnost}`);
    const sila      = sv('nlf_sila');      if (sila)      naodParts.push(`Мускулна сила: ${sila}`);
    const trajanje  = sv('nlf_trajanje');  if (trajanje)  naodParts.push(`Траење: ${trajanje} мин`);
    const sorabotka = sv('nlf_sorabotka'); if (sorabotka) naodParts.push(`Соработка: ${sorabotka}`);
    const progres   = sv('nlf_progres');   if (progres)   naodParts.push(`Прогрес: ${progres}`);
    const plan      = sv('nlf_plan');      if (plan)      naodParts.push(`План: ${plan}`);

    const btn = document.getElementById('nlf-save-btn');
    btn.disabled = true;

    const payload = {
      client_id:   _client.id,
      created_by:  window._user.id,
      log_type:    'fizioterapevt',
      anamneza:    anamneza,
      naod:        naodParts.join('\n'),
      zabeleski:   sv('nlf_zabeleski'),
      bolka:       _pain != null ? _pain : null,
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
