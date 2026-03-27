/**
 * viewtskreq.js — View & Actions modal for Tasks and Requests  (v3)
 *
 * FIX: uid fetched from live Supabase session via getUid().
 *
 * Call: openViewTskReq(item, type, onChanged?)
 *   item: DB row from tasks or requests
 *   type: 'task' | 'request'
 *
 * Requires: window._sb
 */
(function(){

const STYLE_ID='vtr-styles';

const ST_META={
  pending:    {l:'На чекање', cls:'vtr-st-pending'},
  in_progress:{l:'Во тек',    cls:'vtr-st-inprogress'},
  completed:  {l:'Завршено',  cls:'vtr-st-completed'},
  rejected:   {l:'Одбиено',   cls:'vtr-st-rejected'},
};
const PR_META={
  low:   {l:'Ниски',   cls:'vtr-pr-low'},
  normal:{l:'Нормален',cls:'vtr-pr-normal'},
  high:  {l:'Висок',   cls:'vtr-pr-high'},
  urgent:{l:'Итно',    cls:'vtr-pr-urgent'},
};
const ROLE_LABEL={
  doktor:'Доктор',medicinska_sestra:'Мед. сестра',
  fizioterapevt:'Физиотерапевт',menadzer:'Менаџер',
  glavna_sestra:'Главна сестра',socijalen:'Социјален',supervizor:'Супервизор',
};
const CAT_LABEL={medical:'Медицинско',admin:'Административно',followup:'Следење',personal:'Лично',other:'Друго'};

const ICON_TASK=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 12 11 14 15 10"/></svg>`;
const ICON_REQ=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle"><path d="M5 12h14"/><path d="m15 6 6 6-6 6"/></svg>`;
const ICON_CLOCK=`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`;
const ICON_PROG=`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
const ICON_CHECK=`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_X=`<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const ICON_ARCHIVE=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
const ICON_TRASH=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
const ST_ICONS={pending:ICON_CLOCK,in_progress:ICON_PROG,completed:ICON_CHECK,rejected:ICON_X};

async function getUid(){
  if(window._userId) return window._userId;
  const{data}=await window._sb.auth.getSession();
  const uid=data?.session?.user?.id||null;
  if(uid) window._userId=uid;
  return uid;
}

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
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
.vtr-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600;color:var(--dark);line-height:1.35;padding:0 1.5rem .75rem;flex-shrink:0}
.vtr-body{flex:1;overflow-y:auto;padding:0 1.5rem 1rem}
.vtr-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem 1.25rem;background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:.85rem 1rem;margin-bottom:1rem}
.vtr-mf{display:flex;flex-direction:column;gap:.15rem}
.vtr-ml{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray)}
.vtr-mv{font-size:.84rem;color:var(--dark);line-height:1.4}
.vtr-mf-full{grid-column:1/-1}
.vtr-sb{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .55rem;border-radius:10px;font-size:.72rem;font-weight:700}
.vtr-st-pending   {background:#fff3e0;color:#e65100;border:1px solid #ffa726}
.vtr-st-inprogress{background:#e3f2fd;color:#1565c0;border:1px solid #64b5f6}
.vtr-st-completed {background:#e8f5e9;color:#2e7d32;border:1px solid #81c784}
.vtr-st-rejected  {background:#fce4ec;color:#c62828;border:1px solid #ef5350}
.vtr-pr-low   {color:#2e7d32;font-weight:700}
.vtr-pr-normal{color:#2e4a8a;font-weight:700}
.vtr-pr-high  {color:#e65100;font-weight:700}
.vtr-pr-urgent{color:#c62828;font-weight:700}
.vtr-desc-label{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);margin-bottom:.3rem}
.vtr-desc-text{font-size:.87rem;color:var(--dark);line-height:1.65;white-space:pre-wrap;margin-bottom:1rem}
.vtr-cbox{display:flex;align-items:center;gap:.65rem;padding:.65rem .85rem;background:#f0f4e8;border:1px solid #c5d88a;border-radius:8px;margin-bottom:1rem}
.vtr-cname{font-weight:700;font-size:.87rem;color:var(--dark)}
.vtr-cmb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.vtr-cview{margin-left:auto;font-size:.76rem;color:var(--olive);font-weight:700;cursor:pointer;background:none;border:none;padding:0}
.vtr-cview:hover{text-decoration:underline}
.vtr-actions{display:flex;flex-direction:column;gap:.55rem;padding:1rem 1.5rem;border-top:1px solid var(--border);flex-shrink:0;background:#faf7f2}
.vtr-arow{display:flex;flex-wrap:wrap;gap:.45rem}
.vtr-albl{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray);margin-bottom:.05rem}
.vbtn{padding:.48rem .95rem;border-radius:5px;font-family:'Lato',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;border:1px solid var(--border);background:#fff;color:var(--dark);transition:all .14s;display:inline-flex;align-items:center;gap:.35rem}
.vbtn:hover:not(:disabled){border-color:var(--dark);background:var(--cream)}
.vbtn:disabled{opacity:.4;cursor:default}
.vbtn-prog  {background:#e3f2fd;color:#1565c0;border-color:#64b5f6}
.vbtn-prog:hover:not(:disabled){background:#bbdefb;border-color:#1565c0}
.vbtn-done  {background:#e8f5e9;color:#2e7d32;border-color:#81c784}
.vbtn-done:hover:not(:disabled){background:#c8e6c9;border-color:#2e7d32}
.vbtn-rej   {background:#fce4ec;color:#c62828;border-color:#ef5350}
.vbtn-rej:hover:not(:disabled){background:#ffcdd2;border-color:#c62828}
.vbtn-arch  {background:#f0ece2;color:#8a7a55;border-color:#d0c8b0}
.vbtn-arch:hover:not(:disabled){background:#e8e0cc;border-color:#8a7a55}
.vbtn-del   {color:#c0392b;border-color:#e0b0aa}
.vbtn-del:hover:not(:disabled){background:#fce4ec;border-color:#c0392b}
.vtr-rej-wrap{display:flex;flex-direction:column;gap:.35rem}
.vtr-rej-inp{font-family:'Lato',sans-serif;font-size:.84rem;border:1px solid var(--border);border-radius:6px;padding:.5rem .7rem;outline:none;resize:vertical;min-height:56px;width:100%;box-sizing:border-box}
.vtr-rej-inp:focus{border-color:#c62828}
.vtr-toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:.5rem 1.25rem;border-radius:20px;font-size:.8rem;font-weight:600;z-index:9999;animation:vtrFadeIn .22s ease;pointer-events:none}
@keyframes vtrFadeIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  `;
  document.head.appendChild(s);
}

function buildHTML(){
  const d=document.createElement('div');
  d.id='vtr-backdrop';
  d.innerHTML=`<div id="vtr-modal" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(d);
  d.addEventListener('click',ev=>{if(ev.target.id==='vtr-backdrop')closeModal();});
}

let _item=null,_type=null,_onChanged=null,_showReject=false,_myUid=null;

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDt(dt){if(!dt)return'—';return new Date(dt).toLocaleString('mk-MK',{dateStyle:'medium',timeStyle:'short'});}

async function resolveNames(){
  if(_type==='task'&&!_item._owner){
    const{data}=await window._sb.from('profiles').select('id,full_name,role').eq('id',_item.owner_id).maybeSingle();
    _item._owner=data;
  }
  if(_type==='request'&&(!_item._creator||!_item._assignee)){
    const ids=[_item.created_by,_item.assigned_to].filter(Boolean);
    const{data}=await window._sb.from('profiles').select('id,full_name,role').in('id',ids);
    const map={};(data||[]).forEach(p=>{map[p.id]=p;});
    _item._creator =map[_item.created_by];
    _item._assignee=map[_item.assigned_to];
  }
  if(_item.client_id&&!_item._client){
    const{data}=await window._sb.from('clients')
      .select('id,ime_prezime,maticen_broj,obrakanje').eq('id',_item.client_id).maybeSingle();
    _item._client=data;
  }
}

function renderModal(){
  const m=document.getElementById('vtr-modal');
  const st=_item.status||'pending';
  const sm=ST_META[st]||ST_META.pending;
  const pm=PR_META[_item.priority]||PR_META.normal;
  const isTask=_type==='task';
  const uid=_myUid;
  const isOwner    = isTask?_item.owner_id===uid:_item.created_by===uid;
  const isAssignee = !isTask&&_item.assigned_to===uid;
  const isArchived = !!_item.archived;
  const notDone    = st!=='completed'&&st!=='rejected';

  // Client block
  let clientHtml='';
  if(_item._client){
    const cn=(_item._client.obrakanje?_item._client.obrakanje+' ':'')+_item._client.ime_prezime;
    clientHtml=`<div class="vtr-cbox">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div><div class="vtr-cname">${esc(cn)}</div><div class="vtr-cmb">${esc(_item._client.maticen_broj)}</div></div>
      ${typeof openClientCard==='function'?`<button class="vtr-cview" onclick="openClientCard('${_item.client_id}')">Досие →</button>`:''}
    </div>`;
  }else if(_item.client_maticen_broj){
    clientHtml=`<div class="vtr-cbox">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span class="vtr-cmb">Мат. бр.: ${esc(_item.client_maticen_broj)}</span>
    </div>`;
  }

  // Meta extra
  let metaExtra='';
  if(isTask){
    metaExtra=`
      <div class="vtr-mf"><div class="vtr-ml">Категорија</div><div class="vtr-mv">${esc(CAT_LABEL[_item.category]||_item.category||'—')}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Создадено</div><div class="vtr-mv">${fmtDt(_item.created_at)}</div></div>
      ${_item.completed_at?`<div class="vtr-mf"><div class="vtr-ml">Завршено</div><div class="vtr-mv">${fmtDt(_item.completed_at)}</div></div>`:''}`;
  }else{
    const cn=_item._creator?`${esc(_item._creator.full_name)} · ${esc(ROLE_LABEL[_item._creator.role]||'')}`: '—';
    const an=_item._assignee?`${esc(_item._assignee.full_name)} · ${esc(ROLE_LABEL[_item._assignee.role]||'')}`: '—';
    const rt=(_item.request_type||'').replace(/_/g,' ');
    metaExtra=`
      <div class="vtr-mf"><div class="vtr-ml">Тип</div><div class="vtr-mv">${esc(rt)||'—'}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Создадено</div><div class="vtr-mv">${fmtDt(_item.created_at)}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">Од</div><div class="vtr-mv">${cn}</div></div>
      <div class="vtr-mf"><div class="vtr-ml">За</div><div class="vtr-mv">${an}</div></div>
      ${_item.completed_at?`<div class="vtr-mf"><div class="vtr-ml">Завршено</div><div class="vtr-mv">${fmtDt(_item.completed_at)}</div></div>`:''}
      ${_item.rejection_note?`<div class="vtr-mf vtr-mf-full"><div class="vtr-ml">Причина за одбивање</div><div class="vtr-mv" style="color:#c62828">${esc(_item.rejection_note)}</div></div>`:''}`;
  }

  // Actions
  let actHtml='';
  if(!isArchived&&notDone&&(isOwner||isAssignee)){
    const btns=[];
    if(st==='pending') btns.push(`<button class="vbtn vbtn-prog" id="vbtn-prog">${ICON_PROG} Во тек</button>`);
    if(st==='pending'||st==='in_progress') btns.push(`<button class="vbtn vbtn-done" id="vbtn-done">${ICON_CHECK} Заврши</button>`);
    if(!isTask&&isAssignee&&!_showReject) btns.push(`<button class="vbtn vbtn-rej" id="vbtn-rej">${ICON_X} Одбиј</button>`);
    if(btns.length) actHtml+=`<div><div class="vtr-albl">Смени статус</div><div class="vtr-arow">${btns.join('')}</div></div>`;
  }
  if(_showReject){
    actHtml+=`<div class="vtr-rej-wrap">
      <textarea class="vtr-rej-inp" id="vtr-rej-note" placeholder="Причина за одбивање (опционално)…"></textarea>
      <div class="vtr-arow">
        <button class="vbtn vbtn-rej" id="vbtn-confirm-rej">${ICON_X} Потврди одбивање</button>
        <button class="vbtn" id="vbtn-cancel-rej">Откажи</button>
      </div>
    </div>`;
  }
  if(isOwner){
    const archBtn=isArchived
      ?`<button class="vbtn" id="vbtn-unarch">${ICON_ARCHIVE} Врати од архива</button>`
      :`<button class="vbtn vbtn-arch" id="vbtn-arch">${ICON_ARCHIVE} Архивирај</button>`;
    actHtml+=`<div><div class="vtr-albl">Управување</div><div class="vtr-arow">${archBtn}<button class="vbtn vbtn-del" id="vbtn-del">${ICON_TRASH} Избриши</button></div></div>`;
  }

  m.innerHTML=`
    <div class="vtr-accent-bar ${isTask?'vtr-ab-task':'vtr-ab-request'}"></div>
    <div class="vtr-header">
      <span class="vtr-type-pill ${isTask?'vtr-pill-task':'vtr-pill-req'}">${isTask?ICON_TASK:ICON_REQ} ${isTask?'Задача':'Барање'}${isArchived?' · Архивирано':''}</span>
      <button class="vtr-close" id="vbtn-close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="vtr-title">${esc(_item.title)}</div>
    <div class="vtr-body">
      ${clientHtml}
      <div class="vtr-meta-grid">
        <div class="vtr-mf"><div class="vtr-ml">Статус</div><div class="vtr-mv"><span class="vtr-sb ${sm.cls}">${ST_ICONS[st]||''} ${sm.l}</span></div></div>
        <div class="vtr-mf"><div class="vtr-ml">Приоритет</div><div class="vtr-mv"><span class="${pm.cls}">● ${pm.l}</span></div></div>
        ${_item.due_datetime?`<div class="vtr-mf"><div class="vtr-ml">Рок</div><div class="vtr-mv" style="color:${new Date(_item.due_datetime)<new Date()&&st!=='completed'?'#c0392b':'var(--dark)'}">${fmtDt(_item.due_datetime)}</div></div>`:''}
        ${metaExtra}
      </div>
      ${_item.description?`<div class="vtr-desc-label">Детали</div><div class="vtr-desc-text">${esc(_item.description)}</div>`:''}
    </div>
    ${actHtml?`<div class="vtr-actions">${actHtml}</div>`:''}`;

  bind('vbtn-close',       closeModal);
  bind('vbtn-prog',        ()=>updateStatus('in_progress'));
  bind('vbtn-done',        ()=>updateStatus('completed'));
  bind('vbtn-rej',         ()=>{_showReject=true;renderModal();});
  bind('vbtn-confirm-rej', confirmReject);
  bind('vbtn-cancel-rej',  ()=>{_showReject=false;renderModal();});
  bind('vbtn-arch',        ()=>updateArchive(true));
  bind('vbtn-unarch',      ()=>updateArchive(false));
  bind('vbtn-del',         deleteItem);
}

function bind(id,fn){const el=document.getElementById(id);if(el)el.addEventListener('click',fn);}

function toast(msg){
  const t=document.createElement('div');t.className='vtr-toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2300);
}

async function updateStatus(newStatus){
  const tbl=_type==='task'?'tasks':'requests';
  const up={status:newStatus};
  if(newStatus==='completed') up.completed_at=new Date().toISOString();
  const{error}=await window._sb.from(tbl).update(up).eq('id',_item.id);
  if(error){toast('Грешка: '+error.message);return;}
  Object.assign(_item,up);_showReject=false;
  toast(newStatus==='completed'?'Означено како завршено':'Статусот е ажуриран');
  renderModal();if(typeof _onChanged==='function')_onChanged();
}

async function confirmReject(){
  const note=(document.getElementById('vtr-rej-note')||{}).value||'';
  const{error}=await window._sb.from('requests').update({status:'rejected',rejection_note:note||null}).eq('id',_item.id);
  if(error){toast('Грешка: '+error.message);return;}
  _item.status='rejected';_item.rejection_note=note;_showReject=false;
  toast('Барањето е одбиено');renderModal();if(typeof _onChanged==='function')_onChanged();
}

async function updateArchive(archive){
  const tbl=_type==='task'?'tasks':'requests';
  const{error}=await window._sb.from(tbl).update({archived:archive}).eq('id',_item.id);
  if(error){toast('Грешка: '+error.message);return;}
  _item.archived=archive;
  toast(archive?'Архивирано':'Вратено од архива');renderModal();if(typeof _onChanged==='function')_onChanged();
}

async function deleteItem(){
  if(!confirm(`Сигурни сте дека сакате да ја избришете оваа ${_type==='task'?'задача':'барање'}?`)) return;
  const tbl=_type==='task'?'tasks':'requests';
  const{error}=await window._sb.from(tbl).delete().eq('id',_item.id);
  if(error){toast('Грешка: '+error.message);return;}
  toast('Избришано');closeModal();if(typeof _onChanged==='function')_onChanged();
}

function openModal(){document.getElementById('vtr-backdrop').classList.add('open');}
function closeModal(){document.getElementById('vtr-backdrop').classList.remove('open');}
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeModal();});

function init(){injectStyles();buildHTML();}

window.openViewTskReq=async function(item,type,onChanged){
  _item={...item};_type=type;_onChanged=onChanged||null;_showReject=false;
  _myUid=await getUid();
  if(!document.getElementById('vtr-backdrop')) init();
  openModal();
  document.getElementById('vtr-modal').innerHTML=`<div style="padding:3rem;text-align:center;color:var(--gray);font-size:.88rem">Се вчитува…</div>`;
  await resolveNames();
  renderModal();
};

})();
