/**
 * newrequest.js — New Request modal  (v3 FIXED)
 *
 * FIX: uid fetched from live Supabase session, not window._userId.
 *
 * FLOW:
 *   1. Client picker (required, search by maticen broj / name)
 *   2. Target ROLE dropdown (which role should handle this?)
 *      → filters the person dropdown in step 3
 *   3. Assignee dropdown (people with that role, loaded from profiles)
 *   4. Request type dropdown (filtered by assignee role)
 *   5. Title, description, priority, due date
 *
 * Permissions:
 *   menadzer / glavna_sestra → can assign to any role
 *   doktor                  → can assign to medicinska_sestra, fizioterapevt,
 *                             socijalen, supervizor (NOT menadzer/glavna_sestra)
 *   medicinska_sestra       → can assign to doktor only
 *   others                  → button is hidden, modal won't open
 *
 * Call: openNewRequest(onSaved?, prefillClientId?)
 * Requires: window._sb
 */
(function(){

/* ── Request types by target role ─────────────────────── */
const RT = {
  medicinska_sestra: [
    {v:'merenje_vitali',   l:'Мерење на витали'},
    {v:'davanje_terapija', l:'Давање терапија'},
    {v:'prevrska',         l:'Превршка / облекување рана'},
    {v:'higijenska_nega',  l:'Хигиенска нега'},
    {v:'mobilizacija',     l:'Мобилизација / вежби'},
    {v:'monitoring',       l:'Засилен мониторинг'},
    {v:'uzimanje_krvi',    l:'Земање крв / примерок'},
    {v:'kateter',          l:'Постапка со катетер'},
    {v:'infuzija',         l:'Поставување инфузија'},
    {v:'ishrana',          l:'Исхрана / помош при оброк'},
    {v:'transport',        l:'Транспорт на корисник'},
  ],
  fizioterapevt: [
    {v:'fizioterapija',   l:'Физиотерапија / рехабилитација'},
    {v:'elektroterapija', l:'Електротерапија'},
    {v:'masaza',          l:'Масажа'},
    {v:'mobilizacija',    l:'Мобилизација / вежби'},
    {v:'monitoring',      l:'Засилен мониторинг'},
  ],
  doktor: [
    {v:'pregled',           l:'Преглед на корисник'},
    {v:'pismena_nalozi',    l:'Пишување налози / рецепти'},
    {v:'konsultacija',      l:'Консултација'},
    {v:'hronichna_terapija',l:'Промена на хронична терапија'},
    {v:'urgentno',          l:'Итен преглед'},
    {v:'otpushtanje',       l:'Отпуштање / откажување'},
  ],
  socijalen: [
    {v:'socijalna_poseta',  l:'Социјална посета'},
    {v:'dokumentacija',     l:'Документација'},
    {v:'konsultacija',      l:'Консултација'},
    {v:'kontakt_srodstvo',  l:'Контакт со сродство'},
  ],
  supervizor: [
    {v:'supervizija_nega',  l:'Супервизија на нега'},
    {v:'higijenska_nega',   l:'Хигиенска нега'},
    {v:'monitoring',        l:'Засилен мониторинг'},
  ],
  menadzer: [
    {v:'administrativno',   l:'Административна задача'},
    {v:'organizacisko',     l:'Организациска задача'},
    {v:'konsultacija',      l:'Консултација'},
  ],
  glavna_sestra: [
    {v:'organizacisko',     l:'Организациска задача'},
    {v:'nadzor',            l:'Надзор'},
    {v:'konsultacija',      l:'Консултација'},
  ],
};

const ROLE_LABEL = {
  doktor:            'Доктор',
  medicinska_sestra: 'Медицинска сестра',
  fizioterapevt:     'Физиотерапевт',
  menadzer:          'Менаџер',
  glavna_sestra:     'Главна сестра',
  socijalen:         'Социјален работник',
  supervizor:        'Супервизор за нега',
};

const PRIORITIES = [
  {v:'low',   l:'Ниски',   cls:'pr-low'},
  {v:'normal',l:'Нормален',cls:'pr-normal'},
  {v:'high',  l:'Висок',   cls:'pr-high'},
  {v:'urgent',l:'Итно',    cls:'pr-urgent'},
];

/* ── Derive my role from session email ────────────────── */
function emailToRole(email){
  const e=(email||'').toLowerCase();
  if(e.startsWith('doktor'))             return 'doktor';
  if(e.startsWith('fizioterapevt'))      return 'fizioterapevt';
  if(e.startsWith('glavnasestra'))       return 'glavna_sestra';
  if(e.startsWith('menadzer'))           return 'menadzer';
  if(e.startsWith('socijalonrabotnik'))  return 'socijalen';
  if(e.startsWith('supervizornega'))     return 'supervizor';
  return 'other';
}

async function getSessionInfo(){
  const{data}=await window._sb.auth.getSession();
  const user=data?.session?.user;
  if(!user) return{uid:null,role:'other'};
  const uid=user.id;
  // cache
  if(uid) window._userId=uid;
  const role=emailToRole(user.email||'');
  if(role) window._userRole=role;
  return{uid,role};
}

/* Which target roles am I allowed to assign to? */
function getAllowedTargetRoles(myRole){
  switch(myRole){
    case 'menadzer':
    case 'glavna_sestra':
      return['doktor','medicinska_sestra','fizioterapevt','socijalen','supervizor','menadzer','glavna_sestra'];
    case 'doktor':
      return['medicinska_sestra','fizioterapevt','socijalen','supervizor'];
    case 'medicinska_sestra':
      return['doktor'];
    default:
      return[];
  }
}

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ── Styles ───────────────────────────────────────────── */
function injectStyles(){
  if(document.getElementById('nr-styles')) return;
  const s=document.createElement('style');
  s.id='nr-styles';
  s.textContent=`
#nr-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,.65);z-index:400;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
#nr-backdrop.open{display:flex}
#nr-modal{background:#fff;border-radius:14px;width:100%;max-width:600px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden}
.nr-header{padding:1.25rem 1.5rem 1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.nr-title{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:600;color:var(--dark);display:flex;align-items:center;gap:.4rem}
.nr-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:.2rem;display:flex;transition:color .15s}
.nr-close:hover{color:var(--dark)}
.nr-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem}
.nr-footer{padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:.75rem;flex-shrink:0;background:#faf7f2}
.nr-field{display:flex;flex-direction:column;gap:.35rem}
.nr-label{font-size:.67rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gray)}
.req{color:#c0392b}
.nr-input,.nr-textarea,.nr-select{font-family:'Lato',sans-serif;font-size:.88rem;color:var(--dark);border:1px solid var(--border);border-radius:6px;padding:.55rem .75rem;outline:none;background:#fff;transition:border-color .15s;width:100%;box-sizing:border-box}
.nr-input:focus,.nr-textarea:focus,.nr-select:focus{border-color:var(--olive)}
.nr-textarea{resize:vertical;min-height:80px;line-height:1.55}
.nr-row2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.nr-priority-group{display:flex;gap:.45rem;flex-wrap:wrap}
.pr-btn{padding:.3rem .75rem;border-radius:20px;font-size:.72rem;font-weight:700;cursor:pointer;border:2px solid transparent;transition:all .14s;background:var(--cream);color:var(--gray)}
.pr-btn.selected.pr-low   {background:#e8f5e9;color:#2e7d32;border-color:#66bb6a}
.pr-btn.selected.pr-normal{background:#e8ecf5;color:#2e4a8a;border-color:#5c8adc}
.pr-btn.selected.pr-high  {background:#fff3e0;color:#e65100;border-color:#ffa726}
.pr-btn.selected.pr-urgent{background:#fce4ec;color:#c62828;border-color:#ef5350}
.pr-btn:not(.selected):hover{border-color:var(--dark)}
.nr-dd-wrap{position:relative}
.nr-dd-list{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:20;max-height:200px;overflow-y:auto;display:none}
.nr-opt{padding:.5rem .75rem;font-size:.84rem;cursor:pointer;display:flex;align-items:center;gap:.6rem;transition:background .1s}
.nr-opt:hover{background:var(--cream)}
.nr-opt .nr-mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nr-opt .nr-role-tag{font-size:.65rem;font-weight:700;padding:.1rem .4rem;border-radius:8px;background:#e8ecf5;color:#2e4a8a;flex-shrink:0}
.nr-sel-box{display:flex;align-items:center;gap:.5rem;padding:.45rem .75rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-size:.84rem}
.nr-sel-box .nr-mb{font-family:monospace;font-size:.75rem;color:var(--olive);font-weight:700}
.nr-sel-box .nr-role-tag{font-size:.65rem;font-weight:700;padding:.1rem .4rem;border-radius:8px;background:#e8ecf5;color:#2e4a8a}
.nr-sel-box button{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--gray);font-size:1rem;padding:0;line-height:1}
.nr-sel-box button:hover{color:var(--dark)}
.nr-err{font-size:.75rem;color:#c0392b;font-weight:600;background:#fce4ec;padding:.45rem .7rem;border-radius:5px;border:1px solid #efb0b0}
.btn-cancel-r{padding:.55rem 1.1rem;border:1px solid var(--border);border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;color:var(--gray);background:#fff;cursor:pointer;transition:all .15s}
.btn-cancel-r:hover{border-color:var(--dark);color:var(--dark)}
.btn-save-req{padding:.55rem 1.4rem;background:#2e4a8a;color:#fff;border:none;border-radius:5px;font-family:'Lato',sans-serif;font-size:.8rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .15s}
.btn-save-req:hover:not(:disabled){background:#1a3060}
.btn-save-req:disabled{opacity:.5;cursor:default}
  `;
  document.head.appendChild(s);
}

/* ── HTML ─────────────────────────────────────────────── */
function buildHTML(){
  const d=document.createElement('div');
  d.id='nr-backdrop';
  d.innerHTML=`
<div id="nr-modal" role="dialog" aria-modal="true">
  <div class="nr-header">
    <span class="nr-title">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/><path d="m15 6 6 6-6 6"/></svg>
      Ново барање
    </span>
    <button class="nr-close" id="nr-close-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="nr-body">

    <!-- 1. Client -->
    <div class="nr-field">
      <span class="nr-label">Корисник (матичен број) <span class="req">*</span></span>
      <div id="nr-client-area"></div>
    </div>

    <!-- 2. Target role dropdown -->
    <div class="nr-field">
      <label class="nr-label" for="nr-role-sel">Упати до (улога) <span class="req">*</span></label>
      <select class="nr-select" id="nr-role-sel">
        <option value="">— изберете улога —</option>
      </select>
    </div>

    <!-- 3. Specific person dropdown (shown after role is chosen) -->
    <div class="nr-field" id="nr-person-field" style="display:none">
      <label class="nr-label" for="nr-person-sel">Конкретна личност <span class="req">*</span></label>
      <select class="nr-select" id="nr-person-sel">
        <option value="">— изберете личност —</option>
      </select>
    </div>

    <!-- 4. Request type (shown after role is chosen) -->
    <div class="nr-field" id="nr-type-field" style="display:none">
      <label class="nr-label" for="nr-req-type">Тип на барање <span class="req">*</span></label>
      <select class="nr-select" id="nr-req-type">
        <option value="">— изберете тип —</option>
      </select>
    </div>

    <!-- 5. Title -->
    <div class="nr-field">
      <label class="nr-label" for="nr-title">Наслов <span class="req">*</span></label>
      <input class="nr-input" id="nr-title" type="text" placeholder="Краток опис на барањето…" maxlength="200"/>
    </div>

    <!-- 6. Description -->
    <div class="nr-field">
      <label class="nr-label" for="nr-desc">Детали / инструкции</label>
      <textarea class="nr-textarea" id="nr-desc" placeholder="Дополнителни упатства…"></textarea>
    </div>

    <!-- 7. Priority + due -->
    <div class="nr-row2">
      <div class="nr-field">
        <span class="nr-label">Приоритет</span>
        <div class="nr-priority-group" id="nr-priority-group">
          ${PRIORITIES.map(p=>`<button type="button" class="pr-btn ${p.cls}${p.v==='normal'?' selected':''}" data-p="${p.v}">${p.l}</button>`).join('')}
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

/* ── State ────────────────────────────────────────────── */
let _onSaved          = null;
let _prefillClientId  = null;
let _selectedClient   = null;
let _allClients       = [];
let _allProfiles      = [];  // all profiles from DB
let _myUid            = null;
let _myRole           = 'other';
let _allowedRoles     = [];
let _priority         = 'normal';

/* ── Data loading ─────────────────────────────────────── */
async function loadData(){
  const{uid,role}=await getSessionInfo();
  _myUid=uid; _myRole=role;
  _allowedRoles=getAllowedTargetRoles(role);

  // Load clients
  if(!_allClients.length){
    const{data}=await window._sb.from('clients')
      .select('id,ime_prezime,maticen_broj,obrakanje')
      .order('maticen_broj',{ascending:true});
    _allClients=data||[];
  }

  // Load all profiles (for person dropdown)
  // profiles must have: id (= auth.users.id), full_name, role or email
  const{data:profiles}=await window._sb.from('profiles')
    .select('id,full_name,role,email')
    .order('full_name',{ascending:true});
  _allProfiles=(profiles||[]).filter(p=>p.id!==_myUid);
}

/* ── Role dropdown population ─────────────────────────── */
function populateRoleDropdown(){
  const sel=document.getElementById('nr-role-sel');
  if(!sel) return;
  sel.innerHTML='<option value="">— изберете улога —</option>'+
    _allowedRoles.map(r=>`<option value="${r}">${esc(ROLE_LABEL[r]||r)}</option>`).join('');
}

/* ── When role changes ────────────────────────────────── */
function onRoleChange(){
  const role=document.getElementById('nr-role-sel').value;
  const personField=document.getElementById('nr-person-field');
  const typeField=document.getElementById('nr-type-field');
  const personSel=document.getElementById('nr-person-sel');
  const typeSel=document.getElementById('nr-req-type');

  if(!role){
    personField.style.display='none';
    typeField.style.display='none';
    return;
  }

  // Populate person dropdown — people with this role
  const people=_allProfiles.filter(p=>{
    const r=p.role||emailToRole(p.email||'');
    return r===role;
  });

  personSel.innerHTML='<option value="">— изберете личност —</option>'+
    people.map(p=>`<option value="${p.id}">${esc(p.full_name)}</option>`).join('');
  personField.style.display= people.length>0 ? 'flex' : 'none';

  // Populate request type dropdown
  const types=RT[role]||[{v:'drugo',l:'Друго'}];
  typeSel.innerHTML='<option value="">— изберете тип —</option>'+
    types.map(t=>`<option value="${t.v}">${esc(t.l)}</option>`).join('');
  typeField.style.display='flex';
}

/* ── Client picker ────────────────────────────────────── */
function renderClientArea(){
  const area=document.getElementById('nr-client-area');
  if(!area) return;
  if(_selectedClient){
    area.innerHTML=`<div class="nr-sel-box">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>${esc((_selectedClient.obrakanje?_selectedClient.obrakanje+' ':'')+_selectedClient.ime_prezime)}</span>
      <span class="nr-mb">${esc(_selectedClient.maticen_broj)}</span>
      <button onclick="window._nrClearClient()">✕</button>
    </div>`;
  }else{
    area.innerHTML=`<div class="nr-dd-wrap">
      <input class="nr-input" id="nr-client-q" type="text" placeholder="Пребарај по матичен број или ime…" autocomplete="off"/>
      <div class="nr-dd-list" id="nr-client-dd"></div>
    </div>`;
    document.getElementById('nr-client-q').addEventListener('input',onClientSearch);
  }
}
window._nrClearClient=function(){_selectedClient=null;renderClientArea();};

function onClientSearch(ev){
  const q=ev.target.value.toLowerCase().trim();
  const dd=document.getElementById('nr-client-dd');
  if(!q){dd.style.display='none';return;}
  const matches=_allClients.filter(c=>
    (c.maticen_broj||'').toLowerCase().includes(q)||(c.ime_prezime||'').toLowerCase().includes(q)
  ).slice(0,8);
  if(!matches.length){dd.style.display='none';return;}
  dd.innerHTML=matches.map(c=>`<div class="nr-opt" data-cid="${c.id}">
    <span class="nr-mb">${esc(c.maticen_broj)}</span>
    <span>${esc((c.obrakanje?c.obrakanje+' ':'')+c.ime_prezime)}</span>
  </div>`).join('');
  dd.style.display='block';
  dd.querySelectorAll('.nr-opt').forEach(el=>{
    el.addEventListener('click',()=>{
      _selectedClient=_allClients.find(c=>c.id===el.dataset.cid)||null;
      renderClientArea();
    });
  });
}

/* ── Error helper ─────────────────────────────────────── */
function showErr(msg){
  const el=document.getElementById('nr-err');
  if(!el) return;
  el.textContent=msg; el.style.display=msg?'block':'none';
}

/* ── Save ─────────────────────────────────────────────── */
async function save(){
  if(!_selectedClient){showErr('Изберете корисник.');return;}

  const role=document.getElementById('nr-role-sel').value;
  if(!role){showErr('Изберете улога.');return;}

  const personId=document.getElementById('nr-person-sel').value;
  if(!personId){showErr('Изберете конкретна личност.');return;}

  const type=document.getElementById('nr-req-type').value;
  if(!type){showErr('Изберете тип на барање.');return;}

  const title=document.getElementById('nr-title').value.trim();
  if(!title){showErr('Насловот е задолжителен.');document.getElementById('nr-title').focus();return;}

  // get uid from session
  const uid=_myUid||(await getSessionInfo()).uid;
  if(!uid){showErr('Грешка: не е пронајдена активна сесија. Одјавете се и најавете повторно.');return;}

  const btn=document.getElementById('nr-save-btn');
  btn.disabled=true; btn.textContent='Испраќање…';

  const row={
    created_by:          uid,
    assigned_to:         personId,
    client_id:           _selectedClient.id,
    client_maticen_broj: _selectedClient.maticen_broj,
    request_type:        type,
    title,
    description:         document.getElementById('nr-desc').value.trim()||null,
    priority:            _priority,
    due_datetime:        document.getElementById('nr-due').value||null,
    status:              'pending',
    archived:            false,
  };

  const{error}=await window._sb.from('requests').insert(row);
  if(error){
    showErr('Грешка: '+error.message);
    btn.disabled=false; btn.textContent='Испрати барање';
    return;
  }
  closeModal();
  if(typeof _onSaved==='function') _onSaved();
}

/* ── Modal lifecycle ──────────────────────────────────── */
function reset(){
  _selectedClient=null; _priority='normal';
  ['nr-title','nr-desc','nr-due'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const roleSel=document.getElementById('nr-role-sel');if(roleSel)roleSel.value='';
  const personSel=document.getElementById('nr-person-sel');if(personSel)personSel.value='';
  const typeSel=document.getElementById('nr-req-type');if(typeSel)typeSel.value='';
  const pf=document.getElementById('nr-person-field');if(pf)pf.style.display='none';
  const tf=document.getElementById('nr-type-field');if(tf)tf.style.display='none';
  document.querySelectorAll('#nr-priority-group .pr-btn').forEach(b=>b.classList.toggle('selected',b.dataset.p==='normal'));
  showErr('');
}

function openModal(){
  document.getElementById('nr-backdrop').classList.add('open');
  reset();
  populateRoleDropdown();
  if(_prefillClientId){
    _selectedClient=_allClients.find(c=>c.id===_prefillClientId)||null;
  }
  renderClientArea();
}

function closeModal(){document.getElementById('nr-backdrop').classList.remove('open');}

function init(){
  injectStyles(); buildHTML();
  document.getElementById('nr-close-btn').addEventListener('click',closeModal);
  document.getElementById('nr-cancel-btn').addEventListener('click',closeModal);
  document.getElementById('nr-backdrop').addEventListener('click',ev=>{if(ev.target.id==='nr-backdrop')closeModal();});
  document.getElementById('nr-save-btn').addEventListener('click',save);
  document.getElementById('nr-role-sel').addEventListener('change',onRoleChange);
  document.getElementById('nr-priority-group').addEventListener('click',ev=>{
    const btn=ev.target.closest('.pr-btn');if(!btn)return;
    _priority=btn.dataset.p;
    document.querySelectorAll('#nr-priority-group .pr-btn').forEach(b=>b.classList.toggle('selected',b===btn));
  });
  document.addEventListener('click',ev=>{
    if(!ev.target.closest('.nr-dd-wrap')){const dd=document.getElementById('nr-client-dd');if(dd)dd.style.display='none';}
  });
}

window.openNewRequest=async function(onSaved,prefillClientId){
  _onSaved=onSaved||null;
  _prefillClientId=prefillClientId||null;
  if(!document.getElementById('nr-backdrop')) init();
  await loadData();
  openModal();
};

})();
