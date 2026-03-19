/**
 * client-card.js
 * Shared client view modal — include on any protected page.
 * Call: openClientCard(clientId)
 * Requires: auth-guard.js (window._sb, window._username)
 */

(function(){

// ── Inject styles once ─────────────────────────────────────────────
const STYLE = `
<style id="cc-styles">
#cc-backdrop{display:none;position:fixed;inset:0;background:rgba(47,42,36,0.6);z-index:200;align-items:center;justify-content:center;padding:1rem}
#cc-backdrop.open{display:flex}
#cc-modal{background:#fff;border-radius:12px;width:100%;max-width:820px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.22);overflow:hidden}
#cc-header{padding:1.25rem 1.5rem 0;background:#fff;flex-shrink:0}
.cc-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem}
.cc-client-info{display:flex;align-items:center;gap:1rem}
.cc-avatar{width:52px;height:52px;border-radius:50%;object-fit:cover;background:var(--olive);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;flex-shrink:0;overflow:hidden}
.cc-avatar img{width:100%;height:100%;object-fit:cover}
.cc-name{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:600;color:var(--dark);line-height:1.2}
.cc-sub{font-size:0.78rem;color:var(--gray);margin-top:0.2rem}
.cc-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex;transition:color 0.15s}
.cc-close:hover{color:var(--dark)}
.cc-tabs{display:flex;gap:0;border-bottom:2px solid var(--border)}
.cc-tab{padding:0.65rem 1.1rem;font-family:'Lato',sans-serif;font-size:0.8rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.15s,border-color 0.15s;background:none;border-top:none;border-left:none;border-right:none}
.cc-tab.active{color:var(--olive);border-bottom-color:var(--olive)}
#cc-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem}
.cc-section{margin-bottom:1.5rem}
.cc-section-title{font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:600;color:var(--dark);margin-bottom:0.75rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border)}
.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem 1.5rem}
.cc-grid.three{grid-template-columns:1fr 1fr 1fr}
.cc-field{display:flex;flex-direction:column;gap:0.1rem}
.cc-label{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.cc-value{font-size:0.88rem;color:var(--dark);line-height:1.5}
.cc-full{grid-column:1/-1}
.therapy-tbl{width:100%;border-collapse:collapse;font-size:0.85rem}
.therapy-tbl th{text-align:left;font-size:0.67rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gray);padding:0.45rem 0.75rem;border-bottom:2px solid var(--border)}
.therapy-tbl td{padding:0.55rem 0.75rem;border-bottom:1px solid var(--border);vertical-align:middle}
.therapy-tbl tr:last-child td{border-bottom:none}
.vital-grid{display:flex;flex-wrap:wrap;gap:0.5rem 1.25rem;padding:0.75rem;background:var(--cream);border-radius:6px;border:1px solid var(--border)}
.vc{font-size:0.82rem;color:var(--dark)}.vc span{font-weight:700}
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
.badge-cc{display:inline-block;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase}
.badge-active{background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.badge-stopped{background:#f0ece2;color:#8a7a55}
.cc-empty{text-align:center;padding:2rem;color:var(--gray);font-size:0.85rem}
.cc-load-more{display:block;width:100%;padding:0.6rem;background:var(--cream);border:1px solid var(--border);border-radius:6px;font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;color:var(--gray);cursor:pointer;text-align:center;transition:background 0.15s;margin-top:0.5rem}
.cc-load-more:hover{background:var(--cream2)}
.cc-edit-btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 0.85rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.78rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.cc-edit-btn:hover{border-color:var(--olive);color:var(--olive)}
</style>`;

// ── Inject HTML skeleton ───────────────────────────────────────────
function injectDOM(){
  if(document.getElementById('cc-backdrop'))return;
  document.head.insertAdjacentHTML('beforeend',STYLE);
  document.body.insertAdjacentHTML('beforeend',`
  <div id="cc-backdrop">
    <div id="cc-modal" role="dialog" aria-modal="true">
      <div id="cc-header">
        <div class="cc-top">
          <div class="cc-client-info">
            <div class="cc-avatar" id="cc-avatar">?</div>
            <div>
              <div class="cc-name" id="cc-name">…</div>
              <div class="cc-sub" id="cc-sub"></div>
            </div>
          </div>
          <button class="cc-close" id="cc-close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="cc-tabs">
          <button class="cc-tab active" data-tab="info">Лични податоци</button>
          <button class="cc-tab" data-tab="dosie">Медицинско досие</button>
          <button class="cc-tab" data-tab="logs">Записи</button>
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

// ── State ──────────────────────────────────────────────────────────
let _client=null, _therapy=[], _logs=[], _logsOffset=0, _logsPageSize=10;

// ── Public API ─────────────────────────────────────────────────────
window.openClientCard = async function(clientId){
  injectDOM();
  _logsOffset=0;
  document.getElementById('cc-body').innerHTML='<div class="cc-empty">Се вчитува…</div>';
  // Reset tabs
  document.querySelectorAll('.cc-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('.cc-tab[data-tab="info"]').classList.add('active');
  document.getElementById('cc-backdrop').classList.add('open');
  document.body.style.overflow='hidden';

  const [clientRes, therapyRes, logsRes] = await Promise.all([
    window._sb.from('clients').select(`
      id,ime_prezime,obrakanje,maticen_broj,embg,licna_karta_broj,
      adresa,telefon,floor_number,room_number,bed_number,
      profile_pic_url,status,created_at,
      priem_dijagnoza_kod,priem_dijagnoza_opis,priem_anamneza,priem_naod,priem_notes,
      priem_kp_sistolicen,priem_kp_dijastolicen,priem_puls,priem_temperatura,
      priem_spo2,priem_respiracii,priem_tezina,priem_seker,priem_bolka,
      client_chronic_diagnoses(kod,opis,added_at)
    `).eq('id',clientId).single(),
    window._sb.from('client_chronic_therapy').select('*').eq('client_id',clientId).order('added_at'),
    window._sb.from('client_logs').select('*').eq('client_id',clientId).order('created_at',{ascending:false}).range(0,_logsPageSize-1),
  ]);

  _client = clientRes.data;
  _therapy = therapyRes.data||[];
  _logs = logsRes.data||[];

  if(!_client){document.getElementById('cc-body').innerHTML='<div class="cc-empty">Корисникот не е пронајден.</div>';return;}

  // Header
  const initials = (_client.ime_prezime||'?').charAt(0);
  const avatarEl = document.getElementById('cc-avatar');
  if(_client.profile_pic_url){
    avatarEl.innerHTML=`<img src="${e(_client.profile_pic_url)}" alt=""/>`;
  } else {
    avatarEl.textContent=initials;
  }
  document.getElementById('cc-name').textContent=(_client.obrakanje?_client.obrakanje+' ':'')+(_client.ime_prezime||'');
  const loc=_client.floor_number?`Кат ${_client.floor_number} / Соба ${_client.room_number} / Кревет ${_client.bed_number}`:'—';
  document.getElementById('cc-sub').textContent=loc;

  renderTab('info');
};

window.closeClientCard = function(){
  const bd=document.getElementById('cc-backdrop');
  if(bd)bd.classList.remove('open');
  document.body.style.overflow='';
};

// ── Role helpers ──────────────────────────────────────────────────
function isPrivileged(){const u=(window._username||'').toLowerCase();return u==='menadzer'||u==='glavnasestra';}
function isDoctor(){return(window._username||'').toLowerCase()==='doktor';}
function canSeeAll(){return isPrivileged()||isDoctor();}

// ── Tab rendering ──────────────────────────────────────────────────
function renderTab(tab){
  const body=document.getElementById('cc-body');
  if(tab==='info')    body.innerHTML=renderInfo();
  else if(tab==='dosie') body.innerHTML=renderDosie();
  else if(tab==='logs')  { body.innerHTML=renderLogs(_logs,false); bindLoadMore(); }
}

// ── Tab 1: Лични податоци ─────────────────────────────────────────
function renderInfo(){
  const c=_client;
  const editBtn=isPrivileged()?`<button class="cc-edit-btn" onclick="editClientData('${e(c.id)}')">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    Уреди
  </button>`:'';
  return`
  <div class="cc-section">
    <div class="cc-section-title" style="display:flex;align-items:center;justify-content:space-between">
      <span>Основни информации</span>${editBtn}
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
      <div class="cc-field"><div class="cc-label">Сместување</div><div class="cc-value">${c.floor_number?`Кат ${c.floor_number} / Соба ${c.room_number} / Кревет ${c.bed_number}`:'—'}</div></div>
    </div>
  </div>
  ${renderSrodstvo()}`;
}

function renderSrodstvo(){
  // We don't load srodstvo in the main query to keep it light — show link
  return`<div class="cc-section">
    <div class="cc-section-title">Сродство</div>
    <div id="cc-srodstvo-wrap"><div class="cc-empty" style="padding:1rem">
      <button class="cc-load-more" onclick="loadSrodstvo('${e(_client.id)}')">Прикажи сродство</button>
    </div></div>
  </div>`;
}

// ── Tab 2: Медицинско досие ───────────────────────────────────────
function renderDosie(){
  if(!canSeeAll()) return`<div class="cc-empty">Немате пристап до медицинското досие.</div>`;
  const c=_client;
  const active=_therapy.filter(t=>t.active);
  const stopped=_therapy.filter(t=>!t.active);
  const diags=(c.client_chronic_diagnoses||[]);

  // Vitals on priem
  const vitals=[];
  if(c.priem_kp_sistolicen&&c.priem_kp_dijastolicen) vitals.push(`КП: <span>${c.priem_kp_sistolicen}/${c.priem_kp_dijastolicen} mmHg</span>`);
  if(c.priem_puls)        vitals.push(`Пулс: <span>${c.priem_puls} bpm</span>`);
  if(c.priem_temperatura) vitals.push(`Т°: <span>${c.priem_temperatura}°C</span>`);
  if(c.priem_spo2)        vitals.push(`SpO2: <span>${c.priem_spo2}%</span>`);
  if(c.priem_respiracii)  vitals.push(`Респ: <span>${c.priem_respiracii}/мин</span>`);
  if(c.priem_tezina)      vitals.push(`Тежина: <span>${c.priem_tezina} kg</span>`);
  if(c.priem_seker)       vitals.push(`Шеќер: <span>${c.priem_seker} mmol/L</span>`);
  if(c.priem_bolka!=null) vitals.push(`Болка: <span>${c.priem_bolka}/10</span>`);

  return`
  <div class="cc-section">
    <div class="cc-section-title">Дијагноза на прием</div>
    ${c.priem_dijagnoza_kod
      ?`<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
          <span style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--olive)">${e(c.priem_dijagnoza_kod)}</span>
          <span style="font-size:0.88rem;color:var(--dark)">${e(c.priem_dijagnoza_opis||'')}</span>
        </div>`
      :'<div class="cc-empty" style="padding:0.5rem">Нема внесена дијагноза на прием.</div>'}
    ${vitals.length?`<div class="vital-grid">${vitals.map(v=>`<div class="vc">${v}</div>`).join('')}</div>`:''}
    ${c.priem_anamneza?`<div style="margin-top:0.75rem"><div class="cc-label">Анамнеза</div><div class="cc-value" style="margin-top:0.2rem">${e(c.priem_anamneza)}</div></div>`:''}
    ${c.priem_naod?`<div style="margin-top:0.5rem"><div class="cc-label">Наод</div><div class="cc-value" style="margin-top:0.2rem">${e(c.priem_naod)}</div></div>`:''}
    ${c.priem_notes?`<div style="margin-top:0.5rem"><div class="cc-label">Белешки</div><div class="cc-value" style="margin-top:0.2rem">${e(c.priem_notes)}</div></div>`:''}
  </div>

  <div class="cc-section">
    <div class="cc-section-title">Хронични дијагнози</div>
    ${!diags.length?'<div class="cc-empty" style="padding:0.5rem">Нема хронични дијагнози.</div>'
      :`<div style="display:flex;flex-direction:column;gap:0.4rem">
          ${diags.map(d=>`<div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:var(--cream);border:1px solid var(--border);border-radius:4px">
            <span style="font-family:monospace;font-size:0.82rem;font-weight:700;color:var(--olive);flex-shrink:0">${e(d.kod)}</span>
            <span style="font-size:0.85rem">${e(d.opis||'—')}</span>
          </div>`).join('')}
        </div>`}
  </div>

  <div class="cc-section">
    <div class="cc-section-title">Тековна терапија</div>
    ${!active.length?'<div class="cc-empty" style="padding:0.5rem">Нема активна терапија.</div>'
      :`<table class="therapy-tbl">
          <thead><tr><th>Лек</th><th>Доза</th><th>Додадена</th><th>Статус</th></tr></thead>
          <tbody>${active.map(t=>`<tr>
            <td style="font-weight:700">${e(t.drug_name)}</td>
            <td>${e(t.dosage)}</td>
            <td>${new Date(t.added_at).toLocaleDateString('mk-MK')}</td>
            <td><span class="badge-cc badge-active">Активна</span></td>
          </tr>`).join('')}</tbody>
        </table>`}
    ${stopped.length?`<details style="margin-top:0.75rem"><summary style="cursor:pointer;font-size:0.78rem;color:var(--olive);font-weight:700">Стопирана терапија (${stopped.length})</summary>
      <table class="therapy-tbl" style="margin-top:0.5rem"><thead><tr><th>Лек</th><th>Доза</th><th>Статус</th></tr></thead>
      <tbody>${stopped.map(t=>`<tr style="opacity:0.5;text-decoration:line-through"><td>${e(t.drug_name)}</td><td>${e(t.dosage)}</td><td><span class="badge-cc badge-stopped">Стопирана</span></td></tr>`).join('')}</tbody></table>
    </details>`:''}
  </div>`;
}

// ── Tab 3: Записи ─────────────────────────────────────────────────
function renderLogs(logs, append){
  if(!logs.length && !append) return`<div class="cc-empty">Нема записи за овој корисник.</div>`;
  const typeLabel={doctor:'Доктор',social:'Социјален',fizioterapevt:'Физио',supervisor:'Супервизор',other:'Друго'};
  const typeClass={doctor:'le-type-doctor',social:'le-type-social',fizioterapevt:'le-type-other',supervisor:'le-type-other',other:'le-type-other'};
  const entries=logs.map(l=>{
    const v=[];
    if(l.kp_sistolicen&&l.kp_dijastolicen)v.push(`КП: <span>${l.kp_sistolicen}/${l.kp_dijastolicen} mmHg</span>`);
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
  }).join('');

  const loadMoreBtn=logs.length===_logsPageSize
    ?`<button class="cc-load-more" id="cc-load-more-btn">Прикажи постари записи</button>`:'' ;

  if(append){
    const existing=document.getElementById('cc-logs-container');
    if(existing){existing.insertAdjacentHTML('beforeend',entries);}
    const oldBtn=document.getElementById('cc-load-more-btn');
    if(oldBtn)oldBtn.remove();
    document.getElementById('cc-body').insertAdjacentHTML('beforeend',loadMoreBtn);
    bindLoadMore();
    return;
  }
  return`<div id="cc-logs-container">${entries}</div>${loadMoreBtn}`;
}

function bindLoadMore(){
  const btn=document.getElementById('cc-load-more-btn');
  if(!btn)return;
  btn.addEventListener('click',async()=>{
    _logsOffset+=_logsPageSize;
    btn.textContent='Се вчитува…';btn.disabled=true;
    const{data}=await window._sb.from('client_logs').select('*')
      .eq('client_id',_client.id).order('created_at',{ascending:false})
      .range(_logsOffset,_logsOffset+_logsPageSize-1);
    _logs=[..._logs,...(data||[])];
    renderLogs(data||[],true);
  });
}

// ── Load srodstvo on demand ───────────────────────────────────────
window.loadSrodstvo = async function(clientId){
  const{data}=await window._sb.from('client_srodstvo').select('*').eq('client_id',clientId);
  const wrap=document.getElementById('cc-srodstvo-wrap');
  if(!wrap)return;
  if(!data||!data.length){wrap.innerHTML='<div class="cc-empty" style="padding:0.5rem">Нема внесено сродство.</div>';return;}
  wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:0.5rem">
    ${data.map(s=>`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;padding:0.65rem 0.85rem;background:var(--cream);border:1px solid var(--border);border-radius:5px;font-size:0.85rem">
      <div><div class="cc-label">Ime</div><div>${e(s.ime_prezime||'—')}</div></div>
      <div><div class="cc-label">Адреса</div><div>${e(s.adresa||'—')}</div></div>
      <div><div class="cc-label">Телефон</div><div>${e(s.telefon||'—')}</div></div>
    </div>`).join('')}
  </div>`;
};

// ── Edit redirect (for Menadzer/GS) ──────────────────────────────
window.editClientData = function(clientId){
  closeClientCard();
  window.location.href=`clients.html?edit=${clientId}`;
};

// ── Escape helper ─────────────────────────────────────────────────
function e(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

})();
