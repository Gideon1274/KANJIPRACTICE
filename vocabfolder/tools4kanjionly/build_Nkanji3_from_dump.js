
// Builds Data/kanji/Nkanji3.js from a raw “Ready-made Contributed” kanji dump.
// Usage (from vocabfolder/):
//   node tools4kanjionly/build_Nkanji3_from_dump.js --input tools4kanjionly/Nkanji3_dump.txt
//
// Rules:
// - Parses the dump into { kanji, readings, meanings }
// - Only works for kanji dump format (not vocab)
// - Writes Data/kanji/Nkanji3.js
//
// Kanji dump format:
// Kanji (1 char)
// Readings (comma-separated)
// Meanings (comma-separated)
// "See more >" (ignored)
// Blank or next kanji
//
// Example:
// 会
// カイ, エ, あ.う, あ.わせる, あつ.まる
// meeting, meet, party, association, interview, join
// See more >
//
// ...

const fs = require('fs');
const path = require('path');


function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.resolve(ROOT, getArg('--input') || 'tools4kanjionly/Nkanji3_dump.txt');
const outPath = path.resolve(ROOT, 'Data/kanji/Nkanji3.js');

function parseKanjiDump(text) {
  const lines = text.split(/\r?\n/);
  const entries = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    // Skip headers, blank lines, and non-kanji lines
    if (!line ||
      /^Page/.test(line) ||
      /^Ready-made/.test(line) ||
      /^Kanji/.test(line) ||
      /^See more/.test(line) ||
      /^Vocabulary/.test(line)) {
      i++;
      continue;
    }
    // Kanji line: must be a single kanji character
    if (/^[\u4E00-\u9FFF]$/.test(line)) {
      const kanji = line;
      const readingsLine = (lines[i + 1] || '').trim();
      const meaningsLine = (lines[i + 2] || '').trim();
      // Skip if readings or meanings are missing
      if (!readingsLine || !meaningsLine) {
        i++;
        continue;
      }
      // Readings: comma-separated, trim each
      const readings = readingsLine.split(',').map(r => r.trim()).filter(Boolean);
      // Meanings: comma-separated, trim each
      const meanings = meaningsLine.split(',').map(m => m.trim()).filter(Boolean);
      entries.push({ kanji, readings, meanings });
      i += 4; // Kanji, readings, meanings, 'See more >' or blank
      continue;
    }
    i++;
  }
  return entries;
}

function writeKanji(entries) {
  const out = [];
  out.push('window.kanjiData = window.kanjiData || {}; window.kanjiData.N3 = [');
  for (const e of entries) {
    out.push(`     { kanji: ${JSON.stringify(e.kanji)}, readings: ${JSON.stringify(e.readings)}, meanings: ${JSON.stringify(e.meanings)} },`);
  }
  out.push('];');
  out.push('');
  fs.writeFileSync(outPath, out.join('\n'), 'utf8');
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error('Create it and paste your Nkanji3 dump into it, then re-run.');
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = parseKanjiDump(raw);
  writeKanji(parsed);
  console.log(`Parsed entries: ${parsed.length}`);
  console.log(`Wrote: ${outPath}`);
}

main();
