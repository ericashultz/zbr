/*
 * ZBR Canada / Intl Store -- filterable product grid for Squarespace.
 *
 * Usage (Squarespace Code Block on the Store page, "Display Source" OFF):
 *   <div id="zbr-store"></div>
 *   <script src="https://zbr-rho.vercel.app/squarespace/store-grid.js"></script>
 *
 * Products come from /api/catalog (a slim, cached copy of the store's collections).
 * Every tile links to the real Squarespace product page, so cart/checkout stay native.
 * Filters mirror the redesign: search, New Items / Steals, Bands A-Z, Merch, Labels.
 */
(function () {
  'use strict';

  var BASE = 'https://zbr-rho.vercel.app';
  try { if (document.currentScript && document.currentScript.src) BASE = new URL(document.currentScript.src).origin; } catch (e) { /* keep default */ }
  var CATALOG_URL = BASE + '/api/catalog';
  var PAGE_SIZE = 120;
  var MOBILE_MAX = 900; // phones + tablets: stacked sidebar, collapsed filter menus (matches the nav's mobile menu)

  var VINYL = ['v12', 'v7', 'vo'];
  var MERCH = [
    { id: 'vinyl', label: 'Vinyl', sub: [
      { id: 'v12', label: '12" Records' },
      { id: 'v7', label: '7" Records' },
      { id: 'vo', label: '5"/6"/9"/10" Records' }
    ] },
    { id: 'cd', label: 'CDs' },
    { id: 'tape', label: 'Cassettes' },
    { id: 'shirt', label: 'Shirts' },
    { id: 'poster', label: 'Posters' },
    { id: 'button', label: 'Buttons' },
    { id: 'sticker', label: 'Stickers' }
  ];
  var LABELS = ['Zegema Beach Releases', 'Tomb Tree', 'Softseed Music'];

  var CSS = '' +
    '@font-face{font-family:"Fixedsys Excelsior";src:url("' + BASE + '/assets/fonts/FixedsysExcelsior.woff2") format("woff2"),url("' + BASE + '/assets/fonts/FixedsysExcelsior.woff") format("woff");font-weight:normal;font-style:normal;font-display:swap}' +
    '@font-face{font-family:"Fixedsys Excelsior";src:url("' + BASE + '/assets/fonts/FixedsysExcelsior.woff2") format("woff2"),url("' + BASE + '/assets/fonts/FixedsysExcelsior.woff") format("woff");font-weight:bold;font-style:normal;font-display:swap}' +
    '#zbr-store, #zbr-store *{box-sizing:border-box}' +
    '#zbr-store{padding:12px;color:#d9d9d9;font-family:Arial,sans-serif;text-align:left;line-height:1.3}' +
    '#zbr-store .zs-layout{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}' +
    '#zbr-store .zs-sidebar{flex:0 0 200px;min-width:160px;background:#000;border:3px groove #C0DEFF;padding:10px}' +
    '#zbr-store .zs-search{display:block;font:bold 12px "Fixedsys Excelsior","Courier New",monospace;color:#fff;margin:0 0 14px;text-transform:none;letter-spacing:0}' +
    '#zbr-store .zs-search input{display:block;width:100%;height:auto;margin:6px 0 0;padding:6px;font:13px "Fixedsys Excelsior","Courier New",monospace;border:2px inset #c0c0c0;border-radius:0;background:#fff;color:#000;box-shadow:none;text-transform:none;letter-spacing:0}' +
    '#zbr-store .zs-quick{display:flex;gap:8px;margin:0 0 14px}' +
    '#zbr-store button{-webkit-appearance:none;appearance:none;border-radius:0;box-shadow:none;text-transform:none;letter-spacing:0;line-height:1.3;cursor:pointer;margin:0}' +
    '#zbr-store .zs-quick button{flex:1;text-align:center;background:linear-gradient(180deg,#fff,#d4d4d4);border:2px outset #fff;color:#000332;font:bold 13px "Fixedsys Excelsior","Courier New",monospace;padding:6px 4px}' +
    '#zbr-store .zs-quick button:hover{background:#1D64A7;border-color:#1E61A8;color:#fff}' +
    '#zbr-store .zs-quick button[aria-current="true"]{border-style:inset;background:#FFEE00;color:#000}' +
    '#zbr-store .zs-section{margin:0 0 6px}' +
    '#zbr-store .zs-toggle{display:block;width:100%;text-align:left;background:#C0DEFF;color:#000;border:0;font:bold 14px "Fixedsys Excelsior","Courier New",monospace;margin:0 0 8px;padding:5px 8px}' +
    '#zbr-store .zs-toggle .zs-arrow{display:inline;float:right;transition:transform .15s ease}' +
    '#zbr-store .zs-toggle[aria-expanded="true"] .zs-arrow{transform:rotate(180deg)}' +
    '#zbr-store ul.zs-list{list-style:none;margin:0 0 10px;padding:0;max-height:420px;overflow-y:auto}' +
    '#zbr-store ul.zs-list.zs-collapsed{display:none}' +
    '#zbr-store ul.zs-list li, #zbr-store ul.zs-sublist li{list-style:none;margin:0 0 2px;padding:0;background:none}' +
    '#zbr-store ul.zs-list li::before, #zbr-store ul.zs-sublist li::before{content:none}' +
    '#zbr-store .zs-list button{display:block;width:100%;text-align:left;background:none;border:0;font:13px "Fixedsys Excelsior","Courier New",monospace;color:#C0DEFF;padding:4px 6px}' +
    '#zbr-store .zs-list button:hover, #zbr-store .zs-list button[aria-current="true"]{background:#1D64A7;color:#fff}' +
    '#zbr-store ul.zs-sublist{list-style:none;margin:2px 0 2px 14px;padding:0}' +
    '#zbr-store .zs-sublist button{display:block;width:100%;text-align:left;background:none;border:0;font:12px "Fixedsys Excelsior","Courier New",monospace;color:#d9d9d9;padding:3px 6px}' +
    '#zbr-store .zs-sublist button:hover, #zbr-store .zs-sublist button[aria-current="true"]{background:#1D64A7;color:#fff}' +
    '#zbr-store .zs-main{flex:1;min-width:260px}' +
    '#zbr-store .zs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}' +
    '#zbr-store a.zs-tile{display:block;text-align:center;text-decoration:none;background:#000;border:3px groove #C0DEFF;padding:8px;color:#fff}' +
    '#zbr-store a.zs-tile:hover{border-color:#1D64A7;background:#000}' +
    '#zbr-store .zs-tile img{display:block;width:100%;height:auto;border:2px outset #c0c0c0;margin:0 0 6px;background:#111}' +
    '#zbr-store .zs-band{display:block;font:bold 12px Arial,sans-serif;color:#FFEE00;text-transform:none;letter-spacing:0}' +
    '#zbr-store .zs-name{display:block;font:11px Arial,sans-serif;color:#fff;margin:2px 0;text-transform:none;letter-spacing:0}' +
    '#zbr-store .zs-price{display:block;font:bold 12px "Fixedsys Excelsior","Courier New",monospace;color:#C0DFFE;text-transform:none;letter-spacing:0}' +
    '#zbr-store .zs-price.zs-soldout{color:#ff6b6b}' +
    '#zbr-store .zs-msg{color:#d9d9d9;font-size:14px;padding:10px 2px}' +
    '#zbr-store .zs-msg a{color:#C0DEFF}' +
    '#zbr-store .zs-morewrap{text-align:center;margin:18px 0 4px}' +
    '#zbr-store .zs-more{background:linear-gradient(180deg,#fff,#d4d4d4);border:2px outset #fff;color:#000332;font:bold 13px "Fixedsys Excelsior","Courier New",monospace;padding:8px 18px}' +
    '#zbr-store .zs-more:hover{background:#1D64A7;border-color:#1E61A8;color:#fff}' +
    // Squarespace caps normal pages at 710px; let the store page use the full frame like the redesign (4 columns)
    'body.zbr-store-page #page{max-width:none!important;margin-left:0!important;margin-right:0!important;padding-bottom:24px!important}' +
    '@media (max-width:' + MOBILE_MAX + 'px){#zbr-store{padding:4px 12px 12px}#zbr-store .zs-sidebar{flex:1 1 100%;width:100%}}';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').trim().toLowerCase(); }

  function init() {
    var root = document.getElementById('zbr-store');
    if (!root || root.getAttribute('data-zs-ready')) return;
    root.setAttribute('data-zs-ready', '1');
    document.body.classList.add('zbr-store-page');

    if (!document.getElementById('zbr-store-css')) {
      var style = document.createElement('style');
      style.id = 'zbr-store-css';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    root.innerHTML = '<p class="zs-msg">Loading the store&hellip;</p>';

    fetch(CATALOG_URL)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (catalog) { build(root, catalog.items || []); })
      .catch(function () {
        root.innerHTML = '<p class="zs-msg">The store grid couldn\'t load right now. You can still browse: ' +
          '<a href="/zegema-beach-releases">Zegema Beach Releases</a> &middot; ' +
          '<a href="/tomb-tree-tapes">Tomb Tree</a> &middot; ' +
          '<a href="/softseed">Softseed Music</a> &middot; ' +
          '<a href="/specials">New Items / Specials</a></p>';
      });
  }

  function build(root, items) {
    var mq = window.matchMedia('(max-width:' + MOBILE_MAX + 'px)');
    var collapsedByDefault = mq.matches;
    var st = { band: '', cat: '', size: '', label: '', special: '', query: '', shown: PAGE_SIZE };

    // Bands A-Z: unique (case-insensitive), skipping the label's own name
    var seen = {}, bands = [];
    items.forEach(function (p) {
      var k = norm(p.b);
      if (!k || k === 'zegema beach records' || seen[k]) return;
      seen[k] = 1;
      bands.push(p.b);
    });
    function sortKey(b) { return b.replace(/^[^A-Za-z0-9\u00C0-\uFFFF]+/, '') || b; } // ignore leading punctuation like "..." or "["
    bands.sort(function (a, b) { return sortKey(a).localeCompare(sortKey(b), undefined, { sensitivity: 'base', numeric: true }); });

    function section(title, listHtml) {
      return '<div class="zs-section">' +
        '<button type="button" class="zs-toggle" data-zs-toggle aria-expanded="' + (collapsedByDefault ? 'false' : 'true') + '">' + esc(title) + ' <span class="zs-arrow">&#9660;</span></button>' +
        '<ul class="zs-list' + (collapsedByDefault ? ' zs-collapsed' : '') + '">' + listHtml + '</ul></div>';
    }

    var bandsHtml = '<li><button type="button" data-zs-viewall>View All</button></li>' + bands.map(function (b) {
      return '<li><button type="button" data-zs-band="' + esc(b) + '">' + esc(b) + '</button></li>';
    }).join('');

    var merchHtml = '<li><button type="button" data-zs-viewall>View All</button></li>' + MERCH.map(function (m) {
      var sub = m.sub ? '<ul class="zs-sublist">' + m.sub.map(function (s) {
        return '<li><button type="button" data-zs-cat="vinyl" data-zs-size="' + s.id + '">' + esc(s.label) + '</button></li>';
      }).join('') + '</ul>' : '';
      return '<li><button type="button" data-zs-cat="' + m.id + '">' + esc(m.label) + '</button>' + sub + '</li>';
    }).join('');

    var labelsHtml = '<li><button type="button" data-zs-viewall>View All</button></li>' + LABELS.map(function (l) {
      return '<li><button type="button" data-zs-label="' + esc(l) + '">' + esc(l) + '</button></li>';
    }).join('');

    root.innerHTML =
      '<div class="zs-layout">' +
        '<aside class="zs-sidebar">' +
          '<label class="zs-search">Search<input type="text" placeholder="Band or release..." autocomplete="off"></label>' +
          '<div class="zs-quick">' +
            '<button type="button" data-zs-special="new">New Items</button>' +
            '<button type="button" data-zs-special="steals">Steals</button>' +
          '</div>' +
          section('Bands A-Z', bandsHtml) +
          section('Merch', merchHtml) +
          section('Labels', labelsHtml) +
        '</aside>' +
        '<div class="zs-main"><div class="zs-grid"></div><div class="zs-morewrap"></div></div>' +
      '</div>';

    var grid = root.querySelector('.zs-grid');
    var moreWrap = root.querySelector('.zs-morewrap');
    var search = root.querySelector('.zs-search input');

    function hasFmt(p, code) { return !!p.f && p.f.indexOf(code) !== -1; }

    function matches(p, q) {
      if (st.band && norm(p.b) !== norm(st.band)) return false;
      if (st.cat === 'vinyl') { if (!VINYL.some(function (c) { return hasFmt(p, c); })) return false; }
      else if (st.cat && !hasFmt(p, st.cat)) return false;
      if (st.size && !hasFmt(p, st.size)) return false;
      if (st.label && p.l !== st.label) return false;
      if (st.special && p.sp !== st.special) return false;
      if (q && ((p.b || '') + ' ' + p.n).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }

    function priceLabel(p) {
      if (p.s) return 'SOLD OUT';
      return (p.r ? 'from ' : '') + 'CA$' + p.p.toFixed(2);
    }

    function render() {
      var q = norm(st.query);
      var filtered = items.filter(function (p) { return matches(p, q); });

      if (!filtered.length) {
        grid.innerHTML = '<p class="zs-msg">No releases match that search.</p>';
        moreWrap.innerHTML = '';
      } else {
        grid.innerHTML = filtered.slice(0, st.shown).map(function (p) {
          return '<a class="zs-tile" href="' + esc(p.u) + '">' +
            (p.i ? '<img src="' + esc(p.i) + '" alt="' + esc((p.b ? p.b + ' - ' : '') + p.n) + '" loading="lazy">' : '') +
            (p.b ? '<span class="zs-band">' + esc(p.b) + '</span>' : '') +
            '<span class="zs-name">' + esc(p.n) + '</span>' +
            '<span class="zs-price' + (p.s ? ' zs-soldout' : '') + '">' + esc(priceLabel(p)) + '</span>' +
            '</a>';
        }).join('');
        var remaining = filtered.length - st.shown;
        moreWrap.innerHTML = remaining > 0
          ? '<button type="button" class="zs-more" data-zs-more>Show more (' + remaining + ' more)</button>'
          : '';
      }

      // aria-current state, same rules as the redesign
      root.querySelectorAll('[data-zs-band]').forEach(function (b) { b.setAttribute('aria-current', st.band && b.getAttribute('data-zs-band') === st.band ? 'true' : 'false'); });
      root.querySelectorAll('[data-zs-cat]').forEach(function (b) {
        var size = b.getAttribute('data-zs-size');
        var on = size ? size === st.size : (b.getAttribute('data-zs-cat') === st.cat && !st.size);
        b.setAttribute('aria-current', on ? 'true' : 'false');
      });
      root.querySelectorAll('[data-zs-label]').forEach(function (b) { b.setAttribute('aria-current', st.label && b.getAttribute('data-zs-label') === st.label ? 'true' : 'false'); });
      root.querySelectorAll('[data-zs-special]').forEach(function (b) { b.setAttribute('aria-current', b.getAttribute('data-zs-special') === st.special ? 'true' : 'false'); });
      root.querySelectorAll('.zs-list').forEach(function (list) {
        var all = list.querySelector('[data-zs-viewall]');
        if (!all) return;
        var active = list.querySelector('[aria-current="true"]:not([data-zs-viewall])');
        all.setAttribute('aria-current', active ? 'false' : 'true');
      });
    }

    function setFilter(next) {
      // One filter group at a time, like the redesign; search stays on top of it.
      st.band = next.band || ''; st.cat = next.cat || ''; st.size = next.size || '';
      st.label = next.label || ''; st.special = next.special || '';
      st.shown = PAGE_SIZE;
      render();
    }

    search.addEventListener('input', function () { st.query = search.value; st.shown = PAGE_SIZE; render(); });

    root.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t || !root.contains(t)) return;

      if (t.hasAttribute('data-zs-toggle')) {
        var list = t.nextElementSibling;
        var collapsed = list.classList.toggle('zs-collapsed');
        t.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      } else if (t.hasAttribute('data-zs-viewall')) {
        setFilter({});
      } else if (t.hasAttribute('data-zs-band')) {
        var b = t.getAttribute('data-zs-band');
        setFilter({ band: st.band === b ? '' : b });
      } else if (t.hasAttribute('data-zs-cat')) {
        if (t.hasAttribute('data-zs-size')) {
          var sz = t.getAttribute('data-zs-size');
          setFilter(st.size === sz ? {} : { cat: 'vinyl', size: sz });
        } else {
          var c = t.getAttribute('data-zs-cat');
          setFilter(st.cat === c && !st.size ? {} : { cat: c });
        }
      } else if (t.hasAttribute('data-zs-label')) {
        var l = t.getAttribute('data-zs-label');
        setFilter({ label: st.label === l ? '' : l });
      } else if (t.hasAttribute('data-zs-special')) {
        var s = t.getAttribute('data-zs-special');
        setFilter({ special: st.special === s ? '' : s });
      } else if (t.hasAttribute('data-zs-more')) {
        st.shown += PAGE_SIZE;
        render();
      }
    });

    function applyMenuDefaults() {
      root.querySelectorAll('[data-zs-toggle]').forEach(function (btn) {
        btn.nextElementSibling.classList.toggle('zs-collapsed', mq.matches);
        btn.setAttribute('aria-expanded', mq.matches ? 'false' : 'true');
      });
    }
    if (mq.addEventListener) mq.addEventListener('change', applyMenuDefaults);
    else if (mq.addListener) mq.addListener(applyMenuDefaults);

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
