/**
 * newrequest.js — New Request modal
 * Work requests from one user to another, always linked to a client.
 * Call: openNewRequest(onSaved?, prefillClientId?)
 *
 * Permissions enforced here (also must be enforced via RLS):
 *   - menadzer      → can create requests for anyone
 *   - doktor        → can create requests for nurses (medicinska_sestra) and fizioterapevt
 *   - medicinska_sestra → can create requests for doktor only
 *   - others        → cannot create requests for others (button should be hidden)
 *
 * Requires: window._sb, window._userId, window._userRole, window._username
 */
(function () {

const STYLE_ID = 'nr-styles';

// Request types grouped by target role
const RT_FOR_NURSE_FIZIO = [
  { v: 'merenje_vitali',   l: '🩺 Мерење на витали' },
  { v: 'davanje_terapija', l: '💊 Давање терапија' },
  { v: 'prevrska',         l: '🩹 Превршка / облекување рана' },
  { v: 'higijenska_nega',  l: '🛁 Хигиенска нега' },
  { v: 'mobilizacija',     l: '🦵 Мобилизација / вежби' },
  { v: 'monitoring',       l: '📊 Засилен мониторинг' },
  { v: 'uzimanje_krvi',    l: '🧪 Земање крв / примерок' },
  { v: 'kateter',          l: '🔧 Постапка со катетер' },
  { v: 'infuzija',         l: '💉 Поставување инфузија' },
  { v: 'ishrana',          l: '🍽 Исхрана / помош при оброк' },
  { v: 'transport',        l: '🚑 Транспорт на корисник' },
  { v: 'fizioterapija',    l: '🏃 Физиотерапија / рехабилитација' },
  { v: 'elektroterapija',  l: '⚡ Електротерапија' },
  { v: 'masaza',           l: '✋ Масажа' },
];

const RT_FOR_DOCTOR = [
  { v: 'pregled',              l: '🩺 Преглед на корисник' },
  { v: 'pismena_nalozi',       l: '📝 Пишување налози / рецепти' },
  { v: 'konsultacija',         l: '💬 Консултација' },
  { v: 'hronichna_terapija',   l: '💊 Промена на хронична терапија' },
  { v: 'urgentno',             l: '🚨 Итен преглед' },
  { v: 'otpushtanje',          l: '🏠 Отпуштање / откажување' },
];

const PRIORITIES = [
  { v: 'low',    l: 'Ниски',    cls: 'pr-low' },
  { v: 'normal', l: 'Нормален', cls: 'pr-normal' },
  { v: 'high',   l: 'Висок',    cls: 'pr-high' },
  { v: 'urgent', l: 'Итно',     cls: 'pr-urgent' },
];

// Role display labels
const ROLE_LABEL = {
  doktor:            'Доктор',
  medicinska_sestra: 'Медицинска сестра',
  fizioterapevt:     'Физиотерапевт',
  menadzer:          'Менаџер',
  glavna_sestra:     'Главна сестра',
  socijalen:         'Социјален работник',
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
#nr-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,.65);z-index:400;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
#nr-backdrop.open{display:flex}
#nr-modal{background:#fff;border-radius:14px;width:100%;max-width:600px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden}
.nr-header{padding:1.25rem 1.5rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.nr-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:600;color:var(--dark)}
.nr-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:.2rem;display:flex;transition:color .15s}
.nr-close:hover{color:var(--dark)}
.nr-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
.nr-footer{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:.75rem;flex-shrink:0;background:#faf7f2}
.nr-field{display:flex;flex-direction:column;gap:.35rem}
.nr-label{font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gray)}
.nr-label .req{color:#c0392b}
.nr-input,.nr-textarea,.nr-select{font-family:'Lato',sans-serif;font-size:.88rem;color:var(--dark);border:1px solid var(--border);border-radius:6px;padding:.55rem .75rem;outline:none;background:#fff;transition:border-color .15s;width:100%;box-sizing:border-box}
.nr-input:focus,.nr-textarea:focus,.nr-select:focus{border-color:var(--olive)}
.nr-textarea{resize:vertical;min-height:80px;line-height:1.55}
.nr-row2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.nr-priority-group{display:flex;gap:.45rem;flex-wrap:wrap}
.pr-btn{padding:.3rem .75rem;border-radius:20px;font-size:.72rem;font-weight:700;letter-spacing:.05em;cursor:pointer;border:2px solid transparent;transition:all .14s;background:var(--cream);color:var(--gray)}
.pr-btn.selected.pr-low{background:#e8f5e9;color:#2e7d32;border-color:#66bb6a}
.pr-btn.selected.pr-normal{background:#e8ecf5;color:#2e4a8a;border-color:#5c8adc}
.pr-btn.selected.pr-high{background:#fff3e0;color:#e65100;border-color:#ffa726}
.pr-btn.selected.pr-urgent{background:#fce4ec;color:#c62828;border-color:#ef5350}
.pr-btn:not(.selected):hover{border-color:var(--dark)}
.nr-assignee-wrap{position:relative}
.nr-client-search{position:relative}
.nr-client-dropdown,.nr-assignee-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:10;max-height:200px;overflow-y:auto}
.nr-opt{padding:.5rem .75rem;font-size:.84rem;cursor:pointer;display:flex;align-items:center;gap:.6rem;transition:background .1s}
.nr-opt:hover{background:var(--cream)}
.nr-opt .mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nr-opt .role-badge{font-size:.65rem;font-weight:700;padding:.1rem .4rem;border-radius:10px;background:var(--cream);color:var(--gray)}
.nr-selected-box{display:flex;align-items:center;gap:.5rem;padding:.45rem .75rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-size:.84rem}
.nr-selected-box .mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nr-selected-box button{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--gray);font-size:.9rem;padding:0}
.nr-hint{font-size:.73rem;color:var(--gray);font-style:italic}
.nr-info-box{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:.6rem .85rem;font-size:.78rem;color:#1b5e20;display:flex;align-items:center;gap:.5rem}
.nr-err{font-size:.75rem;color:#c0392b;font-weight:600}
.btn-cancel-r{padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;color:var(--gray);background:#fff;cursor:pointer;transition:all .15s}
.btn-cancel-r:hover{border-color:var(--dark);color:var(--dark)}
.btn-save-req{padding:.55rem 1.4rem;background:#2e4a8a;color:#fff;border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .15s}
.btn-save-req:hover:not(:disabled){background:#1a3060}
.btn-save-req:disabled{opacity:.5;cursor:default}
  `;
  document.head.appendChild(s);
}

function buildHTML() {
  const d = document.createElement('div');
  d.id = 'nr-backdrop';
  d.innerHTML = `
<div id="nr-modal" role="dialog" aria-modal="true" aria-labelledby="nr-modal-title">
  <div class="nr-header">
    <span class="nr-title" id="nr-modal-title">⇄ Нов барање</span>
    <button class="nr-close" id="nr-close-btn" aria-label="Затвори">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="nr-body" id="nr-body">

    <!-- client (required) -->
    <div class="nr-field">
      <span class="nr-label">Корисник (матичен број) <span class="req">*</span></span>
      <div id="nr-client-area"></div>
    </div>

    <!-- assigned to -->
    <div class="nr-field" id="nr-assignee-field">
      <span class="nr-label">Упатено до <span class="req">*</span></span>
      <div id="nr-assignee-area"></div>
    </div>

    <!-- request type (shown after assignee is set) -->
    <div class="nr-field" id="nr-type-field" style="display:none">
      <label class="nr-label" for="nr-req-type">Тип на барање <span class="req">*</span></label>
      <select class="nr-select" id="nr-req-type">
        <option value="">— изберете тип —</option>
      </select>
    </div>

    <!-- title -->
    <div class="nr-field">
      <label class="nr-label" for="nr-title">Наслов <span class="req">*</span></label>
      <input class="nr-input" id="nr-title" type="text" placeholder="Краток опис на барањето…" maxlength="200"/>
    </div>

    <!-- description -->
    <div class="nr-field">
      <label class="nr-label" for="nr-desc">Детали / инструкции</label>
      <textarea class="nr-textarea" id="nr-desc" placeholder="Дополнителни упатства…"></textarea>
    </div>

    <!-- priority + due -->
    <div class="nr-row2">
      <div class="nr-field">
        <span class="nr-label">Приоритет</span>
        <div class="nr-priority-group" id="nr-priority-group">
          ${PRIORITIES.map(p => `<button type="button" class="pr-btn ${p.cls}${p.v === 'normal' ? ' selected' : ''}" data-p="${p.v}">${p.l}</button>`).join('')}
        </div>
      </div>
      <div class="nr-field">
        <label class="nr-label" for="nr-due">Рок</label>
        <input class="nr-input" id="nr-due" type="datetime-local"/>
      </div>
    </div>

    <div class="nr-err" id="nr-err" style="display:none"></div>
  </div>
  <div class="nr-footer">
    <button class="btn-cancel-r" id="nr-cancel-btn">Откажи</button>
    <button class="btn-save-req" id="nr-save-btn">Испрати барање</button>
  </div>
</div>`;
  document.body.appendChild(d);
}

let _onSaved = null;
let _prefillClientId = null;
let _selectedClient = null;
let _selectedAssignee = null;
let _allClients = [];
let _eligibleAssignees = [];
let _priority = 'normal';

async function loadData() {
  // Load clients
  if (!_allClients.length) {
    const { data } = await window._sb.from('clients')
      .select('id,ime_prezime,maticen_broj,obrakanje')
      .order('maticen_broj', { ascending: true });
    _allClients = data || [];
  }
  // Load profiles for assignment dropdown
  const role = window._userRole || '';
  let targetRoles = [];
  if (role === 'menadzer' || role === 'glavna_sestra') {
    targetRoles = ['doktor', 'medicinska_sestra', 'fizioterapevt', 'socijalen', 'menadzer', 'glavna_sestra'];
  } else if (role === 'doktor') {
    targetRoles = ['medicinska_sestra', 'fizioterapevt'];
  } else if (role === 'medicinska_sestra') {
    targetRoles = ['doktor'];
  }
  if (!targetRoles.length) return;
  const { data: profiles } = await window._sb.from('profiles')
    .select('id,full_name,role,username')
    .in('role', targetRoles)
    .order('full_name', { ascending: true });
  _eligibleAssignees = profiles || [];
}

function renderClientArea() {
  const area = document.getElementById('nr-client-area');
  if (!area) return;
  if (_selectedClient) {
    area.innerHTML = `<div class="nr-selected-box">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${esc(_selectedClient.obrakanje ? _selectedClient.obrakanje + ' ' : '') + esc(_selectedClient.ime_prezime)}</span>
      <span class="mb">${esc(_selectedClient.maticen_broj)}</span>
      <button onclick="window._nrClearClient()">✕</button>
    </div>`;
  } else {
    area.innerHTML = `<div class="nr-client-search">
      <input class="nr-input" id="nr-client-q" type="text" placeholder="Пребарај по матичен број или ime…" autocomplete="off"/>
      <div class="nr-client-dropdown" id="nr-client-dd" style="display:none"></div>
    </div>`;
    document.getElementById('nr-client-q').addEventListener('input', onClientSearch);
  }
}

window._nrClearClient = function () { _selectedClient = null; renderClientArea(); };

function onClientSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const dd = document.getElementById('nr-client-dd');
  if (!q) { dd.style.display = 'none'; return; }
  const matches = _allClients.filter(c =>
    (c.maticen_broj || '').toLowerCase().includes(q) ||
    (c.ime_prezime || '').toLowerCase().includes(q)
  ).slice(0, 8);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map(c =>
    `<div class="nr-opt" data-cid="${c.id}">
      <span class="mb">${esc(c.maticen_broj)}</span>
      <span>${esc(c.obrakanje ? c.obrakanje + ' ' : '') + esc(c.ime_prezime)}</span>
    </div>`).join('');
  dd.style.display = 'block';
  dd.querySelectorAll('.nr-opt').forEach(el => {
    el.addEventListener('click', () => {
      _selectedClient = _allClients.find(c => c.id === el.dataset.cid);
      renderClientArea();
    });
  });
}

function renderAssigneeArea() {
  const area = document.getElementById('nr-assignee-area');
  if (!area) return;
  if (_selectedAssignee) {
    area.innerHTML = `<div class="nr-selected-box">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${esc(_selectedAssignee.full_name)}</span>
      <span class="role-badge">${esc(ROLE_LABEL[_selectedAssignee.role] || _selectedAssignee.role)}</span>
      <button onclick="window._nrClearAssignee()">✕</button>
    </div>`;
    updateRequestTypeDropdown();
  } else {
    // If only doctors in list and role is nurse → auto-pick first
    const role = window._userRole || '';
    if (role === 'medicinska_sestra' && _eligibleAssignees.length === 1) {
      _selectedAssignee = _eligibleAssignees[0];
      renderAssigneeArea();
      return;
    }
    area.innerHTML = `<div class="nr-assignee-wrap">
      <input class="nr-input" id="nr-assignee-q" type="text" placeholder="Пребарај по ime…" autocomplete="off"/>
      <div class="nr-assignee-dropdown" id="nr-assignee-dd" style="display:none"></div>
    </div>`;
    document.getElementById('nr-assignee-q').addEventListener('input', onAssigneeSearch);
  }
}

window._nrClearAssignee = function () {
  _selectedAssignee = null;
  document.getElementById('nr-type-field').style.display = 'none';
  renderAssigneeArea();
};

function onAssigneeSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const dd = document.getElementById('nr-assignee-dd');
  if (!q) { dd.style.display = 'none'; return; }
  const matches = _eligibleAssignees.filter(p =>
    (p.full_name || '').toLowerCase().includes(q) ||
    (p.username || '').toLowerCase().includes(q)
  ).slice(0, 8);
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map(p =>
    `<div class="nr-opt" data-pid="${p.id}">
      <span>${esc(p.full_name)}</span>
      <span class="role-badge">${esc(ROLE_LABEL[p.role] || p.role)}</span>
    </div>`).join('');
  dd.style.display = 'block';
  dd.querySelectorAll('.nr-opt').forEach(el => {
    el.addEventListener('click', () => {
      _selectedAssignee = _eligibleAssignees.find(p => p.id === el.dataset.pid);
      renderAssigneeArea();
    });
  });
}

function updateRequestTypeDropdown() {
  const tf = document.getElementById('nr-type-field');
  const sel = document.getElementById('nr-req-type');
  if (!_selectedAssignee) { tf.style.display = 'none'; return; }

  let types = [];
  const r = _selectedAssignee.role;
  if (r === 'medicinska_sestra' || r === 'fizioterapevt') types = RT_FOR_NURSE_FIZIO;
  else if (r === 'doktor') types = RT_FOR_DOCTOR;

  if (!types.length) { tf.style.display = 'none'; return; }

  // Filter for fizioterapevt — only physio-relevant types
  if (r === 'fizioterapevt') {
    types = RT_FOR_NURSE_FIZIO.filter(t =>
      ['mobilizacija', 'fizioterapija', 'elektroterapija', 'masaza', 'monitoring'].includes(t.v)
    );
  }

  sel.innerHTML = `<option value="">— изберете тип —</option>` +
    types.map(t => `<option value="${t.v}">${t.l}</option>`).join('');
  tf.style.display = 'flex';
}

function showErr(msg) {
  const el = document.getElementById('nr-err');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

async function save() {
  if (!_selectedClient) { showErr('Изберете корисник (матичен број).'); return; }
  if (!_selectedAssignee) { showErr('Изберете на кого е упатено барањето.'); return; }
  const type = document.getElementById('nr-req-type').value;
  if (!type) { showErr('Изберете тип на барање.'); return; }
  const title = document.getElementById('nr-title').value.trim();
  if (!title) { showErr('Насловот е задолжителен.'); document.getElementById('nr-title').focus(); return; }

  const due = document.getElementById('nr-due').value;
  const desc = document.getElementById('nr-desc').value.trim();

  const btn = document.getElementById('nr-save-btn');
  btn.disabled = true; btn.textContent = 'Испраќање…';

  const row = {
    created_by: window._userId,
    assigned_to: _selectedAssignee.id,
    client_id: _selectedClient.id,
    client_maticen_broj: _selectedClient.maticen_broj,
    request_type: type,
    title,
    description: desc || null,
    priority: _priority,
    due_datetime: due || null,
    status: 'pending',
    archived: false,
  };

  const { error } = await window._sb.from('requests').insert(row);
  if (error) {
    showErr('Грешка: ' + error.message);
    btn.disabled = false; btn.textContent = 'Испрати барање';
    return;
  }
  closeModal();
  if (typeof _onSaved === 'function') _onSaved();
}

function openModal() {
  document.getElementById('nr-backdrop').classList.add('open');
  _selectedClient = null;
  _selectedAssignee = null;
  _priority = 'normal';
  document.getElementById('nr-title').value = '';
  document.getElementById('nr-desc').value = '';
  document.getElementById('nr-due').value = '';
  document.getElementById('nr-type-field').style.display = 'none';
  document.querySelectorAll('.pr-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.p === 'normal');
  });
  showErr('');

  // Pre-fill client if provided
  if (_prefillClientId) {
    _selectedClient = _allClients.find(c => c.id === _prefillClientId) || null;
  }
  renderClientArea();
  renderAssigneeArea();
}

function closeModal() {
  document.getElementById('nr-backdrop').classList.remove('open');
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function init() {
  injectStyles();
  buildHTML();
  document.getElementById('nr-close-btn').addEventListener('click', closeModal);
  document.getElementById('nr-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('nr-backdrop').addEventListener('click', e => { if (e.target.id === 'nr-backdrop') closeModal(); });
  document.getElementById('nr-save-btn').addEventListener('click', save);
  document.getElementById('nr-priority-group').addEventListener('click', e => {
    const btn = e.target.closest('.pr-btn');
    if (!btn) return;
    _priority = btn.dataset.p;
    document.querySelectorAll('#nr-priority-group .pr-btn').forEach(b => b.classList.toggle('selected', b === btn));
  });
  loadData();
}

window.openNewRequest = function (onSaved, prefillClientId) {
  _onSaved = onSaved || null;
  _prefillClientId = prefillClientId || null;
  if (!document.getElementById('nr-backdrop')) init();
  else loadData(); // refresh profiles each time
  openModal();
};

})();
