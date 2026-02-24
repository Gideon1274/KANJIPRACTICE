const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const sqlite3 = require('sqlite3');

const getArg = (name) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? null : process.argv[idx + 1];
};

const inputPath = path.resolve(getArg('--input') || 'tools/dictionariesgrammar.apkg');
const outPath = path.resolve(getArg('--out') || 'Data/vocab/dictionariesgrammar.js');
const audioDir = path.resolve('Data/audio/sentence');

if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

function cleanText(s) {
    if (!s) return "";
    return s.replace(/<[^>]+>/g, '').replace(/\[sound:[^\]]+\]/g, '').trim();
}

async function run() {
    console.log("Processing Grammar Dictionary Package with Filters...");
    const zip = new AdmZip(inputPath);
    const mediaEntry = zip.getEntry('media');
    let dbEntry = zip.getEntry('collection.anki21') || zip.getEntry('collection.anki2');

    if (!dbEntry) {
        console.error("Error: Could not find database.");
        return;
    }

    const mediaMap = JSON.parse(mediaEntry.getData().toString());
    const reverseMediaMap = {};
    for (const key in mediaMap) reverseMediaMap[mediaMap[key]] = key;

    const tmpDb = path.join(os.tmpdir(), `anki-grammar-${Date.now()}.db`);
    fs.writeFileSync(tmpDb, dbEntry.getData());
    const db = new sqlite3.Database(tmpDb);

    const rawRows = await new Promise((res, rej) => {
        db.all('SELECT flds FROM notes', (err, data) => err ? rej(err) : res(data));
    });
    await new Promise(r => db.close(r));
    fs.unlinkSync(tmpDb);

    const dataOutput = {
        BASIC: [],
        INTERMEDIATE: [],
        ADVANCED: [],
        VARIATIONS: [] // New category for filtered-out items
    };

    let processedCount = 0;

    for (let r of rawRows) {
        const f = r.flds.split('\x1f');
        if (f[0] && f[0].includes("Please update to the latest Anki version")) continue;

        const rawKanji = f[0];
        const rawMeaning = f[1];
        const rawReading = f[2];
        const audioTag = f[5];
        const rawLevelText = cleanText(f[6]).trim().toUpperCase();

        if (!rawKanji) continue;

        const entry = {
            kanji: cleanText(rawKanji),
            readings: [cleanText(rawReading)],
            meanings: [cleanText(rawMeaning)],
            audio: null
        };

        // Audio logic
        const audioMatch = audioTag ? audioTag.match(/\[sound:(.*?)\]/) : null;
        if (audioMatch) {
            const internalName = reverseMediaMap[audioMatch[1]];
            if (internalName && zip.getEntry(internalName)) {
                const audioFilename = `grammar_${processedCount}.mp3`;
                fs.writeFileSync(path.join(audioDir, audioFilename), zip.getEntry(internalName).getData());
                entry.audio = audioFilename;
            }
        }

        // --- FILTER LOGIC ---
        // If it contains [], (), or ・, put it in VARIATIONS instead of BASIC/INTER/ADV
        const hasSpecialChars = /[\[\]\(\)・（）]/.test(rawKanji);

        if (hasSpecialChars) {
            dataOutput.VARIATIONS.push(entry);
        } else if (dataOutput[rawLevelText]) {
            dataOutput[rawLevelText].push(entry);
        }

        processedCount++;
    }

    let content = 'window.kanjiData = window.kanjiData || {};\n';
    content += `window.kanjiData.BASIC = ${JSON.stringify(dataOutput.BASIC, null, 2)};\n\n`;
    content += `window.kanjiData.INTERMEDIATE = ${JSON.stringify(dataOutput.INTERMEDIATE, null, 2)};\n\n`;
    content += `window.kanjiData.ADVANCED = ${JSON.stringify(dataOutput.ADVANCED, null, 2)};\n\n`;
    content += `window.kanjiData.VARIATIONS = ${JSON.stringify(dataOutput.VARIATIONS, null, 2)};`;

    fs.writeFileSync(outPath, content, 'utf8');

    console.log(`\n--- Extraction Complete ---`);
    console.log(`BASIC (Clean): ${dataOutput.BASIC.length}`);
    console.log(`INTERMEDIATE (Clean): ${dataOutput.INTERMEDIATE.length}`);
    console.log(`ADVANCED (Clean): ${dataOutput.ADVANCED.length}`);
    console.log(`VARIATIONS (Filtered Out): ${dataOutput.VARIATIONS.length}`);
}

run().catch(console.error);