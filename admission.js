/**
 * admission.js — Self-contained admission modal
 * Requires: auth-guard.js (window._sb, window._user, window._username)
 * Requires: sidebar.js  (window.roomToFloor)
 * Public API:
 *   window.openNewAdmission(callback)
 *   window.openAdmissionForClient(clientId, callback)
 */
(function () {

  let step=1, clientId=null, picFile=null, uploadFiles=[], srodstvoItems=[];
  let chronicDiagItems=[], chronicTherapyItems=[], selectedDrugObj=null;
  let drugTimer=null, _closeCallback=null;

  function u(){ return (window._username||'').toLowerCase(); }
  function isManager(){ return u()==='menadzer'||u()==='glavnasestra'; }
  function isDoctor(){  return u()==='doktor'; }
  function isSocial(){  return u()==='socijalenrabotnik'; }

  // ── Room → Floor (84 rooms, 5 floors) ─────────────────────────
  function roomToFloor(r){
    r=parseInt(r);
    if(r>=1  && r<=16) return 1;
    if(r>=17 && r<=33) return 2;
    if(r>=34 && r<=50) return 3;
    if(r>=51 && r<=67) return 4;
    if(r>=68 && r<=84) return 5;
    return null;
  }

  // Room options 1-84
  const ROOM_OPTIONS = Array.from({length:84},(_,i)=>`<option value="${i+1}">Соба ${i+1}</option>`).join('');

  // ── Inject DOM once ────────────────────────────────────────────
  function inject() {
    if (document.getElementById('adm-bd')) return;
    document.head.insertAdjacentHTML('beforeend', ADM_CSS);
    document.body.insertAdjacentHTML('beforeend', ADM_HTML);
    document.getElementById('adm-close-btn').addEventListener('click', close);
    document.getElementById('adm-cancel-btn').addEventListener('click', close);
    document.getElementById('adm-bd').addEventListener('click', e => { if (e.target.id === 'adm-bd') close(); });
    document.getElementById('adm-save-btn').addEventListener('click', handleSave);
    document.getElementById('adm-pic-file').addEventListener('change', handlePic);
    document.getElementById('adm-docs-file').addEventListener('change', handleDocs);
  }

  // ── Public API ─────────────────────────────────────────────────
  function openNew(cb) {
    _closeCallback = cb || null;
    inject(); reset(); step=1; clientId=null;
    document.getElementById('adm-title').textContent='Регистрација на нов корисник';
    render(); show();
  }

  async function openExisting(id, cb) {
    _closeCallback = cb || null;
    inject(); reset(); clientId=id;
    const {data}=await window._sb.from('clients').select('status').eq('id',id).single();
    const st=data?.status||'draft';
    document.getElementById('adm-title').textContent='Продолжи со прием';
    if(st==='doctor') step=2;
    else if(st==='social') step=3;
    else step=1;
    render(); show();
  }

  function reset(){
    step=1; clientId=null; picFile=null; uploadFiles=[]; srodstvoItems=[];
    chronicDiagItems=[]; chronicTherapyItems=[]; selectedDrugObj=null; clearErr();
  }

  function show(){ document.getElementById('adm-bd').classList.add('open'); document.body.style.overflow='hidden'; }
  function close(){
    document.getElementById('adm-bd').classList.remove('open');
    document.body.style.overflow='';
    if(typeof _closeCallback==='function') _closeCallback();
    // Legacy support
    if(typeof window.onAdmissionClose==='function') window.onAdmissionClose();
  }

  // ── Step indicator ─────────────────────────────────────────────
  function updateSteps(){
    document.querySelectorAll('.a-step').forEach(el=>{
      const s=parseInt(el.dataset.step);
      el.classList.toggle('active',s===step);
      el.classList.toggle('done',s<step);
    });
  }

  // ── Render ─────────────────────────────────────────────────────
  function render(){
    updateSteps(); clearErr();
    const sb=document.getElementById('adm-save-btn');
    if(step===1){
      if(!isManager()){renderInfo('Чекор 1 го пополнуваат Менаџерот или Главната Сестра.');sb.style.display='none';return;}
      sb.style.display='';sb.textContent='Зачувај и продолжи'; renderStep1();
    } else if(step===2){
      if(isDoctor()){sb.style.display='';sb.textContent='Потврди — Доктор';renderStep2();}
      else if(isManager()){sb.style.display='none';renderStatusView(2);}
      else{renderInfo('Чекор 2 го пополнува Докторот.');sb.style.display='none';}
    } else {
      if(isSocial()){sb.style.display='';sb.textContent='Заврши прием';renderStep3();}
      else if(isManager()){sb.style.display='none';renderStatusView(3);}
      else{renderInfo('Чекор 3 го пополнува Социјалниот Работник.');sb.style.display='none';}
    }
  }

  function renderInfo(msg){
    document.getElementById('adm-body').innerHTML=`<div class="a-pending"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><strong>Информација</strong><p>${ee(msg)}</p></div>`;
  }

  function renderStatusView(upTo){
    let h=`<div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 1 — Општи податоци</span><span class="badge-compl">Завршен</span></div><div class="ssc-b">Основните информации се снимени.</div></div>`;
    if(upTo>=3) h+=`<div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 2 — Доктор</span><span class="badge-compl">Завршен</span></div><div class="ssc-b">Докторот го завршил делот.</div></div><div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 3 — Социјален работник</span><span class="badge-wait">На чекање</span></div><div class="ssc-b">Чека на Социјалниот работник.</div></div>`;
    else h+=`<div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 2 — Доктор</span><span class="badge-wait">На чекање</span></div><div class="ssc-b">Чека на Докторот да го пополни.</div></div>`;
    document.getElementById('adm-body').innerHTML=h;
  }

  // ── Step 1 ─────────────────────────────────────────────────────
  function renderStep1(){
    document.getElementById('adm-body').innerHTML=`
    <div class="a-fg"><div class="a-lbl">Профилна слика <span style="font-weight:400;color:var(--gray)">(опционално)</span></div>
      <div class="a-pic-wrap"><div class="a-pic-prev" id="a-pic-prev"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div><button class="a-btn-up" onclick="document.getElementById('adm-pic-file').click()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Избери слика</button>
      <div style="font-size:0.74rem;color:var(--gray);margin-top:0.3rem">JPG/PNG до 5MB</div></div></div></div>
    <div class="a-sect"><div class="a-sect-t">Основни податоци</div>
    <div class="a-grid" style="margin-top:0.7rem">
      <div class="a-fg"><label class="a-lbl">Обраќање <span class="req">*</span></label><select class="a-sel" id="f_ob"><option value="">— Изберете —</option><option>Г-дин</option><option>Г-ѓа</option><option>Г-ца</option></select></div>
      <div class="a-fg"><label class="a-lbl">Матичен број <span class="req">*</span></label><input class="a-inp" id="f_mat" placeholder="нпр. 123456"/></div>
      <div class="a-fg full"><label class="a-lbl">Ime и Презиме <span class="req">*</span></label><input class="a-inp" id="f_ime" placeholder="Марија Петровска"/></div>
      <div class="a-fg full"><label class="a-lbl">Адреса <span class="req">*</span></label><input class="a-inp" id="f_adr" placeholder="ул. Климент Охридски 5, Скопје"/></div>
      <div class="a-fg"><label class="a-lbl">ЕМБГ <span class="req">*</span></label><input class="a-inp" id="f_emb" maxlength="13" placeholder="0101950450001"/></div>
      <div class="a-fg"><label class="a-lbl">Телефон <span class="req">*</span></label><input class="a-inp" id="f_tel" type="tel" placeholder="+389 70 000 000"/></div>
      <div class="a-fg full"><label class="a-lbl">Лична карта / Пасош <span class="req">*</span></label><input class="a-inp" id="f_lk" placeholder="нпр. 1234567"/></div>
    </div></div>
    <div class="a-sect"><div class="a-sect-t">Сместување <span class="req">*</span></div>
    <div class="a-sect-s">Изберете соба и кревет. Слободноста се проверува автоматски. Катот се одредува автоматски.</div>
    <div class="a-grid" style="margin-top:0.5rem">
      <div class="a-fg"><label class="a-lbl">Соба <span class="req">*</span></label>
        <select class="a-sel" id="f_rm" onchange="admBedCheck()">
          <option value="">— Соба —</option>
          ${ROOM_OPTIONS}
        </select>
      </div>
      <div class="a-fg"><label class="a-lbl">Кревет <span class="req">*</span></label>
        <select class="a-sel" id="f_bd" onchange="admBedCheck()">
          <option value="">— Кревет —</option>
          <option value="1">Кревет 1</option>
          <option value="2">Кревет 2</option>
        </select>
      </div>
      <div class="a-fg" id="a-floor-info-wrap" style="display:none">
        <label class="a-lbl">Кат (автоматски)</label>
        <div id="a-floor-info" style="padding:0.65rem 0.8rem;background:var(--cream);border:1px solid var(--border);border-radius:4px;font-size:0.9rem;color:var(--gray)">—</div>
      </div>
      <div class="a-fg" style="justify-content:flex-end"><div id="a-bed-st" style="padding-bottom:0.65rem"></div></div>
    </div></div>
    <div class="a-sect"><div class="a-sect-t">Сродство</div><div class="a-sect-s">Лица за контакт (може повеќе)</div>
    <div id="a-sr-list"></div>
    <button class="btn-dash" id="a-add-sr-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Додај сродник</button></div>
    <div class="a-sect"><div class="a-sect-t">Документи <span style="font-weight:400;font-size:0.85rem;color:var(--gray)">(опционално)</span></div>
    <div class="a-file-dz" onclick="document.getElementById('adm-docs-file').click()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4;display:block;margin:0 auto 0.4rem"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Кликнете за да изберете датотеки</div>
    <div id="a-file-list" style="margin-top:0.5rem;display:flex;flex-direction:column;gap:0.35rem"></div></div>`;
    document.getElementById('a-add-sr-btn').addEventListener('click',()=>{srodstvoItems.push({ime_prezime:'',adresa:'',telefon:''});renderSR();});
    const dz=document.querySelector('.a-file-dz');
    if(dz){dz.addEventListener('dragover',ev=>{ev.preventDefault();dz.style.borderColor='var(--olive)';});dz.addEventListener('dragleave',()=>{dz.style.borderColor='';});dz.addEventListener('drop',ev=>{ev.preventDefault();dz.style.borderColor='';uploadFiles=[...uploadFiles,...Array.from(ev.dataTransfer.files)];renderFiles();});}
    renderSR(); renderFiles();
  }

  // ── Step 2: Doctor ─────────────────────────────────────────────
  function renderStep2(){
    document.getElementById('adm-body').innerHTML=`
    <div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 1 — Општи податоци</span><span class="badge-compl">Завршен</span></div><div class="ssc-b">Основните информации се снимени.</div></div>
    <div class="a-sect" style="margin-top:0;padding-top:0;border-top:none">
      <div class="a-sect-t">Дијагноза на прием <span class="req">*</span></div>
      <div class="a-sect-s">Внесете МКБ-10 код и кликнете „Пребарај", или пребарајте по опис.</div>
      <div class="mkb-row">
        <div class="a-fg" style="flex:0 0 120px;position:relative">
          <label class="a-lbl">Код</label>
          <input class="a-inp" id="d_kod" placeholder="A00.1" style="text-transform:uppercase" oninput="admMKBLive('d_kod','d_opis','d_kod_dd')"/>
          <div class="adm-dd" id="d_kod_dd"></div>
        </div>
        <div class="a-fg" style="flex:1;min-width:150px">
          <label class="a-lbl">Опис</label>
          <input class="a-inp" id="d_opis" readonly placeholder="Се пополнува по пребарување"/>
        </div>
        <div class="a-fg" style="flex-shrink:0">
          <label class="a-lbl">&nbsp;</label>
          <button class="btn-mkb" onclick="admMKB('d_kod','d_opis','d_kod_dd')">Пребарај</button>
        </div>
      </div>
    </div>
    <div class="a-sect"><div class="a-sect-t">Анамнеза</div><textarea class="a-ta" id="d_ana" rows="3" placeholder="Анамнестички податоци…"></textarea></div>
    <div class="a-sect"><div class="a-sect-t">Витални параметри на прием</div>
    <div class="a-grid" style="margin-top:0.65rem">
      <div class="a-fg"><label class="a-lbl">КП Систоличен (mmHg)</label><input class="a-inp" id="d_kps" type="number" placeholder="120"/></div>
      <div class="a-fg"><label class="a-lbl">КП Дијастоличен (mmHg)</label><input class="a-inp" id="d_kpd" type="number" placeholder="80"/></div>
      <div class="a-fg"><label class="a-lbl">Пулс (bpm)</label><input class="a-inp" id="d_pls" type="number" placeholder="72"/></div>
      <div class="a-fg"><label class="a-lbl">Температура (°C)</label><input class="a-inp" id="d_tmp" type="number" step="0.1" placeholder="36.6"/></div>
      <div class="a-fg"><label class="a-lbl">SpO2 (%)</label><input class="a-inp" id="d_spo" type="number" placeholder="98"/></div>
      <div class="a-fg"><label class="a-lbl">Респирации (/мин)</label><input class="a-inp" id="d_res" type="number" placeholder="16"/></div>
      <div class="a-fg"><label class="a-lbl">Тежина (kg)</label><input class="a-inp" id="d_tez" type="number" step="0.1" placeholder="72.5"/></div>
      <div class="a-fg"><label class="a-lbl">Крвен шеќер (mmol/L)</label><input class="a-inp" id="d_sek" type="number" step="0.1" placeholder="5.4"/></div>
      <div class="a-fg full"><label class="a-lbl">Скала на болка (0–10)</label>
        <div class="a-range-wrap"><input type="range" id="d_blk" min="0" max="10" value="0" oninput="document.getElementById('d_blk_v').textContent=this.value"/><span class="a-range-val" id="d_blk_v">0</span></div>
      </div>
    </div></div>
    <div class="a-sect"><div class="a-sect-t">Наод</div><textarea class="a-ta" id="d_naod" rows="3" placeholder="Клинички наод…"></textarea></div>
    <div class="a-sect"><div class="a-sect-t">Хронични дијагнози</div>
      <div id="a-cd-list" style="margin-bottom:0.65rem"></div>
      <div style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap">
        <div class="a-fg" style="flex:0 0 120px;position:relative">
          <label class="a-lbl">Код</label>
          <input class="a-inp" id="cd_kod" placeholder="нпр. I10" style="text-transform:uppercase" oninput="admMKBLive('cd_kod','cd_opis','cd_kod_dd')"/>
          <div class="adm-dd" id="cd_kod_dd"></div>
        </div>
        <div class="a-fg" style="flex:1;min-width:150px"><label class="a-lbl">Опис</label><input class="a-inp" id="cd_opis" readonly placeholder="Се пополнува по пребарување"/></div>
        <div class="a-fg" style="flex-shrink:0"><label class="a-lbl">&nbsp;</label><button class="btn-mkb" onclick="admMKB('cd_kod','cd_opis','cd_kod_dd')">Пребарај</button></div>
        <div class="a-fg" style="flex-shrink:0"><label class="a-lbl">&nbsp;</label><button class="btn-dash" onclick="admAddCD()">+ Додај</button></div>
      </div>
    </div>
    <div class="a-sect"><div class="a-sect-t">Хронична терапија</div>
      <div id="a-ct-list" style="margin-bottom:0.65rem"></div>
      <div style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap">
        <div class="a-fg" style="flex:1;min-width:200px;position:relative">
          <label class="a-lbl">Лек (пребарај — мин. 3 знаци)</label>
          <input class="a-inp" id="ct_drug" placeholder="нпр. Metformin…" autocomplete="off" oninput="admDrugSearch(this.value)"/>
          <div class="adm-dd" id="ct_drug_dd"></div>
        </div>
        <div class="a-fg" style="flex:0 0 165px"><label class="a-lbl">Доза</label><input class="a-inp" id="ct_dose" placeholder="нпр. 1×1 tabl."/></div>
        <div class="a-fg" style="flex-shrink:0"><label class="a-lbl">&nbsp;</label><button class="btn-dash" onclick="admAddCT()">+ Додај</button></div>
      </div>
      <div style="font-size:0.74rem;color:var(--gray);margin-top:0.35rem">Ако лекот не е во базата, може рачно да го внесете.</div>
    </div>
    <div class="a-sect"><div class="a-sect-t">Белешки</div><textarea class="a-ta" id="d_notes" rows="2" placeholder="Дополнителни белешки…"></textarea></div>`;
    ['d_kod','cd_kod'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();admMKB(id,id==='d_kod'?'d_opis':'cd_opis',id+'_dd');}});});
  }

  // ── Step 3: Social ─────────────────────────────────────────────
  function renderStep3(){
    document.getElementById('adm-body').innerHTML=`
    <div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 1 — Општи податоци</span><span class="badge-compl">Завршен</span></div><div class="ssc-b">Основните информации се снимени.</div></div>
    <div class="ssc"><div class="ssc-h"><span class="ssc-ht">Чекор 2 — Доктор</span><span class="badge-compl">Завршен</span></div><div class="ssc-b">Докторот го завршил делот.</div></div>
    <div class="a-pending"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    <strong>Чекор 3 — Социјален Работник</strong>
    <p>Полињата за социјалниот работник ќе бидат додадени подоцна. Кликнете „Заврши прием" за да го комплетирате приемот.</p></div>`;
  }

  // ── Save dispatcher ────────────────────────────────────────────
  async function handleSave(){
    clearErr();
    const btn=document.getElementById('adm-save-btn');
    btn.disabled=true;
    try{
      if(step===1) await save1();
      else if(step===2) await save2();
      else await save3();
    } finally { btn.disabled=false; }
  }

  function nv(id){const v=document.getElementById(id)?.value;return(v&&v.trim())?parseFloat(v):null;}

  async function save1(){
    const reqs=[['f_ob','Обраќање'],['f_mat','Матичен број'],['f_ime','Ime и Презиме'],['f_adr','Адреса'],['f_emb','ЕМБГ'],['f_tel','Телефон'],['f_lk','Лична карта/Пасош'],['f_rm','Соба'],['f_bd','Кревет']];
    for(const[id,lbl]of reqs){const el=document.getElementById(id);if(!el||!el.value.trim()){if(el){el.classList.add('a-err');el.focus();}setErr(`Полето „${lbl}" е задолжително.`);return;}el.classList.remove('a-err');}
    const rm=parseInt(document.getElementById('f_rm').value);
    const bd=parseInt(document.getElementById('f_bd').value);
    const fl=roomToFloor(rm);
    if(!fl){setErr('Невалидна соба.');return;}
    const{data:taken}=await window._sb.from('clients').select('id').eq('room_number',rm).eq('bed_number',bd).neq('status','discharged').maybeSingle();
    if(taken){setErr('Избраниот кревет е веќе зафатен. Изберете друг.');return;}
    let picUrl=null;
    if(picFile){const ext=picFile.name.split('.').pop();const path=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const{error:ue}=await window._sb.storage.from('client-photos').upload(path,picFile);if(!ue){const{data:ud}=window._sb.storage.from('client-photos').getPublicUrl(path);picUrl=ud?.publicUrl||null;}}
    const payload={obrakanje:document.getElementById('f_ob').value,maticen_broj:document.getElementById('f_mat').value.trim(),ime_prezime:document.getElementById('f_ime').value.trim(),adresa:document.getElementById('f_adr').value.trim(),embg:document.getElementById('f_emb').value.trim(),telefon:document.getElementById('f_tel').value.trim(),licna_karta_broj:document.getElementById('f_lk').value.trim(),floor_number:fl,room_number:rm,bed_number:bd,profile_pic_url:picUrl,status:'doctor',created_by:window._user.id};
    const{data,error}=await window._sb.from('clients').insert([payload]).select('id').single();
    if(error){if(error.code==='23505')setErr('Избраниот кревет е веќе зафатен.');else setErr('Грешка: '+error.message);return;}
    clientId=data.id;
    const srRows=srodstvoItems.filter(s=>s.ime_prezime.trim()).map(s=>({client_id:clientId,...s}));
    if(srRows.length) await window._sb.from('client_srodstvo').insert(srRows);
    for(const f of uploadFiles) await window._sb.storage.from('client-files').upload(`${clientId}/${Date.now()}-${f.name}`,f);
    step=2; render();
  }

  async function save2(){
    const kod=(document.getElementById('d_kod')?.value||'').trim().toUpperCase();
    if(!kod){setErr('Дијагнозата на прием е задолжителна.');return;}
    const update={
      priem_dijagnoza_kod:kod, priem_dijagnoza_opis:document.getElementById('d_opis')?.value||null,
      priem_anamneza:document.getElementById('d_ana')?.value||null,
      priem_naod:document.getElementById('d_naod')?.value||null,
      priem_notes:document.getElementById('d_notes')?.value||null,
      priem_kp_sistolicen:nv('d_kps'), priem_kp_dijastolicen:nv('d_kpd'),
      priem_puls:nv('d_pls'), priem_temperatura:nv('d_tmp'), priem_spo2:nv('d_spo'),
      priem_respiracii:nv('d_res'), priem_tezina:nv('d_tez'), priem_seker:nv('d_sek'),
      priem_bolka:parseInt(document.getElementById('d_blk')?.value||'0'),
      status:'social', doctor_completed_at:new Date().toISOString(), doctor_completed_by:window._user.id,
    };
    const{error}=await window._sb.from('clients').update(update).eq('id',clientId);
    if(error){setErr('Грешка: '+error.message);return;}
    if(chronicDiagItems.length) await window._sb.from('client_chronic_diagnoses').insert(chronicDiagItems.map(d=>({client_id:clientId,kod:d.kod,opis:d.opis,added_by:window._user.id})));
    if(chronicTherapyItems.length) await window._sb.from('client_chronic_therapy').insert(chronicTherapyItems.map(t=>({client_id:clientId,drug_name:t.drug_name,dosage:t.dosage,added_by:window._user.id})));
    step=3; render();
  }

  async function save3(){
    const{error}=await window._sb.from('clients').update({status:'completed',social_completed_at:new Date().toISOString(),social_completed_by:window._user.id}).eq('id',clientId);
    if(error){setErr('Грешка: '+error.message);return;}
    close();
  }

  // ── Helper renderers ───────────────────────────────────────────
  function renderSR(){const el=document.getElementById('a-sr-list');if(!el)return;el.innerHTML=srodstvoItems.map((it,i)=>`<div class="sr-item"><button class="sr-rm" onclick="admRemSR(${i})">×</button><div class="sr-grid"><div class="a-fg"><label class="a-lbl">Ime и Презиме</label><input class="a-inp" value="${ee(it.ime_prezime)}" oninput="admUpdSR(${i},'ime_prezime',this.value)" placeholder="Петар Петровски"/></div><div class="a-fg"><label class="a-lbl">Адреса</label><input class="a-inp" value="${ee(it.adresa)}" oninput="admUpdSR(${i},'adresa',this.value)" placeholder="Адреса"/></div><div class="a-fg"><label class="a-lbl">Телефон</label><input class="a-inp" value="${ee(it.telefon)}" oninput="admUpdSR(${i},'telefon',this.value)" placeholder="+389 70 000 000"/></div></div></div>`).join('');}
  window.admRemSR=function(i){srodstvoItems.splice(i,1);renderSR();};
  window.admUpdSR=function(i,f,v){srodstvoItems[i][f]=v;};

  function renderCD(){const el=document.getElementById('a-cd-list');if(!el)return;el.innerHTML=chronicDiagItems.map((d,i)=>`<div class="a-added"><span class="adm-dd-code">${ee(d.kod)}</span><span style="flex:1;font-size:0.85rem">${ee(d.opis||'—')}</span><button class="a-rm" onclick="admRemCD(${i})">×</button></div>`).join('');}
  window.admRemCD=function(i){chronicDiagItems.splice(i,1);renderCD();};

  function renderCT(){const el=document.getElementById('a-ct-list');if(!el)return;el.innerHTML=chronicTherapyItems.map((t,i)=>`<div class="a-added"><span style="font-weight:700;flex:1;font-size:0.85rem">${ee(t.drug_name)}</span><span style="color:var(--gray);font-size:0.82rem;flex-shrink:0">${ee(t.dosage)}</span><button class="a-rm" onclick="admRemCT(${i})">×</button></div>`).join('');}
  window.admRemCT=function(i){chronicTherapyItems.splice(i,1);renderCT();};

  function renderFiles(){const el=document.getElementById('a-file-list');if(!el)return;el.innerHTML=uploadFiles.map((f,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:0.45rem 0.7rem;background:var(--cream);border:1px solid var(--border);border-radius:4px;font-size:0.82rem"><span>${ee(f.name)}</span><button class="a-rm" onclick="admRemFile(${i})">×</button></div>`).join('');}
  window.admRemFile=function(i){uploadFiles.splice(i,1);renderFiles();};

  function handlePic(){const f=document.getElementById('adm-pic-file').files[0];if(!f)return;picFile=f;const r=new FileReader();r.onload=ev=>{const p=document.getElementById('a-pic-prev');if(p)p.innerHTML=`<img src="${ev.target.result}" alt=""/>`;};r.readAsDataURL(f);}
  function handleDocs(){const inp=document.getElementById('adm-docs-file');uploadFiles=[...uploadFiles,...Array.from(inp.files)];inp.value='';renderFiles();}

  // ── Bed availability check ─────────────────────────────────────
  window.admBedCheck = async function(){
    const rm=document.getElementById('f_rm')?.value;
    const bd=document.getElementById('f_bd')?.value;
    const st=document.getElementById('a-bed-st');
    const flWrap=document.getElementById('a-floor-info-wrap');
    const flInfo=document.getElementById('a-floor-info');
    if(!st) return;
    // Show floor info
    if(rm){
      const fl=roomToFloor(parseInt(rm));
      if(flWrap) flWrap.style.display='';
      if(flInfo) flInfo.textContent=fl?`Кат ${fl}`:'—';
    } else {
      if(flWrap) flWrap.style.display='none';
    }
    if(!rm||!bd){st.innerHTML='';return;}
    st.innerHTML='<span style="color:var(--gray);font-size:0.8rem">Се проверува…</span>';
    const{data}=await window._sb.from('clients').select('id').eq('room_number',parseInt(rm)).eq('bed_number',parseInt(bd)).neq('status','discharged').maybeSingle();
    st.innerHTML=data?'<span style="color:#c0392b;font-size:0.8rem;font-weight:700">⚠ Зафатен</span>':'<span style="color:#2a6e2a;font-size:0.8rem;font-weight:700">✓ Слободен</span>';
  };

  // ── MKB-10 search ──────────────────────────────────────────────
  let mkbTimer = null;

  window.admMKB = async function(codeId, opisId, ddId){
    const codeEl=document.getElementById(codeId);
    const opisEl=document.getElementById(opisId);
    const dd=document.getElementById(ddId);
    if(!codeEl) return;
    const raw=(codeEl.value||'').trim().toUpperCase();
    codeEl.value=raw;
    if(!raw){if(opisEl)opisEl.value='';if(dd)dd.classList.remove('show');return;}
    // Exact match first
    const{data:ex}=await window._sb.from('mkb10').select('code,description').eq('code',raw).maybeSingle();
    if(ex){if(opisEl)opisEl.value=ex.description;if(dd)dd.classList.remove('show');return;}
    // Two separate ilike queries — avoids broken .or() syntax
    const[byCode,byDesc]=await Promise.all([
      window._sb.from('mkb10').select('code,description').ilike('code',`${raw}%`).limit(8),
      window._sb.from('mkb10').select('code,description').ilike('description',`%${raw}%`).limit(8),
    ]);
    const seen=new Set();
    const fz=[...(byCode.data||[]),...(byDesc.data||[])].filter(r=>{
      if(seen.has(r.code))return false; seen.add(r.code); return true;
    }).slice(0,12);
    if(!dd) return;
    if(!fz.length){if(opisEl)opisEl.value='';dd.classList.remove('show');return;}
    dd.innerHTML='';
    fz.forEach(r=>{
      const item=document.createElement('div');
      item.className='adm-dd-item';
      item.innerHTML=`<span class="adm-dd-code">${ee(r.code)}</span>${ee(r.description)}`;
      item.addEventListener('click',()=>{
        if(codeEl)codeEl.value=r.code;
        if(opisEl)opisEl.value=r.description;
        dd.classList.remove('show');
      });
      dd.appendChild(item);
    });
    dd.classList.add('show');
  };

  // Live-typing trigger — fires after short pause on each keystroke
  window.admMKBLive = function(codeId, opisId, ddId){
    clearTimeout(mkbTimer);
    const codeEl=document.getElementById(codeId);
    if(!codeEl||codeEl.value.trim().length<1){
      const dd=document.getElementById(ddId);
      if(dd)dd.classList.remove('show');
      return;
    }
    mkbTimer=setTimeout(()=>window.admMKB(codeId,opisId,ddId),350);
  };

  window.admMKBPick = function(codeId,opisId,ddId,code,desc){
    const c=document.getElementById(codeId);const o=document.getElementById(opisId);const d=document.getElementById(ddId);
    if(c)c.value=code;if(o)o.value=desc;if(d)d.classList.remove('show');
  };

  // ── Drug search ────────────────────────────────────────────────
  window.admDrugSearch = function(val){
    clearTimeout(drugTimer); selectedDrugObj=null;
    const dd=document.getElementById('ct_drug_dd');
    if(!val||val.trim().length<3){if(dd)dd.classList.remove('show');return;}
    drugTimer=setTimeout(async()=>{
      const[byLatin,byGeneric]=await Promise.all([
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form').ilike('latin_name',`%${val}%`).limit(8),
        window._sb.from('drugs').select('id,latin_name,generic_name,strength,form').ilike('generic_name',`%${val}%`).limit(8),
      ]);
      const seen=new Set();
      const data=[...(byLatin.data||[]),...(byGeneric.data||[])].filter(d=>{
        if(seen.has(d.id))return false; seen.add(d.id); return true;
      }).slice(0,12);
      if(!dd) return;
      if(!data.length){dd.innerHTML=`<div class="adm-dd-item" style="color:var(--gray);cursor:default">Нема резултати за „${ee(val)}"</div>`;dd.classList.add('show');return;}
      dd.innerHTML='';
      data.forEach(d=>{
        const item=document.createElement('div');
        item.className='adm-dd-item';
        item.innerHTML=`<div class="adm-dd-name">${ee(d.latin_name)}</div><div class="adm-dd-meta">${ee(d.generic_name||'')}${d.strength?' · '+ee(d.strength):''}${d.form?' · '+ee(d.form):''}</div>`;
        item.addEventListener('click',()=>{
          selectedDrugObj=d;
          const inp=document.getElementById('ct_drug');
          if(inp)inp.value=d.latin_name+(d.strength?' '+d.strength:'')+(d.form?' ('+d.form+')':'');
          dd.classList.remove('show');
        });
        dd.appendChild(item);
      });
      dd.classList.add('show');
    },350);
  };

  window.admDrugPick = function(jsonStr){
    const d=JSON.parse(jsonStr); selectedDrugObj=d;
    const inp=document.getElementById('ct_drug');
    if(inp) inp.value=d.latin_name+(d.strength?' '+d.strength:'')+(d.form?' ('+d.form+')':'');
    const dd=document.getElementById('ct_drug_dd');if(dd)dd.classList.remove('show');
  };

  window.admAddCD = function(){
    const kod=(document.getElementById('cd_kod')?.value||'').trim().toUpperCase();
    const opis=(document.getElementById('cd_opis')?.value||'').trim();
    if(!kod) return;
    chronicDiagItems.push({kod,opis}); renderCD();
    document.getElementById('cd_kod').value=''; document.getElementById('cd_opis').value='';
    const dd=document.getElementById('cd_kod_dd');if(dd)dd.classList.remove('show');
  };

  window.admAddCT = function(){
    const drug=(document.getElementById('ct_drug')?.value||'').trim();
    const dose=(document.getElementById('ct_dose')?.value||'').trim();
    if(!drug){setErr('Внесете или изберете лек.');return;}if(!dose){setErr('Внесете доза.');return;}
    clearErr();
    chronicTherapyItems.push({drug_name:selectedDrugObj?selectedDrugObj.latin_name:drug,dosage:dose}); renderCT();
    document.getElementById('ct_drug').value=''; document.getElementById('ct_dose').value='';
    selectedDrugObj=null; const dd=document.getElementById('ct_drug_dd');if(dd)dd.classList.remove('show');
  };

  function setErr(msg){const el=document.getElementById('adm-err');if(el)el.textContent=msg;}
  function clearErr(){const el=document.getElementById('adm-err');if(el)el.textContent='';}
  function ee(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  // ── Expose public API ──────────────────────────────────────────
  window.Admission = { openNew, openExisting };

  // Legacy wrapper names used in clients.html
  window.openNewAdmission = function(cb){ openNew(cb); };
  window.openAdmissionForClient = function(id, cb){ openExisting(id, cb); };

  // ══════════════════════════════════════════════════════════════
  //  CSS
  // ══════════════════════════════════════════════════════════════
  const ADM_CSS = `<style id="adm-css">
#adm-bd{display:none;position:fixed;inset:0;background:rgba(47,42,36,0.62);z-index:300;align-items:center;justify-content:center;padding:1rem}
#adm-bd.open{display:flex}
#adm-box{background:#fff;border-radius:10px;width:100%;max-width:740px;max-height:93vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.22);overflow:hidden}
#adm-hdr{padding:1.25rem 1.75rem 0.9rem;border-bottom:1px solid var(--border);background:#fff;flex-shrink:0}
.a-htop{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.9rem}
.a-title{font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:600;color:var(--dark)}
.a-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:0.25rem;display:flex}.a-close:hover{color:var(--dark)}
.a-steps{display:flex}
.a-step{display:flex;align-items:center;gap:0.5rem;flex:1}
.a-step:not(:last-child)::after{content:'';flex:1;height:2px;background:var(--border);margin:0 0.5rem}
.a-step.done:not(:last-child)::after{background:var(--olive)}
.a-snum{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;background:var(--border);color:var(--gray);flex-shrink:0;transition:background 0.2s,color 0.2s}
.a-step.active .a-snum{background:var(--dark);color:#fff}.a-step.done .a-snum{background:var(--olive);color:#fff}
.a-slabel{font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gray);white-space:nowrap}
.a-step.active .a-slabel{color:var(--dark)}.a-step.done .a-slabel{color:var(--olive)}
#adm-body{overflow-y:auto;padding:1.4rem 1.75rem;flex:1}
#adm-ftr{padding:0.85rem 1.75rem 1.15rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:1rem;background:#fff;flex-shrink:0}
.a-err{font-size:0.82rem;color:#c0392b;flex:1}
.a-btns{display:flex;gap:0.75rem}
.a-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.85rem 1.2rem}.a-grid .full{grid-column:1/-1}
.a-fg{display:flex;flex-direction:column;gap:0.32rem}
.a-lbl{font-size:0.68rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--gray)}
.a-lbl .req{color:#c0392b;margin-left:2px}
.req{color:#c0392b;margin-left:2px}
.a-inp,.a-sel,.a-ta{padding:0.65rem 0.8rem;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.9rem;color:var(--dark);background:#fff;outline:none;transition:border-color 0.15s,box-shadow 0.15s;width:100%;box-sizing:border-box}
.a-inp:focus,.a-sel:focus,.a-ta:focus{border-color:var(--olive);box-shadow:0 0 0 3px rgba(122,122,46,0.1)}
.a-inp.a-err{border-color:#c0392b}.a-inp[readonly]{background:var(--cream);cursor:default}.a-ta{resize:vertical}
.a-sect{margin-top:1.4rem;padding-top:1.1rem;border-top:1px solid var(--border)}
.a-sect-t{font-family:'Playfair Display',serif;font-size:1rem;font-weight:600;color:var(--dark);margin-bottom:0.2rem}
.a-sect-s{font-size:0.8rem;color:var(--gray);margin-bottom:0.75rem}
.mkb-row{display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap}
.btn-mkb{padding:0.65rem 0.85rem;background:var(--olive);color:#fff;border:none;border-radius:4px;font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background 0.15s}
.btn-mkb:hover{background:#5a5a1e}
.adm-dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:2px solid var(--olive);border-radius:5px;box-shadow:0 8px 28px rgba(0,0,0,0.18);z-index:9999;max-height:240px;overflow-y:auto;display:none}
.adm-dd.show{display:block}
.adm-dd-item{padding:0.55rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.84rem}
.adm-dd-item:last-child{border-bottom:none}.adm-dd-item:hover{background:var(--cream)}
.adm-dd-code{font-family:monospace;font-weight:700;color:var(--olive);margin-right:0.4rem}
.adm-dd-name{font-weight:700;color:var(--dark)}.adm-dd-meta{font-size:0.73rem;color:var(--gray);margin-top:0.1rem}
.a-added{display:flex;align-items:center;gap:0.65rem;padding:0.5rem 0.75rem;background:var(--cream);border:1px solid var(--border);border-radius:4px;margin-bottom:0.4rem}
.a-rm{background:none;border:none;cursor:pointer;color:var(--gray);font-size:1.1rem;line-height:1;padding:0 0.25rem;flex-shrink:0}.a-rm:hover{color:#c0392b}
.a-pic-wrap{display:flex;align-items:center;gap:1.25rem}
.a-pic-prev{width:66px;height:66px;border-radius:50%;background:var(--cream2);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
.a-pic-prev img{width:100%;height:100%;object-fit:cover}
.a-btn-up{display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.85rem;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--gray);font-family:'Lato',sans-serif;font-size:0.82rem;cursor:pointer;transition:all 0.15s}
.a-btn-up:hover{border-color:var(--dark);color:var(--dark)}
.sr-item{background:var(--cream);border:1px solid var(--border);border-radius:6px;padding:0.9rem;margin-bottom:0.7rem;position:relative}
.sr-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.7rem}
.sr-rm{position:absolute;top:0.45rem;right:0.45rem;background:none;border:none;cursor:pointer;color:var(--gray);font-size:1.2rem;padding:0 0.25rem}.sr-rm:hover{color:#c0392b}
.btn-dash{display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.9rem;background:transparent;border:1px dashed var(--olive);border-radius:4px;color:var(--olive);font-family:'Lato',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:background 0.15s}
.btn-dash:hover{background:rgba(122,122,46,0.07)}
.a-file-dz{border:2px dashed var(--border);border-radius:6px;padding:1.2rem;text-align:center;color:var(--gray);font-size:0.85rem;cursor:pointer;transition:all 0.15s}
.a-file-dz:hover{border-color:var(--olive);background:rgba(122,122,46,0.04)}
.ssc{border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:0.9rem}
.ssc-h{display:flex;align-items:center;justify-content:space-between;padding:0.7rem 1rem;background:var(--cream);border-bottom:1px solid var(--border)}
.ssc-ht{font-weight:700;font-size:0.88rem;color:var(--dark)}.ssc-b{padding:0.7rem 1rem;font-size:0.85rem;color:var(--gray)}
.badge-compl{display:inline-block;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5}
.badge-wait{display:inline-block;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.65rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;background:#e8ecf5;color:#2e4a8a}
.a-pending{display:flex;flex-direction:column;align-items:center;text-align:center;padding:1.75rem 1rem;gap:0.7rem;color:var(--gray)}
.a-pending svg{opacity:0.3}.a-pending strong{color:var(--dark);font-family:'Playfair Display',serif;font-size:1rem}
.a-pending p{font-size:0.85rem;line-height:1.7;max-width:360px}
.a-range-wrap{display:flex;align-items:center;gap:0.75rem}
.a-range-wrap input[type=range]{flex:1}
.a-range-val{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:600;color:var(--dark);min-width:1.5rem;text-align:center}
.btn-prim{padding:0.65rem 1.4rem;background:var(--dark);border:none;border-radius:4px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;letter-spacing:0.08em;color:#fff;cursor:pointer;transition:background 0.15s}
.btn-prim:hover{background:var(--olive)}.btn-prim:disabled{opacity:0.5;pointer-events:none}
.btn-sec{padding:0.65rem 1.2rem;background:transparent;border:1px solid var(--border);border-radius:4px;font-family:'Lato',sans-serif;font-size:0.85rem;font-weight:700;color:var(--gray);cursor:pointer;transition:all 0.15s}
.btn-sec:hover{border-color:var(--dark);color:var(--dark)}
</style>`;

  // ══════════════════════════════════════════════════════════════
  //  HTML SKELETON
  // ══════════════════════════════════════════════════════════════
  const ADM_HTML = `<div id="adm-bd">
  <div id="adm-box" role="dialog" aria-modal="true">
    <div id="adm-hdr">
      <div class="a-htop">
        <h2 class="a-title" id="adm-title">Регистрација</h2>
        <button class="a-close" id="adm-close-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="a-steps">
        <div class="a-step active" data-step="1"><div class="a-snum">1</div><span class="a-slabel">Општи податоци</span></div>
        <div class="a-step" data-step="2"><div class="a-snum">2</div><span class="a-slabel">Доктор</span></div>
        <div class="a-step" data-step="3"><div class="a-snum">3</div><span class="a-slabel">Социјален работник</span></div>
      </div>
    </div>
    <div id="adm-body"></div>
    <div id="adm-ftr">
      <div class="a-err" id="adm-err"></div>
      <div class="a-btns">
        <button class="btn-sec" id="adm-cancel-btn">Откажи</button>
        <button class="btn-prim" id="adm-save-btn">Следно</button>
      </div>
    </div>
  </div>
</div>
<input type="file" id="adm-pic-file" accept="image/*" style="display:none"/>
<input type="file" id="adm-docs-file" multiple style="display:none"/>`;

})();
