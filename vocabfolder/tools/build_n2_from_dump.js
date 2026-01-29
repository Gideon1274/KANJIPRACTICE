/*
Builds Data/vocab/n2.js from a raw “Ready-made Contributed” Jisho-style dump.

Usage (from vocabfolder/):
  node tools/build_n2_from_dump.js --input tools/n2_dump.txt

What it does:
- Parses the dump into { kanji, readings, meanings }
- Prioritizes a kanji form for `kanji` when present
- Removes entries that already exist in N3 (by kanji and reading match)
- Writes Data/vocab/n2.js
*/

const fs = require('fs');
const path = require('path');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.resolve(ROOT, getArg('--input') || 'tools/n2_dump.txt');
const n3Path = path.resolve(ROOT, 'Data/vocab/n3.js');
const outPath = path.resolve(ROOT, 'Data/vocab/n2.js');

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
  // Convert Katakana to Hiragana to make matching kana-insensitive.
  // Works after NFKC normalization (so halfwidth katakana are handled too).
  return String(text || '').replace(/[\u30A1-\u30F6]/g, ch => {
    const code = ch.charCodeAt(0) - 0x60;
    return String.fromCharCode(code);
  });
}

function kanaToRomaji(input) {
  // Basic Hepburn-style transliteration for hiragana/katakana.
  // Intended for quiz-friendly romaji, not linguistic perfection.
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

    // Common foreign/loanword combos (katakana-derived; represented in hiragana here)
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

    // Try digraph/combination.
    const two = s.slice(i, i + 2);
    let syl = combos[two];
    if (syl) {
      i += 1;
    } else {
      syl = base[ch];
    }

    if (!syl) {
      // Unknown char (punctuation etc.) -> skip
      continue;
    }

    // ん before vowels/y => n'
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

  // Romaji first
  for (const r of readings) {
    const romaji = kanaToRomaji(r);
    if (!romaji) continue;
    const key = normalizeKey(romaji);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(romaji);
  }

  // Then kana
  for (const r of readings) {
    const key = normalizeKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }

  return out;
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

function loadN3Keys() {
  const srcRaw = fs.readFileSync(n3Path, 'utf8');

  // Remove block comments, then ignore whole-line comments so commented-out entries don't count.
  const noBlock = srcRaw.replace(/\/\*[\s\S]*?\*\//g, '');
  const src = noBlock
    .split(/\r?\n/)
    .filter(l => !l.trim().startsWith('//'))
    .join('\n');

  const keys = new Set();

  // Extract kanji fields (supports multi-line object formatting).
  // Matches: kanji: "..." or kanji: '...'
  const kanjiDouble = /\bkanji\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const kanjiSingle = /\bkanji\s*:\s*'((?:\\.|[^'\\])*)'/g;

  let m;
  while ((m = kanjiDouble.exec(src))) keys.add(normalizeKey(m[1]));
  while ((m = kanjiSingle.exec(src))) keys.add(normalizeKey(m[1]));

  // Extract readings arrays (supports multi-line array formatting).
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

  // Drop obvious noise.
  if (/^Ready-made\b/i.test(s)) return false;
  if (/^Vocabulary\b/i.test(s)) return false;
  if (/^Page\b/i.test(s)) return false;
  if (/^See\b/i.test(s)) return false;
  if (/^See more\b/i.test(s)) return false;

  // Drop common metadata notes from Jisho dumps. These are not headwords.
  // Examples: "esp. 代わる", "usu. in compounds", "oft. as ..."
  if (/^(esp|usu|oft)\./i.test(s)) return false;
  if (/^as\b/i.test(s)) return false;

  // Meaning lines like "1. ..." are not headers.
  if (/^\d+\./.test(s)) return false;

  // Headers usually contain Japanese.
  if (!hasJapanese(s)) return false;

  // Heuristic: headers usually have no long English phrases.
  if (/[A-Za-z]{4,}/.test(s)) return false;

  return true;
}

function cleanMeaningLine(line) {
  let s = String(line || '').trim();
  if (!s) return null;

  // Drop UI/jisho junk.
  if (/^See more\b/i.test(s)) return null;
  if (/^common\b/i.test(s)) return null;
  if (/^Antonym\b/i.test(s)) return null;
  if (/^See\b/i.test(s)) return null;
  if (/^Counter$/i.test(s)) return null;

  // Drop grammar/metadata-ish lines that aren't definitions.
  const metaPatterns = [
    /\bGodan verb\b/i,
    /\bIchidan verb\b/i,
    /\bIntransitive\b/i,
    /\bTransitive\b/i,
    /\bAdverb\b/i,
    /\bNoun\b/i,
    /\bInterjection\b/i,
    /\bExpression\b/i,
    /\bNA-adjective\b/i,
    /\bMay take 'no'\b/i,
    /\bTakes suru\b/i,
    /\bColloquialism\b/i,
    /\bArchaism\b/i,
    /\bDialect\b/i,
    /\bgrammar\b/i,
    /\bMathematics\b/i,
    /\bComputer\b/i,
    /\bLinguistics\b/i,
    /\bFood term\b/i,
    /\bMusic term\b/i,
    /\bLaw term\b/i,
    /\bPhysics\b/i,
    /\bPolite\b/i,
    /\bHumble\b/i,
    /\bHonorific\b/i,
    /\busu\.?\b/i,
  ];
  if (metaPatterns.some(r => r.test(s)) && !/[A-Za-z]/.test(s.replace(/\busu\.?\b/i, ''))) {
    return null;
  }

  // Strip numbering.
  s = s.replace(/^\d+\.?\s*/, '');

  // Meaning/definition lines should be English only; lines containing Japanese are
  // typically metadata like "See ...・1" and should be discarded.
  if (hasJapanese(s)) return null;

  // Must contain some English letters to be a meaning.
  if (!/[A-Za-z]/.test(s)) return null;

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
    // Compact + unique meanings
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

      // Prioritize a form containing kanji for `kanji`, else first non-reading, else first.
      const kanjiVariant = variants.find(v => hasKanji(v));
      const nonReadingVariant = variants.find(v => !isKanaLike(v));
      const chosenKanji = kanjiVariant || nonReadingVariant || variants[0];

      const readings =
        readingVariants.length > 0
          ? buildReadingsWithRomaji(readingVariants)
          : (chosenKanji && isKanaLike(chosenKanji) ? [chosenKanji] : []);

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

    // Split only by semicolon so meanings like "(ceramic, porcelain)" stay intact.
    const parts = cleaned
      .split(';')
      .map(p => p.trim())
      .filter(Boolean);

    current.meanings.push(...parts);
  }

  flush();
  return entries;
}

function writeN2(entries) {
  const out = [];
  out.push('window.kanjiData = window.kanjiData || {}; window.kanjiData.N2 = [');
  for (const e of entries) {
    const kanji = JSON.stringify(e.kanji);
    const readings = JSON.stringify(e.readings);
    const meanings = JSON.stringify(e.meanings);
    out.push(`    { kanji: ${kanji}, readings: ${readings}, meanings: ${meanings} },`);
  }
  out.push('];');
  out.push('');
  fs.writeFileSync(outPath, out.join('\n'), 'utf8');
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error('Create it and paste your N2 dump into it, then re-run.');
    process.exit(1);
  }

  const n3Keys = loadN3Keys();
  const raw = fs.readFileSync(inputPath, 'utf8');

  const parsed = parseDump(raw);

  const deduped = parsed.filter(e => {
    const keyCandidates = [e.kanji, ...(e.readings || [])].map(normalizeKey).filter(Boolean);
    return !keyCandidates.some(k => n3Keys.has(k));
  });

  writeN2(deduped);

  console.log(`Parsed entries: ${parsed.length}`);
  console.log(`After removing N3 overlaps: ${deduped.length}`);
  console.log(`Wrote: ${outPath}`);
}

main();
