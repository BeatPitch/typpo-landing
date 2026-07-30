/**
 * <media-slot> — user-fillable VIDEO or image placeholder.
 *
 * Like <image-slot>, but accepts a video (mp4/webm/mov) as well as an image.
 * A dropped video autoplays muted + looped (playsinline); a dropped image
 * shows as a cover-fit still. The file is stored as a data URL in a
 * .media-slots.state.json sidecar via window.omelette.writeFile, so it
 * survives reload / share / download the same way image-slot does. Outside
 * the omelette runtime the slot is read-only.
 *
 * Attributes:
 *   id           Persistence key. REQUIRED to survive reload; must be unique.
 *   fit          object-fit: cover | contain.   (default 'cover')
 *   position     object-position.               (default '50% 50%')
 *   radius       Corner radius in px.           (default 0)
 *   placeholder  Empty-state caption.           (default 'Drop a video or image')
 *
 * Size/layout come from ordinary CSS on the element.
 */
(() => {
  const STATE_FILE = '.media-slots.state.json';
  const ACCEPT = 'video/*,image/*';
  const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── shared sidecar store ────────────────────────────────────────────────
  const subs = new Set();
  let slots = {};
  const tombstones = new Set();
  let loaded = false, loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  let saving = false, saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }

  function getSlot(id) { return slots[id] || null; }
  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    if (loaded) save(); else load().then(save);
  }

  function readDataUrl(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(file);
    });
  }

  const css =
    ":host{display:inline-block;position:relative;vertical-align:top;width:240px;height:160px;" +
    "  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(255,255,255,.72)}" +
    ".frame{position:absolute;inset:0;overflow:hidden;background:#0a0a0b}" +
    ".frame video,.frame img{position:absolute;inset:0;width:100%;height:100%;display:none;" +
    "  -webkit-user-drag:none;user-select:none}" +
    ".empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;" +
    "  justify-content:center;gap:8px;text-align:center;padding:14px;box-sizing:border-box;" +
    "  cursor:pointer;user-select:none}" +
    ".empty svg{opacity:.5}" +
    ".empty .cap{max-width:92%;font-weight:600;letter-spacing:.01em}" +
    ".empty .sub{font-size:11px;opacity:.7}" +
    ".empty .sub u{text-underline-offset:2px}" +
    ".empty:hover .sub u{color:#fff}" +
    ".ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(255,255,255,.28)}" +
    ":host([data-over]) .frame{outline:2px solid #EE7F7B;outline-offset:-2px;background:rgba(238,127,123,.12)}" +
    ":host([data-over]) .ring{border-color:#EE7F7B}" +
    ":host([data-filled]) .ring{display:none}" +
    ".ctl{position:absolute;top:8px;right:8px;display:flex;gap:6px;opacity:0;pointer-events:none;" +
    "  transition:opacity .12s;z-index:3}" +
    ":host([data-filled][data-editable]:hover) .ctl{opacity:1;pointer-events:auto}" +
    ".ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;" +
    "  background:rgba(10,10,11,.7);color:#fff;font:11px/1 system-ui,sans-serif;backdrop-filter:blur(6px)}" +
    ".ctl button:hover{background:rgba(10,10,11,.9)}" +
    ".err{position:absolute;left:8px;bottom:8px;right:8px;color:#fff;font-size:11px;" +
    "  background:rgba(179,38,30,.92);padding:5px 7px;border-radius:5px;pointer-events:none}";

  const icon =
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="2" y="4" width="14" height="16" rx="2"/>' +
    '<path d="M16 9l6-3v12l-6-3"/></svg>';

  class MediaSlot extends HTMLElement {
    static get observedAttributes() { return ['fit', 'position', 'radius', 'placeholder', 'id']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + css + '</style>' +
        '<div class="frame">' +
        '  <video muted loop playsinline preload="metadata"></video>' +
        '  <img alt="" draggable="false">' +
        '  <div class="empty">' + icon +
        '    <div class="cap"></div><div class="sub">or <u>browse files</u></div></div>' +
        '  <div class="ring"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace">Replace</button>' +
        '  <button data-act="clear">Remove</button></div>' +
        '<input type="file" accept="' + ACCEPT + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._video = root.querySelector('video');
      this._img = root.querySelector('img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._input = root.querySelector('input');
      this._err = null;
      this._depth = 0;
      this._gen = 0;
      this._subFn = () => this._render();
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') this._input.click();
        if (act === 'clear') { this._gen++; this._local = null; if (this.id) setSlot(this.id, null); else this._render(); }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
    }

    connectedCallback() {
      if (!this.id && !MediaSlot._warned) {
        MediaSlot._warned = true;
        console.warn('<media-slot> without an id will not persist its dropped media.');
      }
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.addEventListener(t, this));
      subs.add(this._subFn);
      load();
      this._render();
    }

    disconnectedCallback() {
      subs.delete(this._subFn);
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((t) => this.removeEventListener(t, this));
    }

    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault(); e.stopPropagation();
        this._depth = 0; this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      const isVideo = /^video\//.test(file.type);
      const isImage = /^image\//.test(file.type);
      if (!isVideo && !isImage) { this._setError('Drop a video or image file.'); return; }
      if (file.size > 40 * 1024 * 1024) {
        this._setError('That file is over 40MB — trim the clip so it can be saved.');
        return;
      }
      const gen = ++this._gen;
      try {
        const url = await readDataUrl(file);
        if (gen !== this._gen) return;
        const val = { u: url, t: isVideo ? 'video' : 'image' };
        if (this.id) setSlot(this.id, val);
        else { this._local = val; this._render(); }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that file.');
        console.warn('<media-slot> ingest failed:', err);
      }
    }

    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 4000);
    }

    _render() {
      const n = parseFloat(this.getAttribute('radius'));
      const radius = (Number.isFinite(n) ? n : 0) + 'px';
      this._frame.style.borderRadius = radius;
      this._ring.style.borderRadius = radius;
      const fit = this.getAttribute('fit') || 'cover';
      const pos = this.getAttribute('position') || '50% 50%';
      [this._video, this._img].forEach((el) => { el.style.objectFit = fit; el.style.objectPosition = pos; });

      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:(video|image)\//i.test(stored.u)) stored = null;
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop a video or image';

      if (stored && stored.u) {
        if (stored.t === 'video') {
          if (this._video.getAttribute('src') !== stored.u) this._video.src = stored.u;
          this._video.style.display = 'block';
          this._img.style.display = 'none';
          this._img.removeAttribute('src');
          if (rm) { this._video.setAttribute('controls', ''); this._video.removeAttribute('autoplay'); }
          else { this._video.removeAttribute('controls'); this._video.setAttribute('autoplay', ''); this._video.play && this._video.play().catch(() => {}); }
        } else {
          if (this._img.getAttribute('src') !== stored.u) this._img.src = stored.u;
          this._img.style.display = 'block';
          this._video.style.display = 'none';
          this._video.removeAttribute('src');
        }
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
      } else {
        this._video.style.display = 'none'; this._video.removeAttribute('src');
        this._img.style.display = 'none'; this._img.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }

  if (!customElements.get('media-slot')) customElements.define('media-slot', MediaSlot);
})();
