/**
 * client-card.js  — REVAMPED v2 (schema-aligned)
 * Shared client view modal — include on any protected page.
 * Call: openClientCard(clientId)
 * Requires: auth-guard.js (window._sb, window._username)
 */

(function(){

// ── Styles ────────────────────────────────────────────────────────────
const STYLE = `
<style id="cc-styles">
#cc-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,0.65);z-index:200;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px)}
#cc-backdrop.open{display:flex}
#cc-modal{background:#fff;border-radius:14px;width:100%;max-width:1060px;max-height:95vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden}
#cc-header{padding:1.25rem 1.5rem 0;background:#fff;flex-shrink:0}
.cc-hero{display:flex;align-items:flex-start;gap:1.1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.cc-avatar{width:60px;height:60px;border-radius:50%;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;flex-shrink:0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12)}
.cc-avatar img{width:100%;height:100%;object-fit:cover}
.cc-hero-info{flex:1;min-width:0}
.cc-hero-row1{display:flex;align-items:center;justify-content:space-between;gap:0.75rem}
.cc-name{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:600;color:var(--dark);line-height:1.2}
.cc-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s;flex-shrink:0}
.cc-close:hover{color:var(--dark)}
.cc-hero-badges{display:flex;align-items:center;flex-wrap:wrap;gap:0.3rem;margin-top:0.35rem}
.cc-hbadge{display:inline-flex;align-items:center;gap:0.3rem;padding:0.2rem 0.6rem;background:var(--cream);border:1px solid var(--border);border-radius:20px;font-size:0.77rem;font-weight:600;color:var(--dark)}
.cc-hbadge.green{background:#e6f4ec;border-color:#b5d5c0;color:#2a6e3a}
.cc-dot{width:4px;height:4px;border-radius:50%;background:var(--gray);opacity:0.4;margin:0 0.2rem;flex-shrink:0}
.cc-hero-pills{display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.45rem}
.cc-pill{display:inline-flex;align-items:center;gap:0.25rem;padding:0.18rem 0.6rem;border-radius:10px;background:var(--cream);border:1px solid var(--border);font-size:0.74rem;color:var(--dark)}
.cc-pill-lbl{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);margin-right:0.1rem}
.cc-tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin-top:0.85rem}
.cc-tab{padding:0.65rem 1.1rem;font-family:'Lato',sans-serif;font-size:0.79rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s;background:none;border-top:none;border-left:none;border-right:none;white-space:nowrap}
.cc-tab.active{color:var(--olive);border-bottom-color:var(--olive)}
#cc-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem}
.cc-section{margin-bottom:1.5rem}
.cc-section-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem 1.5rem}
.cc-field{display:flex;flex-direction:column;gap:0.1rem}
.cc-label{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.cc-value{font-size:0.88rem;color:var(--dark);line-height:1.5}
.cc-full{grid-column:1/-1}
.cc-empty{text-align:center;padding:2rem;color:var(--gray);font-size:0.85rem}
.cc-edit-btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.4rem 0.8rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.cc-edit-btn:hover{border-color:var(--olive);color:var(--olive)}
.dosie-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start}
@media(max-width:720px){.dosie-layout{grid-template-columns:1fr}}
.vitals-view-tabs{display:flex;gap:0.3rem;margin-bottom:0.75rem}
.vtab{padding:0.28rem 0.8rem;font-size:0.72rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:var(--cream);color:var(--gray);transition:all 0.15s;display:inline-flex;align-items:center;gap:0.3rem}
.vtab.active{background:var(--olive);color:#fff;border-color:var(--olive)}
.vitals-chart-wrap{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:0.75rem}
.vpills{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.6rem}
.vpill{padding:0.2rem 0.6rem;font-size:0.7rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:#fff;color:var(--gray);transition:all 0.15s}
.vpill.active{background:var(--olive);color:#fff;border-color:var(--olive)}
.chart-canvas-wrap{position:relative;height:155px}
.chart-canvas-wrap canvas{display:block}
.chart-note{font-size:0.71rem;color:var(--gray);text-align:right;margin-top:0.3rem}
.vitals-list-wrap{border:1px solid var(--border);border-radius:6px;overflow:hidden;max-height:300px;overflow-y:auto}
.vitals-list{display:flex;flex-direction:column}
.vl-row{display:grid;grid-template-columns:1.4fr repeat(8,1fr);gap:0;align-items:center;padding:0.38rem 0.6rem;border-bottom:1px solid var(--border);font-size:0.75rem}
.vl-row:last-child{border-bottom:none}
.vl-row.hdr{background:var(--cream);font-size:0.64rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);position:sticky;top:0;z-index:1}
.vl-cell{text-align:center}
.vl-cell.date{text-align:left;color:var(--gray);font-size:0.73rem}
.vl-cell.has{color:var(--dark);font-weight:600}
.vl-cell.empty{color:#ccc}
.therapy-tbl{width:100%;border-collapse:collapse;font-size:0.83rem}
.therapy-tbl th{text-align:left;font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);padding:0.4rem 0.65rem;border-bottom:2px solid var(--border)}
.therapy-tbl td{padding:0.5rem 0.65rem;border-bottom:1px solid var(--border);vertical-align:middle}
.therapy-tbl tr:last-child td{border-bottom:none}
.badge-cc{display:inline-block;padding:0.12rem 0.45rem;border-radius:20px;font-size:0.64rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase}
.badge-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.badge-stopped{background:#f0ece2;color:#8a7a55}
.diag-list{display:flex;flex-direction:column;gap:0.35rem}
.diag-item{display:flex;align-items:center;gap:0.65rem;padding:0.45rem 0.7rem;background:var(--cream);border:1px solid var(--border);border-radius:4px}
.diag-kod{font-family:monospace;font-size:0.8rem;font-weight:700;color:var(--olive);flex-shrink:0}
.diag-opis{font-size:0.83rem}
.request-box{background:var(--cream);border:1px dashed var(--border);border-radius:8px;padding:1.25rem 1rem;text-align:center;color:var(--gray);font-size:0.81rem;margin-bottom:1.25rem}
.request-box svg{opacity:0.25;margin-bottom:0.5rem;display:block;margin-inline:auto}
.logs-filter-row{display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem}
.logs-month-sel{padding:0.38rem 0.7rem;border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.82rem;background:#fff;color:var(--dark);cursor:pointer;outline:none}
.log-entry{padding:0.85rem;border:1px solid var(--border);border-radius:6px;margin-bottom:0.65rem}
.le-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.45rem;flex-wrap:wrap;gap:0.3rem}
.le-diag{font-family:monospace;font-size:0.81rem;font-weight:700;color:var(--olive)}
.le-date{font-size:0.71rem;color:var(--gray)}
.le-type{display:inline-block;padding:0.1rem 0.42rem;border-radius:10px;font-size:0.63rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-left:0.35rem}
.le-type-doctor{background:#e8ecf5;color:#2e4a8a}
.le-type-social{background:#e8f0e8;color:#3a6e3a}
.le-type-other{background:#f0ece2;color:#8a7a55}
.le-field{margin-top:0.35rem}
.le-fl{font-size:0.63rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray)}
.le-fv{font-size:0.82rem;color:var(--dark);line-height:1.5}
.vital-chips{display:flex;flex-wrap:wrap;gap:0.35rem 0.9rem;padding:0.55rem 0.75rem;background:var(--cream);border-radius:5px;border:1px solid var(--border);margin:0.35rem 0}
.vc{font-size:0.8rem;color:var(--dark)}.vc span{font-weight:700}
.cc-btn-outline{display:block;width:100%;padding:0.55rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.81rem;font-weight:700;color:var(--gray);cursor:pointer;text-align:center;transition:background 0.15s;margin-top:0.5rem}
.cc-btn-outline:hover{background:var(--cream2,#f0ece2)}
.cc-btn-olive{background:var(--olive)!important;color:#fff!important;border-color:var(--olive)!important}
.cc-btn-olive:hover{opacity:0.88}
.srodstvo-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;padding:0.6rem 0.8rem;background:var(--cream);border:1px solid var(--border);border-radius:5px;font-size:0.84rem;margin-bottom:0.4rem}
.overflow-note{font-size:0.77rem;color:var(--gray);text-align:center;padding:0.5rem;background:var(--cream);border-radius:4px;margin-top:0.5rem;border:1px solid var(--border)}
</style>`;

// ── DOM ────────────────────────────────────────────────────────────────
function injectDOM(){
  if(document.getElementById('cc-backdrop'))return;
  document.head.insertAdjacentHTML('beforeend',STYLE);
  document.body.insertAdjacentHTML('beforeend',`
  <div id="cc-backdrop">
    <div id="cc-modal" role="dialog" aria-modal="true">
      <div id="cc-header">
        <div class="cc-hero">
          <div class="cc-avatar" id="cc-avatar">?</div>
          <div class="cc-hero-info">
            <div class="cc-hero-row1">
              <div class="cc-name" id="cc-name">…</div>
              <button class="cc-close" id="cc-close">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="cc-hero-badges" id="cc-hero-badges"></div>
            <div class="cc-hero-pills" id="cc-hero-pills"></div>
          </div>
        </div>
        <div class="cc-tabs">
          <button class="cc-tab" data-tab="social">Социјално досие</button>
          <button class="cc-tab active" data-tab="dosie">Медицинско досие</button>
          <button class="cc-tab" data-tab="logs">Записи</button>
          <button class="cc-tab" data-tab="info">Лични податоци</button>
        </div>
      </div>
      <div id="cc-body"><div class="cc-empty">Се вчитува…</div></div>
    </div>
  </div>`);

  document.getElementById('cc-close').addEventListener('click', closeClientCard);
  document.getElementById('cc-backdrop').addEventListener('click', ev => {
    if(ev.target===document.getElementById('cc-backdrop')) closeClientCard();
  });
  document.querySelectorAll('.cc-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab);
    });
  });
}

// ── State ──────────────────────────────────────────────────────────────
let _client=null, _therapy=[], _logs=[], _vitals=[], _srodstvo=[];
let _logsMonth=null;
let _vitalsView='chart';
let _activeParam='puls';
const LOGS_MAX=50;

// ── Helpers ────────────────────────────────────────────────────────────
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function ageFromEmbg(embg){
  if(!embg||String(embg).length<7)return null;
  const d=String(embg).padStart(13,'0');
  const day=parseInt(d.slice(0,2),10);
  const mon=parseInt(d.slice(2,4),10)-1;
  let yr=parseInt(d.slice(4,7),10);
  if(yr<100) yr+=2000; else yr+=1900;
  try{
    const bd=new Date(yr,mon,day);
    if(isNaN(bd.getTime()))return null;
    const today=new Date();
    let age=today.getFullYear()-bd.getFullYear();
    if(today.getMonth()<mon||(today.getMonth()===mon&&today.getDate()<day))age--;
    return(age>0&&age<130)?age:null;
  }catch{return null;}
}

function fmtDate(ts){return ts?new Date(ts).toLocaleDateString('mk-MK'):'—';}
function fmtDateTime(ts){return ts?new Date(ts).toLocaleString('mk-MK'):'—';}

function isPrivileged(){const u=(window._username||'').toLowerCase();return u==='menadzer'||u==='glavnasestra';}
function isDoctor(){return(window._username||'').toLowerCase()==='doktor';}
function canSeeAll(){return isPrivileged()||isDoctor();}

// ── Open ────────────────────────────────────────────────────────────────
window.openClientCard = async function(clientId){
  injectDOM();
  _logsMonth=null; _vitalsView='chart'; _activeParam='puls';
  document.getElementById('cc-body').innerHTML='<div class="cc-empty">Се вчитува…</div>';
  document.getElementById('cc-hero-badges').innerHTML='';
  document.getElementById('cc-hero-pills').innerHTML='';
  document.getElementById('cc-name').textContent='…';
  const av=document.getElementById('cc-avatar');
  av.innerHTML=''; av.textContent='?';
  document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.cc-tab[data-tab="dosie"]').classList.add('active');
  document.getElementById('cc-backdrop').classList.add('open');
  document.body.style.overflow='hidden';

  const [clientRes,therapyRes,logsRes,vitalsRes,srodRes]=await Promise.all([
    window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,licna_karta_broj,
      adresa,telefon,floor_number,room_number,bed_number,
      profile_pic_url,status,created_at,updated_at,
      social_notes,social_completed_at,
      doctor_notes,doctor_completed_at,
      priem_dijagnoza_kod,priem_dijagnoza_opis,
      priem_anamneza,priem_naod,priem_notes,
      priem_kp_sistolicen,priem_kp_dijastolicen,priem_puls,
      priem_temperatura,priem_spo2,priem_respiracii,
      priem_tezina,priem_seker,priem_bolka,
      client_chronic_diagnoses(id,kod,opis,added_at)
    `).eq('id',clientId).single(),

    window._sb.from('client_chronic_therapy')
      .select('id,drug_name,dosage,active,added_at,stopped_at')
      .eq('client_id',clientId).order('added_at',{ascending:false}),

    window._sb.from('client_logs')
      .select('id,created_at,log_type,dijagnoza_kod,dijagnoza_opis,anamneza,naod,parenteralna,kp_sistolicen,kp_dijastolicen,puls,temperatura,spo2,respiracii,tezina,seker,bolka')
      .eq('client_id',clientId).order('created_at',{ascending:false}).limit(LOGS_MAX+1),

    window._sb.from('client_logs')
      .select('created_at,kp_sistolicen,kp_dijastolicen,puls,temperatura,spo2,respiracii,tezina,seker,bolka')
      .eq('client_id',clientId).order('created_at',{ascending:false}).limit(25),

    window._sb.from('client_srodstvo')
      .select('id,ime_prezime,adresa,telefon').eq('client_id',clientId),
  ]);

  _client   = clientRes.data;
  _therapy  = therapyRes.data||[];
  _logs     = logsRes.data||[];
  _vitals   = (vitalsRes.data||[]).filter(v=>
    v.kp_sistolicen||v.puls||v.temperatura||v.spo2||v.respiracii||v.tezina||v.seker||v.bolka!=null
  );
  _srodstvo = srodRes.data||[];

  if(!_client){
    document.getElementById('cc-body').innerHTML='<div class="cc-empty">Корисникот не е пронајден.</div>';
    return;
  }

  const c=_client;

  // Avatar
  const avEl=document.getElementById('cc-avatar');
  if(c.profile_pic_url){
    avEl.innerHTML=`<img src="${e(c.profile_pic_url)}" alt="">`;
  }else{
    avEl.textContent=(c.ime_prezime||'?').charAt(0).toUpperCase();
  }

  // Name
  document.getElementById('cc-name').textContent=(c.obrakanje?c.obrakanje+' ':'')+(c.ime_prezime||'');

  // Badges
  const age=ageFromEmbg(c.embg);
  const fl=c.floor_number||(window.roomToFloor?window.roomToFloor(c.room_number):null);
  const bp=[];
  if(age!==null) bp.push(`<span class="cc-hbadge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>${age} год</span>`);
  if(c.room_number){
    if(bp.length)bp.push('<span class="cc-dot"></span>');
    bp.push(`<span class="cc-hbadge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Соба ${c.room_number} / Кревет ${c.bed_number}</span>`);
  }
  if(fl){bp.push('<span class="cc-dot"></span>');bp.push(`<span class="cc-hbadge">Кат ${fl}</span>`);}
  if(c.status&&c.status!=='draft'){bp.push('<span class="cc-dot"></span>');bp.push(`<span class="cc-hbadge green">${e(c.status)}</span>`);}
  document.getElementById('cc-hero-badges').innerHTML=bp.join('');

  // Pills
  const pp=[];
  if(c.maticen_broj)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Мат.</span>${e(c.maticen_broj)}</span>`);
  if(c.telefon)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Тел.</span>${e(c.telefon)}</span>`);
  if(c.adresa)pp.push(`<span class="cc-pill"><span class="cc-pill-lbl">Адреса</span>${e(c.adresa)}</span>`);
  document.getElementById('cc-hero-pills').innerHTML=pp.join('');

  renderTab('dosie');
};

window.closeClientCard=function(){
  const bd=document.getElementById('cc-backdrop');
  if(bd)bd.classList.remove('open');
  document.body.style.overflow='';
};

// ── Tab router ─────────────────────────────────────────────────────────
function renderTab(tab){
  const body=document.getElementById('cc-body');
  if(tab==='social')     body.innerHTML=renderSocial();
  else if(tab==='dosie') {body.innerHTML=renderDosie();scheduleChart();}
  else if(tab==='logs')  {body.innerHTML=renderLogs();bindLogsFilter();}
  else if(tab==='info')  body.innerHTML=renderInfo();
}
window._ccTab=renderTab;

// ══════════════════════════════════════════════════════════════════════
// Социјално досие
// ══════════════════════════════════════════════════════════════════════
function renderSocial(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Уреди</button>`:'';

  const hasSocial=c.social_notes||c.social_completed_at;
  const socialHtml=hasSocial?`
    <div class="cc-grid">
      ${c.social_notes?`<div class="cc-field cc-full"><div class="cc-label">Белешки</div><div class="cc-value">${e(c.social_notes)}</div></div>`:''}
      ${c.social_completed_at?`<div class="cc-field"><div class="cc-label">Комплетирано на</div><div class="cc-value">${fmtDate(c.social_completed_at)}</div></div>`:''}
    </div>`
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесени социјални информации.</div>';

  const srodHtml=_srodstvo.length
    ?_srodstvo.map(s=>`<div class="srodstvo-row">
        <div><div class="cc-label">Ime и Презиме</div><div>${e(s.ime_prezime||'—')}</div></div>
        <div><div class="cc-label">Адреса</div><div>${e(s.adresa||'—')}</div></div>
        <div><div class="cc-label">Телефон</div><div>${e(s.telefon||'—')}</div></div>
      </div>`).join('')
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесено сродство.</div>';

  return`
  <div class="cc-section">
    <div class="cc-section-title"><span>Социјално досие</span>${editBtn}</div>
    ${socialHtml}
  </div>
  <div class="cc-section">
    <div class="cc-section-title"><span>Сродство / Контакт лица</span></div>
    ${srodHtml}
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// Медицинско досие
// ══════════════════════════════════════════════════════════════════════
function renderDosie(){
  if(!canSeeAll())return'<div class="cc-empty">Немате пристап до медицинското досие.</div>';
  const c=_client;
  const active=_therapy.filter(t=>t.active);
  const stopped=_therapy.filter(t=>!t.active);
  const diags=c.client_chronic_diagnoses||[];

  const leftCol=`<div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Витални знаци</span></div>
      ${renderVitalsWidget()}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронична терапија</span></div>
      ${!active.length?'<div class="cc-empty" style="padding:0.5rem">Нема активна терапија.</div>'
        :`<table class="therapy-tbl"><thead><tr><th>Лек</th><th>Доза</th><th>Додадена</th><th>Статус</th></tr></thead>
          <tbody>${active.map(t=>`<tr><td style="font-weight:700">${e(t.drug_name)}</td><td>${e(t.dosage)}</td><td>${fmtDate(t.added_at)}</td><td><span class="badge-cc badge-active">Активна</span></td></tr>`).join('')}</tbody>
          </table>`}
      ${stopped.length?`<details style="margin-top:0.65rem"><summary style="cursor:pointer;font-size:0.78rem;color:var(--olive);font-weight:700">Стопирана терапија (${stopped.length})</summary>
        <table class="therapy-tbl" style="margin-top:0.5rem"><thead><tr><th>Лек</th><th>Доза</th><th>Стопирана</th></tr></thead>
        <tbody>${stopped.map(t=>`<tr style="opacity:0.55;text-decoration:line-through"><td>${e(t.drug_name)}</td><td>${e(t.dosage)}</td><td>${fmtDate(t.stopped_at)}</td></tr>`).join('')}</tbody>
        </table></details>`:''}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронични дијагнози</span></div>
      ${!diags.length?'<div class="cc-empty" style="padding:0.5rem">Нема хронични дијагнози.</div>'
        :`<div class="diag-list">${diags.map(d=>`<div class="diag-item"><span class="diag-kod">${e(d.kod)}</span><span class="diag-opis">${e(d.opis||'—')}</span></div>`).join('')}</div>`}
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Дијагноза на прием</span></div>
      ${c.priem_dijagnoza_kod?`<div style="display:flex;align-items:center;gap:0.7rem;margin-bottom:0.6rem">
        <span style="font-family:monospace;font-size:0.95rem;font-weight:700;color:var(--olive)">${e(c.priem_dijagnoza_kod)}</span>
        <span style="font-size:0.87rem">${e(c.priem_dijagnoza_opis||'')}</span></div>`
        :'<div class="cc-empty" style="padding:0.4rem">Нема внесена дијагноза.</div>'}
      ${renderAdmissionVitals(c)}
      ${c.priem_anamneza?`<div class="cc-field" style="margin-top:0.5rem"><div class="cc-label">Анамнеза</div><div class="cc-value">${e(c.priem_anamneza)}</div></div>`:''}
      ${c.priem_naod?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Наод</div><div class="cc-value">${e(c.priem_naod)}</div></div>`:''}
      ${c.priem_notes?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Белешки на прием</div><div class="cc-value">${e(c.priem_notes)}</div></div>`:''}
      ${c.doctor_notes?`<div class="cc-field" style="margin-top:0.4rem"><div class="cc-label">Белешки на доктор</div><div class="cc-value">${e(c.doctor_notes)}</div></div>`:''}
    </div>
  </div>`;

  const miniLogs=_logs.slice(0,3);
  const rightCol=`<div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Барања и задачи</span></div>
      <div class="request-box">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h8M8 16h5"/></svg>
        Поврзано со модулот за задачи — наскоро
      </div>
    </div>
    <div class="cc-section">
      <div class="cc-section-title"><span>Последни записи</span></div>
      ${miniLogs.length?miniLogs.map(l=>renderLogEntry(l)).join(''):'<div class="cc-empty" style="padding:0.5rem">Нема записи.</div>'}
      ${_logs.length?`<button class="cc-btn-outline cc-btn-olive" onclick="document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));document.querySelector('.cc-tab[data-tab=\\'logs\\']').classList.add('active');window._ccTab('logs')">Отвори ги сите записи →</button>`:''}
    </div>
  </div>`;

  return`<div class="dosie-layout">${leftCol}${rightCol}</div>`;
}

function renderAdmissionVitals(c){
  const chips=[];
  if(c.priem_kp_sistolicen&&c.priem_kp_dijastolicen)chips.push(`КП: <span>${c.priem_kp_sistolicen}/${c.priem_kp_dijastolicen} mmHg</span>`);
  if(c.priem_puls)        chips.push(`Пулс: <span>${c.priem_puls} bpm</span>`);
  if(c.priem_temperatura) chips.push(`Т°: <span>${c.priem_temperatura}°C</span>`);
  if(c.priem_spo2)        chips.push(`SpO2: <span>${c.priem_spo2}%</span>`);
  if(c.priem_respiracii)  chips.push(`Респ: <span>${c.priem_respiracii}/мин</span>`);
  if(c.priem_tezina)      chips.push(`Тежина: <span>${c.priem_tezina} kg</span>`);
  if(c.priem_seker)       chips.push(`Шеќер: <span>${c.priem_seker} mmol/L</span>`);
  if(c.priem_bolka!=null) chips.push(`Болка: <span>${c.priem_bolka}/10</span>`);
  if(!chips.length)return'';
  return`<div class="vital-chips">${chips.map(ch=>`<div class="vc">${ch}</div>`).join('')}</div>`;
}

// ── Vitals widget ──────────────────────────────────────────────────────
const PARAMS=[
  {key:'puls',       label:'Пулс',   unit:'bpm',    color:'#e07a27',field:'puls'},
  {key:'kp',         label:'КП',     unit:'mmHg',   color:'#e05252',field:'kp_sistolicen'},
  {key:'temperatura',label:'Т°',     unit:'°C',     color:'#d4a017',field:'temperatura'},
  {key:'spo2',       label:'SpO2',   unit:'%',      color:'#2e8a5a',field:'spo2'},
  {key:'respiracii', label:'Респ',   unit:'/мин',   color:'#2e6ba8',field:'respiracii'},
  {key:'tezina',     label:'Тежина', unit:'kg',     color:'#7a4ea8',field:'tezina'},
  {key:'seker',      label:'Шеќер',  unit:'mmol/L', color:'#c43e8a',field:'seker'},
  {key:'bolka',      label:'Болка',  unit:'/10',    color:'#8a3a3a',field:'bolka'},
];

function renderVitalsWidget(){
  if(!_vitals.length)return'<div class="cc-empty" style="padding:0.75rem">Нема витали внесени во записите.</div>';
  return`
    <div class="vitals-view-tabs">
      <button class="vtab ${_vitalsView==='chart'?'active':''}" id="vtab-chart" onclick="window._ccVitalsView('chart')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Графикон
      </button>
      <button class="vtab ${_vitalsView==='list'?'active':''}" id="vtab-list" onclick="window._ccVitalsView('list')">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/></svg>Листа
      </button>
    </div>
    <div id="cc-vitals-inner">${_vitalsView==='chart'?renderVitalsChart():renderVitalsList()}</div>`;
}

window._ccVitalsView=function(mode){
  _vitalsView=mode;
  ['chart','list'].forEach(m=>{const t=document.getElementById('vtab-'+m);if(t)t.classList.toggle('active',m===mode);});
  const inner=document.getElementById('cc-vitals-inner');
  if(!inner)return;
  inner.innerHTML=mode==='chart'?renderVitalsChart():renderVitalsList();
  if(mode==='chart')scheduleChart();
};

window._ccPickParam=function(key){
  _activeParam=key;
  document.querySelectorAll('.vpill').forEach(p=>p.classList.toggle('active',p.dataset.key===key));
  drawChart(key);
};

function renderVitalsChart(){
  const pills=PARAMS.map(p=>`<button class="vpill ${_activeParam===p.key?'active':''}" data-key="${p.key}" onclick="window._ccPickParam('${p.key}')">${p.label}</button>`).join('');
  return`<div class="vitals-chart-wrap">
    <div class="vpills">${pills}</div>
    <div class="chart-canvas-wrap" id="cc-chart-wrap"><canvas id="cc-vitals-canvas"></canvas></div>
    <div class="chart-note" id="cc-chart-note">Последните 5 уникатни денови</div>
  </div>`;
}

function renderVitalsList(){
  const rows=_vitals.map(v=>{
    const kp=(v.kp_sistolicen&&v.kp_dijastolicen)?`${v.kp_sistolicen}/${v.kp_dijastolicen}`:null;
    const cells=[
      {val:kp,has:!!kp},
      {val:v.puls,has:!!v.puls},
      {val:v.temperatura,has:v.temperatura!=null},
      {val:v.spo2,has:!!v.spo2},
      {val:v.respiracii,has:!!v.respiracii},
      {val:v.tezina,has:v.tezina!=null},
      {val:v.seker,has:v.seker!=null},
      {val:v.bolka!=null?v.bolka:null,has:v.bolka!=null},
    ];
    return`<div class="vl-row">
      <span class="vl-cell date">${new Date(v.created_at).toLocaleDateString('mk-MK',{day:'2-digit',month:'2-digit',year:'2-digit'})}</span>
      ${cells.map(c=>`<span class="vl-cell ${c.has?'has':'empty'}">${c.has?c.val:'—'}</span>`).join('')}
    </div>`;
  }).join('');
  return`<div class="vitals-list-wrap"><div class="vitals-list">
    <div class="vl-row hdr"><span class="vl-cell date">Датум</span><span class="vl-cell">КП</span><span class="vl-cell">Пулс</span><span class="vl-cell">Т°</span><span class="vl-cell">SpO2</span><span class="vl-cell">Респ</span><span class="vl-cell">Кг</span><span class="vl-cell">Шеќ</span><span class="vl-cell">Болка</span></div>
    ${rows||'<div class="cc-empty">Нема витали.</div>'}
  </div></div>`;
}

function scheduleChart(){setTimeout(()=>{if(_vitalsView==='chart')drawChart(_activeParam);},80);}

function drawChart(paramKey){
  const canvas=document.getElementById('cc-vitals-canvas');
  if(!canvas)return;
  const wrap=document.getElementById('cc-chart-wrap');
  const note=document.getElementById('cc-chart-note');
  const param=PARAMS.find(p=>p.key===paramKey)||PARAMS[0];

  // Day buckets
  const dayMap=new Map();
  for(const v of _vitals){
    const day=v.created_at.slice(0,10);
    if(!dayMap.has(day))dayMap.set(day,[]);
    dayMap.get(day).push(v);
  }
  const daysWithData=[...dayMap.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .filter(([,entries])=>entries.some(v=>paramKey==='kp'?v.kp_sistolicen:(v[param.field]!=null)))
    .slice(-5);

  const labels=daysWithData.map(([day])=>new Date(day+'T12:00:00').toLocaleDateString('mk-MK',{day:'2-digit',month:'2-digit'}));
  const values=daysWithData.map(([,entries])=>{
    const vals=entries.map(v=>{
      if(paramKey==='kp')return v.kp_sistolicen?parseFloat(v.kp_sistolicen):null;
      return v[param.field]!=null?parseFloat(v[param.field]):null;
    }).filter(x=>x!==null);
    return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  });

  const W=(wrap?wrap.offsetWidth:400)||400;
  const H=155;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);

  const hasData=values.some(v=>v!==null);
  if(!hasData){
    ctx.fillStyle='#aaa';ctx.font='12px Lato,sans-serif';ctx.textAlign='center';
    ctx.fillText('Нема податоци за '+param.label,W/2,H/2);
    if(note)note.textContent='Нема вредности за '+param.label;
    return;
  }
  if(note)note.textContent=`${param.label} (${param.unit}) · последни 5 денови со податоци`;

  const pL=42,pR=14,pT=14,pB=34;
  const cW=W-pL-pR,cH=H-pT-pB;
  const nonNull=values.filter(v=>v!==null);
  let minV=Math.min(...nonNull),maxV=Math.max(...nonNull);
  if(minV===maxV){minV-=1;maxV+=1;}
  const range=maxV-minV;
  const xS=i=>pL+(daysWithData.length>1?i/(daysWithData.length-1)*cW:cW/2);
  const yS=v=>pT+(1-(v-minV)/range)*cH;

  // Grid
  ctx.strokeStyle='#eae7e0';ctx.lineWidth=1;
  for(let i=0;i<=3;i++){
    const y=pT+i/3*cH;
    ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();
    const lv=maxV-i*(range/3);
    ctx.fillStyle='#b0a898';ctx.font='10px Lato,sans-serif';ctx.textAlign='right';
    ctx.fillText(lv%1===0?lv:lv.toFixed(1),pL-4,y+3.5);
  }
  ctx.fillStyle='#b0a898';ctx.font='10px Lato,sans-serif';ctx.textAlign='center';
  labels.forEach((lbl,i)=>ctx.fillText(lbl,xS(i),H-pB+16));

  const pts=values.map((v,i)=>({x:xS(i),y:v!==null?yS(v):null,v}));
  const color=param.color;
  const fi=pts.findIndex(p=>p.y!==null);
  const li=pts.reduce((a,p,i)=>p.y!==null?i:a,-1);

  if(fi>=0){
    const grad=ctx.createLinearGradient(0,pT,0,H-pB);
    grad.addColorStop(0,color+'55');grad.addColorStop(1,color+'08');
    ctx.save();ctx.beginPath();let s=false;
    pts.forEach(p=>{if(p.y===null)return;if(!s){ctx.moveTo(p.x,p.y);s=true;}else ctx.lineTo(p.x,p.y);});
    ctx.lineTo(pts[li].x,H-pB);ctx.lineTo(pts[fi].x,H-pB);ctx.closePath();
    ctx.fillStyle=grad;ctx.fill();ctx.restore();
  }

  ctx.beginPath();let ls=false;
  pts.forEach(p=>{if(p.y===null)return;if(!ls){ctx.moveTo(p.x,p.y);ls=true;}else ctx.lineTo(p.x,p.y);});
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();

  pts.forEach(p=>{
    if(p.y===null)return;
    ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,2*Math.PI);
    ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.fill();ctx.stroke();
    ctx.fillStyle=color;ctx.font='bold 10px Lato,sans-serif';ctx.textAlign='center';
    ctx.fillText(p.v%1===0?p.v:p.v.toFixed(1),p.x,p.y-9);
  });
}

// ══════════════════════════════════════════════════════════════════════
// Записи
// ══════════════════════════════════════════════════════════════════════
function renderLogs(){
  const months=[...new Set(_logs.map(l=>l.created_at.slice(0,7)))].sort((a,b)=>b.localeCompare(a));
  const monthOpts=months.map(m=>{
    const lbl=new Date(m+'-01T12:00:00').toLocaleDateString('mk-MK',{month:'long',year:'numeric'});
    return`<option value="${m}" ${_logsMonth===m?'selected':''}>${lbl}</option>`;
  }).join('');

  let filtered=_logsMonth?_logs.filter(l=>l.created_at.startsWith(_logsMonth)):_logs;
  const overflow=filtered.length>LOGS_MAX;
  if(overflow)filtered=filtered.slice(0,LOGS_MAX);

  return`
    <div class="logs-filter-row">
      <span class="cc-label" style="margin:0;white-space:nowrap">Месец:</span>
      <select class="logs-month-sel" id="cc-logs-month">
        <option value="">Сите месеци</option>${monthOpts}
      </select>
      <span style="font-size:0.75rem;color:var(--gray)">${filtered.length} записи</span>
    </div>
    <div id="cc-logs-list">
      ${filtered.length?filtered.map(l=>renderLogEntry(l)).join(''):'<div class="cc-empty">Нема записи за избраниот месец.</div>'}
    </div>
    ${overflow?`<div class="overflow-note">Прикажани се ${LOGS_MAX} записи. За постари, користете го главниот Logs модул со филтрирање по датум.</div>`:''}`;
}

const _TL={doctor:'Доктор',social:'Социјален',fizioterapevt:'Физио',supervisor:'Супервизор',other:'Друго'};
const _TC={doctor:'le-type-doctor',social:'le-type-social',fizioterapevt:'le-type-other',supervisor:'le-type-other',other:'le-type-other'};

function renderLogEntry(l){
  const v=[];
  if(l.kp_sistolicen&&l.kp_dijastolicen)v.push(`КП: <span>${l.kp_sistolicen}/${l.kp_dijastolicen} mmHg</span>`);
  if(l.puls)        v.push(`Пулс: <span>${l.puls} bpm</span>`);
  if(l.temperatura) v.push(`Т°: <span>${l.temperatura}°C</span>`);
  if(l.spo2)        v.push(`SpO2: <span>${l.spo2}%</span>`);
  if(l.respiracii)  v.push(`Респ: <span>${l.respiracii}/мин</span>`);
  if(l.tezina)      v.push(`Тежина: <span>${l.tezina} kg</span>`);
  if(l.seker)       v.push(`Шеќер: <span>${l.seker} mmol/L</span>`);
  if(l.bolka!=null) v.push(`Болка: <span>${l.bolka}/10</span>`);
  return`<div class="log-entry">
    <div class="le-top">
      <div>
        <span class="le-diag">${e(l.dijagnoza_kod||'—')}${l.dijagnoza_opis?' — '+e(l.dijagnoza_opis):''}</span>
        <span class="le-type ${_TC[l.log_type||'doctor']||'le-type-other'}">${_TL[l.log_type||'doctor']||'Друго'}</span>
      </div>
      <span class="le-date">${fmtDateTime(l.created_at)}</span>
    </div>
    ${v.length?`<div class="vital-chips">${v.map(x=>`<div class="vc">${x}</div>`).join('')}</div>`:''}
    ${l.anamneza   ?`<div class="le-field"><div class="le-fl">Анамнеза</div><div class="le-fv">${e(l.anamneza)}</div></div>`:''}
    ${l.naod       ?`<div class="le-field"><div class="le-fl">Наод</div><div class="le-fv">${e(l.naod)}</div></div>`:''}
    ${l.parenteralna?`<div class="le-field"><div class="le-fl">Парентерална</div><div class="le-fv">${e(l.parenteralna)}</div></div>`:''}
  </div>`;
}

function bindLogsFilter(){
  const sel=document.getElementById('cc-logs-month');
  if(!sel)return;
  sel.addEventListener('change',()=>{
    _logsMonth=sel.value||null;
    document.getElementById('cc-body').innerHTML=renderLogs();
    bindLogsFilter();
  });
}

// ══════════════════════════════════════════════════════════════════════
// Лични податоци
// ══════════════════════════════════════════════════════════════════════
function renderInfo(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Уреди</button>`:'';
  return`
  <div class="cc-section">
    <div class="cc-section-title"><span>Лични податоци</span>${editBtn}</div>
    <div class="cc-grid">
      <div class="cc-field"><div class="cc-label">Обраќање</div><div class="cc-value">${e(c.obrakanje||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Матичен број</div><div class="cc-value">${e(c.maticen_broj||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Ime и Презиме</div><div class="cc-value">${e(c.ime_prezime||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Адреса</div><div class="cc-value">${e(c.adresa||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Телефон</div><div class="cc-value">${e(c.telefon||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">ЕМБГ</div><div class="cc-value" style="font-family:monospace">${e(c.embg||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Лична карта / Пасош</div><div class="cc-value">${e(c.licna_karta_broj||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Датум на прием</div><div class="cc-value">${fmtDate(c.created_at)}</div></div>
    </div>
  </div>`;
}

window.editClientData=function(clientId){
  closeClientCard();
  window.location.href=`clients.html?edit=${clientId}`;
};

})();
