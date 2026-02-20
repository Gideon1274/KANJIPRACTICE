const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Create/Connect to the SQLite database file
const db = new sqlite3.Database('./anki_results.db');

// 2. Initialize the table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_range TEXT,
        total_answered INTEGER,
        correct INTEGER,
        accuracy_rate TEXT,
        missed_first_pass TEXT,
        time_taken TEXT,
        date_completed TEXT
    )`);
});

// 3. Endpoint to receive data from your HTML
app.post('/save-result', (req, res) => {
    const { session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed } = req.body;
    const sql = `INSERT INTO quiz_results (session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [session_range, total_answered, correct, accuracy_rate, missed_first_pass, time_taken, date_completed], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send(err.message);
        }
        console.log("Session recorded successfully.");
        res.send("Success");
    });
});

app.listen(3000, () => console.log("SQLite Server running at http://localhost:3000"));