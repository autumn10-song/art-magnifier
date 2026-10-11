(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const els = {
    stage: $('stage'),
    frame: $('frame'),
    img: $('artImage'),
    lens: $('lens'),
    focusDot: $('focusDot'),
    pins: $('pins'),
    stageMessage: $('stageMessage'),
    title: $('artTitle'),
    meta: $('artMeta'),
    thumbs: $('thumbs'),
    zoomInput: $('zoomInput'),
    zoomOut: $('zoomOut'),
    sizeInput: $('sizeInput'),
    sizeOut: $('sizeOut'),
    liftInput: $('liftInput'),
    squareInput: $('squareInput'),
    artQuestions: $('artQuestions'),
    commonQuestions: $('commonQuestions'),
    findings: $('findings'),
    findingsEmpty: $('findingsEmpty'),
    pinBtn: $('pinBtn'),
    togglePinsBtn: $('togglePinsBtn'),
    clearFindingsBtn: $('clearFindingsBtn'),
    printBtn: $('printBtn'),
    printSheet: $('printSheet'),
    addBtn: $('addBtn'),
    addDialog: $('addDialog'),
    addForm: $('addForm'),
    addCancel: $('addCancel'),
    addError: $('addError'),
    fileInput: $('fileInput'),
    urlInput: $('urlInput'),
    titleInput: $('titleInput'),
    artistInput: $('artistInput'),
    yearInput: $('yearInput'),
    questionsInput: $('questionsInput'),
    dropOverlay: $('dropOverlay'),
    fullscreenBtn: $('fullscreenBtn'),
    exitFullBtn: $('exitFullBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
  };

  // ---------- 브라우저 저장소 (실패해도 프로그램은 동작) ----------
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('magnifier.' + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem('magnifier.' + key, JSON.stringify(value));
      } catch (e) { /* 저장할 수 없는 환경 */ }
    },
    remove(key) {
      try { localStorage.removeItem('magnifier.' + key); } catch (e) { /* 무시 */ }
    },
  };

  // 직접 추가한 작품은 용량이 커서 IndexedDB에 저장합니다.
  const userDb = (function () {
    let dbPromise = null;
    function open() {
      if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
          if (!('indexedDB' in window)) return reject(new Error('no indexedDB'));
          const req = indexedDB.open('art-magnifier', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('artworks', { keyPath: 'id' });
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      }
      return dbPromise;
    }
    function run(mode, fn) {
      return open().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction('artworks', mode);
        const result = fn(tx.objectStore('artworks'));
        tx.oncomplete = () => resolve(result && result.result);
        tx.onerror = () => reject(tx.error);
      }));
    }
    return {
      all: () => run('readonly', (s) => s.getAll()).catch(() => []),
      put: (record) => run('readwrite', (s) => s.put(record)).catch(() => {}),
      remove: (id) => run('readwrite', (s) => s.delete(id)).catch(() => {}),
    };
  })();

  // ---------- 상태 ----------
  const settings = Object.assign(
    { zoom: 3, size: 200, lift: true, square: false },
    store.get('settings', {})
  );

  const state = {
    artworks: window.DEFAULT_ARTWORKS.slice(),
    index: 0,
    loaded: false,
    lens: {
      visible: false,
      locked: false,     // 마우스로 클릭하면 돋보기가 그 자리에 멈춥니다
      fx: 0.5,           // 초점 위치 (작품 너비·높이에 대한 비율 0~1)
      fy: 0.5,
      liftY: 0,
    },
    drag: null,
    activeFinding: -1,
    pinsHidden: false,
  };

  function current() {
    return state.artworks[state.index];
  }

  // ---------- 작품 표시 ----------
  function showArtwork(index) {
    const count = state.artworks.length;
    if (!count) return;
    state.index = ((index % count) + count) % count;
    const art = current();
    store.set('lastArtwork', art.id);

    state.loaded = false;
    state.lens.visible = false;
    state.lens.locked = false;
    state.activeFinding = -1;
    els.frame.hidden = false;
    els.frame.classList.add('no-image');
    showMessage('작품을 불러오는 중이에요… 🖼️');
    els.img.alt = art.title + (art.artist ? ' - ' + art.artist : '');
    els.img.src = art.src;

    els.title.textContent = art.title;
    els.meta.textContent = [art.artist, art.year].filter(Boolean).join(' · ');
    renderQuestions(art);
    renderThumbs();
    renderFindings();
    renderLens();
  }

  function showMessage(text) {
    els.stageMessage.textContent = text;
    els.stageMessage.hidden = !text;
  }

  els.img.addEventListener('load', () => {
    state.loaded = true;
    els.frame.classList.remove('no-image');
    showMessage('');
    const src = els.img.currentSrc || els.img.src;
    els.lens.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
    renderPins();
    renderLens();
  });

  els.img.addEventListener('error', () => {
    state.loaded = false;
    els.frame.hidden = true;
    showMessage('작품 이미지를 불러오지 못했어요. 😢 인터넷 연결을 확인하거나 다른 작품을 골라 주세요.');
  });

  function renderQuestions(art) {
    els.artQuestions.replaceChildren(
      ...(art.questions || []).map((q) => {
        const li = document.createElement('li');
        li.textContent = q;
        return li;
      })
    );
  }

  function renderThumbs() {
    els.thumbs.replaceChildren(
      ...state.artworks.map((art, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'thumb-wrap';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'thumb' + (i === state.index ? ' active' : '');
        btn.style.backgroundImage = 'url("' + (art.thumb || art.src).replace(/"/g, '%22') + '")';
        btn.setAttribute('aria-label', art.title);
        btn.setAttribute('aria-current', i === state.index ? 'true' : 'false');
        btn.addEventListener('click', () => showArtwork(i));
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = art.title;
        btn.appendChild(label);
        wrap.appendChild(btn);

        if (!art.builtIn) {
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'remove';
          del.textContent = '✕';
          del.title = '이 작품 지우기';
          del.setAttribute('aria-label', art.title + ' 지우기');
          del.addEventListener('click', () => removeArtwork(art));
          wrap.appendChild(del);
        }
        return wrap;
      })
    );
    const active = els.thumbs.querySelector('.thumb.active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ---------- 돋보기 ----------
  function imageSize() {
    return { width: els.img.clientWidth, height: els.img.clientHeight };
  }

  function renderLens() {
    const lens = state.lens;
    if (!lens.visible || !state.loaded) {
      els.lens.hidden = true;
      els.focusDot.hidden = true;
      return;
    }
    const { width, height } = imageSize();
    const r = window.Lens.computeLens({
      x: lens.fx * width,
      y: lens.fy * height,
      width,
      height,
      size: settings.size,
      zoom: settings.zoom,
      liftY: lens.liftY,
    });
    const s = els.lens.style;
    s.width = s.height = settings.size + 'px';
    s.left = r.left + 'px';
    s.top = r.top + 'px';
    s.backgroundSize = r.backgroundWidth + 'px ' + r.backgroundHeight + 'px';
    s.backgroundPosition = r.backgroundX + 'px ' + r.backgroundY + 'px';
    els.lens.classList.toggle('square', settings.square);
    els.lens.hidden = false;

    // 돋보기가 손가락 위로 떠 있을 때는 실제로 보고 있는 지점을 점으로 표시
    els.focusDot.hidden = !lens.liftY;
    els.focusDot.style.left = r.focusX + 'px';
    els.focusDot.style.top = r.focusY + 'px';
  }

  function localPoint(e) {
    const rect = els.img.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function setFocus(x, y) {
    const { width, height } = imageSize();
    if (!width || !height) return;
    state.lens.fx = window.Lens.clamp(x / width, 0, 1);
    state.lens.fy = window.Lens.clamp(y / height, 0, 1);
  }

  function isInsideLens(p) {
    if (!state.lens.visible) return false;
    const { width, height } = imageSize();
    const cx = state.lens.fx * width;
    const cy = state.lens.fy * height - state.lens.liftY;
    const half = settings.size / 2;
    if (settings.square) return Math.abs(p.x - cx) <= half && Math.abs(p.y - cy) <= half;
    return Math.hypot(p.x - cx, p.y - cy) <= half;
  }

  els.frame.addEventListener('pointerdown', (e) => {
    if (!state.loaded || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    els.frame.focus({ preventScroll: true });
    try { els.frame.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }

    const p = localPoint(e);
    const { width, height } = imageSize();
    const lens = state.lens;
    let grab = { x: 0, y: 0 };

    if (isInsideLens(p)) {
      // 돋보기 자체를 잡고 끄는 경우: 잡은 위치를 유지하며 이동
      grab = { x: lens.fx * width - p.x, y: lens.fy * height - p.y };
    } else {
      lens.liftY = e.pointerType !== 'mouse' && settings.lift ? settings.size / 2 + 28 : 0;
      setFocus(p.x, p.y);
    }
    lens.visible = true;
    state.drag = { id: e.pointerId, type: e.pointerType, grab, startX: e.clientX, startY: e.clientY, moved: false };
    renderLens();
  });

  els.frame.addEventListener('pointermove', (e) => {
    if (!state.loaded) return;
    const p = localPoint(e);
    const drag = state.drag;
    if (drag && drag.id === e.pointerId) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) drag.moved = true;
      setFocus(p.x + drag.grab.x, p.y + drag.grab.y);
      renderLens();
    } else if (!drag && e.pointerType === 'mouse' && !state.lens.locked) {
      state.lens.liftY = 0;
      state.lens.visible = true;
      setFocus(p.x, p.y);
      renderLens();
    }
  });

  function endDrag(e) {
    const drag = state.drag;
    if (!drag || drag.id !== e.pointerId) return;
    state.drag = null;
    // 마우스로 클릭(끌지 않음)하면 돋보기 고정/해제
    if (drag.type === 'mouse' && !drag.moved && e.type === 'pointerup') {
      state.lens.locked = !state.lens.locked;
      if (!state.lens.locked) {
        const p = localPoint(e);
        setFocus(p.x, p.y);
      }
    } else if (drag.type === 'mouse') {
      state.lens.locked = true;
    }
    renderLens();
  }
  els.frame.addEventListener('pointerup', endDrag);
  els.frame.addEventListener('pointercancel', endDrag);

  els.frame.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !state.drag && !state.lens.locked) {
      state.lens.visible = false;
      renderLens();
    }
  });

  // 길게 눌렀을 때 뜨는 메뉴(이미지 저장 등) 막기
  els.frame.addEventListener('contextmenu', (e) => e.preventDefault());

  // 키보드: 화살표로 이동, Enter로 발견 표시
  els.frame.addEventListener('keydown', (e) => {
    if (!state.loaded) return;
    const step = e.shiftKey ? 0.08 : 0.02;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const lens = state.lens;
      if (lens.visible) {
        lens.fx = window.Lens.clamp(lens.fx + moves[e.key][0], 0, 1);
        lens.fy = window.Lens.clamp(lens.fy + moves[e.key][1], 0, 1);
      }
      lens.visible = true;
      lens.locked = true;
      lens.liftY = 0;
      renderLens();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addFinding();
    } else if (e.key === 'Escape') {
      state.lens.visible = false;
      state.lens.locked = false;
      renderLens();
    }
  });

  window.addEventListener('resize', () => {
    renderLens();
  });

  // ---------- 설정 ----------
  function applySettings() {
    els.zoomInput.value = settings.zoom;
    els.zoomOut.textContent = settings.zoom + '배';
    els.sizeInput.value = settings.size;
    els.sizeOut.textContent = settings.size + 'px';
    els.liftInput.checked = settings.lift;
    els.squareInput.checked = settings.square;
    store.set('settings', settings);
    renderLens();
  }
  els.zoomInput.addEventListener('input', () => { settings.zoom = Number(els.zoomInput.value); applySettings(); });
  els.sizeInput.addEventListener('input', () => {
    settings.size = Number(els.sizeInput.value);
    if (state.lens.liftY) state.lens.liftY = settings.size / 2 + 28;
    applySettings();
  });
  els.liftInput.addEventListener('change', () => { settings.lift = els.liftInput.checked; applySettings(); });
  els.squareInput.addEventListener('change', () => { settings.square = els.squareInput.checked; applySettings(); });

  // ---------- 발견 기록 ----------
  function findingsKey() {
    return 'findings.' + current().id;
  }
  function getFindings() {
    return store.get(findingsKey(), []);
  }
  function saveFindings(list) {
    store.set(findingsKey(), list);
  }

  function addFinding() {
    if (!state.loaded) return;
    if (!state.lens.visible) {
      alert('먼저 돋보기를 작품 위에 놓아 주세요.\n(마우스는 작품을 클릭하면 돋보기가 멈춰요.)');
      return;
    }
    const list = getFindings();
    list.push({ x: state.lens.fx, y: state.lens.fy, note: '' });
    saveFindings(list);
    state.activeFinding = list.length - 1;
    state.lens.locked = true;
    renderFindings();
    const inputs = els.findings.querySelectorAll('textarea');
    if (inputs.length) inputs[inputs.length - 1].focus({ preventScroll: false });
  }

  function goToFinding(i) {
    const f = getFindings()[i];
    if (!f) return;
    state.activeFinding = i;
    Object.assign(state.lens, { fx: f.x, fy: f.y, visible: true, locked: true, liftY: 0 });
    renderFindings();
    renderLens();
  }

  function renderFindings() {
    const list = getFindings();
    els.findingsEmpty.hidden = list.length > 0;
    els.findings.replaceChildren(
      ...list.map((f, i) => {
        const li = document.createElement('li');
        li.className = 'finding' + (i === state.activeFinding ? ' active' : '');

        const num = document.createElement('button');
        num.type = 'button';
        num.className = 'num';
        num.textContent = String(i + 1);
        num.title = '돋보기로 다시 보기';
        num.setAttribute('aria-label', (i + 1) + '번 발견 위치 다시 보기');
        num.addEventListener('click', () => goToFinding(i));

        const note = document.createElement('textarea');
        note.value = f.note;
        note.placeholder = '무엇을 발견했나요? (색, 선, 모양, 느낌…)';
        note.setAttribute('aria-label', (i + 1) + '번 발견 내용');
        note.addEventListener('input', () => {
          const all = getFindings();
          if (all[i]) { all[i].note = note.value; saveFindings(all); }
        });
        note.addEventListener('focus', () => {
          if (state.activeFinding !== i) goToFindingQuiet(i);
        });

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'del';
        del.textContent = '🗑';
        del.title = '지우기';
        del.setAttribute('aria-label', (i + 1) + '번 발견 지우기');
        del.addEventListener('click', () => {
          const all = getFindings();
          all.splice(i, 1);
          saveFindings(all);
          state.activeFinding = -1;
          renderFindings();
        });

        li.append(num, note, del);
        return li;
      })
    );
    renderPins();
  }

  // 글을 쓰는 중에 목록을 다시 그리면 입력이 끊기므로 표시만 바꿉니다
  function goToFindingQuiet(i) {
    const f = getFindings()[i];
    if (!f) return;
    state.activeFinding = i;
    Object.assign(state.lens, { fx: f.x, fy: f.y, visible: true, locked: true, liftY: 0 });
    els.findings.querySelectorAll('.finding').forEach((li, j) => li.classList.toggle('active', j === i));
    renderPins();
    renderLens();
  }

  function renderPins() {
    els.pins.classList.toggle('hidden', state.pinsHidden);
    els.pins.replaceChildren(...buildPins(getFindings(), state.activeFinding));
  }

  function buildPins(list, active) {
    return list.map((f, i) => {
      const pin = document.createElement('div');
      pin.className = 'pin' + (i === active ? ' active' : '');
      pin.style.left = f.x * 100 + '%';
      pin.style.top = f.y * 100 + '%';
      const span = document.createElement('span');
      span.textContent = String(i + 1);
      pin.appendChild(span);
      return pin;
    });
  }

  els.pinBtn.addEventListener('click', addFinding);
  els.togglePinsBtn.addEventListener('click', () => {
    state.pinsHidden = !state.pinsHidden;
    els.togglePinsBtn.textContent = state.pinsHidden ? '표시 보이기' : '표시 숨기기';
    renderPins();
  });
  els.clearFindingsBtn.addEventListener('click', () => {
    if (!getFindings().length) return;
    if (!confirm('이 작품의 발견 기록을 모두 지울까요?')) return;
    store.remove(findingsKey());
    state.activeFinding = -1;
    renderFindings();
  });

  els.printBtn.addEventListener('click', () => {
    const art = current();
    const list = getFindings();
    const sheet = els.printSheet;
    sheet.replaceChildren();

    const h = document.createElement('h1');
    h.textContent = '🔍 ' + art.title;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = [art.artist, art.year].filter(Boolean).join(' · ');
    const name = document.createElement('p');
    name.className = 'name-line';
    name.textContent = '이름: ____________________   날짜: ____________';

    const artBox = document.createElement('div');
    artBox.className = 'art';
    const img = document.createElement('img');
    img.src = els.img.currentSrc || els.img.src;
    img.alt = art.title;
    artBox.append(img, ...buildPins(list, -1));

    const ol = document.createElement('ol');
    (list.length ? list : [{ note: '' }, { note: '' }, { note: '' }]).forEach((f, i) => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = (i + 1) + '.';
      li.append(b, ' ' + (f.note || ''));
      ol.appendChild(li);
    });

    sheet.append(h, meta, name, artBox, ol);
    if (img.complete) window.print();
    else {
      img.onload = img.onerror = () => window.print();
    }
  });

  // ---------- 작품 추가 / 삭제 ----------
  function newId() {
    return 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function fileTitle(file) {
    return file.name.replace(/\.[^.]+$/, '') || '내 작품';
  }

  function recordToArtwork(rec) {
    const src = rec.blob ? URL.createObjectURL(rec.blob) : rec.url;
    return {
      id: rec.id,
      title: rec.title,
      artist: rec.artist || '',
      year: rec.year || '',
      questions: rec.questions || [],
      src,
      builtIn: false,
    };
  }

  function addRecords(records) {
    if (!records.length) return;
    records.forEach((rec) => {
      userDb.put(rec);
      state.artworks.push(recordToArtwork(rec));
    });
    showArtwork(state.artworks.length - records.length);
  }

  function addFiles(files, info) {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const records = images.map((file) => ({
      id: newId(),
      title: (images.length === 1 && info.title) || fileTitle(file),
      artist: info.artist || '',
      year: info.year || '',
      questions: info.questions || [],
      blob: file,
      createdAt: Date.now(),
    }));
    addRecords(records);
    return records.length;
  }

  function checkImageUrl(url) {
    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = url;
    });
  }

  function titleFromUrl(url) {
    try {
      const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
      return last.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || '새 작품';
    } catch (e) {
      return '새 작품';
    }
  }

  async function addUrl(url, info) {
    if (!(await checkImageUrl(url))) return false;
    addRecords([{
      id: newId(),
      title: info.title || titleFromUrl(url),
      artist: info.artist || '',
      year: info.year || '',
      questions: info.questions || [],
      url,
      createdAt: Date.now(),
    }]);
    return true;
  }

  function removeArtwork(art) {
    if (!confirm('"' + art.title + '" 작품을 목록에서 지울까요?')) return;
    const i = state.artworks.indexOf(art);
    if (i < 0) return;
    const wasCurrent = i === state.index;
    state.artworks.splice(i, 1);
    userDb.remove(art.id);
    store.remove('findings.' + art.id);
    if (art.src.startsWith('blob:')) URL.revokeObjectURL(art.src);
    if (wasCurrent) showArtwork(Math.min(i, state.artworks.length - 1));
    else {
      if (i < state.index) state.index--;
      renderThumbs();
    }
  }

  function openAddDialog() {
    els.addForm.reset();
    els.addError.hidden = true;
    if (els.addDialog.showModal) els.addDialog.showModal();
    else els.addDialog.setAttribute('open', '');
  }
  function closeAddDialog() {
    if (els.addDialog.close) els.addDialog.close();
    else els.addDialog.removeAttribute('open');
  }
  function showAddError(text) {
    els.addError.textContent = text;
    els.addError.hidden = false;
  }

  els.addBtn.addEventListener('click', openAddDialog);
  els.addCancel.addEventListener('click', closeAddDialog);
  els.addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const info = {
      title: els.titleInput.value.trim(),
      artist: els.artistInput.value.trim(),
      year: els.yearInput.value.trim(),
      questions: els.questionsInput.value.split('\n').map((q) => q.trim()).filter(Boolean),
    };
    const files = els.fileInput.files;
    const url = els.urlInput.value.trim();
    if (files && files.length) {
      if (!addFiles(files, info)) return showAddError('이미지 파일을 골라 주세요.');
      closeAddDialog();
    } else if (url) {
      showAddError('이미지를 확인하는 중이에요…');
      if (await addUrl(url, info)) closeAddDialog();
      else showAddError('이 주소에서 이미지를 불러올 수 없어요. 이미지 파일 주소(.jpg, .png 등)인지 확인해 주세요.');
    } else {
      showAddError('파일을 고르거나 이미지 주소를 넣어 주세요.');
    }
  });

  // 화면 위로 이미지 파일(또는 다른 웹 페이지의 그림)을 끌어다 놓으면 추가
  let dragDepth = 0;
  function hasDroppable(e) {
    const types = e.dataTransfer && Array.from(e.dataTransfer.types || []);
    return types && (types.includes('Files') || types.includes('text/uri-list'));
  }
  window.addEventListener('dragenter', (e) => {
    if (!hasDroppable(e)) return;
    e.preventDefault();
    dragDepth++;
    els.dropOverlay.hidden = false;
  });
  window.addEventListener('dragover', (e) => {
    if (hasDroppable(e)) e.preventDefault();
  });
  window.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) els.dropOverlay.hidden = true;
  });
  window.addEventListener('drop', async (e) => {
    if (!hasDroppable(e)) return;
    e.preventDefault();
    dragDepth = 0;
    els.dropOverlay.hidden = true;
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length) {
      addFiles(dt.files, {});
      return;
    }
    const url = (dt.getData('text/uri-list') || '').split('\n').find((l) => l && !l.startsWith('#'));
    if (url && !(await addUrl(url.trim(), {}))) {
      alert('끌어다 놓은 그림을 불러올 수 없어요. 그림을 컴퓨터에 저장한 뒤 [작품 추가]로 넣어 주세요.');
    }
  });

  // ---------- 이동 / 전체 화면 ----------
  els.prevBtn.addEventListener('click', () => showArtwork(state.index - 1));
  els.nextBtn.addEventListener('click', () => showArtwork(state.index + 1));
  document.addEventListener('keydown', (e) => {
    if (e.target !== document.body) return;
    if (e.key === 'ArrowLeft') showArtwork(state.index - 1);
    if (e.key === 'ArrowRight') showArtwork(state.index + 1);
  });

  function setFullscreen(on) {
    document.body.classList.toggle('is-fullscreen', on);
    const root = document.documentElement;
    try {
      if (on && !document.fullscreenElement) {
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        const p = req && req.call(root);
        if (p && p.catch) p.catch(() => {});
      } else if (!on && (document.fullscreenElement || document.webkitFullscreenElement)) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        const p = exit && exit.call(document);
        if (p && p.catch) p.catch(() => {});
      }
    } catch (err) { /* 전체 화면을 지원하지 않으면 화면 배치만 바꿉니다 */ }
    requestAnimationFrame(renderLens);
  }
  els.fullscreenBtn.addEventListener('click', () => setFullscreen(true));
  els.exitFullBtn.addEventListener('click', () => setFullscreen(false));
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) setFullscreen(false);
  });

  // ---------- 시작 ----------
  els.commonQuestions.replaceChildren(
    ...window.COMMON_QUESTIONS.map((q) => {
      const li = document.createElement('li');
      li.textContent = q;
      return li;
    })
  );
  applySettings();

  userDb.all().then((records) => {
    records
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .forEach((rec) => state.artworks.push(recordToArtwork(rec)));
    const lastId = store.get('lastArtwork', null);
    const lastIndex = state.artworks.findIndex((a) => a.id === lastId);
    showArtwork(lastIndex >= 0 ? lastIndex : 0);
  });
})();
