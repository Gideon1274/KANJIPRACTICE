const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Ensure the "progress_vocab" folder exists
const progressDir = path.join(__dirname, 'progress_vocab');
if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir);
}

// 2. Dynamic filename: vocabResult_Month_Day.db
const now = new Date();
const dbName = `vocabResult_${now.getMonth() + 1}_${now.getDate()}.db`;
const dbPath = path.join(progressDir, dbName);

const db = new sqlite3.Database(dbPath);
console.log(`Connected to Vocabulary database: ${dbPath}`);

// 3. Initialize the table with "deck_name"
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS vocab_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_name TEXT, 
        session_range TEXT,
        total_answered INTEGER,
        correct INTEGER,
        accuracy_rate TEXT,
        missed_items TEXT,
        time_taken TEXT,
        date_completed TEXT
    )`);
});

// 4. Endpoint to save vocabulary results
app.post('/save-result', (req, res) => {
    const {
        deck_name,
        session_range,
        total_answered,
        correct,
        accuracy_rate,
        missed_first_pass,
        time_taken,
        date_completed
    } = req.body;

    const sql = `INSERT INTO vocab_results (deck_name, session_range, total_answered, correct, accuracy_rate, missed_items, time_taken, date_completed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [deck_name, session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send(err.message);
        }
        console.log(`Vocab session recorded for [${deck_name}]`);
        res.send("Success");
    });
});

// 5. Endpoint to get total time spent on Vocab
app.get('/total-time', (req, res) => {
    db.all('SELECT time_taken FROM vocab_results', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let totalSeconds = 0;
        rows.forEach(row => {
            if (row.time_taken) {
                const parts = row.time_taken.split(':');
                const m = parseInt(parts[0], 10);
                const s = parseInt(parts[1], 10);
                totalSeconds += (m * 60) + s;
            }
        });

        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const min = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const sec = (totalSeconds % 60).toString().padStart(2, '0');

        res.json({
            total_seconds: totalSeconds,
            total_formatted: `${h}:${min}:${sec}`
        });
    });
});

app.listen(3001, () => console.log("Vocab Server running at http://localhost:3001"));