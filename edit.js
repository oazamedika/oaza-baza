/* edit.js — Client general-info editor
   Opens a modal to edit a client's general information.
   Also allows менаџер / главна сестра to mark a client as
   одјавен or починат (freeing their bed but keeping маtичен број).
   Одјавени / починати clients can be reinstated to a bed.
   NEW: Photo upload/replace for the client's profile picture.
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
        background:#fff;border-radius:10px;width:100%;max-width:580px;
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

      /* ── photo zone ── */
      .em-photo-zone{
        display:flex;align-items:center;gap:1.1rem;
        padding:.85rem 1rem;background:var(--cream);
        border:1px solid var(--border);border-radius:7px;
      }
      .em-photo-prev{
        width:62px;height:62px;border-radius:50%;background:#ddd;
        border:2px solid var(--border);display:flex;align-items:center;justify-content:center;
        overflow:hidden;flex-shrink:0;font-family:'Playfair Display',serif;
        font-size:1.3rem;font-weight:700;color:#fff;background:var(--olive);
      }
      .em-photo-prev img{width:100%;height:100%;object-fit:cover}
      .em-photo-actions{display:flex;flex-direction:column;gap:.4rem}
      .em-photo-hint{font-size:.72rem;color:var(--gray);line-height:1.4}
      .em-photo-btn{
        display:inline-flex;align-items:center;gap:.4rem;
        padding:.42rem .85rem;background:transparent;border:1px solid var(--border);
        border-radius:4px;font-family:'Lato',sans-serif;font-size:.78rem;
        font-weight:700;color:var(--gray);cursor:pointer;transition:all .15s;
      }
      .em-photo-btn:hover{border-color:var(--olive);color:var(--olive)}
      .em-photo-btn.danger{color:#c0392b;border-color:#f5c6c6}
      .em-photo-btn.danger:hover{background:#fff5f5}
      .em-photo-new-badge{
        display:inline-block;font-size:.65rem;font-weight:700;
        letter-spacing:.07em;text-transform:uppercase;
        background:#e6f0e6;color:#2a6e2a;border:1px solid #b5d5b5;
        border-radius:10px;padding:.1rem .45rem;margin-left:.35rem;
      }

      /* ── status zone ── */
      .em-status-zone{border:1px solid var(--border);border-radius:7px;overflow:hidden}
      .em-status-zone-header{
        padding:.65rem 1rem;background:var(--cream);
        font-size:.68rem;font-weight:700;letter-spacing:.14em;
        text-transform:uppercase;color:var(--gray);border-bottom:1px solid var(--border);
      }
      .em-status-opts{display:flex;flex-direction:column;gap:0}
      .em-status-opt{
        display:flex;align-items:flex-start;gap:.85rem;padding:.85rem 1rem;
        cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;
      }
      .em-status-opt:last-child{border-bottom:none}
      .em-status-opt:hover{background:#faf7f2}
      .em-status-opt input[type=radio]{margin-top:.15rem;accent-color:var(--olive);flex-shrink:0}
      .em-status-opt-label{font-size:.88rem;font-weight:700;color:var(--dark)}
      .em-status-opt-desc{font-size:.76rem;color:var(--gray);margin-top:.15rem;line-height:1.45}
      .em-status-opt[data-val='active']  .em-status-opt-label{color:#2a6e2a}
      .em-status-opt[data-val='odjavен'] .em-status-opt-label{color:#2e4a8a}
      .em-status-opt[data-val='pocinat'] .em-status-opt-label{color:#8a3a3a}

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

            <!-- Photo -->
            <div>
              <div class="em-section-title">Профилна слика</div>
              <div class="em-photo-zone">
                <div class="em-photo-prev" id="em-photo-prev">?</div>
                <div class="em-photo-actions">
                  <button type="button" class="em-photo-btn" id="em-photo-pick-btn">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Замени слика
                    <span class="em-photo-new-badge" id="em-photo-new-badge" style="display:none">НОВА</span>
                  </button>
                  <button type="button" class="em-photo-btn danger" id="em-photo-remove-btn" style="display:none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    Отстрани слика
                  </button>
                  <span class="em-photo-hint">JPG / PNG · до 5 MB</span>
                </div>
              </div>
              <input type="file" id="em-photo-file" accept="image/*" style="display:none"/>
            </div>

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
                  <label class="em-label">Ime и презиме</label>
                  <input class="em-input" id="em-ime" placeholder="Марија Петровска"/>
                </div>
              </div>
              <div class="em-row" style="margin-top:.85rem">
                <div class="em-field">
                  <label class="em-label">ЕМБГ</label>
                  <input class="em-input" id="em-embg" maxlength="13" placeholder="0101950450001"/>
                </div>
                <div class="em-field">
                  <label class="em-label">Телефон</label>
                  <input class="em-input" id="em-telefon" type="tel" placeholder="+389 70 000 000"/>
                </div>
              </div>
            </div>

            <!-- Bed -->
            <div>
              <div class="em-section-title">Сместување</div>
              <div class="em-row">
                <div class="em-field">
                  <label class="em-label">Кат</label>
                  <input class="em-input" id="em-floor" type="number" min="1" max="5" placeholder="1"/>
                </div>
                <div class="em-field">
                  <label class="em-label">Соба</label>
                  <input class="em-input" id="em-room" type="number" min="1" max="84" placeholder="12"/>
                </div>
                <div class="em-field">
                  <label class="em-label">Кревет</label>
                  <input class="em-input" id="em-bed" type="number" min="1" max="2" placeholder="1"/>
                </div>
              </div>
            </div>

            <!-- Status -->
            <div>
              <div class="em-section-title">Статус на корисник</div>
              <div class="em-status-zone">
                <div class="em-status-zone-header">Статус</div>
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

    /* photo pick */
    document.getElementById('em-photo-pick-btn').addEventListener('click', () => {
      document.getElementById('em-photo-file').click();
    });
    document.getElementById('em-photo-file').addEventListener('change', onPhotoPicked);
    document.getElementById('em-photo-remove-btn').addEventListener('click', onPhotoRemove);
  }

  /* ── state ──────────────────────────────────────────────── */
  let _clientId      = null;
  let _onSaved       = null;
  let _origStatus    = 'active';
  let _origPhotoUrl  = null;   // current saved photo URL
  let _newPhotoFile  = null;   // newly picked File (not yet uploaded)
  let _removePhoto   = false;  // user wants to delete the photo

  /* ── open ───────────────────────────────────────────────── */
  window.openClientEdit = async function (clientId, onSaved) {
    if (!canEdit()) return;
    injectStyles();
    ensureDOM();

    _clientId     = clientId;
    _onSaved      = onSaved || null;
    _newPhotoFile = null;
    _removePhoto  = false;

    /* fetch client */
    const { data, error } = await window._sb
      .from('clients')
      .select('id,ime_prezime,obrakanje,embg,telefon,maticen_broj,client_status,floor_number,room_number,bed_number,profile_pic_url')
      .eq('id', clientId)
      .single();

    if (error || !data) { showToast('Грешка при вчитување на корисникот.'); return; }

    _origStatus   = data.client_status || 'active';
    _origPhotoUrl = data.profile_pic_url || null;

    /* populate fields */
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

    /* populate photo preview */
    refreshPhotoPreview(data.ime_prezime, _origPhotoUrl);

    /* set status radio */
    document.querySelectorAll('input[name="em_cstatus"]').forEach(r => { r.checked = r.value === _origStatus; });
    document.getElementById('em-danger-confirm').classList.remove('show');

    /* open */
    const ov = document.getElementById('edit-overlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('open'));

    /* save */
    document.getElementById('em-save').onclick = doSave;
  };

  /* ── photo preview helpers ──────────────────────────────── */
  function refreshPhotoPreview(name, url) {
    const prev    = document.getElementById('em-photo-prev');
    const rmBtn   = document.getElementById('em-photo-remove-btn');
    const newBadge= document.getElementById('em-photo-new-badge');

    if (_newPhotoFile) {
      // Show local preview from newly picked file
      const reader = new FileReader();
      reader.onload = ev => { prev.innerHTML = `<img src="${ev.target.result}" alt=""/>`; };
      reader.readAsDataURL(_newPhotoFile);
      if (newBadge) newBadge.style.display = '';
      if (rmBtn)    rmBtn.style.display    = '';
    } else if (_removePhoto || !url) {
      prev.innerHTML = '';
      prev.textContent = (name || '?').charAt(0).toUpperCase();
      if (newBadge) newBadge.style.display = 'none';
      if (rmBtn)    rmBtn.style.display    = _removePhoto ? '' : 'none';
    } else {
      prev.innerHTML = `<img src="${esc(url)}" alt="" onerror="this.parentNode.innerHTML='${esc((name||'?').charAt(0).toUpperCase())}'"/>`;
      if (newBadge) newBadge.style.display = 'none';
      if (rmBtn)    rmBtn.style.display    = '';
    }
  }

  function onPhotoPicked() {
    const file = document.getElementById('em-photo-file').files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Сликата е поголема од 5 MB.'); return; }
    _newPhotoFile = file;
    _removePhoto  = false;
    const name = document.getElementById('em-ime').value;
    refreshPhotoPreview(name, null);
  }

  function onPhotoRemove() {
    _newPhotoFile = null;
    _removePhoto  = true;
    const name = document.getElementById('em-ime').value;
    refreshPhotoPreview(name, null);
  }

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

    try {
      /* ── 1. Handle photo ── */
      let newPhotoUrl = _origPhotoUrl; // default: keep existing

      if (_removePhoto) {
        // Delete from storage if we know the path, then clear URL
        if (_origPhotoUrl) {
          try {
            const path = extractStoragePath(_origPhotoUrl);
            if (path) await window._sb.storage.from('client-photos').remove([path]);
          } catch (_) { /* non-fatal */ }
        }
        newPhotoUrl = null;
      } else if (_newPhotoFile) {
        // Upload new file
        const ext  = _newPhotoFile.name.split('.').pop().toLowerCase();
        const path = `${_clientId}/${Date.now()}.${ext}`;
        const { error: upErr } = await window._sb.storage
          .from('client-photos')
          .upload(path, _newPhotoFile, { upsert: true });
        if (upErr) {
          showToast('Грешка при прикачување на слика: ' + upErr.message);
          return;
        }
        // Delete old photo from storage (best-effort)
        if (_origPhotoUrl) {
          try {
            const oldPath = extractStoragePath(_origPhotoUrl);
            if (oldPath && oldPath !== path)
              await window._sb.storage.from('client-photos').remove([oldPath]);
          } catch (_) { /* non-fatal */ }
        }
        const { data: urlData } = window._sb.storage
          .from('client-photos').getPublicUrl(path);
        newPhotoUrl = urlData?.publicUrl || null;
      }

      /* ── 2. Build DB payload ── */
      const newStatus = document.querySelector('input[name="em_cstatus"]:checked')?.value || 'active';
      const isLeaving = newStatus === 'odjavен' || newStatus === 'pocinat';

      const payload = {
        ime_prezime:    document.getElementById('em-ime').value.trim(),
        obrakanje:      document.getElementById('em-obrakanje').value || null,
        embg:           document.getElementById('em-embg').value.trim()    || null,
        telefon:        document.getElementById('em-telefon').value.trim() || null,
        client_status:  newStatus,
        profile_pic_url: newPhotoUrl,
      };

      if (isLeaving) {
        payload.floor_number = null;
        payload.room_number  = null;
        payload.bed_number   = null;
      } else {
        const floor = document.getElementById('em-floor').value;
        const room  = document.getElementById('em-room').value;
        const bed   = document.getElementById('em-bed').value;
        payload.floor_number = floor ? parseInt(floor) : null;
        payload.room_number  = room  ? parseInt(room)  : null;
        payload.bed_number   = bed   ? parseInt(bed)   : null;
      }

      const { error } = await window._sb.from('clients').update(payload).eq('id', _clientId);

      if (error) {
        showToast('Грешка при зачувување: ' + error.message);
        return;
      }

      showToast('Промените се зачувани.');
      closeEdit();
      if (_onSaved) _onSaved();

    } finally {
      btn.disabled = false;
      btn.textContent = 'Зачувај промени';
    }
  }

  /* ── Extract storage path from public URL ──────────────── */
  function extractStoragePath(publicUrl) {
    if (!publicUrl) return null;
    // Supabase public URLs look like:
    // https://<project>.supabase.co/storage/v1/object/public/client-photos/path/to/file.jpg
    try {
      const marker = '/client-photos/';
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(publicUrl.slice(idx + marker.length));
    } catch {
      return null;
    }
  }

  /* ── close ──────────────────────────────────────────────── */
  function closeEdit() {
    const ov = document.getElementById('edit-overlay');
    ov.classList.remove('open');
    setTimeout(() => { ov.style.display = 'none'; }, 220);
    // Reset file input so same file can be re-picked
    const fi = document.getElementById('em-photo-file');
    if (fi) fi.value = '';
  }

  /* ── toast ──────────────────────────────────────────────── */
  function showToast(msg) {
    let t = document.getElementById('edit-toast');
    if (!t) {
      document.body.insertAdjacentHTML('beforeend', '<div id="edit-toast"></div>');
      t = document.getElementById('edit-toast');
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
  }

})();
