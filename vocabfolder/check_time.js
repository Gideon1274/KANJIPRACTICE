const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const now = new Date();
const month = now.getMonth() + 1;
const day = now.getDate();
// const dbName = `ankiResult_${month}_${day}.db`;
const dbName = `ankiResult_3_19.db`;
const dbPath = path.join(__dirname, 'progress', dbName);

const db = new sqlite3.Database(dbPath);

db.all("SELECT time_taken FROM quiz_results", (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }
    let totalSeconds = 0;
    rows.forEach(row => {
        if (row.time_taken) {
            const parts = row.time_taken.split(':').map(Number);
            if (parts.length === 2) {
                // MM:SS format
                const minutes = parts[0];
                const seconds = parts[1];
                totalSeconds += minutes * 60 + seconds;
            } else if (parts.length === 3) {
                // HH:MM:SS format
                const hours = parts[0];
                const minutes = parts[1];
                const seconds = parts[2];
                totalSeconds += hours * 3600 + minutes * 60 + seconds;
            }
        }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    console.log(`${hours} Hours, ${minutes} Minutes, ${seconds} Seconds`);
    db.close();
});