/**
 * viewtskreq.js — View & Actions modal for Tasks and Requests
 * Call: openViewTskReq(item, type, onChanged?)
 *   item: row from 'tasks' or 'requests' table
 *   type: 'task' | 'request'
 *   onChanged: callback after any mutation
 *
 * Actions available:
 *   Tasks:     pending → in_progress → completed; archive; delete (owner only)
 *   Requests:  pending → in_progress → completed | rejected; archive; delete (creator only)
 *
 * Requires: window._sb, window._userId, window._userRole
 */
(function () {

const STYLE_ID = 'vtr-styles';

const STATUS_META = {
  pending:     { l: 'На чекање',    cls: 'vtr-st-pending',     icon: '⏳' },
  in_progress: { l: 'Во тек',       cls: 'vtr-st-inprogress',  icon: '🔄' },
  completed:   { l: 'Завршено',     cls: 'vtr-st-completed',   icon: '✅' },
  rejected:    { l: 'Одбиено',      cls: 'vtr-st-rejected',    icon: '❌' },
};

const PRIORITY_META = {
  low:    { l: 'Ниски',    cls: 'vtr-pr-low' },
  normal: { l: 'Нормален', cls: 'vtr-pr-normal' },
  high:   { l: 'Висок',    cls: 'vtr-pr-high' },
  urgent: { l: 'Итно',     cls: 'vtr-pr-urgent' },
};

const ROLE_LABEL = {
  doktor:            'Доктор',
  medicinska_sestra: 'Мед. сестра',
  fizioterapevt:     'Физиотерапевт',
  menadzer:          'Менаџер',
  glavna_sestra:     'Главна сестра',
  socijalen:         'Социјален',
};

const CAT_LABEL = {
  medical:  'Медицинско',
  admin:    'Административно',
  followup: 'Следење',
  personal: 'Лично',
  other:    'Друго',
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
#vtr-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,.68);z-index:500;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
#vtr-backdrop.open{display:flex}
#vtr-modal{background:#fff;border-radius:14px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.3);overflow:hidden}
.vtr-accent-bar{height:5px;flex-shrink:0}
.vtr-ab-task{background:linear-gradient(90deg,var(--olive),#a0a832)}
.vtr-ab-request{background:linear-gradient(90deg,#2e4a8a,#5c8adc)}
.vtr-header{padding:1.1rem 1.5rem .85rem;display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;flex-shrink:0}
.vtr-type-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem .65rem;border-radius:20px;font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
.vtr-pill-task{background:#f0f4e8;color:#4a6a10;border:1px solid #c5d88a}
.vtr-pill-req{background:#e8ecf5;color:#2e4a8a;border:1px solid #b5c5e0}
.vtr-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:.2rem;display:flex;flex-shrink:0;transition:color .15s}
.vtr-close:hover{color:var(--dark)}
.vtr-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:600;color:var(--dark);line-height:1.3;padding:0 1.5rem .75rem;flex-shrink:0}
.vtr-body{flex:1;overflow-y:auto;padding:0 1.5rem 1rem}
.vtr-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1.25rem;background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;margin-bottom:1rem}
.vtr-mf{display:flex;flex-direction:column;gap:.15rem}
.vtr-ml{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray)}
.vtr-mv{font-size:.84rem;color:var(--dark);line-height:1.4}
.vtr-status-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .55rem;border-radius:10px;font-size:.72rem;font-weight:700}
.vtr-st-pending{background:#fff3e0;color:#e65100;border:1px solid #ffa726}
.vtr-st-inprogress{background:#e3f2fd;color:#1565c0;border:1px solid #64b5f6}
.vtr-st-completed{background:#e8f5e9;color:#2e7d32;border:1px solid #81c784}
.vtr-st-rejected{background:#fce4ec;color:#c62828;border:1px solid #ef5350}
.vtr-pr-low{color:#2e7d32;font-weight:700}
.vtr-pr-normal{color:#2e4a8a;font-weight:700}
.vtr-pr-high{color:#e65100;font-weight:700}
.vtr-pr-urgent{color:#c62828;font-weight:700}
.vtr-desc-block{margin-bottom:1rem}
.vtr-desc-label{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem}
.vtr-desc-text{font-size:.87rem;color:var(--dark);line-height:1.65;white-space:pre-wrap}
.vtr-client-box{display:flex;align-items:center;gap:.65rem;padding:.65rem .85rem;background:#f0f4e8;border:1px solid #c5d88a;border-radius:8px;margin-bottom:1rem}
.vtr-client-box svg{opacity:.6;flex-shrink:0}
.vtr-client-name{font-weight:700;font-size:.87rem;color:var(--dark)}
.vtr-client-mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.vtr-client-view{margin-left:auto;font-size:.76rem;color:var(--olive);font-weight:700;cursor:pointer;background:none;border:none;padding:0;white-space:nowrap}
.vtr-client-view:hover{text-decoration:underline}
.vtr-actions{display:flex;flex-direction:column;gap:.5rem;padding:1rem 1.5rem;border-top:1px solid var(--border);flex-shrink:0;background:#faf7f2}
.vtr-actions-row{display:flex;flex-wrap:wrap;gap:.5rem}
.vtr-act-label{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);margin-bottom:.1rem}
.vtr-btn{padding:.5rem 1rem;border-radius:5px;font-family:'Lato',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.05em;cursor:pointer;border:1px solid var(--border);background:#fff;color:var(--dark);transition:all .14s;display:inline-flex;align-items:center;gap:.35rem}
.vtr-btn:hover:not(:disabled){border-color:var(--dark);background:var(--cream)}
.vtr-btn:disabled{opacity:.4;cursor:default}
.vtr-btn-inprogress{background:#e3f2fd;color:#1565c0;border-color:#64b5f6}
.vtr-btn-inprogress:hover:not(:disabled){background:#bbdefb;border-color:#1565c0}
.vtr-btn-done{background:#e8f5e9;color:#2e7d32;border-color:#81c784}
.vtr-btn-done:hover:not(:disabled){background:#c8e6c9;border-color:#2e7d32}
.vtr-btn-reject{background:#fce4ec;color:#c62828;border-color:#ef5350}
.vtr-btn-reject:hover:not(:disabled){background:#ffcdd2;border-color:#c62828}
.vtr-btn-archive{background:#f0ece2;color:#8a7a55;border-color:#d0c8b0}
.vtr-btn-archive:hover:not(:disabled){background:#e8e0cc;border-color:#8a7a55}
.vtr-btn-delete{color:#c0392b;border-color:#e0b0aa}
.vtr-btn-delete:hover:not(:disabled){background:#fce4ec;border-color:#c0392b}
.vtr-sep{width:1px;background:var(--border);align-self:stretch;margin:0 .25rem}
.vtr-toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:.55rem 1.25rem;border-radius:20px;font-size:.8rem;font-weight:600;z-index:600;animation:vtrToastIn .25s ease;pointer-events:none}
@keyframes vtrToastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.vtr-rejection-wrap{display:flex;flex-direction:column;gap:.35rem;margin-top:.5rem}
.vtr-rejection-input{font-family:'Lato',sans-serif;font-size:.84rem;border:1px solid var(--border);border-radius:6px;padding:.5rem .7rem;outline:none;resize:vertical;min-height:60px;width:100%;box-sizing:border-box}
.vtr-rejection-input:focus{border-color:#c62828}
.vtr-complete-section{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:.6rem .8rem;font-size:.77rem;color:#1b5e20;margin-bottom:.5rem}
  `;
  document.head.appendChild(s);
}

function buildHTML() {
  const d = document.createElement('div');
  d.id = 'vtr-backdrop';
  d.innerHTML = `<div id="vtr-modal" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(d);
}

let _item = null;
let _type = null; // 'task' | 'request'
let _onChanged = null;
let _showRejectInput = false;

function fmtDatetime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('mk-MK', { dateStyle: 'medium', timeStyle: 'short' });
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

async function resolveNames() {
  // Fetch creator / assignee / owner names from profiles
  if (_type === 'task') {
    const { data } = await window._sb.from('profiles').select('id,full_name,role').eq('id', _item.owner_id).single();
    _item._owner = data;
  } else {
    const ids = [_item.created_by, _item.assigned_to].filter(Boolean);
    const { data } = await window._sb.from('profiles').select('id,full_name,role').in('id', ids);
    const map = {};
    (data || []).forEach(p => { map[p.id] = p; });
    _item._creator = map[_item.created_by];
    _item._assignee = map[_item.assigned_to];
  }
  // Resolve client if needed
  if ((_item.client_id) && !_item._client) {
    const { data } = await window._sb.from('clients')
      .select('id,ime_prezime,maticen_broj,obrakanje')
      .eq('id', _item.client_id).single();
    _item._client = data;
  }
}

function renderModal() {
  const m = document.getElementById('vtr-modal');
  const s = _item.status;
  const st = STATUS_META[s] || STATUS_META.pending;
  const pr = PRIORITY_META[_item.priority] || PRIORITY_META.normal;
  const isTask = _type === 'task';
  const uid = window._userId;
  const isOwnerOrCreator = isTask ? _item.owner_id === uid : _item.created_by === uid;
  const isAssignee = !isTask && _item.assigned_to === uid;
  const isArchived = _item.archived;

  // client block
  let clientHtml = '';
  if (_item._client) {
    clientHtml = `<div class="vtr-client-box">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div>
        <div class="vtr-client-name">${esc(_item._client.obrakanje ? _item._client.obrakanje + ' ' : '') + esc(_item._client.ime_prezime)}</div>
        <div class="vtr-client-mb">${esc(_item._client.maticen_broj)}</div>
      </div>
      ${typeof openClientCard === 'function' ? `<button class="vtr-client-view" onclick="openClientCard('${_item.client_id}')">Досие →</button>` : ''}
    </div>`;
  } else if (_item.client_maticen_broj) {
    clientHtml = `<div class="vtr-client-box">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div class="vtr-client-mb">Мат. бр.: ${esc(_item.client_maticen_broj)}</div>
    </div>`;
  }

  // meta grid
  const createdAt = fmtDatetime(_item.created_at);
  const dueHtml = _item.due_datetime
    ? `<div class="vtr-mf"><div class="vtr-ml">Рок</div><div class="vtr-mv" style="color:${new Date(_item.due_datetime) < new Date() && s !== 'completed' ? '#c0392b' : 'var(--dark)'}">⏰ ${fmtDatetime(_item.due_datetime)}</div></div>`
    : '';

  let metaExtra = '';
  if (isTask) {
    metaExtra = `
      <div class="vtr-mf"><div class="vtr-ml">Категорија</div><div class="vtr-mv">${esc(CAT_LABEL[_item.category] || _item.category || '—')}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Создаден</div><div class="vtr-mv">${createdAt}</div></div>
    `;
    if (_item.completed_at) {
      metaExtra += `<div class="vtr-mf"><div class="vtr-ml">Завршено</div><div class="vtr-mv">${fmtDatetime(_item.completed_at)}</div></div>`;
    }
  } else {
    const creatorName = _item._creator ? `${esc(_item._creator.full_name)} (${esc(ROLE_LABEL[_item._creator.role] || '')})` : '—';
    const assigneeName = _item._assignee ? `${esc(_item._assignee.full_name)} (${esc(ROLE_LABEL[_item._assignee.role] || '')})` : '—';
    const rt = _item.request_type ? _item.request_type.replace(/_/g, ' ') : '—';
    metaExtra = `
      <div class="vtr-mf"><div class="vtr-ml">Тип</div><div class="vtr-mv">${esc(rt)}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Создадено</div><div class="vtr-mv">${createdAt}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Од</div><div class="vtr-mv">${creatorName}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">За</div><div class="vtr-mv">${assigneeName}</div></div>
    `;
    if (_item.completed_at) {
      metaExtra += `<div class="vtr-mf"><div class="vtr-ml">Завршено</div><div class="vtr-mv">${fmtDatetime(_item.completed_at)}</div></div>`;
    }
    if (_item.rejection_note) {
      metaExtra += `<div class="vtr-mf cc-full"><div class="vtr-ml">Причина за одбивање</div><div class="vtr-mv" style="color:#c62828">${esc(_item.rejection_note)}</div></div>`;
    }
  }

  // description
  const descHtml = _item.description
    ? `<div class="vtr-desc-block"><div class="vtr-desc-label">Детали</div><div class="vtr-desc-text">${esc(_item.description)}</div></div>`
    : '';

  // rejection input (shown conditionally)
  const rejectionHtml = _showRejectInput ? `
    <div class="vtr-rejection-wrap">
      <textarea class="vtr-rejection-input" id="vtr-reject-note" placeholder="Причина за одбивање (опционално)…"></textarea>
      <div style="display:flex;gap:.5rem">
        <button class="vtr-btn vtr-btn-reject" id="vtr-confirm-reject">Потврди одбивање</button>
        <button class="vtr-btn" id="vtr-cancel-reject">Откажи</button>
      </div>
    </div>` : '';

  // action buttons
  let actHtml = '';
  const notDone = s !== 'completed' && s !== 'rejected';

  if (!isArchived && notDone) {
    const rows = [];
    // Status progression
    if (isAssignee || isOwnerOrCreator) {
      if (s === 'pending') {
        rows.push(`<button class="vtr-btn vtr-btn-inprogress" id="vtr-btn-inprogress">🔄 Во тек</button>`);
      }
      if (s === 'pending' || s === 'in_progress') {
        rows.push(`<button class="vtr-btn vtr-btn-done" id="vtr-btn-done">✅ Заврши</button>`);
      }
    }
    if (!isTask && isAssignee && notDone && !_showRejectInput) {
      rows.push(`<button class="vtr-btn vtr-btn-reject" id="vtr-btn-reject">❌ Одбиј</button>`);
    }
    if (rows.length) {
      actHtml += `<div><div class="vtr-act-label">Смени статус</div><div class="vtr-actions-row">${rows.join('')}</div></div>`;
    }
    actHtml += rejectionHtml;
  }

  // Archive / unarchive
  if (isOwnerOrCreator) {
    const archBtn = isArchived
      ? `<button class="vtr-btn" id="vtr-btn-unarchive">📂 Врати од архива</button>`
      : `<button class="vtr-btn vtr-btn-archive" id="vtr-btn-archive">🗄 Архивирај</button>`;
    const delBtn = `<button class="vtr-btn vtr-btn-delete" id="vtr-btn-delete">🗑 Избриши</button>`;
    actHtml += `<div><div class="vtr-act-label">Управување</div><div class="vtr-actions-row">${archBtn}${delBtn}</div></div>`;
  }

  m.innerHTML = `
    <div class="vtr-accent-bar ${isTask ? 'vtr-ab-task' : 'vtr-ab-request'}"></div>
    <div class="vtr-header">
      <span class="vtr-type-pill ${isTask ? 'vtr-pill-task' : 'vtr-pill-req'}">
        ${isTask ? '✦ Задача' : '⇄ Барање'}
        ${isArchived ? ' · Архивирано' : ''}
      </span>
      <button class="vtr-close" id="vtr-close-btn" aria-label="Затвори">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="vtr-title">${esc(_item.title)}</div>
    <div class="vtr-body">
      ${clientHtml}
      <div class="vtr-meta-grid">
        <div class="vtr-mf"><div class="vtr-ml">Статус</div><div class="vtr-mv"><span class="vtr-status-badge ${st.cls}">${st.icon} ${st.l}</span></div></div>
        <div class="vtr-mf"><div class="vtr-ml">Приоритет</div><div class="vtr-mv"><span class="${pr.cls}">● ${pr.l}</span></div></div>
        ${dueHtml}
        ${metaExtra}
      </div>
      ${descHtml}
    </div>
    ${actHtml ? `<div class="vtr-actions">${actHtml}</div>` : ''}
  `;

  // Bind buttons
  document.getElementById('vtr-close-btn').addEventListener('click', closeModal);
  bindBtn('vtr-btn-inprogress', () => updateStatus('in_progress'));
  bindBtn('vtr-btn-done',       () => updateStatus('completed'));
  bindBtn('vtr-btn-reject',     () => { _showRejectInput = true; renderModal(); });
  bindBtn('vtr-btn-confirm-reject', confirmReject);
  bindBtn('vtr-cancel-reject',  () => { _showRejectInput = false; renderModal(); });
  bindBtn('vtr-btn-archive',    () => updateArchive(true));
  bindBtn('vtr-btn-unarchive',  () => updateArchive(false));
  bindBtn('vtr-btn-delete',     deleteItem);
  // Also bind confirm reject separately (rendered inside HTML)
  const confBtn = document.getElementById('vtr-confirm-reject');
  if (confBtn) confBtn.addEventListener('click', confirmReject);
  const cancBtn = document.getElementById('vtr-cancel-reject');
  if (cancBtn) cancBtn.addEventListener('click', () => { _showRejectInput = false; renderModal(); });
}

function bindBtn(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function showToast(msg) {
  const existing = document.querySelector('.vtr-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'vtr-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

async function updateStatus(newStatus) {
  const table = _type === 'task' ? 'tasks' : 'requests';
  const updates = { status: newStatus };
  if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
  const { error } = await window._sb.from(table).update(updates).eq('id', _item.id);
  if (error) { showToast('Грешка: ' + error.message); return; }
  _item.status = newStatus;
  if (newStatus === 'completed') _item.completed_at = updates.completed_at;
  _showRejectInput = false;
  showToast(newStatus === 'completed' ? '✅ Означено како завршено' : '🔄 Статусот е ажуриран');
  renderModal();
  if (typeof _onChanged === 'function') _onChanged();
}

async function confirmReject() {
  const note = (document.getElementById('vtr-reject-note') || {}).value || '';
  const { error } = await window._sb.from('requests')
    .update({ status: 'rejected', rejection_note: note || null })
    .eq('id', _item.id);
  if (error) { showToast('Грешка: ' + error.message); return; }
  _item.status = 'rejected';
  _item.rejection_note = note;
  _showRejectInput = false;
  showToast('❌ Барањето е одбиено');
  renderModal();
  if (typeof _onChanged === 'function') _onChanged();
}

async function updateArchive(archive) {
  const table = _type === 'task' ? 'tasks' : 'requests';
  const { error } = await window._sb.from(table).update({ archived: archive }).eq('id', _item.id);
  if (error) { showToast('Грешка: ' + error.message); return; }
  _item.archived = archive;
  showToast(archive ? '🗄 Архивирано' : '📂 Вратено од архива');
  renderModal();
  if (typeof _onChanged === 'function') _onChanged();
}

async function deleteItem() {
  if (!confirm(`Сигурни сте дека сакате да ја избришете оваа ${_type === 'task' ? 'задача' : 'барање'}?`)) return;
  const table = _type === 'task' ? 'tasks' : 'requests';
  const { error } = await window._sb.from(table).delete().eq('id', _item.id);
  if (error) { showToast('Грешка: ' + error.message); return; }
  showToast('🗑 Избришано');
  closeModal();
  if (typeof _onChanged === 'function') _onChanged();
}

function openModal() {
  document.getElementById('vtr-backdrop').classList.add('open');
}

function closeModal() {
  document.getElementById('vtr-backdrop').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function init() {
  injectStyles();
  buildHTML();
  document.getElementById('vtr-backdrop').addEventListener('click', e => {
    if (e.target.id === 'vtr-backdrop') closeModal();
  });
}

window.openViewTskReq = async function (item, type, onChanged) {
  _item = { ...item };
  _type = type;
  _onChanged = onChanged || null;
  _showRejectInput = false;
  if (!document.getElementById('vtr-backdrop')) init();
  openModal();
  // Show loading state
  document.getElementById('vtr-modal').innerHTML = `
    <div style="padding:3rem;text-align:center;color:var(--gray);font-size:.88rem">Се вчитува…</div>`;
  await resolveNames();
  renderModal();
};

})();
