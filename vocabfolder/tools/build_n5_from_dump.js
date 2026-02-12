/*
Builds Data/vocab/n5.js from a raw “Ready-made Contributed” Jisho-style dump.

Usage (from vocabfolder/):
  node tools/build_n5_from_dump.js --input tools/n5_dump.txt

Rules (same style as N4 builder):
- Parses the dump into { kanji, readings, meanings }
- Generates romaji for kana readings and places romaji first in `readings`
- Removes entries that already exist in N3 (N3 is the comparison baseline)
- Writes Data/vocab/n5.js

Notes:
- This is a heuristic parser for the text dump format.
- It intentionally ignores metadata lines like "esp.", "usu.", "oft.", "as ...", "See ...・1", etc.
*/

const fs = require('fs');
const path = require('path');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.resolve(ROOT, getArg('--input') || 'tools/n5_dump.txt');
const outPath = path.resolve(ROOT, 'Data/vocab/n5.js');

const PRIORITY = ['N3', 'N5', 'N4', 'N2', 'N1'];

function loadKeysFromDataFile(jsPath) {
  if (!fs.existsSync(jsPath)) return new Set();
  const srcRaw = fs.readFileSync(jsPath, 'utf8');
  const noBlock = srcRaw.replace(/\/\*[\s\S]*?\*\//g, '');
  const src = noBlock
    .split(/\r?\n/)
    .filter(l => !l.trim().startsWith('//'))
    .join('\n');

  const keys = new Set();
  const kanjiDouble = /\bkanji\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const kanjiSingle = /\bkanji\s*:\s*'((?:\\.|[^'\\])*)'/g;
  let m;
  while ((m = kanjiDouble.exec(src))) keys.add(normalizeKey(m[1]));
  while ((m = kanjiSingle.exec(src))) keys.add(normalizeKey(m[1]));
  const readingsBlockRegex = /\breadings\s*:\s*\[([\s\S]*?)\]/g;
  while ((m = readingsBlockRegex.exec(src))) {
    const inner = m[1];
    const strDouble = /"((?:\\.|[^"\\])*)"/g;
    const strSingle = /'((?:\\.|[^'\\])*)'/g;
    let s;
    while ((s = strDouble.exec(inner))) keys.add(normalizeKey(s[1]));
    while ((s = strSingle.exec(inner))) keys.add(normalizeKey(s[1]));
  }
  keys.delete('');
  return keys;
}

function loadBaselineKeysFor(level) {
  const idx = PRIORITY.indexOf(level);
  if (idx <= 0) return new Set();
  const levels = PRIORITY.slice(0, idx);
  const combined = new Set();
  for (const L of levels) {
    const p = path.resolve(ROOT, `Data/vocab/${L.toLowerCase()}.js`);
    const s = loadKeysFromDataFile(p);
    for (const k of s) combined.add(k);
  }
  return combined;
}

function hasJapanese(text) {
  return /[\u3040-\u30FF\u3400-\u9FFF]/.test(text);
}

function hasKanji(text) {
  return /[\u3400-\u9FFF]/.test(text);
}

function isKanaLike(text) {
  // Hiragana/Katakana + prolonged sound mark + middledot + small punctuation
  return /^[\u3040-\u309F\u30A0-\u30FFー・\s]+$/.test(text);
}

function kataToHira(text) {
  // Convert Katakana to Hiragana to normalize kana.
  return String(text || '').replace(/[\u30A1-\u30F6]/g, ch => {
    const code = ch.charCodeAt(0) - 0x60;
    return String.fromCharCode(code);
  });
}

function normalizeKey(text) {
  const s = String(text || '')
    .trim()
    .normalize('NFKC');

  const kanaFolded = kataToHira(s);

  return kanaFolded
    .replace(/\s+/g, '')
    .replace(/[、，,]/g, '')
    .toLowerCase();
}

function kanaToRomaji(input) {
  // Basic Hepburn-style transliteration for hiragana/katakana.
  const original = String(input || '').trim().normalize('NFKC');
  const s = kataToHira(original);
  if (!s) return '';

  const base = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゎ': 'wa',
    'ゔ': 'vu',
    'ゐ': 'i', 'ゑ': 'e',
  };

  const combos = {
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
    'ゔぁ': 'va', 'ゔぃ': 'vi', 'ゔぇ': 've', 'ゔぉ': 'vo', 'ゔゅ': 'vyu',
    'てぃ': 'ti', 'でぃ': 'di',
    'とぅ': 'tu', 'どぅ': 'du',
    'つぁ': 'tsa', 'つぃ': 'tsi', 'つぇ': 'tse', 'つぉ': 'tso',
    'しぇ': 'she', 'ちぇ': 'che', 'じぇ': 'je',
    'すぁ': 'swa', 'すぃ': 'swi', 'すぇ': 'swe', 'すぉ': 'swo',
    'くぁ': 'kwa', 'くぃ': 'kwi', 'くぇ': 'kwe', 'くぉ': 'kwo',
    'ぐぁ': 'gwa', 'ぐぃ': 'gwi', 'ぐぇ': 'gwe', 'ぐぉ': 'gwo',
  };

  function lastVowel(out) {
    const m = /[aeiou](?!.*[aeiou])/.exec(out);
    return m ? m[0] : '';
  }

  let out = '';
  let geminate = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === '・') continue;
    if (ch === ' ' || ch === '\t') {
      out += ' ';
      continue;
    }

    if (ch === 'ー') {
      const v = lastVowel(out);
      if (v) out += v;
      continue;
    }

    if (ch === 'っ') {
      geminate = true;
      continue;
    }

    const two = s.slice(i, i + 2);
    let syl = combos[two];
    if (syl) {
      i += 1;
    } else {
      syl = base[ch];
    }

    if (!syl) continue;

    if (ch === 'ん') {
      const next = s[i + 1] || '';
      const nextTwo = s.slice(i + 1, i + 3);
      const nextRomaji = combos[nextTwo] || base[next] || '';
      if (/^(a|i|u|e|o|y)/.test(nextRomaji)) {
        syl = "n'";
      }
    }

    if (geminate) {
      if (syl.startsWith('ch')) {
        out += 't';
      } else if (/^[a-z]/.test(syl) && !/^[aeiou]/.test(syl) && !syl.startsWith("n'")) {
        out += syl[0];
      }
      geminate = false;
    }

    out += syl;
  }

  return out.replace(/\s+/g, ' ').trim();
}

function buildReadingsWithRomaji(kanaReadings) {
  const readings = Array.isArray(kanaReadings) ? kanaReadings : [];
  const out = [];
  const seen = new Set();

  for (const r of readings) {
    const romaji = kanaToRomaji(r);
    if (!romaji) continue;
    const key = normalizeKey(romaji);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(romaji);
  }

  for (const r of readings) {
    const key = normalizeKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }

  return out;
}

function loadN3Keys() {
  const srcRaw = fs.readFileSync(n3Path, 'utf8');

  const noBlock = srcRaw.replace(/\/\*[\s\S]*?\*\//g, '');
  const src = noBlock
    .split(/\r?\n/)
    .filter(l => !l.trim().startsWith('//'))
    .join('\n');

  const keys = new Set();

  const kanjiDouble = /\bkanji\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const kanjiSingle = /\bkanji\s*:\s*'((?:\\.|[^'\\])*)'/g;

  let m;
  while ((m = kanjiDouble.exec(src))) keys.add(normalizeKey(m[1]));
  while ((m = kanjiSingle.exec(src))) keys.add(normalizeKey(m[1]));

  const readingsBlockRegex = /\breadings\s*:\s*\[([\s\S]*?)\]/g;
  while ((m = readingsBlockRegex.exec(src))) {
    const inner = m[1];

    const strDouble = /"((?:\\.|[^"\\])*)"/g;
    const strSingle = /'((?:\\.|[^'\\])*)'/g;
    let s;
    while ((s = strDouble.exec(inner))) keys.add(normalizeKey(s[1]));
    while ((s = strSingle.exec(inner))) keys.add(normalizeKey(s[1]));
  }

  keys.delete('');
  return keys;
}

function isLikelyHeaderLine(line) {
  if (!line) return false;
  const s = line.trim();
  if (!s) return false;

  if (/^Ready-made\b/i.test(s)) return false;
  if (/^Vocabulary\b/i.test(s)) return false;
  if (/^Page\b/i.test(s)) return false;
  if (/^See\b/i.test(s)) return false;
  if (/^See more\b/i.test(s)) return false;

  if (/^(esp|usu|oft)\./i.test(s)) return false;
  if (/^as\b/i.test(s)) return false;

  if (/^\d+\./.test(s)) return false;

  if (!hasJapanese(s)) return false;

  if (/[A-Za-z]{4,}/.test(s)) return false;

  return true;
}

function cleanMeaningLine(line) {
  let s = String(line || '').trim();
  if (!s) return null;

  if (/^See more\b/i.test(s)) return null;
  if (/^common\b/i.test(s)) return null;
  if (/^Antonym\b/i.test(s)) return null;
  if (/^See\b/i.test(s)) return null;
  if (/^Counter$/i.test(s)) return null;

  s = s.replace(/^\d+\.?\s*/, '');

  // Strip leading POS/metadata tags like "Godan verb, Intransitive, ..."
  function stripPosTags(str) {
    const parts = String(str).split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return str;

    const posIndicator = /\b(?:verb|adjectiv|adverb|noun|transitive|intransitive|suffix|prefix|counter|auxiliary|expression|conjugation|godan|ichidan|irregular|na-adjective|i-adjective|na adjective|i adjective|usu|esp|often|colloquial|slang|archaic|archaicism|formal|informal|polite|familiar|suru)\b/i;

    let i = 0;
    while (i < parts.length) {
      const seg = parts[i];
      if (posIndicator.test(seg) || /^\w{1,4}\.$/.test(seg)) {
        i++;
        continue;
      }
      break;
    }

    const remaining = parts.slice(i);
    if (remaining.length === 0) return parts.join(', ');
    return remaining.join(', ');
  }

  s = stripPosTags(s);

  if (hasJapanese(s)) return null;

  if (!/[A-Za-z]/.test(s)) return null;

  // Limit long comma-separated gloss lists to a concise subset (1-2 items).
  (function limitFragments() {
    const parts = String(s).split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 2) return;

    let candidates = parts.filter(p => !/[()（）]|\be\.g\b|\beg\b/i.test(p));
    const short = candidates.filter(p => p.length <= 40);
    if (short.length > 0) candidates = short;
    if (candidates.length === 0) candidates = parts;
    s = candidates.slice(0, 2).join(', ');
  })();

  return s;
}

function parseDump(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const entries = [];
  let current = null;

  function flush() {
    if (!current) return;

    const meanings = Array.from(new Set(current.meanings.map(m => m.trim()).filter(Boolean)));
    const readings = Array.from(new Set(current.readings.map(r => r.trim()).filter(Boolean)));

    if (current.kanji && readings.length > 0 && meanings.length > 0) {
      entries.push({
        kanji: current.kanji,
        readings,
        meanings,
      });
    }

    current = null;
  }

  for (const line of lines) {
    if (isLikelyHeaderLine(line)) {
      flush();

      const variants = line
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);

      const readingVariants = variants.filter(v => isKanaLike(v));

      const kanjiVariant = variants.find(v => hasKanji(v));
      const nonReadingVariant = variants.find(v => !isKanaLike(v));
      const chosenKanji = kanjiVariant || nonReadingVariant || variants[0];

      const readings =
        readingVariants.length > 0
          ? buildReadingsWithRomaji(readingVariants)
          : (chosenKanji && isKanaLike(chosenKanji) ? buildReadingsWithRomaji([chosenKanji]) : []);

      current = {
        kanji: chosenKanji,
        readings,
        meanings: [],
      };

      continue;
    }

    if (!current) continue;

    const cleaned = cleanMeaningLine(line);
    if (!cleaned) continue;

    const parts = cleaned
      .split(';')
      .map(p => p.trim())
      .filter(Boolean);

    current.meanings.push(...parts);
  }

  flush();
  return entries;
}

function writeN5(entries) {
  const out = [];
  out.push('window.kanjiData = window.kanjiData || {}');
  out.push('window.kanjiData.N5 = [');
  for (const e of entries) {
    out.push(`    { kanji: ${JSON.stringify(e.kanji)}, readings: ${JSON.stringify(e.readings)}, meanings: ${JSON.stringify(e.meanings)} },`);
  }
  out.push('];');
  out.push('');
  fs.writeFileSync(outPath, out.join('\n'), 'utf8');
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error('Create it and paste your N5 dump into it, then re-run.');
    process.exit(1);
  }

  const baselineKeys = loadBaselineKeysFor('N5');
  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = parseDump(raw);

  const deduped = parsed.filter(e => {
    const keyCandidates = [e.kanji, ...(e.readings || [])].map(normalizeKey).filter(Boolean);
    return !keyCandidates.some(k => baselineKeys.has(k));
  });

  writeN5(deduped);

  console.log(`Parsed entries: ${parsed.length}`);
  console.log(`After removing N3 overlaps: ${deduped.length}`);
  console.log(`Wrote: ${outPath}`);
}

main();
