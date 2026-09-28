/* Inventario: previews de lectura; no escribe Firebase ni modifica los archivos. */
(function () {
  'use strict';
  var cache = new Map(), current = null, viewer = null;
  function source(value) {
    try { var u = new URL(value, location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; }
    catch (_) { return ''; }
  }
  function release(video) {
    video.onloadedmetadata = video.onseeked = video.onerror = null;
    video.pause(); video.removeAttribute('src'); video.load(); video.remove();
  }
  function closeViewer() {
    if (!viewer) return;
    var old = viewer; viewer = null;
    release(old.querySelector('video')); old.close(); old.remove();
  }
  function openVideo(url, label, poster) {
    closeViewer();
    var dialog = document.createElement('dialog');
    if (typeof dialog.showModal !== 'function') { window.open(url, '_blank', 'noopener'); return; }
    dialog.dataset.videoUrl = url;
    dialog.className = 'inv-video-viewer';
    dialog.setAttribute('aria-label', label);
    var header = document.createElement('div'); header.className = 'inv-video-header';
    var title = document.createElement('strong'); title.textContent = label;
    var close = document.createElement('button'); close.type = 'button'; close.textContent = 'Cerrar ×';
    close.setAttribute('aria-label', 'Cerrar video'); close.onclick = closeViewer;
    header.append(title, close);
    var video = document.createElement('video');
    video.controls = true; video.playsInline = true; video.preload = 'metadata';
    video.setAttribute('playsinline', ''); video.src = url;
    if (poster) video.poster = poster;
    var status = document.createElement('p'); status.className = 'inv-video-status';
    status.textContent = 'Usa los controles para reproducir o ampliar el video.';
    var link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener';
    link.textContent = 'Abrir video original';
    video.onerror = function () { status.textContent = 'Este navegador no pudo reproducirlo. Prueba abrir el original.'; };
    dialog.append(header, video, status, link);
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeViewer(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeViewer(); });
    document.body.appendChild(dialog); viewer = dialog; dialog.showModal();
    // Se reproduce solo después del toque/clic, nunca al abrir la carpeta.
    var play = video.play(); if (play && play.catch) play.catch(function () {});
  }
  function disposeThumbnails() {
    var old = current; current = null;
    if (old) { old.stopped = true; old.observer && old.observer.disconnect(); old.jobs.forEach(function (cancel) { cancel(); }); }
  }
  function dispose() { disposeThumbnails(); closeViewer(); }
  function paint(button, thumbnail) {
    var img = document.createElement('img'); img.src = thumbnail; img.alt = ''; img.className = 'inv-video-poster';
    button.prepend(img); button.querySelector('.inv-video-hint').textContent = 'Ver video';
  }
  function thumbnail(url, button, state, done) {
    var video = document.createElement('video'), ended = false, timer;
    video.className = 'inv-video-decoder'; video.muted = true; video.playsInline = true;
    video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    video.preload = 'metadata'; video.crossOrigin = 'anonymous';
    function finish(result) {
      if (ended) return; ended = true; clearTimeout(timer); state.jobs.delete(cancel); release(video);
      if (!state.stopped && button.isConnected) {
        if (result) {
          cache.set(url, result); if (cache.size > 80) cache.delete(cache.keys().next().value);
          paint(button, result);
        } else button.querySelector('.inv-video-hint').textContent = 'Toca para ver';
      }
      done();
    }
    function cancel() { finish(null); }
    state.jobs.add(cancel);
    video.onloadedmetadata = function () {
      if (!video.videoWidth || !isFinite(video.duration) || video.duration <= 0) { finish(null); return; }
      // Salta el fotograma inicial: Safari necesita cargar y buscar un cuadro.
      try { video.currentTime = Math.min(0.5, video.duration / 2); } catch (_) { finish(null); }
    };
    video.onseeked = function () {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = Math.min(360, video.videoWidth);
        canvas.height = Math.max(1, Math.round(canvas.width * video.videoHeight / video.videoWidth));
        // Limita también videos verticales/extremos para no consumir memoria de más.
        if (canvas.height > 480) { canvas.width = Math.max(1, Math.round(canvas.width * 480 / canvas.height)); canvas.height = 480; }
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.78));
      } catch (_) { finish(null); }
    };
    video.onerror = function () { finish(null); };
    timer = setTimeout(function () { finish(null); }, 20000);
    document.body.appendChild(video); video.src = url; video.load();
  }
  function mount(root, media) {
    disposeThumbnails();
    if (viewer && !media.some(function (m) { return m.t === 'video' && source(m.url) === viewer.dataset.videoUrl; })) closeViewer();
    var state = { stopped: false, jobs: new Set(), queue: [], running: 0, observer: null };
    current = state;
    function pump() {
      if (state.stopped || state.running >= 2 || !state.queue.length) return;
      var item = state.queue.shift(); state.running++;
      thumbnail(item.url, item.button, state, function () { state.running--; pump(); }); pump();
    }
    function enqueue(button) {
      if (button.dataset.queued) return;
      button.dataset.queued = '1'; state.queue.push({ button: button, url: button.dataset.videoUrl }); pump();
    }
    if ('IntersectionObserver' in window) {
      state.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { state.observer.unobserve(entry.target); enqueue(entry.target); } });
      }, { root: root.closest('.modal'), rootMargin: '100px' });
    }
    root.querySelectorAll('[data-video-index]').forEach(function (button) {
      var index = Number(button.dataset.videoIndex), item = media[index];
      var url = item && item.t === 'video' ? source(item.url) : '';
      if (!url) { button.disabled = true; button.querySelector('.inv-video-hint').textContent = 'Video no disponible'; return; }
      button.dataset.videoUrl = url;
      var label = 'Video ' + (index + 1);
      button.setAttribute('aria-label', 'Ver ' + label.toLowerCase());
      button.onclick = function () { openVideo(url, label, cache.get(url)); };
      if (cache.has(url)) paint(button, cache.get(url));
      else if (state.observer) state.observer.observe(button);
      else enqueue(button);
    });
  }
  window.InventarioVideoPreview = { mount: mount, dispose: dispose };
})();
