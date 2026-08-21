const fs = require('fs');
const path = require('path');

const WIKI_BASE = 'https://warfarin.wiki';
const USER_AGENT = 'EndfieldPermitExport/i18n-sync (https://github.com/AiverAiva/Endfield-Permit-Export)';
const FETCH_TIMEOUT_MS = 20000;
const MIN_CHARS = 30;
const MIN_WPNS = 77;
const ENDMIN_IDS = ['chr_0002_endminm', 'chr_0003_endminf', 'chr_9000_endmin'];

const KEY_ORDER = ['ui', 'log', 'excel', 'uigf', 'gacha', 'char', 'wpn'];

const LANG_MAP = {
  cn: '简体中文.json',
  tc: '繁體中文.json',
  en: 'English.json',
  jp: '日本語.json',
  kr: '한국어.json',
  de: 'Deutsch.json',
  fr: 'Français.json',
  es: 'Español.json',
  br: 'Português.json',
  ru: 'Pусский.json',
  th: 'ภาษาไทย.json',
  vn: 'Tiếng Việt.json',
  id: 'Indonesia.json'
};

const I18N_DIR = path.join(__dirname, '../src/i18n');

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });
  return sorted;
}

function sortWithCategoryOrder(localI18n) {
  const other = {};
  const grouped = {};
  for (const key of Object.keys(localI18n)) {
    const prefix = key.split('.')[0];
    if (KEY_ORDER.includes(prefix)) {
      if (!grouped[prefix]) grouped[prefix] = {};
      grouped[prefix][key] = localI18n[key];
    } else {
      other[key] = localI18n[key];
    }
  }
  const result = {};
  for (const prefix of KEY_ORDER) {
    if (grouped[prefix]) {
      Object.keys(grouped[prefix]).sort().forEach(key => {
        result[key] = grouped[prefix][key];
      });
    }
  }
  Object.keys(sortObjectKeys(other)).forEach(key => {
    result[key] = other[key];
  });
  return result;
}

// Remix single-fetch payload is a flattened index array.
// Objects look like { _23: 24, _25: 26 } where keys/values are indices into the array.
function decodeRemix(arr) {
  const memo = new Map();
  function get(i) {
    if (i === -5) return undefined;
    if (typeof i !== 'number') return i;
    if (memo.has(i)) return memo.get(i);
    if (i < 0 || i >= arr.length) return i;
    const v = arr[i];
    if (v === null || typeof v !== 'object') {
      memo.set(i, v);
      return v;
    }
    if (Array.isArray(v)) {
      const out = [];
      memo.set(i, out);
      for (const x of v) out.push(typeof x === 'number' ? get(x) : x);
      return out;
    }
    const keys = Object.keys(v);
    if (keys.length && keys.every((k) => /^_\d+$/.test(k))) {
      const obj = {};
      memo.set(i, obj);
      for (const k of keys) {
        obj[get(Number(k.slice(1)))] = get(v[k]);
      }
      return obj;
    }
    memo.set(i, v);
    return v;
  }
  return get(0);
}

function collectNames(node, out = { char: {}, wpn: {} }) {
  if (!node || typeof node !== 'object') return out;
  if (typeof node.id === 'string' && typeof node.name === 'string' && node.name) {
    if (node.id.startsWith('chr_')) out.char[node.id] = node.name;
    else if (node.id.startsWith('wpn_')) out.wpn[node.id] = node.name;
  }
  for (const v of Object.values(node)) collectNames(v, out);
  return out;
}

function applyEndminAliases(chars) {
  const name = ENDMIN_IDS.map((id) => chars[id]).find(Boolean);
  if (!name) {
    throw new Error('Endministrator name missing from operators catalog');
  }
  for (const id of ENDMIN_IDS) chars[id] = name;
}

async function fetchRemix(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/x-script, application/json, */*'
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${url} -> not JSON`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${url} -> expected Remix index array`);
  return decodeRemix(parsed);
}

async function fetchLangNames(lang) {
  const [ops, wpns] = await Promise.all([
    fetchRemix(`${WIKI_BASE}/${lang}/operators.data`),
    fetchRemix(`${WIKI_BASE}/${lang}/weapons.data`)
  ]);
  const names = collectNames(ops);
  collectNames(wpns, names);

  const charCount = Object.keys(names.char).length;
  const wpnCount = Object.keys(names.wpn).length;
  if (charCount < MIN_CHARS) {
    throw new Error(`${lang}: expected >=${MIN_CHARS} operators, got ${charCount}`);
  }
  if (wpnCount < MIN_WPNS) {
    throw new Error(`${lang}: expected >=${MIN_WPNS} weapons, got ${wpnCount}`);
  }

  applyEndminAliases(names.char);
  return names;
}

async function start() {
  const pending = [];
  for (const [lang, fileName] of Object.entries(LANG_MAP)) {
    const localFilePath = path.join(I18N_DIR, fileName);
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file ${fileName} does not exist`);
    }
    console.log(`Fetching ${lang} (${fileName})...`);
    const names = await fetchLangNames(lang);
    console.log(
      `  ${lang}: ${Object.keys(names.char).length} chars, ${Object.keys(names.wpn).length} wpns`
    );
    pending.push({ fileName, localFilePath, names });
  }

  for (const { fileName, localFilePath, names } of pending) {
    const localI18n = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
    for (const [id, name] of Object.entries(names.char)) {
      localI18n[`char.${id}`] = name;
    }
    for (const [id, name] of Object.entries(names.wpn)) {
      localI18n[`wpn.${id}`] = name;
    }
    fs.writeFileSync(
      localFilePath,
      JSON.stringify(sortWithCategoryOrder(localI18n), null, 2) + '\n'
    );
    console.log(`Updated ${fileName}`);
  }

  console.log('\nAll i18n files updated from warfarin.wiki');
}

start().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
