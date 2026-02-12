#!/usr/bin/env node
// Dumps first N notes' raw `flds` values from an .apkg for inspection.
const fs = require('fs');
const path = require('path');
const os = require('os');

function getArg(name) {
    const idx = process.argv.indexOf(name);
    if (idx === -1) return null;
    return process.argv[idx + 1] || null;
}

const inputPath = path.resolve(getArg('--input') || 'deck.apkg');
const limit = Number(getArg('--limit') || 10);

if (!fs.existsSync(inputPath)) {
    console.error('Input not found:', inputPath);
    process.exit(1);
}

let AdmZip, sqlite3;
try { AdmZip = require('adm-zip'); } catch (e) { console.error('Install adm-zip: npm install adm-zip'); process.exit(1); }
try { sqlite3 = require('sqlite3'); } catch (e) { console.error('Install sqlite3: npm install sqlite3'); process.exit(1); }

const zip = new AdmZip(inputPath);
const entry = zip.getEntry('collection.anki2');
if (!entry) { console.error('collection.anki2 not found inside .apkg'); process.exit(1); }

const tmpDb = path.join(os.tmpdir(), `collection-${Date.now()}.anki2`);
fs.writeFileSync(tmpDb, entry.getData());

const db = new sqlite3.Database(tmpDb);
db.all('SELECT id, flds FROM notes LIMIT ?', [limit], (err, rows) => {
    if (err) {
        console.error('SQLite error', err);
        try { fs.unlinkSync(tmpDb); } catch (e) { }
        process.exit(1);
    }

    for (const r of rows) {
        console.log('--- NOTE ID:', r.id, '---');
        // Show raw flds and a visible representation (replace US separator with [|])
        const raw = String(r.flds || '');
        const visible = raw.replace(/\x1f/g, '[|]');
        console.log(visible);
        console.log();
    }

    try { fs.unlinkSync(tmpDb); } catch (e) { }
    process.exit(0);
});
