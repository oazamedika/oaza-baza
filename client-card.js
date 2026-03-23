/**
 * client-card.js  — REVAMPED
 * Shared client view modal — include on any protected page.
 * Call: openClientCard(clientId)
 * Requires: auth-guard.js (window._sb, window._username)
 *
 * BACKEND NOTES (see bottom of file for Supabase requirements)
 */

(function(){

// ── Styles ──────────────────────────────────────────────────────────
const STYLE = `
<style id="cc-styles">
/* ── Backdrop & Modal ── */
#cc-backdrop{display:none;position:fixed;inset:0;background:rgba(30,26,22,0.65);z-index:200;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px)}
#cc-backdrop.open{display:flex}
#cc-modal{
  background:#fff;border-radius:14px;
  width:100%;max-width:1060px;
  max-height:95vh;display:flex;flex-direction:column;
  box-shadow:0 32px 80px rgba(0,0,0,0.26);overflow:hidden
}

/* ── Header ── */
#cc-header{padding:1.25rem 1.5rem 0;background:#fff;flex-shrink:0}

/* ── Client hero bar ── */
.cc-hero{
  display:flex;align-items:flex-start;gap:1.1rem;
  padding-bottom:1rem;margin-bottom:0;
  border-bottom:1px solid var(--border)
}
.cc-avatar{
  width:60px;height:60px;border-radius:50%;object-fit:cover;
  background:var(--olive);color:#fff;display:flex;align-items:center;
  justify-content:center;font-family:'Playfair Display',serif;
  font-size:1.4rem;font-weight:700;flex-shrink:0;overflow:hidden;
  box-shadow:0 2px 8px rgba(0,0,0,0.12)
}
.cc-avatar img{width:100%;height:100%;object-fit:cover}
.cc-hero-info{flex:1;min-width:0}
.cc-hero-row1{display:flex;align-items:center;justify-content:space-between;gap:0.75rem}
.cc-name{font-family:'Playfair Display',serif;font-size:1.35rem;font-weight:600;color:var(--dark);line-height:1.2}
.cc-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s;flex-shrink:0}
.cc-close:hover{color:var(--dark)}

/* badges row: age · bed · floor */
.cc-hero-badges{display:flex;align-items:center;gap:0;margin-top:0.3rem;font-size:0.82rem;color:var(--dark)}
.cc-hbadge{display:flex;align-items:center;gap:0.3rem;padding:0.2rem 0.55rem;background:var(--cream);border:1px solid var(--border);border-radius:20px;font-weight:600;font-size:0.78rem}
.cc-hbadge svg{flex-shrink:0}
.cc-dot-sep{width:4px;height:4px;border-radius:50%;background:var(--gray);opacity:0.45;margin:0 0.45rem}

/* info pills row 1 + row 2 */
.cc-hero-pills{display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.5rem}
.cc-pill{display:inline-flex;align-items:center;gap:0.3rem;padding:0.18rem 0.6rem;border-radius:10px;background:var(--cream);border:1px solid var(--border);font-size:0.74rem;color:var(--dark)}
.cc-pill .cc-pill-label{font-size:0.67rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);margin-right:0.15rem}

/* ── Tabs ── */
.cc-tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin-top:0.85rem}
.cc-tab{padding:0.65rem 1.1rem;font-family:'Lato',sans-serif;font-size:0.79rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s;background:none;border-top:none;border-left:none;border-right:none}
.cc-tab.active{color:var(--olive);border-bottom-color:var(--olive)}

/* ── Body ── */
#cc-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem}

/* ── Generic helpers ── */
.cc-section{margin-bottom:1.5rem}
.cc-section-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem 1.5rem}
.cc-grid.three{grid-template-columns:1fr 1fr 1fr}
.cc-field{display:flex;flex-direction:column;gap:0.1rem}
.cc-label{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.cc-value{font-size:0.88rem;color:var(--dark);line-height:1.5}
.cc-full{grid-column:1/-1}
.cc-empty{text-align:center;padding:2rem;color:var(--gray);font-size:0.85rem}
.cc-edit-btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.4rem 0.8rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.cc-edit-btn:hover{border-color:var(--olive);color:var(--olive)}

/* ── Two-col dosie layout ── */
.dosie-layout{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;align-items:start}
@media(max-width:700px){.dosie-layout{grid-template-columns:1fr}}

/* ── Vitals ── */
.vitals-tabs{display:flex;gap:0.3rem;margin-bottom:0.75rem}
.vtab{padding:0.3rem 0.8rem;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:var(--cream);color:var(--gray);transition:all 0.15s}
.vtab.active{background:var(--olive);color:#fff;border-color:var(--olive)}

/* Chart view */
.vitals-chart-wrap{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:0.75rem}
.vitals-param-pills{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.75rem}
.vpill{padding:0.22rem 0.65rem;font-size:0.71rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:1px solid var(--border);border-radius:20px;cursor:pointer;background:#fff;color:var(--gray);transition:all 0.15s}
.vpill.active{background:var(--olive);color:#fff;border-color:var(--olive)}
.vitals-chart-canvas-wrap{position:relative;height:160px}
.vitals-chart-canvas-wrap canvas{width:100%!important;height:100%!important}

/* List view */
.vitals-list{display:flex;flex-direction:column;gap:0.4rem;max-height:320px;overflow-y:auto}
.vital-row{display:grid;grid-template-columns:1.2fr repeat(7,1fr);gap:0.25rem;align-items:center;padding:0.45rem 0.6rem;border:1px solid var(--border);border-radius:5px;background:#fff;font-size:0.78rem}
.vital-row.header{background:var(--cream);font-size:0.67rem;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--gray);position:sticky;top:0;z-index:1}
.vital-row.header > *{color:var(--gray)}
.vr-date{font-size:0.74rem;color:var(--gray)}
.vr-val{text-align:center}
.vr-val.highlight{color:var(--olive);font-weight:700}

/* Therapy table */
.therapy-tbl{width:100%;border-collapse:collapse;font-size:0.85rem}
.therapy-tbl th{text-align:left;font-size:0.67rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);padding:0.45rem 0.75rem;border-bottom:2px solid var(--border)}
.therapy-tbl td{padding:0.55rem 0.75rem;border-bottom:1px solid var(--border);vertical-align:middle}
.therapy-tbl tr:last-child td{border-bottom:none}
.badge-cc{display:inline-block;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase}
.badge-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.badge-stopped{background:#f0ece2;color:#8a7a55}

/* Right column: requests + mini logs */
.request-placeholder{background:var(--cream);border:1px dashed var(--border);border-radius:8px;padding:1.5rem 1rem;text-align:center;color:var(--gray);font-size:0.82rem;margin-bottom:1.25rem}
.request-placeholder svg{opacity:0.3;margin-bottom:0.5rem;display:block;margin-left:auto;margin-right:auto}

/* ── Logs ── */
.logs-filter-row{display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem}
.logs-month-select{padding:0.4rem 0.75rem;border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.82rem;background:#fff;color:var(--dark);cursor:pointer}
.log-entry-cc{padding:0.9rem;border:1px solid var(--border);border-radius:6px;margin-bottom:0.75rem}
.le-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem}
.le-diag-cc{font-family:monospace;font-size:0.82rem;font-weight:700;color:var(--olive)}
.le-date-cc{font-size:0.72rem;color:var(--gray)}
.le-type{display:inline-block;padding:0.1rem 0.45rem;border-radius:10px;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-left:0.4rem}
.le-type-doctor{background:#e8ecf5;color:#2e4a8a}
.le-type-social{background:#e8f0e8;color:#3a6e3a}
.le-type-other{background:#f0ece2;color:#8a7a55}
.le-field{margin-top:0.4rem}
.le-fl{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray)}
.le-fv{font-size:0.83rem;color:var(--dark);line-height:1.55}
.vital-grid{display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;padding:0.75rem;background:var(--cream);border-radius:6px;border:1px solid var(--border)}
.vc{font-size:0.82rem;color:var(--dark)}.vc span{font-weight:700}
.cc-load-more{display:block;width:100%;padding:0.6rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;color:var(--gray);cursor:pointer;text-align:center;transition:background 0.15s;margin-top:0.5rem}
.cc-load-more:hover{background:var(--cream2)}
.cc-load-more.olive{background:var(--olive);color:#fff;border-color:var(--olive)}
.cc-load-more.olive:hover{opacity:0.9}
.logs-overflow-note{font-size:0.78rem;color:var(--gray);text-align:center;padding:0.5rem;background:var(--cream);border-radius:4px;margin-top:0.5rem;border:1px solid var(--border)}

/* Srodstvo inline */
.srodstvo-grid{display:flex;flex-direction:column;gap:0.5rem}
.srodstvo-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;padding:0.65rem 0.85rem;background:var(--cream);border:1px solid var(--border);border-radius:5px;font-size:0.85rem}

/* Social dosie */
.social-section-box{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1rem}
.social-section-box .cc-label{margin-bottom:0.15rem}
.social-section-box .cc-value{font-size:0.85rem}

/* ── Diagnoses list ── */
.diag-list{display:flex;flex-direction:column;gap:0.4rem}
.diag-item{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:var(--cream);border:1px solid var(--border);border-radius:4px}
.diag-kod{font-family:monospace;font-size:0.82rem;font-weight:700;color:var(--olive);flex-shrink:0}
.diag-opis{font-size:0.85rem}
</style>`;

// ── DOM injection ────────────────────────────────────────────────────
function injectDOM(){
  if(document.getElementById('cc-backdrop'))return;
  document.head.insertAdjacentHTML('beforeend',STYLE);
  document.body.insertAdjacentHTML('beforeend',`
  <div id="cc-backdrop">
    <div id="cc-modal" role="dialog" aria-modal="true">
      <div id="cc-header">
        <!-- Hero: avatar + name + badges + pills -->
        <div class="cc-hero">
          <div class="cc-avatar" id="cc-avatar">?</div>
          <div class="cc-hero-info">
            <div class="cc-hero-row1">
              <div class="cc-name" id="cc-name">…</div>
              <button class="cc-close" id="cc-close">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <!-- Row: age · bed · floor -->
            <div class="cc-hero-badges" id="cc-hero-badges"></div>
            <!-- Two rows of info pills -->
            <div class="cc-hero-pills" id="cc-hero-pills"></div>
          </div>
        </div>
        <!-- Tabs -->
        <div class="cc-tabs">
          <button class="cc-tab" data-tab="social">Социјално досие</button>
          <button class="cc-tab active" data-tab="dosie">Медицинско досие</button>
          <button class="cc-tab" data-tab="logs">Записи</button>
          <button class="cc-tab" data-tab="info">Лични податоци</button>
        </div>
      </div>
      <div id="cc-body">
        <div class="cc-empty">Се вчитува…</div>
      </div>
    </div>
  </div>`);

  document.getElementById('cc-close').addEventListener('click',closeClientCard);
  document.getElementById('cc-backdrop').addEventListener('click',e=>{
    if(e.target===document.getElementById('cc-backdrop'))closeClientCard();
  });
  document.querySelectorAll('.cc-tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab);
    });
  });
}

// ── State ────────────────────────────────────────────────────────────
let _client=null, _therapy=[], _logs=[], _vitals=[], _srodstvo=[];
let _logsMonthFilter=null; // 'YYYY-MM' or null
const LOGS_MAX=50;

// ── Escape helper ─────────────────────────────────────────────────────
function e(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ── Age from EMBG ─────────────────────────────────────────────────────
function ageFromEmbg(embg){
  if(!embg||embg.length<7)return null;
  const d=String(embg).padStart(13,'0');
  const day=parseInt(d.substring(0,2),10);
  const mon=parseInt(d.substring(2,4),10)-1;
  let yr=parseInt(d.substring(4,7),10);
  // EMBG year: 3 digits, >=800 = 1800s, >=000 = 2000s
  if(yr>=0&&yr<=99) yr+=2000; else if(yr>=100&&yr<=799) yr+=1000; else yr+=1000;
  try{
    const bd=new Date(yr,mon,day);
    const today=new Date();
    let age=today.getFullYear()-bd.getFullYear();
    const m=today.getMonth()-bd.getMonth();
    if(m<0||(m===0&&today.getDate()<bd.getDate()))age--;
    return age>0&&age<130?age:null;
  }catch{return null;}
}

// ── Open card ────────────────────────────────────────────────────────
window.openClientCard = async function(clientId){
  injectDOM();
  _logsMonthFilter=null;
  document.getElementById('cc-body').innerHTML='<div class="cc-empty">Се вчитува…</div>';
  document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.cc-tab[data-tab="dosie"]').classList.add('active');
  document.getElementById('cc-backdrop').classList.add('open');
  document.body.style.overflow='hidden';

  // Reset hero
  document.getElementById('cc-hero-badges').innerHTML='';
  document.getElementById('cc-hero-pills').innerHTML='';
  document.getElementById('cc-name').textContent='…';
  document.getElementById('cc-avatar').textContent='?';

  const [clientRes, therapyRes, logsRes, vitalsRes, srodstvoRes] = await Promise.all([
    window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,licna_karta_broj,
      adresa,telefon,floor_number,room_number,bed_number,
      profile_pic_url,status,created_at,
      priem_dijagnoza_kod,priem_dijagnoza_opis,priem_anamneza,priem_naod,priem_notes,
      priem_kp_sistolicen,priem_kp_dijastolicen,priem_puls,priem_temperatura,
      priem_spo2,priem_respiracii,priem_tezina,priem_seker,priem_bolka,
      socijalen_rabotnik,socijalen_dosie_br,kategorija,finansiranje,
      client_chronic_diagnoses(kod,opis,added_at)
    `).eq('id',clientId).single(),
    window._sb.from('client_chronic_therapy').select('*').eq('client_id',clientId).order('added_at'),
    window._sb.from('client_logs').select('*').eq('client_id',clientId).order('created_at',{ascending:false}).limit(LOGS_MAX+1),
    // Fetch last 25 vitals log entries that have at least one vital sign
    window._sb.from('client_logs').select('created_at,kp_sistolicen,kp_dijastolicen,puls,temperatura,spo2,respiracii,tezina,seker,bolka')
      .eq('client_id',clientId).order('created_at',{ascending:false}).limit(25),
    window._sb.from('client_srodstvo').select('*').eq('client_id',clientId),
  ]);

  _client = clientRes.data;
  _therapy = therapyRes.data||[];
  _logs    = logsRes.data||[];
  _vitals  = (vitalsRes.data||[]).filter(v=>
    v.kp_sistolicen||v.puls||v.temperatura||v.spo2||v.respiracii||v.tezina||v.seker||v.bolka!=null
  );
  _srodstvo= srodstvoRes.data||[];

  if(!_client){document.getElementById('cc-body').innerHTML='<div class="cc-empty">Корисникот не е пронајден.</div>';return;}

  // ── Build hero ──
  const c=_client;
  const initials=(c.ime_prezime||'?').charAt(0);
  const avatarEl=document.getElementById('cc-avatar');
  if(c.profile_pic_url){
    avatarEl.innerHTML=`<img src="${e(c.profile_pic_url)}" alt=""/>`;
  } else {
    avatarEl.textContent=initials;
  }
  document.getElementById('cc-name').textContent=(c.obrakanje?c.obrakanje+' ':'')+(c.ime_prezime||'');

  // Badges: age · bed · floor
  const age=ageFromEmbg(c.embg);
  const _fl=c.floor_number||(window.roomToFloor?window.roomToFloor(c.room_number):null);
  const badgesEl=document.getElementById('cc-hero-badges');
  const parts=[];
  if(age!==null){
    parts.push(`<span class="cc-hbadge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
      ${age} год
    </span>`);
  }
  if(c.room_number){
    if(parts.length) parts.push('<span class="cc-dot-sep"></span>');
    parts.push(`<span class="cc-hbadge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9l10-7 10 7v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/></svg>
      Соба ${c.room_number} / Кревет ${c.bed_number}
    </span>`);
    if(_fl){
      parts.push('<span class="cc-dot-sep"></span>');
      parts.push(`<span class="cc-hbadge">Кат ${_fl}</span>`);
    }
  }
  if(c.status){
    parts.push('<span class="cc-dot-sep"></span>');
    parts.push(`<span class="cc-hbadge" style="background:#e6f0e6;border-color:#b5d5b5;color:#2a6e2a">${e(c.status)}</span>`);
  }
  badgesEl.innerHTML=parts.join('');

  // Pills: second row — maticen, telefon, adresa, socijalen_rabotnik, finansiranje
  const pills=[];
  if(c.maticen_broj) pills.push(`<span class="cc-pill"><span class="cc-pill-label">Мат.</span>${e(c.maticen_broj)}</span>`);
  if(c.telefon)      pills.push(`<span class="cc-pill"><span class="cc-pill-label">Тел.</span>${e(c.telefon)}</span>`);
  if(c.adresa)       pills.push(`<span class="cc-pill"><span class="cc-pill-label">Адреса</span>${e(c.adresa)}</span>`);
  if(c.socijalen_rabotnik) pills.push(`<span class="cc-pill"><span class="cc-pill-label">Соц. раб.</span>${e(c.socijalen_rabotnik)}</span>`);
  if(c.finansiranje) pills.push(`<span class="cc-pill"><span class="cc-pill-label">Финансирање</span>${e(c.finansiranje)}</span>`);
  document.getElementById('cc-hero-pills').innerHTML=pills.join('');

  renderTab('dosie');
};

window.closeClientCard = function(){
  const bd=document.getElementById('cc-backdrop');
  if(bd)bd.classList.remove('open');
  document.body.style.overflow='';
};

// ── Role helpers ─────────────────────────────────────────────────────
function isPrivileged(){const u=(window._username||'').toLowerCase();return u==='menadzer'||u==='glavnasestra';}
function isDoctor(){return(window._username||'').toLowerCase()==='doktor';}
function canSeeAll(){return isPrivileged()||isDoctor();}

// ── Tab router ────────────────────────────────────────────────────────
function renderTab(tab){
  const body=document.getElementById('cc-body');
  if(tab==='social')  body.innerHTML=renderSocial();
  else if(tab==='dosie')  body.innerHTML=renderDosie();
  else if(tab==='logs')   { body.innerHTML=renderLogs(); bindLogsFilter(); }
  else if(tab==='info')   body.innerHTML=renderInfo();
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1 — Социјално досие
// ═══════════════════════════════════════════════════════════════════
function renderSocial(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    Уреди
  </button>`:'';

  // Social dosie fields
  const socialFields=[
    {label:'Социјален работник', val:c.socijalen_rabotnik},
    {label:'Број на досие', val:c.socijalen_dosie_br},
    {label:'Категорија', val:c.kategorija},
    {label:'Финансирање', val:c.finansiranje},
  ].filter(f=>f.val);

  const socialHtml=socialFields.length
    ?`<div class="cc-grid">${socialFields.map(f=>`
        <div class="cc-field">
          <div class="cc-label">${f.label}</div>
          <div class="cc-value">${e(f.val)}</div>
        </div>`).join('')}</div>`
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесени социјални информации.</div>';

  // Srodstvo — show inline (already loaded)
  const srodstvoHtml=_srodstvo.length
    ?`<div class="srodstvo-grid">${_srodstvo.map(s=>`
        <div class="srodstvo-row">
          <div><div class="cc-label">Ime и Презиме</div><div>${e(s.ime_prezime||'—')}</div></div>
          <div><div class="cc-label">Адреса</div><div>${e(s.adresa||'—')}</div></div>
          <div><div class="cc-label">Телефон</div><div>${e(s.telefon||'—')}</div></div>
        </div>`).join('')}</div>`
    :'<div class="cc-empty" style="padding:0.5rem">Нема внесено сродство.</div>';

  return`
  <div class="cc-section">
    <div class="cc-section-title">
      <span>Социјално досие</span>${editBtn}
    </div>
    ${socialHtml}
  </div>
  <div class="cc-section">
    <div class="cc-section-title"><span>Сродство</span></div>
    ${srodstvoHtml}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 — Медицинско досие  (two-column layout)
// ═══════════════════════════════════════════════════════════════════
function renderDosie(){
  if(!canSeeAll()) return`<div class="cc-empty">Немате пристап до медицинското досие.</div>`;
  const c=_client;
  const active=_therapy.filter(t=>t.active);
  const stopped=_therapy.filter(t=>!t.active);
  const diags=(c.client_chronic_diagnoses||[]);

  // ─ left column ─
  const leftCol=`
    <!-- Vitals section -->
    <div class="cc-section">
      <div class="cc-section-title"><span>Витални знаци</span></div>
      ${renderVitalsWidget()}
    </div>

    <!-- Chronic therapy -->
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронична терапија</span></div>
      ${!active.length
        ?'<div class="cc-empty" style="padding:0.5rem">Нема активна терапија.</div>'
        :`<table class="therapy-tbl">
            <thead><tr><th>Лек</th><th>Доза</th><th>Додадена</th><th>Статус</th></tr></thead>
            <tbody>${active.map(t=>`<tr>
              <td style="font-weight:700">${e(t.drug_name)}</td>
              <td>${e(t.dosage)}</td>
              <td>${new Date(t.added_at).toLocaleDateString('mk-MK')}</td>
              <td><span class="badge-cc badge-active">Активна</span></td>
            </tr>`).join('')}</tbody>
          </table>`}
      ${stopped.length?`<details style="margin-top:0.75rem">
        <summary style="cursor:pointer;font-size:0.78rem;color:var(--olive);font-weight:700">Стопирана терапија (${stopped.length})</summary>
        <table class="therapy-tbl" style="margin-top:0.5rem">
          <thead><tr><th>Лек</th><th>Доза</th><th>Статус</th></tr></thead>
          <tbody>${stopped.map(t=>`<tr style="opacity:0.5;text-decoration:line-through"><td>${e(t.drug_name)}</td><td>${e(t.dosage)}</td><td><span class="badge-cc badge-stopped">Стопирана</span></td></tr>`).join('')}</tbody>
        </table>
      </details>`:''}
    </div>

    <!-- Chronic diagnoses -->
    <div class="cc-section">
      <div class="cc-section-title"><span>Хронични дијагнози</span></div>
      ${!diags.length
        ?'<div class="cc-empty" style="padding:0.5rem">Нема хронични дијагнози.</div>'
        :`<div class="diag-list">${diags.map(d=>`
            <div class="diag-item">
              <span class="diag-kod">${e(d.kod)}</span>
              <span class="diag-opis">${e(d.opis||'—')}</span>
            </div>`).join('')}</div>`}
    </div>

    <!-- Admission -->
    <div class="cc-section">
      <div class="cc-section-title"><span>Дијагноза на прием</span></div>
      ${c.priem_dijagnoza_kod
        ?`<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
            <span style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--olive)">${e(c.priem_dijagnoza_kod)}</span>
            <span style="font-size:0.88rem">${e(c.priem_dijagnoza_opis||'')}</span>
          </div>`
        :'<div class="cc-empty" style="padding:0.5rem">Нема внесена дијагноза на прием.</div>'}
      ${c.priem_anamneza?`<div class="cc-field" style="margin-top:0.5rem"><div class="cc-label">Анамнеза</div><div class="cc-value">${e(c.priem_anamneza)}</div></div>`:''}
      ${c.priem_naod?`<div class="cc-field" style="margin-top:0.5rem"><div class="cc-label">Наод</div><div class="cc-value">${e(c.priem_naod)}</div></div>`:''}
      ${c.priem_notes?`<div class="cc-field" style="margin-top:0.5rem"><div class="cc-label">Белешки</div><div class="cc-value">${e(c.priem_notes)}</div></div>`:''}
    </div>
  `;

  // ─ right column ─
  const miniLogs=_logs.slice(0,3);
  const typeLabel={doctor:'Доктор',social:'Социјален',fizioterapevt:'Физио',supervisor:'Супервизор',other:'Друго'};
  const typeClass={doctor:'le-type-doctor',social:'le-type-social',fizioterapevt:'le-type-other',supervisor:'le-type-other',other:'le-type-other'};

  const miniLogsHtml=!miniLogs.length
    ?'<div class="cc-empty" style="padding:0.5rem">Нема записи.</div>'
    :miniLogs.map(l=>renderLogEntry(l,typeLabel,typeClass)).join('');

  const rightCol=`
    <!-- Tasks / requests placeholder -->
    <div class="cc-section">
      <div class="cc-section-title"><span>Барања и задачи</span></div>
      <div class="request-placeholder">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h8M8 16h5"/></svg>
        Поврзано со модулот за задачи — наскоро
      </div>
    </div>

    <!-- Last 3 zapisi -->
    <div class="cc-section">
      <div class="cc-section-title">
        <span>Последни записи</span>
      </div>
      ${miniLogsHtml}
      ${_logs.length?`<button class="cc-load-more olive" onclick="(function(){document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));document.querySelector('.cc-tab[data-tab=\\'logs\\']').classList.add('active');window._ccRenderTab('logs');})()">
        Отвори ги сите записи →
      </button>`:''}
    </div>
  `;

  // expose renderTab for inline onclick
  window._ccRenderTab=renderTab;

  return`<div class="dosie-layout">${leftCol}${rightCol}</div>`;
}

// ── Vitals widget (chart + list) ───────────────────────────────────
const VITAL_PARAMS=[
  {key:'kp',       label:'КП',      unit:'mmHg', color:'#e05252'},
  {key:'puls',     label:'Пулс',    unit:'bpm',  color:'#e07a27'},
  {key:'temperatura',label:'Т°',   unit:'°C',   color:'#d4a017'},
  {key:'spo2',     label:'SpO2',    unit:'%',    color:'#2e8a5a'},
  {key:'respiracii',label:'Респ',  unit:'/мин', color:'#2e6ba8'},
  {key:'tezina',   label:'Тежина',  unit:'kg',   color:'#7a4ea8'},
  {key:'seker',    label:'Шеќер',   unit:'mmol/L',color:'#c43e8a'},
  {key:'bolka',    label:'Болка',   unit:'/10',  color:'#8a3a3a'},
];

let _activeVitalParam='puls';
let _vitalsView='chart'; // 'chart' or 'list'
let _chartInstance=null;

function renderVitalsWidget(){
  if(!_vitals.length){
    return`<div class="cc-empty" style="padding:1rem">Нема внесени витални знаци во записите.</div>`;
  }
  return`
  <div>
    <div class="vitals-tabs">
      <button class="vtab ${_vitalsView==='chart'?'active':''}" id="vtab-chart" onclick="window._ccVitalsView('chart')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:3px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Графикон
      </button>
      <button class="vtab ${_vitalsView==='list'?'active':''}" id="vtab-list" onclick="window._ccVitalsView('list')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:3px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
        Листа
      </button>
    </div>
    <div id="cc-vitals-content">
      ${_vitalsView==='chart' ? renderVitalsChart() : renderVitalsList()}
    </div>
  </div>`;
}

window._ccVitalsView=function(mode){
  _vitalsView=mode;
  const content=document.getElementById('cc-vitals-content');
  if(!content)return;
  ['chart','list'].forEach(m=>{
    const t=document.getElementById('vtab-'+m);
    if(t)t.classList.toggle('active',m===mode);
  });
  content.innerHTML=(mode==='chart')?renderVitalsChart():renderVitalsList();
  if(mode==='chart')drawVitalsChart(_activeVitalParam);
};

window._ccSelectVitalParam=function(key){
  _activeVitalParam=key;
  document.querySelectorAll('.vpill').forEach(p=>{
    p.classList.toggle('active',p.dataset.key===key);
  });
  drawVitalsChart(key);
};

function renderVitalsChart(){
  // Use last 5 days of vitals that have data
  const paramPills=VITAL_PARAMS.map(p=>`
    <button class="vpill ${_activeVitalParam===p.key?'active':''}" data-key="${p.key}" onclick="window._ccSelectVitalParam('${p.key}')">
      ${p.label}
    </button>`).join('');

  return`
  <div class="vitals-chart-wrap">
    <div class="vitals-param-pills">${paramPills}</div>
    <div class="vitals-chart-canvas-wrap">
      <canvas id="cc-vitals-canvas"></canvas>
    </div>
    <div id="cc-vitals-chart-note" style="font-size:0.72rem;color:var(--gray);text-align:right;margin-top:0.3rem">Последните 5 уникатни денови</div>
  </div>`;
}

function renderVitalsList(){
  // Show all 25 vitals in list
  const rows=_vitals.map(v=>{
    const kp=(v.kp_sistolicen&&v.kp_dijastolicen)?`${v.kp_sistolicen}/${v.kp_dijastolicen}`:'—';
    return`<div class="vital-row">
      <span class="vr-date">${new Date(v.created_at).toLocaleDateString('mk-MK',{day:'2-digit',month:'2-digit',year:'2-digit'})}</span>
      <span class="vr-val ${v.kp_sistolicen?'highlight':''}">${kp}</span>
      <span class="vr-val ${v.puls?'highlight':''}">${v.puls||'—'}</span>
      <span class="vr-val ${v.temperatura?'highlight':''}">${v.temperatura||'—'}</span>
      <span class="vr-val ${v.spo2?'highlight':''}">${v.spo2||'—'}</span>
      <span class="vr-val">${v.respiracii||'—'}</span>
      <span class="vr-val">${v.tezina||'—'}</span>
      <span class="vr-val">${v.seker||'—'}</span>
    </div>`;
  }).join('');
  return`
  <div class="vitals-list">
    <div class="vital-row header">
      <span>Датум</span><span class="vr-val">КП</span><span class="vr-val">Пулс</span><span class="vr-val">Т°</span>
      <span class="vr-val">SpO2</span><span class="vr-val">Респ</span><span class="vr-val">Кг</span><span class="vr-val">Шеќ</span>
    </div>
    ${rows||'<div class="cc-empty">Нема витали.</div>'}
  </div>`;
}

// ── Draw chart using Canvas API (no external lib needed) ─────────────
function drawVitalsChart(paramKey){
  // Wait for canvas to be in DOM
  requestAnimationFrame(()=>{
    const canvas=document.getElementById('cc-vitals-canvas');
    if(!canvas)return;

    // Get last 5 days buckets
    const dayMap=new Map();
    for(const v of _vitals){
      const day=v.created_at.substring(0,10);
      if(!dayMap.has(day))dayMap.set(day,{date:day,entries:[]});
      dayMap.get(day).entries.push(v);
    }
    // Sort days ascending, take last 5
    const days=[...dayMap.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-5);

    // Extract values for chosen param
    const param=VITAL_PARAMS.find(p=>p.key===paramKey)||VITAL_PARAMS[1];
    const labels=days.map(d=>{
      const dt=new Date(d.date+'T00:00:00');
      return dt.toLocaleDateString('mk-MK',{day:'2-digit',month:'2-digit'});
    });
    const values=days.map(d=>{
      // average if multiple entries per day
      const vals=d.entries.map(v=>{
        if(paramKey==='kp') return v.kp_sistolicen?parseFloat(v.kp_sistolicen):null;
        return v[paramKey]!=null?parseFloat(v[paramKey]):null;
      }).filter(x=>x!==null);
      return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    });

    // If no data for this param
    const noteEl=document.getElementById('cc-vitals-chart-note');
    const hasData=values.some(v=>v!==null);
    if(!hasData){
      if(noteEl) noteEl.textContent='Нема податоци за овој параметар во последните 5 денови.';
      // Clear canvas
      const ctx=canvas.getContext('2d');
      const W=canvas.parentElement.offsetWidth||400;
      const H=160;
      canvas.width=W; canvas.height=H;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='#aaa';ctx.font='13px Lato,sans-serif';ctx.textAlign='center';
      ctx.fillText('Нема податоци',W/2,H/2);
      return;
    }
    if(noteEl) noteEl.textContent=`Последните 5 уникатни денови · ${param.label} (${param.unit})`;

    // Canvas setup
    const W=canvas.parentElement.offsetWidth||400;
    const H=160;
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);

    const padL=40,padR=16,padT=12,padB=36;
    const cW=W-padL-padR;
    const cH=H-padT-padB;

    const nonNull=values.filter(v=>v!==null);
    const minV=Math.min(...nonNull);
    const maxV=Math.max(...nonNull);
    const range=maxV-minV||1;
    const yScale=v=>(1-(v-minV)/range)*cH+padT;
    const xScale=i=>padL+(i/(days.length-1||1))*cW;

    // Grid lines
    ctx.strokeStyle='#e8e5df';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y=padT+(i/4)*cH;
      ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
      const lv=maxV-i*(range/4);
      ctx.fillStyle='#aaa';ctx.font='10px Lato,sans-serif';ctx.textAlign='right';
      ctx.fillText(lv.toFixed(lv%1===0?0:1),padL-4,y+3.5);
    }

    // X labels
    ctx.fillStyle='#aaa';ctx.font='10px Lato,sans-serif';ctx.textAlign='center';
    labels.forEach((lbl,i)=>{
      ctx.fillText(lbl,xScale(i),H-padB+16);
    });

    // Fill area
    const pts=values.map((v,i)=>({x:xScale(i),y:v!==null?yScale(v):null}));
    const color=param.color;
    ctx.beginPath();
    let started=false;
    pts.forEach((p,i)=>{
      if(p.y===null)return;
      if(!started){ctx.moveTo(p.x,p.y);started=true;}
      else ctx.lineTo(p.x,p.y);
    });
    // Area fill
    if(started){
      const grad=ctx.createLinearGradient(0,padT,0,H-padB);
      grad.addColorStop(0,color+'44');
      grad.addColorStop(1,color+'08');
      ctx.save();
      ctx.lineTo(xScale(pts.findLastIndex(p=>p.y!==null)),H-padB);
      ctx.lineTo(xScale(pts.findIndex(p=>p.y!==null)),H-padB);
      ctx.closePath();
      ctx.fillStyle=grad;
      ctx.fill();
      ctx.restore();
    }

    // Line
    ctx.beginPath();started=false;
    pts.forEach(p=>{
      if(p.y===null)return;
      if(!started){ctx.moveTo(p.x,p.y);started=true;}
      else ctx.lineTo(p.x,p.y);
    });
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.stroke();

    // Dots + value labels
    pts.forEach(p=>{
      if(p.y===null)return;
      ctx.beginPath();ctx.arc(p.x,p.y,4,0,2*Math.PI);
      ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.fill();ctx.stroke();
    });
    values.forEach((v,i)=>{
      if(v===null)return;
      ctx.fillStyle=color;ctx.font='bold 10px Lato,sans-serif';ctx.textAlign='center';
      ctx.fillText(v.toFixed(v%1===0?0:1),xScale(i),yScale(v)-8);
    });
  });
}

// auto-draw on initial render
setTimeout(()=>{if(_vitalsView==='chart')drawVitalsChart(_activeVitalParam);},100);

// ═══════════════════════════════════════════════════════════════════
// TAB 3 — Записи
// ═══════════════════════════════════════════════════════════════════
function renderLogs(){
  const typeLabel={doctor:'Доктор',social:'Социјален',fizioterapevt:'Физио',supervisor:'Супервизор',other:'Друго'};
  const typeClass={doctor:'le-type-doctor',social:'le-type-social',fizioterapevt:'le-type-other',supervisor:'le-type-other',other:'le-type-other'};

  // Build month options from logs
  const monthsSet=new Set();
  _logs.forEach(l=>monthsSet.add(l.created_at.substring(0,7)));
  const months=[...monthsSet].sort((a,b)=>b.localeCompare(a));

  const monthOptions=months.map(m=>{
    const dt=new Date(m+'-01T00:00:00');
    const lbl=dt.toLocaleDateString('mk-MK',{month:'long',year:'numeric'});
    return`<option value="${m}" ${_logsMonthFilter===m?'selected':''}>${lbl}</option>`;
  }).join('');

  const filterRow=`
  <div class="logs-filter-row">
    <label class="cc-label" style="margin:0">Месец:</label>
    <select class="logs-month-select" id="cc-logs-month-sel">
      <option value="">Сите месеци</option>
      ${monthOptions}
    </select>
  </div>`;

  // Filter logs
  let filtered=_logsMonthFilter
    ?_logs.filter(l=>l.created_at.startsWith(_logsMonthFilter))
    :_logs;

  const overflow=filtered.length>LOGS_MAX;
  if(overflow)filtered=filtered.slice(0,LOGS_MAX);

  const entriesHtml=filtered.length
    ?filtered.map(l=>renderLogEntry(l,typeLabel,typeClass)).join('')
    :'<div class="cc-empty">Нема записи за овој месец.</div>';

  const overflowNote=overflow
    ?`<div class="logs-overflow-note">Прикажани се само ${LOGS_MAX} записи. За постари, користете го Logs табот со филтрирање по датум.</div>`:'';

  return`
  ${filterRow}
  <div id="cc-logs-container">${entriesHtml}</div>
  ${overflowNote}`;
}

function renderLogEntry(l,typeLabel,typeClass){
  const v=[];
  if(l.kp_sistolicen&&l.kp_dijastolicen) v.push(`КП: <span>${l.kp_sistolicen}/${l.kp_dijastolicen} mmHg</span>`);
  if(l.puls)        v.push(`Пулс: <span>${l.puls} bpm</span>`);
  if(l.temperatura) v.push(`Т°: <span>${l.temperatura}°C</span>`);
  if(l.spo2)        v.push(`SpO2: <span>${l.spo2}%</span>`);
  if(l.tezina)      v.push(`Тежина: <span>${l.tezina} kg</span>`);
  if(l.seker)       v.push(`Шеќер: <span>${l.seker} mmol/L</span>`);
  if(l.bolka!=null) v.push(`Болка: <span>${l.bolka}/10</span>`);
  return`<div class="log-entry-cc">
    <div class="le-top">
      <div>
        <span class="le-diag-cc">${e(l.dijagnoza_kod||'—')}${l.dijagnoza_opis?' — '+e(l.dijagnoza_opis):''}</span>
        <span class="le-type ${typeClass[l.log_type||'doctor']||'le-type-other'}">${typeLabel[l.log_type||'doctor']||'Друго'}</span>
      </div>
      <span class="le-date-cc">${new Date(l.created_at).toLocaleString('mk-MK')}</span>
    </div>
    ${v.length?`<div class="vital-grid" style="padding:0.5rem;margin:0.4rem 0">${v.map(x=>`<div class="vc">${x}</div>`).join('')}</div>`:''}
    ${l.anamneza?`<div class="le-field"><div class="le-fl">Анамнеза</div><div class="le-fv">${e(l.anamneza)}</div></div>`:''}
    ${l.naod?`<div class="le-field"><div class="le-fl">Наод</div><div class="le-fv">${e(l.naod)}</div></div>`:''}
    ${l.parenteralna?`<div class="le-field"><div class="le-fl">Парентерална</div><div class="le-fv">${e(l.parenteralna)}</div></div>`:''}
  </div>`;
}

function bindLogsFilter(){
  const sel=document.getElementById('cc-logs-month-sel');
  if(!sel)return;
  sel.addEventListener('change',()=>{
    _logsMonthFilter=sel.value||null;
    const body=document.getElementById('cc-body');
    body.innerHTML=renderLogs();
    bindLogsFilter();
  });
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4 — Лични податоци
// ═══════════════════════════════════════════════════════════════════
function renderInfo(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    Уреди
  </button>`:'';
  return`
  <div class="cc-section">
    <div class="cc-section-title">
      <span>Лични податоци</span>${editBtn}
    </div>
    <div class="cc-grid">
      <div class="cc-field"><div class="cc-label">Обраќање</div><div class="cc-value">${e(c.obrakanje||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Матичен број</div><div class="cc-value">${e(c.maticen_broj||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Ime и Презиме</div><div class="cc-value">${e(c.ime_prezime||'—')}</div></div>
      <div class="cc-field cc-full"><div class="cc-label">Адреса</div><div class="cc-value">${e(c.adresa||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Телефон</div><div class="cc-value">${e(c.telefon||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">ЕМБГ</div><div class="cc-value" style="font-family:monospace">${e(c.embg||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Лична карта / Пасош</div><div class="cc-value">${e(c.licna_karta_broj||'—')}</div></div>
      <div class="cc-field"><div class="cc-label">Датум на прием</div><div class="cc-value">${c.created_at?new Date(c.created_at).toLocaleDateString('mk-MK'):'—'}</div></div>
    </div>
  </div>`;
}

// ── Edit redirect ─────────────────────────────────────────────────
window.editClientData = function(clientId){
  closeClientCard();
  window.location.href=`clients.html?edit=${clientId}`;
};

})();

/*
═══════════════════════════════════════════════════════════════════════
BACKEND / SUPABASE NOTES
═══════════════════════════════════════════════════════════════════════

1. VITALS FROM LOGS (no schema change needed)
   The chart and list now pull vitals from `client_logs` (last 25 entries
   with at least one vital field filled in). The fields already exist:
     kp_sistolicen, kp_dijastolicen, puls, temperatura, spo2,
     respiracii, tezina, seker, bolka
   No new table needed — just make sure these are recorded when logging.

2. SOCIAL DOSIE FIELDS (may need adding to `clients` table)
   The social tab now displays:
     socijalen_rabotnik  TEXT  — Social worker name
     socijalen_dosie_br  TEXT  — Dosie number
     kategorija          TEXT  — Client category
     finansiranje        TEXT  — Financing source
   Add these columns if they don't exist:
     ALTER TABLE clients
       ADD COLUMN IF NOT EXISTS socijalen_rabotnik TEXT,
       ADD COLUMN IF NOT EXISTS socijalen_dosie_br TEXT,
       ADD COLUMN IF NOT EXISTS kategorija TEXT,
       ADD COLUMN IF NOT EXISTS finansiranje TEXT;

3. RESPIRACII in logs (may be missing)
   If `client_logs` doesn't have a `respiracii` column yet:
     ALTER TABLE client_logs ADD COLUMN IF NOT EXISTS respiracii NUMERIC;
   (Respiratory rate — shown in vitals list & chart)

4. AGE CALCULATION
   Age is derived from EMBG (Macedonian ID number). No DB change needed.
   The EMBG format encodes birthdate: DDMMYYYR...
   If EMBG is not stored, age will simply not display.

5. SRODSTVO (kinship)
   `client_srodstvo` is now fetched upfront (lightweight query) instead
   of on-demand, so it renders immediately in the Social tab.
   Make sure RLS allows the logged-in user to SELECT from this table.

6. LOGS MONTH FILTER
   Filtering is done client-side on the already-fetched 50 logs.
   If you want server-side month filtering for clients with many logs,
   add a Postgres index:
     CREATE INDEX IF NOT EXISTS idx_client_logs_client_date
       ON client_logs(client_id, created_at DESC);
═══════════════════════════════════════════════════════════════════════
*/
