/*
 * ZBR product page helpers for Squarespace 7.0 (Settings > Advanced > Code Injection > Footer):
 *   <script src="https://zbr-rho.vercel.app/squarespace/product-page.js" data-store-url="/"></script>
 *
 *  - "Back to Store" link: goes to the store landing page and restores the visitor's filters,
 *    page and scroll position (saved by store-grid.js when they opened the product).
 *  - Photo carousel: turns the stacked product photos into one photo at a time with
 *    prev/next arrows, dots and swipe, like the redesign. Styling lives in zbr-custom.css (.zs-carousel).
 */
(function () {
  'use strict';

  var STORE_URL = '/';
  try {
    var me = document.currentScript;
    if (me && me.getAttribute('data-store-url')) STORE_URL = me.getAttribute('data-store-url');
  } catch (e) { /* keep default */ }

  function backLink() {
    var a = document.querySelector('#productNav a');
    if (!a) return;
    a.href = STORE_URL;
    a.innerHTML = '&laquo; Back to Store';
    a.addEventListener('click', function () {
      try { sessionStorage.setItem('zbr-store-restore', '1'); } catch (e) { /* ignore */ }
    });
  }

  function carousel() {
    var gal = document.getElementById('productGallery');
    var track = document.getElementById('productSlideshow');
    if (!gal || !track || gal.classList.contains('zs-carousel')) return;
    var slides = [].slice.call(track.querySelectorAll('.slide'));
    if (slides.length < 2) return;

    var cur = 0;
    var dots = document.createElement('div');
    dots.className = 'zs-car-dots';
    var prev = document.createElement('button');
    var next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'zs-car-prev'; next.className = 'zs-car-next';
    prev.setAttribute('aria-label', 'Previous photo'); next.setAttribute('aria-label', 'Next photo');
    prev.innerHTML = '&#9664;'; next.innerHTML = '&#9654;';

    slides.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'zs-car-dot';
      d.setAttribute('role', 'button');
      d.setAttribute('aria-label', 'Photo ' + (i + 1));
      d.addEventListener('click', function () { show(i); });
      dots.appendChild(d);
    });

    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('zs-cur', n === cur); });
      [].forEach.call(dots.children, function (d, n) { d.setAttribute('aria-current', n === cur ? 'true' : 'false'); });
    }
    prev.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });

    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });

    track.appendChild(prev); track.appendChild(next);
    gal.appendChild(dots);
    gal.classList.add('zs-carousel');
    var thumbs = document.getElementById('productThumbnails'); // the template's own thumbnail strip would fight the dots
    if (thumbs) thumbs.style.display = 'none';
    show(0);
  }

  // Squarespace fills in the photos after the page loads; wait until they are all in (or give up after 5s).
  function whenPhotosReady(fn) {
    var tries = 0;
    (function check() {
      var imgs = [].slice.call(document.querySelectorAll('#productSlideshow .slide img'));
      var ready = imgs.length && imgs.every(function (im) { return im.naturalWidth > 0; });
      if (ready || ++tries > 33) fn(); else setTimeout(check, 150);
    })();
  }

  function init() {
    backLink();
    whenPhotosReady(carousel);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
