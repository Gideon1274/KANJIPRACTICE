const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the current directory (vocabfolder)
app.use(express.static(__dirname));

const progressDir = path.join(__dirname, 'progress');
if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir);
}

const now = new Date();
const month = now.getMonth() + 1;
const day = now.getDate();
const dbName = `ankiResult_${month}_${day}.db`;
const dbPath = path.join(progressDir, dbName);

const db = new sqlite3.Database(dbPath);
console.log(`Connected to database: ${dbPath}`);

// 1. Updated Schema to include "deck_name"
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_name TEXT, 
        session_range TEXT,
        total_answered INTEGER,
        correct INTEGER,
        accuracy_rate TEXT,
        missed_first_pass TEXT,
        time_taken TEXT,
        date_completed TEXT
    )`);
});

// 2. Updated Endpoint to receive "deck_name"
app.post('/save-result', (req, res) => {
    const {
        deck_name, // e.g., "Core 2000", "Basic DoJG", etc.
        session_range,
        total_answered,
        correct,
        accuracy_rate,
        missed_first_pass,
        time_taken,
        date_completed
    } = req.body;

    const sql = `INSERT INTO quiz_results (deck_name, session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [deck_name, session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send(err.message);
        }
        console.log(`Session recorded for [${deck_name}] successfully.`);
        res.send("Success");
    });
});

// 3. Fixed Route to get total time from the correct table
app.get('/total-time', (req, res) => {
    // Changed "results" to "quiz_results" to match your initialization
    db.all('SELECT time_taken FROM quiz_results', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        let totalSeconds = 0;
        rows.forEach(row => {
            if (row.time_taken) {
                const parts = row.time_taken.split(':');
                const minutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                totalSeconds += (minutes * 60) + seconds;
            }
        });

        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');

        res.json({
            total_seconds: totalSeconds,
            total_formatted: `${h}:${m}:${s}`
        });
    });
});

app.listen(3000, () => console.log("SQLite Server running at http://localhost:3000"));