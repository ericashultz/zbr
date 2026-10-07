// Slim product catalog for the Squarespace store grid (squarespace/store-grid.js).
// Reads every store collection's public ?format=json from the live Squarespace site,
// boils ~14 MB of raw product JSON down to a few hundred KB, and caches it at the edge.

const UPSTREAM = process.env.ZBR_UPSTREAM || 'https://www.zegemabeachrecords.com';

// slug -> { label: store "Label" filter, special: quick-filter bucket, fmt: default format codes }
const COLLECTIONS = [
  { slug: 'zegema-beach-releases', label: 'Zegema Beach Releases' },
  { slug: 'tomb-tree-tapes', label: 'Tomb Tree' },
  { slug: 'softseed', label: 'Softseed Music' },
  { slug: 'specials', special: 'new' },
  { slug: 'steals', special: 'steals' },
  { slug: '12inches', fmt: ['v12'] },
  { slug: '12distro2', fmt: ['v12'] },
  { slug: 'distro-7inch', fmt: ['v7'] },
  { slug: 'oddvinyl', fmt: ['vo'] },
  { slug: 'cassettes', fmt: ['tape'] },
  { slug: 'cds', fmt: ['cd'] },
  { slug: 'shirts', fmt: ['shirt'] },
  { slug: 'posters1', fmt: ['poster'] },
  { slug: 'posters2', fmt: ['poster'] },
  { slug: 'buttons', fmt: ['button'] },
  { slug: 'stickers', fmt: ['sticker'] }
  // sold-out-zbr / sold-out-zbr2 are archive pages and intentionally not part of the grid
];

// Squarespace category -> format codes used by the grid's Merch filters
const CATEGORY_FORMATS = {
  '12"': ['v12'], '2x12"': ['v12'], 'cd/12"': ['v12', 'cd'],
  '7"': ['v7'],
  '10"': ['vo'], '5"': ['vo'], '6"': ['vo'], '8"': ['vo'], '9"': ['vo'],
  'cassette': ['tape'],
  'cd': ['cd'], 'cds': ['cd'], '3"cd': ['cd'],
  't-shirt': ['shirt'], 'shirts': ['shirt'], 'crewneck': ['shirt'], 'hooded sweatshirt': ['shirt'], 'hoodie': ['shirt'],
  'poster': ['poster'],
  'button': ['button'], 'pin': ['button'],
  'sticker': ['sticker'], 'patch/sticker': ['sticker'], 'patch': ['sticker']
};

async function getJson(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'user-agent': 'zbr-catalog/1.0' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      if (attempt === 1) throw e;
    } finally {
      clearTimeout(timer);
    }
  }
}

// Many products keep their real cover in a child image record (items[0]); their own
// assetUrl is only a folder path (ends in "/" or a bare numeric id) and renders as a placeholder.
function imageUrl(item) {
  const own = item.assetUrl || '';
  const isFolder = own.endsWith('/') || /^\d+$/.test(own.split('/').pop());
  if (own && !isFolder) return own;
  const child = (item.items || []).find(k => k && k.assetUrl);
  return child ? child.assetUrl : own;
}

// Squarespace stores titles with HTML entities (e.g. "&amp;"); the grid escapes text itself.
function decodeEntities(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
}

function slim(item, col) {
  const sc = item.structuredContent || {};
  const variants = sc.variants || [];
  const cents = variants.map(v => (v.onSale && v.salePrice > 0 ? v.salePrice : v.price)).filter(n => typeof n === 'number');
  if (!cents.length && typeof sc.priceCents === 'number') cents.push(sc.priceCents);
  const min = cents.length ? Math.min.apply(null, cents) : 0;
  const max = cents.length ? Math.max.apply(null, cents) : 0;
  const soldOut = variants.length > 0 && variants.every(v => !v.unlimited && v.qtyInStock === 0);

  const fmts = new Set(col.fmt || []);
  (item.categories || []).forEach(c => (CATEGORY_FORMATS[String(c).toLowerCase()] || []).forEach(f => fmts.add(f)));

  const title = decodeEntities(String(item.title || '')).trim();
  const dash = title.indexOf(' - ');
  const band = dash > 0 ? title.slice(0, dash).trim() : '';
  const name = dash > 0 ? title.slice(dash + 3).trim() : title;

  const out = {
    b: band,
    n: name,
    u: item.fullUrl,
    i: imageUrl(item) ? imageUrl(item) + '?format=500w' : '',
    p: min / 100
  };
  if (max !== min) out.r = 1; // price is a range -> "from"
  if (soldOut) out.s = 1;
  if (fmts.size) out.f = Array.from(fmts);
  if (col.label) out.l = col.label;
  if (col.special) out.sp = col.special;
  return out;
}

async function buildCatalog() {
  const results = await Promise.allSettled(COLLECTIONS.map(async col => {
    const data = await getJson(UPSTREAM + '/' + col.slug + '?format=json');
    return (data.items || []).filter(i => i.fullUrl).map(i => slim(i, col));
  }));
  const failed = [];
  const items = [];
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') items.push.apply(items, r.value);
    else failed.push(COLLECTIONS[idx].slug);
  });
  return { generatedAt: new Date().toISOString(), count: items.length, failed, items };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  try {
    const catalog = await buildCatalog();
    if (!catalog.items.length) throw new Error('empty catalog');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // A partial catalog (a collection failed) is only cached briefly so it self-heals.
    res.setHeader('Cache-Control', catalog.failed.length
      ? 'public, s-maxage=60'
      : 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(catalog));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'catalog unavailable' }));
  }
};
module.exports.buildCatalog = buildCatalog;
