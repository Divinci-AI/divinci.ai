/* Site-wide fuzzy search — header Cmd/Ctrl+K modal + blog inline filter.
   Loads the active-language index (falls back to EN), runs Fuse.js fuzzy
   matching, renders keyboard-navigable results. No runtime backend. */
(function () {
  'use strict';

  var TRIGGERS = document.querySelectorAll('.site-search-trigger');
  var MODAL = document.getElementById('search-modal');
  var INPUT = document.getElementById('search-input');
  var RESULTS = document.getElementById('search-results');
  var EMPTY = document.getElementById('search-empty');
  var HINT = document.getElementById('search-hint');
  if (!TRIGGERS.length || !MODAL || !INPUT || !RESULTS || !EMPTY) return;

  // Active language from <html lang>; falls back to EN.
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var INDEX_URL = '/search-index.' + lang + '.json';
  var fuse = null;

  function loadIndex() {
    return fetch(INDEX_URL)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .catch(function () { return fetch('/search-index.en.json').then(function (r) { return r.json(); }); });
  }

  loadIndex().then(function (data) {
    fuse = new Fuse(data, {
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'tags', weight: 0.3 },
        { name: 'categories', weight: 0.3 },
        { name: 'excerpt', weight: 0.2 },
        { name: 'url', weight: 0.1 }
      ]
    });
  });

  var active = -1;

  function clearResults() {
    while (RESULTS.firstChild) RESULTS.removeChild(RESULTS.firstChild);
  }

  // Root-absolute hrefs only — relative paths concatenate onto the current URL.
  function absoluteUrl(url) {
    if (!url) return '/';
    if (/^(https?:)?\/\//i.test(url) || url.charAt(0) === '/') return url;
    return '/' + url;
  }

  function render(q) {
    clearResults();
    active = -1;
    if (!q || !fuse) {
      EMPTY.hidden = true;
      if (HINT) HINT.hidden = false;
      return;
    }
    var hits = fuse.search(q).slice(0, 12);
    if (HINT) HINT.hidden = true;
    if (!hits.length) { EMPTY.hidden = false; return; }
    EMPTY.hidden = true;
    hits.forEach(function (h) {
      var item = h.item;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.setAttribute('href', absoluteUrl(item.url));
      var section = document.createElement('div');
      section.className = 'r-section';
      section.textContent = item.section;
      var title = document.createElement('div');
      title.className = 'r-title';
      title.textContent = item.title;
      var excerpt = document.createElement('div');
      excerpt.className = 'r-excerpt';
      excerpt.textContent = (item.excerpt || '').slice(0, 140);
      a.appendChild(section);
      a.appendChild(title);
      a.appendChild(excerpt);
      li.appendChild(a);
      RESULTS.appendChild(li);
    });
  }

  function openModal() {
    MODAL.classList.add('open');
    INPUT.focus();
    INPUT.value = '';
    render('');
  }
  function closeModal() {
    MODAL.classList.remove('open');
    active = -1;
    clearResults();
  }
  function highlight() {
    var items = RESULTS.querySelectorAll('li');
    items.forEach(function (li, i) { li.classList.toggle('active', i === active); });
    if (active >= 0 && items[active]) items[active].scrollIntoView({ block: 'nearest' });
  }

  Array.prototype.forEach.call(TRIGGERS, function (t) { t.addEventListener('click', openModal); });
  MODAL.addEventListener('click', function (e) { if (e.target === MODAL) closeModal(); });
  INPUT.addEventListener('input', function (e) { render(e.target.value); });

  document.addEventListener('keydown', function (e) {
    // Cmd/Ctrl+K toggles the modal.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (MODAL.classList.contains('open')) closeModal(); else openModal();
      return;
    }
    if (e.key === 'Escape' && MODAL.classList.contains('open')) { closeModal(); return; }
    if (!MODAL.classList.contains('open')) return;

    var items = RESULTS.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = items.length ? Math.min(active + 1, items.length - 1) : -1;
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = items.length ? Math.max(active - 1, 0) : -1;
      highlight();
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      var link = items[active].querySelector('a');
      if (link) window.location.href = link.getAttribute('href');
    }
  });
})();
