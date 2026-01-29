// Builds Data/kanji/Nkanji1.js from a raw “Ready-made Contributed” kanji dump.
// Usage (from vocabfolder/):
//   node tools4kanjionly/build_Nkanji1_from_dump.js --input tools4kanjionly/Nkanji1_dump.txt
//
// - Parses the dump into { kanji, readings, meanings }
// - Removes entries that already exist in N2 or N3 (by kanji or reading)
// - Writes Data/kanji/Nkanji1.js

const fs = require('fs');
const path = require('path');

function getArg(name) {
    const idx = process.argv.indexOf(name);
    if (idx === -1) return null;
    return process.argv[idx + 1] || null;
}

const ROOT = path.resolve(__dirname, '..');
const inputPath = path.resolve(ROOT, getArg('--input') || 'tools4kanjionly/Nkanji1_dump.txt');
const n2Path = path.resolve(ROOT, 'Data/kanji/Nkanji2.js');
const n3Path = path.resolve(ROOT, 'Data/kanji/Nkanji3.js');
const outPath = path.resolve(ROOT, 'Data/kanji/Nkanji1.js');

function kataToHira(text) {
    return String(text || '').replace(/[\u30A1-\u30F6]/g, ch => {
        const code = ch.charCodeAt(0) - 0x60;
        return String.fromCharCode(code);
    });
}

function normalizeKey(text) {
    const s = String(text || '').trim().normalize('NFKC');
    const kanaFolded = kataToHira(s);
    return kanaFolded.replace(/\s+/g, '').replace(/[、，,]/g, '').toLowerCase();
}


function loadKanjiReadings(paths) {
    const entries = [];
    for (const p of paths) {
        if (!fs.existsSync(p)) continue;
        const srcRaw = fs.readFileSync(p, 'utf8');
        const noBlock = srcRaw.replace(/\/\*[\s\S]*?\*\//g, '');
        const src = noBlock.split(/\r?\n/).filter(l => !l.trim().startsWith('//')).join('\n');
        const entryRegex = /\{\s*kanji:\s*(["'])(.*?)\1,\s*readings:\s*\[((?:.|\n)*?)\],/g;
        let m;
        while ((m = entryRegex.exec(src))) {
            const kanji = m[2];
            const readingsRaw = m[3];
            const readings = [];
            const strDouble = /"((?:\\.|[^"\\])*)"/g;
            const strSingle = /'((?:\\.|[^'\\])*)'/g;
            let s;
            while ((s = strDouble.exec(readingsRaw))) readings.push(s[1]);
            while ((s = strSingle.exec(readingsRaw))) readings.push(s[1]);
            entries.push({ kanji, readings });
        }
    }
    return entries;
}

function parseKanjiDump(text) {
    const lines = text.split(/\r?\n/);
    const entries = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || /^Page/.test(line) || /^Ready-made/.test(line) || /^Kanji/.test(line) || /^See more/.test(line) || /^Vocabulary/.test(line)) {
            i++;
            continue;
        }
        if (/^[\u4E00-\u9FFF]$/.test(line)) {
            const kanji = line;
            const readingsLine = (lines[i + 1] || '').trim();
            const meaningsLine = (lines[i + 2] || '').trim();
            if (!readingsLine || !meaningsLine) {
                i++;
                continue;
            }
            const readings = readingsLine.split(',').map(r => r.trim()).filter(Boolean);
            const meanings = meaningsLine.split(',').map(m => m.trim()).filter(Boolean);
            entries.push({ kanji, readings, meanings });
            i += 4;
            continue;
        }
        i++;
    }
    return entries;
}

function writeKanji(entries) {
    const out = [];
    out.push('window.kanjiData = window.kanjiData || {}; window.kanjiData.N1 = [');
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
        process.exit(1);
    }
    const n2n3Entries = loadKanjiReadings([n2Path, n3Path]);
    const raw = fs.readFileSync(inputPath, 'utf8');
    const parsed = parseKanjiDump(raw);
    // Only remove if both kanji and at least one reading match
    const deduped = parsed.filter(e => {
        return !n2n3Entries.some(entry => {
            if (e.kanji !== entry.kanji) return false;
            return e.readings.some(r => entry.readings.includes(r));
        });
    });
    writeKanji(deduped);
    console.log(`Parsed entries: ${parsed.length}`);
    console.log(`After removing N2/N3 overlaps: ${deduped.length}`);
    console.log(`Wrote: ${outPath}`);
}

main();
