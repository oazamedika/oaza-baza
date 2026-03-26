/**
 * newtask.js — New Task modal
 * Opens a modal to create a personal task (optionally linked to a client).
 * Call: openNewTask(onSaved?)
 * Requires: window._sb, window._username, window._userId (from auth-guard.js)
 */
(function () {

const STYLE_ID = 'nt-styles';
const CATEGORIES = [
  { v: 'medical',  l: 'Медицинско' },
  { v: 'admin',    l: 'Административно' },
  { v: 'followup', l: 'Следење' },
  { v: 'personal', l: 'Лично' },
  { v: 'other',    l: 'Друго' },
];
const PRIORITIES = [
  { v: 'low',    l: 'Ниски',   cls: 'pr-low' },
  { v: 'normal', l: 'Нормален',cls: 'pr-normal' },
  { v: 'high',   l: 'Висок',   cls: 'pr-high' },
  { v: 'urgent', l: 'Итно',    cls: 'pr-urgent' },
];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
#nt-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,.65);z-index:400;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
#nt-backdrop.open{display:flex}
#nt-modal{background:#fff;border-radius:14px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden}
.nt-header{padding:1.25rem 1.5rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.nt-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:600;color:var(--dark)}
.nt-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:.2rem;display:flex;transition:color .15s}
.nt-close:hover{color:var(--dark)}
.nt-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
.nt-footer{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:.75rem;flex-shrink:0;background:#faf7f2}
.nt-field{display:flex;flex-direction:column;gap:.35rem}
.nt-label{font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gray)}
.nt-label .req{color:#c0392b}
.nt-input,.nt-textarea,.nt-select{font-family:'Lato',sans-serif;font-size:.88rem;color:var(--dark);border:1px solid var(--border);border-radius:6px;padding:.55rem .75rem;outline:none;background:#fff;transition:border-color .15s;width:100%;box-sizing:border-box}
.nt-input:focus,.nt-textarea:focus,.nt-select:focus{border-color:var(--olive)}
.nt-textarea{resize:vertical;min-height:80px;line-height:1.55}
.nt-row2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.nt-priority-group{display:flex;gap:.45rem;flex-wrap:wrap}
.pr-btn{padding:.3rem .75rem;border-radius:20px;font-size:.72rem;font-weight:700;letter-spacing:.05em;cursor:pointer;border:2px solid transparent;transition:all .14s;background:var(--cream);color:var(--gray)}
.pr-btn.selected.pr-low{background:#e8f5e9;color:#2e7d32;border-color:#66bb6a}
.pr-btn.selected.pr-normal{background:#e8ecf5;color:#2e4a8a;border-color:#5c8adc}
.pr-btn.selected.pr-high{background:#fff3e0;color:#e65100;border-color:#ffa726}
.pr-btn.selected.pr-urgent{background:#fce4ec;color:#c62828;border-color:#ef5350}
.pr-btn:not(.selected):hover{border-color:var(--dark)}
.nt-client-search{position:relative}
.nt-client-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:10;max-height:180px;overflow-y:auto}
.nt-client-opt{padding:.5rem .75rem;font-size:.84rem;cursor:pointer;display:flex;align-items:center;gap:.6rem;transition:background .1s}
.nt-client-opt:hover{background:var(--cream)}
.nt-client-opt .mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nt-client-clear{position:absolute;right:.6rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--gray);font-size:1rem;line-height:1;padding:0}
.nt-client-clear:hover{color:var(--dark)}
.nt-selected-client{display:flex;align-items:center;gap:.5rem;padding:.45rem .75rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-size:.84rem}
.nt-selected-client .mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nt-selected-client button{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--gray);font-size:.9rem;padding:0}
.nt-hint{font-size:.73rem;color:var(--gray);font-style:italic}
.btn-cancel{padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;color:var(--gray);background:#fff;cursor:pointer;transition:all .15s}
.btn-cancel:hover{border-color:var(--dark);color:var(--dark)}
.btn-save-task{padding:.55rem 1.4rem;background:var(--dark);color:#fff;border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .15s}
.btn-save-task:hover:not(:disabled){background:var(--olive)}
.btn-save-task:disabled{opacity:.5;cursor:default}
.nt-err{font-size:.75rem;color:#c0392b;font-weight:600}
  `;
  document.head.appendChild(s);
}

function buildHTML() {
  const d = document.createElement('div');
  d.id = 'nt-backdrop';
  d.innerHTML = `
<div id="nt-modal" role="dialog" aria-modal="true" aria-labelledby="nt-modal-title">
  <div class="nt-header">
    <span class="nt-title" id="nt-modal-title">✦ Нова задача</span>
    <button class="nt-close" id="nt-close-btn" aria-label="Затвори">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="nt-body" id="nt-body">
    <!-- title -->
    <div class="nt-field">
      <label class="nt-label" for="nt-title">Наслов <span class="req">*</span></label>
      <input class="nt-input" id="nt-title" type="text" placeholder="Опис на задачата…" maxlength="200"/>
    </div>
    <!-- description -->
    <div class="nt-field">
      <label class="nt-label" for="nt-desc">Детали</label>
      <textarea class="nt-textarea" id="nt-desc" placeholder="Дополнителни белешки…"></textarea>
    </div>
    <!-- priority -->
    <div class="nt-field">
      <span class="nt-label">Приоритет</span>
      <div class="nt-priority-group" id="nt-priority-group">
        ${PRIORITIES.map(p=>`<button type="button" class="pr-btn ${p.cls}${p.v==='normal'?' selected':''}" data-p="${p.v}">${p.l}</button>`).join('')}
      </div>
    </div>
    <!-- due + category -->
    <div class="nt-row2">
      <div class="nt-field">
        <label class="nt-label" for="nt-due">Рок</label>
        <input class="nt-input" id="nt-due" type="datetime-local"/>
      </div>
      <div class="nt-field">
        <label class="nt-label" for="nt-cat">Категорија</label>
        <select class="nt-select" id="nt-cat">
          <option value="">— изберете —</option>
          ${CATEGORIES.map(c=>`<option value="${c.v}">${c.l}</option>`).join('')}
        </select>
      </div>
    </div>
    <!-- reminder -->
    <div class="nt-field">
      <label class="nt-label" for="nt-reminder">Потсетник (опционално)</label>
      <input class="nt-input" id="nt-reminder" type="datetime-local"/>
      <span class="nt-hint">Ќе се покаже во вашиот дашборд пред рокот.</span>
    </div>
    <!-- client link -->
    <div class="nt-field">
      <span class="nt-label">Поврзан корисник (опционално)</span>
      <div id="nt-client-area"></div>
    </div>
    <!-- error -->
    <div class="nt-err" id="nt-err" style="display:none"></div>
  </div>
  <div class="nt-footer">
    <button class="btn-cancel" id="nt-cancel-btn">Откажи</button>
    <button class="btn-save-task" id="nt-save-btn">Зачувај задача</button>
  </div>
</div>`;
  document.body.appendChild(d);
}

let _onSaved = null;
let _selectedClient = null;
let _allClients = [];
let _priority = 'normal';

async function loadClients() {
  if (_allClients.length) return;
  const { data } = await window._sb.from('clients')
    .select('id,ime_prezime,maticen_broj,obrakanje')
    .order('maticen_broj', { ascending: true });
  _allClients = data || [];
}

function renderClientArea() {
  const area = document.getElementById('nt-client-area');
  if (!area) return;
  if (_selectedClient) {
    area.innerHTML = `<div class="nt-selected-client">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${esc(_selectedClient.obrakanje ? _selectedClient.obrakanje + ' ' : '') + esc(_selectedClient.ime_prezime)}</span>
      <span class="mb">${esc(_selectedClient.maticen_broj)}</span>
      <button onclick="window._ntClearClient()">✕</button>
    </div>`;
  } else {
    area.innerHTML = `<div class="nt-client-search">
      <input class="nt-input" id="nt-client-q" type="text" placeholder="Пребарај по матичен број или ime…" autocomplete="off"/>
      <div class="nt-client-dropdown" id="nt-client-dd" style="display:none"></div>
    </div>`;
    document.getElementById('nt-client-q').addEventListener('input', onClientSearch);
  }
}

window._ntClearClient = function () {
  _selectedClient = null;
  renderClientArea();
};

function onClientSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const dd = document.getElementById('nt-client-dd');
  if (!q) { dd.style.display = 'none'; return; }
  const matches = _allClients.filter(c =>
    (c.maticen_broj || '').toLowerCase().includes(q) ||
    (c.ime_prezime || '').toLowerCase().includes(q)
  ).slice(0, 8);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map(c => `
    <div class="nt-client-opt" data-cid="${c.id}">
      <span class="mb">${esc(c.maticen_broj)}</span>
      <span>${esc(c.obrakanje ? c.obrakanje + ' ' : '') + esc(c.ime_prezime)}</span>
    </div>`).join('');
  dd.style.display = 'block';
  dd.querySelectorAll('.nt-client-opt').forEach(el => {
    el.addEventListener('click', () => {
      _selectedClient = _allClients.find(c => c.id === el.dataset.cid);
      renderClientArea();
    });
  });
}

function showErr(msg) {
  const el = document.getElementById('nt-err');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

async function save() {
  const title = document.getElementById('nt-title').value.trim();
  if (!title) { showErr('Насловот е задолжителен.'); document.getElementById('nt-title').focus(); return; }

  const due = document.getElementById('nt-due').value;
  const reminder = document.getElementById('nt-reminder').value;
  const cat = document.getElementById('nt-cat').value;
  const desc = document.getElementById('nt-desc').value.trim();

  const btn = document.getElementById('nt-save-btn');
  btn.disabled = true; btn.textContent = 'Зачувување…';

  const row = {
    owner_id: window._userId,
    title,
    description: desc || null,
    priority: _priority,
    due_datetime: due || null,
    reminder_at: reminder || null,
    category: cat || null,
    client_id: _selectedClient ? _selectedClient.id : null,
    client_maticen_broj: _selectedClient ? _selectedClient.maticen_broj : null,
    status: 'pending',
    archived: false,
  };

  const { error } = await window._sb.from('tasks').insert(row);
  if (error) {
    showErr('Грешка: ' + error.message);
    btn.disabled = false; btn.textContent = 'Зачувај задача';
    return;
  }
  closeModal();
  if (typeof _onSaved === 'function') _onSaved();
}

function openModal() {
  document.getElementById('nt-backdrop').classList.add('open');
  // reset
  _selectedClient = null;
  _priority = 'normal';
  document.getElementById('nt-title').value = '';
  document.getElementById('nt-desc').value = '';
  document.getElementById('nt-due').value = '';
  document.getElementById('nt-reminder').value = '';
  document.getElementById('nt-cat').value = '';
  document.querySelectorAll('.pr-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.p === 'normal');
  });
  showErr('');
  renderClientArea();
  document.getElementById('nt-title').focus();
}

function closeModal() {
  document.getElementById('nt-backdrop').classList.remove('open');
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function init() {
  injectStyles();
  buildHTML();
  document.getElementById('nt-close-btn').addEventListener('click', closeModal);
  document.getElementById('nt-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('nt-backdrop').addEventListener('click', e => { if (e.target.id === 'nt-backdrop') closeModal(); });
  document.getElementById('nt-save-btn').addEventListener('click', save);
  document.getElementById('nt-priority-group').addEventListener('click', e => {
    const btn = e.target.closest('.pr-btn');
    if (!btn) return;
    _priority = btn.dataset.p;
    document.querySelectorAll('.pr-btn').forEach(b => b.classList.toggle('selected', b === btn));
  });
  loadClients();
}

window.openNewTask = function (onSaved) {
  _onSaved = onSaved || null;
  if (!document.getElementById('nt-backdrop')) init();
  openModal();
};

})();
