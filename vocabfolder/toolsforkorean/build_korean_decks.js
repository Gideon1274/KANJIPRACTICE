const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const sqlite3 = require('sqlite3');

function getArg(name) {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? null : process.argv[idx + 1] || null;
}

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function stripHtml(s) {
    return String(s || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;?/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

function cleanText(s) {
    const t = stripHtml(s)
        .replace(/\[sound:[^\]]+\]/g, '')
        .replace(/^[\-\s♪]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return t;
}

function extractFirstSoundName(fields) {
    for (const f of fields) {
        const m = String(f || '').match(/\[sound:([^\]]+)\]/);
        if (m) return m[1];
    }
    return null;
}

function extractFirstImageName(fields) {
    for (const f of fields) {
        const s = String(f || '');
        const m = s.match(/<img[^>]+src="([^"]+)"/i);
        if (m) return m[1];
    }
    return null;
}

function pickFirstNonEmpty(fields, indices) {
    for (const i of indices) {
        const v = cleanText(fields[i] || '');
        if (v) return v;
    }
    return '';
}

async function readNotesFromApkg(zip) {
    const dbEntry = zip.getEntry('collection.anki21') || zip.getEntry('collection.anki2');
    if (!dbEntry) throw new Error('Could not find collection.anki21 or collection.anki2');

    const tmpDb = path.join(os.tmpdir(), `anki-korean-${Date.now()}.db`);
    fs.writeFileSync(tmpDb, dbEntry.getData());
    const db = new sqlite3.Database(tmpDb);

    try {
        const rows = await new Promise((res, rej) => {
            db.all('SELECT flds FROM notes', (err, data) => (err ? rej(err) : res(data)));
        });
        return rows.map((r) => String(r.flds || ''));
    } finally {
        await new Promise((resolve) => db.close(() => resolve()));
        try {
            if (fs.existsSync(tmpDb)) fs.unlinkSync(tmpDb);
        } catch (_) { }
    }
}

function buildReverseMediaMap(zip) {
    const mediaEntry = zip.getEntry('media');
    if (!mediaEntry) return null;
    const mediaMap = JSON.parse(mediaEntry.getData().toString());
    const reverse = {};
    for (const internalKey of Object.keys(mediaMap)) {
        reverse[mediaMap[internalKey]] = internalKey;
    }
    return reverse;
}

function copyMediaIfPresent(zip, reverseMediaMap, originalName, destDir, destName) {
    if (!reverseMediaMap || !originalName) return null;
    const internalKey = reverseMediaMap[originalName];
    if (!internalKey) return null;
    const entry = zip.getEntry(internalKey);
    if (!entry) return null;
    ensureDir(destDir);
    const outPath = path.join(destDir, destName);
    if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, entry.getData());
    }
    return destName;
}

function splitMeanings(text) {
    const t = String(text || '').replace(/\r/g, '\n');
    return t
        .split(/[\n;／/]+/g)
        .map((s) => cleanText(s))
        .filter(Boolean);
}

async function processDeck({ apkgPath, key, displayFieldCandidates, readingFieldCandidates, meaningFieldCandidates, sortFieldCandidates }, output) {
    const zip = new AdmZip(apkgPath);
    const reverseMediaMap = buildReverseMediaMap(zip);
    const rawNotes = await readNotesFromApkg(zip);

    const audioDir = path.join(output.audioRoot, key);
    const imageDir = path.join(output.imageRoot, key);

    const items = [];
    let emitted = 0;

    for (const raw of rawNotes) {
        const fields = raw.split('\x1f');
        if (fields.some((f) => String(f || '').includes('Please update to the latest Anki version'))) continue;

        const displayText = pickFirstNonEmpty(fields, displayFieldCandidates);
        if (!displayText) continue;

        const readings = [];
        for (const idx of readingFieldCandidates) {
            const val = cleanText(fields[idx] || '');
            if (val) readings.push(val);
        }

        const meanings = [];
        for (const idx of meaningFieldCandidates) {
            const parts = splitMeanings(fields[idx] || '');
            for (const p of parts) meanings.push(p);
        }

        const soundName = extractFirstSoundName(fields);
        const imgName = extractFirstImageName(fields);

        let audio = null;
        if (soundName) {
            const ext = path.extname(soundName) || '.mp3';
            audio = copyMediaIfPresent(zip, reverseMediaMap, soundName, audioDir, `${key}_${emitted}${ext}`);
        }

        let image = null;
        if (imgName) {
            const ext = path.extname(imgName) || '.jpg';
            image = copyMediaIfPresent(zip, reverseMediaMap, imgName, imageDir, `${key}_${emitted}${ext}`);
        }

        let sort = null;
        for (const idx of sortFieldCandidates) {
            const v = cleanText(fields[idx] || '');
            if (!v) continue;
            const n = Number(v);
            if (!Number.isNaN(n)) {
                sort = n;
                break;
            }
        }

        items.push({
            kanji: displayText,
            readings: readings.filter(Boolean),
            meanings: meanings.filter(Boolean),
            audio,
            image,
            deck: key,
            sort
        });

        emitted++;
    }

    const hasSort = items.some((it) => typeof it.sort === 'number' && !Number.isNaN(it.sort));
    if (hasSort) items.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    for (const it of items) delete it.sort;

    output.data[key] = items;
}

async function run() {
    const inputDir = path.resolve(getArg('--dir') || __dirname);
    const outPath = path.resolve(getArg('--out') || path.join(__dirname, '..', 'Data', 'vocab', 'korean_decks.js'));
    const audioRoot = path.resolve(getArg('--audio-root') || path.join(__dirname, '..', 'Data', 'audio', 'korean'));
    const imageRoot = path.resolve(getArg('--image-root') || path.join(__dirname, '..', 'Data', 'images', 'korean'));

    ensureDir(path.dirname(outPath));
    ensureDir(audioRoot);
    ensureDir(imageRoot);

    const decks = [
        {
            file: 'TTMIKs_First_500_Korean_Words_by_Retro_picturesaudio.apkg',
            key: 'TTMIK_500',
            displayFieldCandidates: [0],
            readingFieldCandidates: [],
            meaningFieldCandidates: [1],
            sortFieldCandidates: []
        },
        {
            file: 'Korean_Vocabulary_by_Evita.apkg',
            key: 'EVITA_VOCAB',
            displayFieldCandidates: [0],
            readingFieldCandidates: [],
            meaningFieldCandidates: [1, 2],
            sortFieldCandidates: [4]
        },
        {
            file: 'Korean_Grammar_Sentences_by_Evita.apkg',
            key: 'EVITA_GRAMMAR',
            displayFieldCandidates: [0],
            readingFieldCandidates: [],
            meaningFieldCandidates: [1, 2, 4],
            sortFieldCandidates: []
        },
        {
            file: '1000_Korean_sentences_sorted_from_easiest_to_hardest.apkg',
            key: 'KOR_1000_SENT',
            displayFieldCandidates: [5, 3, 2],
            readingFieldCandidates: [2, 6],
            meaningFieldCandidates: [7, 8],
            sortFieldCandidates: [0, 1]
        },
        {
            file: 'Korean_Core_2000_for_Japanese_Speakers_by_peldas.apkg',
            key: 'CORE_2000_JP',
            displayFieldCandidates: [0],
            readingFieldCandidates: [],
            meaningFieldCandidates: [1, 2, 3],
            sortFieldCandidates: [5]
        }
    ];

    const output = { data: {}, audioRoot, imageRoot };

    for (const d of decks) {
        const apkgPath = path.join(inputDir, d.file);
        if (!fs.existsSync(apkgPath)) continue;
        await processDeck({ apkgPath, ...d }, output);
    }

    let content = 'window.koreanData = window.koreanData || {};\n';
    for (const key of Object.keys(output.data)) {
        content += `window.koreanData[${JSON.stringify(key)}] = ${JSON.stringify(output.data[key], null, 2)};\n\n`;
    }

    fs.writeFileSync(outPath, content.trimEnd(), 'utf8');
    console.log(`Wrote ${Object.keys(output.data).length} decks to ${outPath}`);
    for (const [key, list] of Object.entries(output.data)) {
        console.log(`${key}: ${list.length}`);
    }
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});

