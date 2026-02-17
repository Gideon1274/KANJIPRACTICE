const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const sqlite3 = require('sqlite3');

const getArg = (name) => {
    const idx = process.argv.indexOf(name);
    return idx === -1 ? null : process.argv[idx + 1];
};

const inputPath = path.resolve(getArg('--input') || 'tools/Core2000.apkg');
const outPath = path.resolve(getArg('--out') || 'Data/vocab/core2000.js');
const audioDir = path.resolve('Data/audio/sentence');

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

function cleanText(s) {
    if (!s) return "";
    return s.replace(/<[^>]+>/g, '').replace(/\[sound:[^\]]+\]/g, '').replace(/\[.*?\]/g, '').trim();
}

async function run() {
    console.log("Processing Anki Package...");
    const zip = new AdmZip(inputPath);
    const mediaEntry = zip.getEntry('media');
    const dbEntry = zip.getEntry('collection.anki2');

    // 1. Map Anki's internal IDs to actual filenames
    const mediaMap = JSON.parse(mediaEntry.getData().toString());
    const reverseMediaMap = {}; // Maps "internal_name" -> "original_filename"
    for (const key in mediaMap) {
        reverseMediaMap[mediaMap[key]] = key;
    }

    // 2. Extract Database
    const tmpDb = path.join(os.tmpdir(), `anki-${Date.now()}.db`);
    fs.writeFileSync(tmpDb, dbEntry.getData());
    const db = new sqlite3.Database(tmpDb);

    const rawRows = await new Promise((res, rej) => {
        db.all('SELECT flds FROM notes', (err, data) => err ? rej(err) : res(data));
    });
    await new Promise(r => db.close(r));
    fs.unlinkSync(tmpDb);

    const finalItems = [];
    let processedCount = 0;

    for (let r of rawRows) {
        const f = r.flds.split('\x1f');
        const rawExpression = f[8];
        const audioTag = f[13]; // [sound:xxxx.mp3]

        if (!rawExpression || rawExpression.includes("（　）")) continue;

        const entry = {
            kanji: cleanText(rawExpression),
            readings: [cleanText(f[11])],
            meanings: [cleanText(f[10])],
            audio: null
        };

        // Extract Audio File
        const audioMatch = audioTag.match(/\[sound:(.*?)\]/);
        if (audioMatch) {
            const internalName = reverseMediaMap[audioMatch[1]];
            if (internalName) {
                const audioData = zip.getEntry(internalName);
                if (audioData) {
                    const audioFilename = `sent_${processedCount}.mp3`;
                    fs.writeFileSync(path.join(audioDir, audioFilename), audioData.getData());
                    entry.audio = audioFilename;
                }
            }
        }

        finalItems.push(entry);
        processedCount++;
    }

    // 3. Write JS File
    let content = 'window.kanjiData = window.kanjiData || {}; window.kanjiData.ANKI = [\n';
    finalItems.forEach(it => {
        content += `  ${JSON.stringify(it)},\n`;
    });
    content += '];';

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`Success! Exported ${finalItems.length} sentences and their audio.`);
}

run().catch(console.error);