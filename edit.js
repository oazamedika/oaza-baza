/* edit.js — Client general-info editor
   Opens a modal to edit a client's general information.
   Also allows менаџер / главна сестра to mark a client as
   одјавен or починат (freeing their bed but keeping маtичен број).
   Одјавени / починати clients can be reinstated to a bed.
   ---------------------------------------------------------------- */

(function () {
  /* ── helpers ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function canEdit() {
    const u = (window._username || '').toLowerCase();
    return u === 'menadzer' || u === 'glavnasestra';
  }

  /* ── inject styles once ──────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('edit-modal-styles')) return;
    const s = document.createElement('style');
    s.id = 'edit-modal-styles';
    s.textContent = `
      /* ── overlay ── */
      #edit-overlay {
        position:fixed;inset:0;background:rgba(30,26,20,.55);
        backdrop-filter:blur(3px);z-index:1200;
        display:flex;align-items:center;justify-content:center;
        opacity:0;transition:opacity .2s;padding:1rem;
      }
      #edit-overlay.open{opacity:1}

      /* ── modal shell ── */
      #edit-modal {
        background:#fff;border-radius:10px;width:100%;max-width:560px;
        max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18);
        transform:translateY(14px);transition:transform .22s;
        font-family:'Lato',sans-serif;
      }
      #edit-overlay.open #edit-modal{transform:translateY(0)}

      /* ── header ── */
      .em-header {
        display:flex;align-items:center;justify-content:space-between;
        padding:1.15rem 1.4rem;border-bottom:1px solid var(--border);
        position:sticky;top:0;background:#fff;z-index:1;
      }
      .em-title{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:600;color:var(--dark)}
      .em-maticen{font-size:.75rem;color:var(--gray);margin-top:.1rem}
      .em-close{background:none;border:none;cursor:pointer;color:var(--gray);padding:.3rem;border-radius:4px;line-height:1}
      .em-close:hover{color:var(--dark);background:var(--cream)}

      /* ── body / form ── */
      .em-body{padding:1.25rem 1.4rem;display:flex;flex-direction:column;gap:1.1rem}

      .em-section-title{
        font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
        color:var(--gray);margin-bottom:.5rem;padding-bottom:.35rem;
        border-bottom:1px solid var(--border);
      }

      .em-row{display:grid;grid-template-columns:1fr 1fr;gap:.85rem}
      .em-row.full{grid-template-columns:1fr}

      .em-field{display:flex;flex-direction:column;gap:.35rem}
      .em-label{font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gray)}
      .em-input,.em-select{
        padding:.55rem .75rem;border:1px solid var(--border);border-radius:5px;
        font-family:'Lato',sans-serif;font-size:.88rem;color:var(--dark);
        background:#fff;outline:none;transition:border-color .15s;width:100%;box-sizing:border-box;
      }
      .em-input:focus,.em-select:focus{border-color:var(--olive)}
      .em-input[readonly]{background:var(--cream);color:var(--gray);cursor:default}

      /* ── status zone ── */
      .em-status-zone{
        border:1px solid var(--border);border-radius:7px;
        overflow:hidden;
      }
      .em-status-zone-header{
        padding:.65rem 1rem;background:var(--cream);
        font-size:.68rem;font-weight:700;letter-spacing:.14em;
        text-transform:uppercase;color:var(--gray);
        border-bottom:1px solid var(--border);
      }
      .em-status-opts{display:flex;flex-direction:column;gap:0}
      .em-status-opt{
        display:flex;align-items:flex-start;gap:.85rem;padding:.85rem 1rem;
        cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;
      }
      .em-status-opt:last-child{border-bottom:none}
      .em-status-opt:hover{background:#faf7f2}
      .em-status-opt input[type=radio]{margin-top:.15rem;accent-color:var(--olive);flex-shrink:0}
      .em-status-opt-body{}
      .em-status-opt-label{font-size:.88rem;font-weight:700;color:var(--dark)}
      .em-status-opt-desc{font-size:.76rem;color:var(--gray);margin-top:.15rem;line-height:1.45}

      /* colour accents per status */
      .em-status-opt[data-val='active']   .em-status-opt-label{color:#2a6e2a}
      .em-status-opt[data-val='odjavен']  .em-status-opt-label{color:#2e4a8a}
      .em-status-opt[data-val='pocinat']  .em-status-opt-label{color:#8a3a3a}

      /* ── confirm danger box ── */
      .em-danger-confirm{
        display:none;background:#fff5f5;border:1px solid #f5c6c6;border-radius:6px;
        padding:.85rem 1rem;font-size:.84rem;color:#8a3a3a;line-height:1.5;
      }
      .em-danger-confirm.show{display:block}
      .em-danger-confirm strong{display:block;margin-bottom:.25rem}

      /* ── footer ── */
      .em-footer{
        display:flex;align-items:center;justify-content:flex-end;gap:.75rem;
        padding:1rem 1.4rem;border-top:1px solid var(--border);
        position:sticky;bottom:0;background:#fff;z-index:1;
      }
      .em-btn{
        padding:.6rem 1.3rem;border-radius:5px;font-family:'Lato',sans-serif;
        font-size:.82rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
        cursor:pointer;border:none;transition:background .15s;
      }
      .em-btn-cancel{background:var(--cream);color:var(--dark);border:1px solid var(--border)}
      .em-btn-cancel:hover{background:var(--border)}
      .em-btn-save{background:var(--dark);color:#fff}
      .em-btn-save:hover{background:var(--olive)}
      .em-btn-save:disabled{opacity:.5;cursor:not-allowed}

      /* ── toast ── */
      #edit-toast{
        position:fixed;bottom:1.5rem;right:1.5rem;z-index:1400;
        background:var(--dark);color:#fff;padding:.65rem 1.2rem;
        border-radius:6px;font-size:.84rem;font-family:'Lato',sans-serif;
        opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;
        pointer-events:none;
      }
      #edit-toast.show{opacity:1;transform:translateY(0)}
    `;
    document.head.appendChild(s);
  }

  /* ── build DOM once ─────────────────────────────────────── */
  function ensureDOM() {
    if (document.getElementById('edit-overlay')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="edit-overlay" role="dialog" aria-modal="true">
        <div id="edit-modal">
          <div class="em-header">
            <div>
              <div class="em-title" id="em-title">Уреди корисник</div>
              <div class="em-maticen" id="em-maticen"></div>
            </div>
            <button class="em-close" id="em-close" aria-label="Затвори">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="em-body">
            <!-- Personal info -->
            <div>
              <div class="em-section-title">Лични податоци</div>
              <div class="em-row">
                <div class="em-field">
                  <label class="em-label">Обраќање</label>
                  <select class="em-select" id="em-obrakanje">
                    <option value="">—</option>
                    <option value="Г-дин">Г-дин</option>
                    <option value="Г-ѓа">Г-ѓа</option>
                    <option value="Г-ца">Г-ца</option>
                  </select>
                </div>
                <div class="em-field">
                  <label class="em-label">Матичен број</label>
                  <input class="em-input" id="em-maticen-input" readonly title="Матичниот број е доделен и не може да се менува"/>
                </div>
              </div>
              <div class="em-row full" style="margin-top:.85rem">
                <div class="em-field">
                  <label class="em-label">Име и презиме</label>
                  <input class="em-input" id="em-ime" type="text" placeholder="Марко Марковски"/>
                </div>
              </div>
              <div class="em-row" style="margin-top:.85rem">
                <div class="em-field">
                  <label class="em-label">ЕМБГ</label>
                  <input class="em-input" id="em-embg" type="text" maxlength="13" placeholder="1234567890123"/>
                </div>
                <div class="em-field">
                  <label class="em-label">Телефон</label>
                  <input class="em-input" id="em-telefon" type="text" placeholder="+389 70 000 000"/>
                </div>
              </div>
            </div>

            <!-- Location -->
            <div>
              <div class="em-section-title">Сместување</div>
              <div class="em-row">
                <div class="em-field">
                  <label class="em-label">Кат</label>
                  <select class="em-select" id="em-floor">
                    <option value="">—</option>
                    <option value="1">Кат 1</option>
                    <option value="2">Кат 2</option>
                    <option value="3">Кат 3</option>
                    <option value="4">Кат 4</option>
                    <option value="5">Кат 5</option>
                  </select>
                </div>
                <div class="em-field">
                  <label class="em-label">Соба</label>
                  <input class="em-input" id="em-room" type="number" min="1" placeholder="1"/>
                </div>
              </div>
              <div class="em-row" style="margin-top:.85rem">
                <div class="em-field">
                  <label class="em-label">Кревет</label>
                  <select class="em-select" id="em-bed">
                    <option value="">—</option>
                    <option value="1">Кревет 1</option>
                    <option value="2">Кревет 2</option>
                  </select>
                </div>
                <div></div>
              </div>
            </div>

            <!-- Status zone -->
            <div id="em-status-section">
              <div class="em-section-title">Статус на корисник</div>
              <div class="em-status-zone">
                <div class="em-status-zone-header">Изберете статус</div>
                <div class="em-status-opts">
                  <label class="em-status-opt" data-val="active">
                    <input type="radio" name="em_cstatus" value="active"/>
                    <div class="em-status-opt-body">
                      <div class="em-status-opt-label">Активен</div>
                      <div class="em-status-opt-desc">Корисникот е сместен во установата и може да прима записи.</div>
                    </div>
                  </label>
                  <label class="em-status-opt" data-val="odjavен">
                    <input type="radio" name="em_cstatus" value="odjavен"/>
                    <div class="em-status-opt-body">
                      <div class="em-status-opt-label">Одјавен</div>
                      <div class="em-status-opt-desc">Корисникот ја напуштил установата. Креветот се ослободува, матичниот број останува. Може да се врати.</div>
                    </div>
                  </label>
                  <label class="em-status-opt" data-val="pocinat">
                    <input type="radio" name="em_cstatus" value="pocinat"/>
                    <div class="em-status-opt-body">
                      <div class="em-status-opt-label">Починат</div>
                      <div class="em-status-opt-desc">Корисникот починал. Креветот се ослободува. Матичниот број останува. Записи не се возможни.</div>
                    </div>
                  </label>
                </div>
              </div>
              <div class="em-danger-confirm" id="em-danger-confirm">
                <strong id="em-danger-title"></strong>
                <span id="em-danger-desc"></span>
              </div>
            </div>
          </div><!-- /em-body -->

          <div class="em-footer">
            <button class="em-btn em-btn-cancel" id="em-cancel">Откажи</button>
            <button class="em-btn em-btn-save"   id="em-save">Зачувај промени</button>
          </div>
        </div>
      </div>
      <div id="edit-toast"></div>
    `);

    /* close handlers */
    document.getElementById('em-close').onclick  = closeEdit;
    document.getElementById('em-cancel').onclick = closeEdit;
    document.getElementById('edit-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('edit-overlay')) closeEdit();
    });

    /* status radio → danger confirm */
    document.querySelectorAll('input[name="em_cstatus"]').forEach(r => {
      r.addEventListener('change', onStatusChange);
    });
  }

  /* ── state ──────────────────────────────────────────────── */
  let _clientId   = null;
  let _onSaved    = null;
  let _origStatus = 'active';

  /* ── open ───────────────────────────────────────────────── */
  window.openClientEdit = async function (clientId, onSaved) {
    if (!canEdit()) return;
    injectStyles();
    ensureDOM();

    _clientId = clientId;
    _onSaved  = onSaved || null;

    /* fetch client */
    const { data, error } = await window._sb
      .from('clients')
      .select('id,ime_prezime,obrakanje,embg,telefon,maticen_broj,client_status,floor_number,room_number,bed_number')
      .eq('id', clientId)
      .single();

    if (error || !data) { showToast('Грешка при вчитување на корисникот.'); return; }

    _origStatus = data.client_status || 'active';

    /* populate */
    document.getElementById('em-title').textContent   = data.ime_prezime || 'Уреди корисник';
    document.getElementById('em-maticen').textContent = data.maticen_broj ? `Матичен: ${data.maticen_broj}` : '';
    document.getElementById('em-maticen-input').value = data.maticen_broj || '';
    document.getElementById('em-obrakanje').value     = data.obrakanje   || '';
    document.getElementById('em-ime').value           = data.ime_prezime || '';
    document.getElementById('em-embg').value          = data.embg        || '';
    document.getElementById('em-telefon').value       = data.telefon     || '';
    document.getElementById('em-floor').value         = data.floor_number || '';
    document.getElementById('em-room').value          = data.room_number  || '';
    document.getElementById('em-bed').value           = data.bed_number   || '';

    /* set status radio */
    const radios = document.querySelectorAll('input[name="em_cstatus"]');
    radios.forEach(r => { r.checked = r.value === _origStatus; });
    document.getElementById('em-danger-confirm').classList.remove('show');

    /* open */
    const ov = document.getElementById('edit-overlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('open'));

    /* save */
    document.getElementById('em-save').onclick = doSave;
  };

  /* ── status change → danger warning ─────────────────────── */
  function onStatusChange() {
    const val     = document.querySelector('input[name="em_cstatus"]:checked')?.value;
    const confirm = document.getElementById('em-danger-confirm');
    const title   = document.getElementById('em-danger-title');
    const desc    = document.getElementById('em-danger-desc');

    if (val === 'odjavен' && val !== _origStatus) {
      title.textContent = 'Потврда: Одјавување';
      desc.textContent  = 'Корисникот ќе биде одјавен. Креветот ќе се ослободи. Нови записи нема да бидат можни додека не се врати.';
      confirm.classList.add('show');
    } else if (val === 'pocinat' && val !== _origStatus) {
      title.textContent = 'Потврда: Означување како починат';
      desc.textContent  = 'Ова е трајна промена на статусот. Креветот ќе се ослободи. Нови записи нема да бидат можни. Матичниот број останува зачуван. Може да се поништи подоцна.';
      confirm.classList.add('show');
    } else {
      confirm.classList.remove('show');
    }
  }

  /* ── save ───────────────────────────────────────────────── */
  async function doSave() {
    const btn = document.getElementById('em-save');
    btn.disabled = true;
    btn.textContent = 'Се зачувува…';

    const newStatus = document.querySelector('input[name="em_cstatus"]:checked')?.value || 'active';
    const isLeaving = newStatus === 'odjavен' || newStatus === 'pocinat';

    const payload = {
      ime_prezime:  document.getElementById('em-ime').value.trim(),
      obrakanje:    document.getElementById('em-obrakanje').value || null,
      embg:         document.getElementById('em-embg').value.trim()    || null,
      telefon:      document.getElementById('em-telefon').value.trim() || null,
      client_status: newStatus,
    };

    /* If leaving → clear bed assignment */
    if (isLeaving) {
      payload.floor_number = null;
      payload.room_number  = null;
      payload.bed_number   = null;
    } else {
      /* active → allow editing bed */
      const floor = document.getElementById('em-floor').value;
      const room  = document.getElementById('em-room').value;
      const bed   = document.getElementById('em-bed').value;
      payload.floor_number = floor ? parseInt(floor) : null;
      payload.room_number  = room  ? parseInt(room)  : null;
      payload.bed_number   = bed   ? parseInt(bed)   : null;
    }

    const { error } = await window._sb.from('clients').update(payload).eq('id', _clientId);

    btn.disabled = false;
    btn.textContent = 'Зачувај промени';

    if (error) {
      showToast('Грешка при зачувување: ' + error.message);
      return;
    }

    showToast('Промените се зачувани.');
    closeEdit();
    if (_onSaved) _onSaved();
  }

  /* ── close ──────────────────────────────────────────────── */
  function closeEdit() {
    const ov = document.getElementById('edit-overlay');
    ov.classList.remove('open');
    setTimeout(() => { ov.style.display = 'none'; }, 220);
  }

  /* ── toast ──────────────────────────────────────────────── */
  function showToast(msg) {
    let t = document.getElementById('edit-toast');
    if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="edit-toast"></div>'); t = document.getElementById('edit-toast'); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

})();
