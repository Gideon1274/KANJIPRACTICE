/*
Generate JLPT sentence datasets (N1–N5) from the vocab lists.

Goal:
- For every vocab entry in Data/vocab/n1.js ... n5.js, generate EXACTLY 5 sentences.
- Sentences are grammar-safe by “mentioning” the target word (bolded) so every vocab item works.
- Output matches JPsentence.js format: { kanji, readings: [kana], meanings: [jp, kana, en] }
- Writes:
    Data/sentences/n1sentence.js ... Data/sentences/n5sentence.js

Run (from vocabfolder/):
  node tools/build_jlpt_sentences_from_vocab.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VOCAB_DIR = path.resolve(ROOT, 'Data', 'vocab');
const OUT_DIR = path.resolve(ROOT, 'Data', 'sentences');

function hasJapaneseChars(s) {
  return /[\u3040-\u30FF\u3400-\u9FFF]/.test(String(s || ''));
}

function isRomaji(s) {
  return /^[\sA-Za-z0-9'\-_.]+$/.test(String(s || '').trim());
}

function pickKana(readings) {
  for (const r of readings || []) {
    const s = String(r || '').trim();
    if (!s) continue;
    if (!isRomaji(s) && hasJapaneseChars(s)) return s;
  }
  return '';
}

function pickEnglish(meanings) {
  const first = String((meanings && meanings[0]) || '').trim();
  return first || 'meaning';
}

function loadVocabFromFile(fileName, levelKey) {
  const filePath = path.join(VOCAB_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];

  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: { kanjiData: {} } };

  // eslint-disable-next-line no-new-func
  const fn = new Function('window', code + '\n;return window;');
  const w = fn(sandbox.window);

  const arr = (w && w.kanjiData && w.kanjiData[levelKey]) || [];
  if (!Array.isArray(arr)) return [];

  return arr
    .map(x => ({
      kanji: String((x && x.kanji) || '').trim(),
      readings: Array.isArray(x && x.readings) ? x.readings.map(r => String(r || '').trim()).filter(Boolean) : [],
      meanings: Array.isArray(x && x.meanings) ? x.meanings.map(m => String(m || '').trim()).filter(Boolean) : [],
    }))
    .filter(x => x.kanji.length > 0);
}

function sentenceObj(jp, kana, en) {
  const jpS = String(jp || '').trim();
  const kanaS = String(kana || '').trim();
  const enS = String(en || '').trim();
  return {
    kanji: jpS,
    readings: [kanaS || 'Empty'],
    meanings: [jpS, kanaS || '(kana)', enS || '(en)'],
  };
}

function buildFiveSentences(word, kanaWord, enMeaning) {
  function buildManySentences(word, kanaWord, enMeaning, targetCount = 500) {
    const w = String(word || '').trim();
    const k = String(kanaWord || w).trim();
    const m = String(enMeaning || '').trim();
    const wb = `<b>${w}</b>`;

    // Subjects and their kana + english equivalents
    const subjects = [
      { jp: '友達が', kana: 'ともだちが', en: 'A friend' },
      { jp: '上司が', kana: 'じょうしが', en: 'My boss' },
      { jp: '店員が', kana: 'てんいんが', en: 'The shop clerk' },
      { jp: '先生が', kana: 'せんせいが', en: 'The teacher' },
      { jp: '彼が', kana: 'かれが', en: 'He' },
      { jp: '彼女が', kana: 'かのじょが', en: 'She' },
      { jp: 'ネットで', kana: 'ねっとで', en: 'Online' },
      { jp: 'SNSで', kana: 'えすえぬえすで', en: 'On social media' },
      { jp: 'テレビで', kana: 'てれびで', en: 'On TV' },
      { jp: '会社で', kana: 'かいしゃで', en: 'At work' },
    ];

    // Verb-phrases (jp, kana, en)
    const vps = [
      { jp: 'って言ってた', kana: 'っていってた', en: 'said' },
      { jp: 'を勧めてた', kana: 'をすすめてた', en: 'recommended' },
      { jp: 'を使ってた', kana: 'をつかってた', en: 'was using' },
      { jp: 'について話してた', kana: 'についてはなしてた', en: 'was talking about' },
      { jp: 'を買ったって言ってた', kana: 'をかったっていってた', en: 'said they bought' },
      { jp: 'が気になるって', kana: 'がきになるって', en: 'mentioned they were curious about' },
      { jp: 'を探してた', kana: 'をさがしてた', en: 'was looking for' },
      { jp: 'に困ってた', kana: 'にこまってた', en: 'was having trouble with' },
      { jp: 'が流行ってるって', kana: 'がはやってるって', en: 'said it is trending' },
      { jp: 'を知らなかったって', kana: 'をしらなかったって', en: 'didn\'t know about' },
    ];

    // Endings to create different natural tones
    const endings = ['。', '？', 'よ。', 'ね。', 'よね。'];

    const results = [];
    for (let si = 0; si < subjects.length; si++) {
      for (let vi = 0; vi < vps.length; vi++) {
        for (let ei = 0; ei < endings.length; ei++) {
          if (results.length >= targetCount) break;
          const s = subjects[si];
          const vp = vps[vi];
          const end = endings[ei];

          const jp = `${s.jp}${wb}${vp.jp}${end}`;
          const kana = `${s.kana}${k}${vp.kana}${end}`;
          const en = `${s.en} ${vp.en} "${w}"${end === '？' ? '?' : '.'}`;

          results.push(sentenceObj(jp, kana, en));
        }
        if (results.length >= targetCount) break;
      }
      if (results.length >= targetCount) break;
    }

    // If we still don't have enough (shouldn't happen), pad with simpler templates
    while (results.length < targetCount) {
      const jp = `${wb}って聞いたよ。`;
      const kana = `${k}ってきいたよ。`;
      const en = `I heard "${w}."`;
      results.push(sentenceObj(jp, kana, en));
    }

    return results;
  }
  return buildManySentences(word, kanaWord, enMeaning, 500);
}

function renderLevelFile(levelKey, sentences) {
  const header = `// ${levelKey} sentences (generated from vocab).\n// Format matches JPsentence.js: { kanji, readings: [kana], meanings: [jp, kana, en] }\n\n(function () {\n  \"use strict\";\n  if (typeof kanjiData === \"undefined\") {\n    console.warn(\"[${levelKey}sentence] kanjiData is not defined. Load JPsentence.js first.\");\n    return;\n  }\n\n  kanjiData.${levelKey} = `;

  const body = JSON.stringify(sentences, null, 2)
    .replace(/\"kanji\"/g, 'kanji')
    .replace(/\"readings\"/g, 'readings')
    .replace(/\"meanings\"/g, 'meanings');

  const footer = `;\n})();\n`;
  return header + body + footer;
}

function writeLevel(levelKey, fileBaseName) {
  const vocab = loadVocabFromFile(`${fileBaseName}.js`, levelKey);

  const sentences = [];
  for (const entry of vocab) {
    const word = entry.kanji;
    const kanaWord = pickKana(entry.readings) || word;
    const enMeaning = pickEnglish(entry.meanings);
    sentences.push(...buildFiveSentences(word, kanaWord, enMeaning));
  }

  const outPath = path.join(OUT_DIR, `${fileBaseName}sentence.js`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, renderLevelFile(levelKey, sentences), 'utf8');

  return { outPath, vocabCount: vocab.length, sentenceCount: sentences.length };
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
    console.log(`${path.relative(ROOT, r.outPath)}: vocab=${r.vocabCount}, sentences=${r.sentenceCount}`);
  }
}

main();
