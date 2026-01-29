/*
Generate JLPT grammar (cloze) datasets (N1–N5) from the sentence datasets.

- Reads Data/sentences/n1sentence.js ... n5sentence.js
- Creates fill-in-the-blank questions by replacing a grammar point with "____".
- Output format:
    { prompt, answer, full, kana, en }
- Writes:
    Data/grammar/n1grammar.js ... Data/grammar/n5grammar.js

Run (from vocabfolder/):
  node tools/build_jlpt_grammar_from_sentences.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SENT_DIR = path.resolve(ROOT, 'Data', 'sentences');
const OUT_DIR = path.resolve(ROOT, 'Data', 'grammar');

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '');
}

function loadSentences(levelKey, fileBaseName) {
  const filePath = path.join(SENT_DIR, `${fileBaseName}sentence.js`);
  if (!fs.existsSync(filePath)) return [];

  const code = fs.readFileSync(filePath, 'utf8');
  const kanjiData = {};

  // eslint-disable-next-line no-new-func
  const fn = new Function('kanjiData', code + '\n; return kanjiData;');
  const result = fn(kanjiData);
  const arr = result && result[levelKey];
  return Array.isArray(arr) ? arr : [];
}

function firstMeaningOrEmpty(sentenceObj, idx) {
  const meanings = (sentenceObj && sentenceObj.meanings) || [];
  return String(meanings[idx] || '').trim();
}

function buildClozeFromSentence(jpHtml) {
  const jp = String(jpHtml || '').trim();

  // Try a small, high-signal set of grammar patterns.
  // We only replace the first match.
  const rules = [
    { find: 'という', answer: 'という' },
    { find: 'によって', answer: 'によって' },
    { find: 'ことがあります', answer: 'ことがあります' },
    { find: 'てみたい', answer: 'てみたい' },
    { find: 'で', answer: 'で' },
    { find: 'を', answer: 'を' },
    { find: 'に', answer: 'に' },
    { find: 'が', answer: 'が' },
    { find: 'は', answer: 'は' },
  ];

  for (const r of rules) {
    const idx = jp.indexOf(r.find);
    if (idx === -1) continue;

    // Avoid blanking inside a tag.
    const before = jp.slice(0, idx);
    const openTag = before.lastIndexOf('<');
    const closeTag = before.lastIndexOf('>');
    if (openTag > closeTag) continue;

    const prompt = jp.slice(0, idx) + '____' + jp.slice(idx + r.find.length);
    return { prompt, answer: r.answer, full: jp };
  }

  return null;
}

function renderLevelFile(levelKey, items) {
  const header = `// ${levelKey} grammar (cloze) questions (generated from sentences).\n\n(function () {\n  \"use strict\";\n  if (typeof grammarData === \"undefined\") {\n    console.warn(\"[${levelKey}grammar] grammarData is not defined. Load Data/grammar/JPgrammar.js first.\");\n    return;\n  }\n\n  grammarData.${levelKey} = `;

  const body = JSON.stringify(items, null, 2)
    .replace(/\"prompt\"/g, 'prompt')
    .replace(/\"answer\"/g, 'answer')
    .replace(/\"full\"/g, 'full')
    .replace(/\"kana\"/g, 'kana')
    .replace(/\"en\"/g, 'en');

  const footer = `;\n})();\n`;
  return header + body + footer;
}

function writeLevel(levelKey, fileBaseName) {
  const sentences = loadSentences(levelKey, fileBaseName);

  const out = [];
  for (const s of sentences) {
    const jp = String((s && s.kanji) || '').trim();
    if (!jp) continue;

    const cloze = buildClozeFromSentence(jp);
    if (!cloze) continue;

    const kana = firstMeaningOrEmpty(s, 1) || String(((s && s.readings) || [])[0] || '').trim();
    const en = firstMeaningOrEmpty(s, 2);

    out.push({
      prompt: cloze.prompt,
      answer: cloze.answer,
      full: cloze.full,
      kana: stripHtml(kana),
      en: en,
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${fileBaseName}grammar.js`);
  fs.writeFileSync(outPath, renderLevelFile(levelKey, out), 'utf8');

  return { outPath, sentenceCount: sentences.length, grammarCount: out.length };
}

function main() {
  const results = [
    writeLevel('N5', 'n5'),
    writeLevel('N4', 'n4'),
    writeLevel('N3', 'n3'),
    writeLevel('N2', 'n2'),
    writeLevel('N1', 'n1'),
  ];

  for (const r of results) {
    console.log(`${path.relative(ROOT, r.outPath)}: sentences=${r.sentenceCount}, grammar=${r.grammarCount}`);
  }
}

main();
