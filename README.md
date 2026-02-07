**KanjiPractice — JLPT Vocab & Kanji Quiz**

- **Purpose:** A lightweight client-side quiz app to practice JLPT kanji and vocabulary. It supports N1–N5 datasets, a vocab/kanji checklist, voice input, and keyboard shortcuts for quick workflow.

**Quick Start**
- Open the app in your browser: [vocabfolder/VOCAB.html](vocabfolder/VOCAB.html).
- Select a level and mode, then click `Start Quiz`.
- The main quiz shows a kanji; type the reading/meaning or use voice input (if supported).

**Vocab Checklist / Range Input**
- The right-side panel (`vocab-panel`) contains the checklist and a range input (`vocab-range-input`).
- Enter a range like `1-25,40-50` and press Enter or click `Enter` to apply the filter.
- The input displays Japanese full-width digits (e.g. `１２３－５００`) and accepts full-width or ASCII ranges.

**Selecting by Clicking Numbers**
- Click a number in the checklist to clear all checks and check only that item.
- Ctrl+Click a number to toggle that checkbox and set an anchor.
- Shift+Click (with an anchor) will check the entire anchor..clicked range (like a file explorer).
- Click numbers (no modifier) will update the range input to reflect the shown selection.

**Shortcuts**
- Ctrl+Enter: triggers the vocab-panel `Enter` action (with a short delay to allow IME commits) and also preserves the quiz reset behavior. This is the primary shortcut for applying the range input regardless of focus.


**Data**
- Vocabulary lists are under `vocabfolder/Data/vocab/` (e.g. `n1.js`, `n2.js`, `n3.js`).
- The app reads `window.kanjiData` objects from these files.

**Audio & Fonts**
- Sounds: `soundeffects/correct.mp3`, `soundeffects/wrong.mp3`.
- Fonts: `font/` contains bundled fonts used by the app.

**Development / Running Locally**
- No build step required. Open `vocabfolder/VOCAB.html` in a browser.
- For live reload during edits, use a simple static server (e.g., `live-server` or `python -m http.server`).

