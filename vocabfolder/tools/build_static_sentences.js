/*
  Build static JPsentence.js-style sentence files from vocab lists.
  Output files are pure data (no runtime generation in the browser).

  Run (from repo root):
    node vocabfolder/tools/build_static_sentences.js
*/

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const vocabDir = path.join(repoRoot, "vocabfolder", "Data", "vocab");
const sentencesDir = path.join(repoRoot, "vocabfolder", "Data", "sentences");

function loadVocab(levelFile, levelKey) {
  // The vocab files are browser scripts that assign window.kanjiData.NX.
  const filePath = path.join(vocabDir, levelFile);
  const code = fs.readFileSync(filePath, "utf8");

  const sandbox = { window: { kanjiData: {} } };
  // eslint-disable-next-line no-new-func
  const fn = new Function("window", code + "\n;return window;");
  const w = fn(sandbox.window);
  const arr = (w.kanjiData && w.kanjiData[levelKey]) || [];
  if (!Array.isArray(arr)) return [];

  // Filter out clearly bad entries
  return arr
    .map((x) => ({
      kanji: String(x.kanji || "").trim(),
      readings: Array.isArray(x.readings) ? x.readings.map((r) => String(r || "").trim()).filter(Boolean) : [],
      meanings: Array.isArray(x.meanings) ? x.meanings.map((m) => String(m || "").trim()).filter(Boolean) : [],
    }))
    .filter((x) => x.kanji.length > 0);
}

function loadExistingSentences(sentenceFile, levelKey) {
  const filePath = path.join(sentencesDir, sentenceFile);
  if (!fs.existsSync(filePath)) return [];
  const code = fs.readFileSync(filePath, "utf8");

  // The sentence files are browser scripts that expect a global `kanjiData`.
  // Execute them in a sandbox object so we can retrieve kanjiData.N3 safely.
  const sandboxKanjiData = {};
  // eslint-disable-next-line no-new-func
  const fn = new Function("kanjiData", code + "\n;return kanjiData;");
  const kd = fn(sandboxKanjiData) || {};
  const arr = kd[levelKey] || [];
  return Array.isArray(arr) ? arr : [];
}

function parseArgs(argv) {
  const out = { overwriteCanonical: false, n3Extra: 0, noGenerated: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--overwrite-canonical") out.overwriteCanonical = true;
    if (a === "--no-generated") out.noGenerated = true;
    if (a === "--n3-extra") {
      const v = Number(argv[i + 1]);
      if (!Number.isFinite(v) || v < 0) throw new Error("--n3-extra requires a non-negative number");
      out.n3Extra = Math.floor(v);
      i++;
    }
  }
  return out;
}

function hasJapaneseChars(s) {
  return /[\u3040-\u30FF\u3400-\u9FFF]/.test(s);
}

function isRomaji(s) {
  return /^[\sA-Za-z0-9'\-_.]+$/.test(s);
}

function pickKana(readings) {
  for (const r of readings || []) {
    const s = String(r || "").trim();
    if (!s) continue;
    if (!isRomaji(s) && hasJapaneseChars(s)) return s;
  }
  return "";
}

function pickEnglish(meanings) {
  const s = String((meanings && meanings[0]) || "").trim();
  return s || "(meaning)";
}

function classify(kanaOrKanji) {
  const base = String(kanaOrKanji || "");
  if (base.endsWith("する")) return "verb";
  if (base.endsWith("い") && base.length >= 2) return "i-adj";
  // very rough, but we avoid conjugation anyway
  if (/[うくぐすつぬぶむる]$/.test(base)) return "verb";
  return "noun";
}

function toNounPhrase(word, kind) {
  const w = String(word || "").trim();
  if (!w) return "";
  if (kind === "verb") return `${w}こと`;
  if (kind === "i-adj") return `${w}こと`;
  return w;
}

function sentenceObj(jp, kana, en) {
  const jpS = String(jp).trim();
  const kanaS = String(kana).trim();
  const enS = String(en).trim();
  return {
    kanji: jpS,
    readings: [kanaS || "Empty"],
    meanings: [jpS, kanaS || "(kana)", enS || "(en)"],
  };
}

function normalizeEnglishMeaning(en) {
  // For verb meanings often "to X"; keep natural English.
  return en.replace(/^to\s+/i, "to ");
}

function buildSentencesForEntry(entry, templates) {
  const word = entry.kanji;
  const kanaWord = pickKana(entry.readings) || word;
  const enMeaning = normalizeEnglishMeaning(pickEnglish(entry.meanings));

  const kind = classify(kanaWord);

  const out = [];
  for (const t of templates) {
    const jp = t.jp(word, kind);
    const kana = t.kana(kanaWord, kind);
    const en = t.en(enMeaning, kind, word);
    out.push(sentenceObj(jp, kana, en));
  }
  return out;
}

function uniqByKanji(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x || !x.kanji) continue;
    if (seen.has(x.kanji)) continue;
    seen.add(x.kanji);
    out.push(x);
  }
  return out;
}

function renderJs(level, sentences) {
  const header = `// ${level} sentences (static).\n// Format matches JPsentence.js: { kanji, readings: [kana], meanings: [jp, kana, en] }\n\n(function () {\n  \"use strict\";\n  if (typeof kanjiData === \"undefined\") {\n    console.warn(\"[${level}sentence] kanjiData is not defined. Load JPsentence.js first.\");\n    return;\n  }\n\n  kanjiData.${level} = `;

  const body = JSON.stringify(sentences, null, 2)
    .replace(/\"kanji\"/g, "kanji")
    .replace(/\"readings\"/g, "readings")
    .replace(/\"meanings\"/g, "meanings");

  const footer = `;\n})();\n`;
  return header + body + footer;
}

function writeLevel(level, vocab, minSentences, perWordTemplates) {
  const built = [];
  for (const entry of vocab) {
    built.push(...buildSentencesForEntry(entry, perWordTemplates));
  }

  let sentences = uniqByKanji(built);

  // Ensure minimum count by repeating additional safe templates if needed.
  if (sentences.length < minSentences) {
    const extraTemplate = {
      jp: (w) => `\u6700\u8fd1\u3001${w}\u3068\u3044\u3046\u8a00\u8449\u3092\u899a\u3048\u307e\u3057\u305f\u3002`,
      kana: (k) => `\u3055\u3044\u304d\u3093\u3001${k}\u3068\u3044\u3046\u3053\u3068\u3070\u3092\u304a\u307c\u3048\u307e\u3057\u305f\u3002`,
      en: (m, _kind, w) => `Recently I learned the word \"${w}\" (${m}).`,
    };

    const extras = [];
    for (const entry of vocab) {
      const word = entry.kanji;
      const kanaWord = pickKana(entry.readings) || word;
      const enMeaning = normalizeEnglishMeaning(pickEnglish(entry.meanings));
      extras.push(sentenceObj(extraTemplate.jp(word), extraTemplate.kana(kanaWord), extraTemplate.en(enMeaning, "", word)));
    }

    sentences = uniqByKanji(sentences.concat(extras));
  }

  // Trim if too huge.
  if (sentences.length > Math.max(minSentences, vocab.length * perWordTemplates.length)) {
    sentences = sentences.slice(0, Math.max(minSentences, vocab.length * perWordTemplates.length));
  }

  return sentences;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const n5 = loadVocab("n5.js", "N5");
  const n4 = loadVocab("n4.js", "N4");
  const n3 = loadVocab("n3.js", "N3");

  // N1/N2 vocab files are placeholders in this repo by default, but if you populate
  // them later, they can be included in the combined N3 pool.
  const n2 = loadVocab("n2.js", "N2");
  const n1 = loadVocab("n1.js", "N1");

  // We generate sentences that remain grammatical without wrapping every target in quotes.
  // To keep things safe across word types, many N3 templates rely on a noun-phrase form:
  //   noun: X / verb: Xこと / i-adj: Xこと
  const n5Templates = [
    {
      jp: (w) => `\u6700\u8fd1\u3001${w}\u3068\u3044\u3046\u8a00\u8449\u3092\u899a\u3048\u307e\u3057\u305f\u3002`,
      kana: (k) => `\u3055\u3044\u304d\u3093\u3001${k}\u3068\u3044\u3046\u3053\u3068\u3070\u3092\u304a\u307c\u3048\u307e\u3057\u305f\u3002`,
      en: (m, _kind, w) => `Recently I learned the word "${w}" (${m}).`,
    },
    {
      jp: (w) => `${w}\u306e\u610f\u5473\u3092\u8abf\u3079\u307e\u3057\u305f\u3002`,
      kana: (k) => `${k}\u306e\u3044\u307f\u3092\u3057\u3089\u3079\u307e\u3057\u305f\u3002`,
      en: (m, _kind, w) => `I looked up the meaning of "${w}" (${m}).`,
    },
    {
      jp: (w) => `\u4eca\u65e5\u306f${w}\u3092\u4f7f\u3046\u7df4\u7fd2\u3092\u3057\u307e\u3059\u3002`,
      kana: (k) => `\u304d\u3087\u3046\u306f${k}\u3092\u3064\u304b\u3046\u308c\u3093\u3057\u3085\u3046\u3092\u3057\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `Today I'll practice using "${w}".`,
    },
  ];

  const n4Templates = [
    {
      jp: (w) => `\u6700\u8fd1\u3001${w}\u3068\u3044\u3046\u8a00\u8449\u3092\u899a\u3048\u307e\u3057\u305f\u3002`,
      kana: (k) => `\u3055\u3044\u304d\u3093\u3001${k}\u3068\u3044\u3046\u3053\u3068\u3070\u3092\u304a\u307c\u3048\u307e\u3057\u305f\u3002`,
      en: (m, _kind, w) => `Recently I learned the word "${w}" (${m}).`,
    },
    {
      jp: (w) => `${w}\u306e\u610f\u5473\u3092\u8abf\u3079\u3066\u304b\u3089\u4f7f\u3044\u307e\u3059\u3002`,
      kana: (k) => `${k}\u306e\u3044\u307f\u3092\u3057\u3089\u3079\u3066\u304b\u3089\u3064\u304b\u3044\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I'll look up what "${w}" means before using it.`,
    },
    {
      jp: (w) => `\u4f8b\u6587\u3067${w}\u3092\u4f7f\u3063\u3066\u307f\u307e\u3059\u3002`,
      kana: (k) => `\u308c\u3044\u3076\u3093\u3067${k}\u3092\u3064\u304b\u3063\u3066\u307f\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I'll try using "${w}" in an example sentence.`,
    },
    {
      jp: (w) => `${w}\u306f\u3088\u304f\u4f7f\u3046\u8a00\u8449\u3060\u3068\u601d\u3044\u307e\u3059\u3002`,
      kana: (k) => `${k}\u306f\u3088\u304f\u3064\u304b\u3046\u3053\u3068\u3070\u3060\u3068\u304a\u3082\u3044\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I think "${w}" is a word that's used often.`,
    },
    {
      jp: (w) => `\u6642\u9593\u304c\u3042\u308c\u3070\u3001${w}\u3092\u5fa9\u7fd2\u3057\u305f\u3044\u3067\u3059\u3002`,
      kana: (k) => `\u3058\u304b\u3093\u304c\u3042\u308c\u3070\u3001${k}\u3092\u3075\u304f\u3057\u3085\u3046\u3057\u305f\u3044\u3067\u3059\u3002`,
      en: (_m, _kind, w) => `If I have time, I'd like to review "${w}".`,
    },
    {
      jp: (w) => `${w}\u3092\u30ce\u30fc\u30c8\u306b\u66f8\u3044\u3066\u304a\u304d\u307e\u3059\u3002`,
      kana: (k) => `${k}\u3092\u306e\u30fc\u3068\u306b\u304b\u3044\u3066\u304a\u304d\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I'll write "${w}" in my notebook.`,
    },
  ];

  // N3: include N3->N1-ish grammar patterns while keeping sentences grammatical across word types.
  const n3Templates = [
    {
      jp: (w, kind) => `\u307e\u305a${toNounPhrase(w, kind)}\u306e\u610f\u5473\u3092\u6574\u7406\u3057\u3066\u304b\u3089\u899a\u3048\u307e\u3059\u3002`,
      kana: (k, kind) => `\u307e\u305a${toNounPhrase(k, kind)}\u306e\u3044\u307f\u3092\u305b\u3044\u308a\u3057\u3066\u304b\u3089\u304a\u307c\u3048\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `First, I'll organize the meaning of "${w}" before memorizing it.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306e\u4f7f\u3044\u65b9\u306f\u4e00\u3064\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306e\u3064\u304b\u3044\u304b\u305f\u306f\u3072\u3068\u3064\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      en: (_m, _kind, w) => `There isn't only one way to use "${w}".`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3060\u304b\u3089\u3068\u3044\u3063\u3066\u3001\u3044\u3064\u3082\u540c\u3058\u610f\u5473\u306b\u306a\u308b\u308f\u3051\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3060\u304b\u3089\u3068\u3044\u3063\u3066\u3001\u3044\u3064\u3082\u304a\u306a\u3058\u3044\u307f\u306b\u306a\u308b\u308f\u3051\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      en: (_m, _kind, w) => `Just because it's "${w}", it doesn't always mean the same thing.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306f\u6587\u8108\u306b\u3088\u3063\u3066\u610f\u5473\u304c\u5909\u308f\u308b\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306f\u3076\u3093\u307f\u3083\u304f\u306b\u3088\u3063\u3066\u3044\u307f\u304c\u304b\u308f\u308b\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `The meaning of "${w}" can change depending on context.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3092\u898b\u3066\u3001\u306a\u3093\u3068\u306a\u304f\u610f\u5473\u304c\u5206\u304b\u308b\u3088\u3046\u306b\u306a\u308a\u305f\u3044\u3067\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3092\u307f\u3066\u3001\u306a\u3093\u3068\u306a\u304f\u3044\u307f\u304c\u308f\u304b\u308b\u3088\u3046\u306b\u306a\u308a\u305f\u3044\u3067\u3059\u3002`,
      en: (_m, _kind, w) => `I want to get to the point where I can roughly understand "${w}" at a glance.`,
    },
    {
      jp: (w, kind) => `\u4f3c\u305f\u8a00\u8449\u3068\u6bd4\u3079\u306a\u304c\u3089${toNounPhrase(w, kind)}\u3092\u899a\u3048\u307e\u3059\u3002`,
      kana: (k, kind) => `\u306b\u305f\u3053\u3068\u3070\u3068\u304f\u3089\u3079\u306a\u304c\u3089${toNounPhrase(k, kind)}\u3092\u304a\u307c\u3048\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I'll memorize "${w}" by comparing it with similar words.`,
    },
    {
      jp: (w) => `${w}\u306f\u3001\u77e5\u3063\u3066\u3044\u305d\u3046\u3067\u77e5\u3089\u306a\u3044\u8a00\u8449\u3067\u3057\u305f\u3002`,
      kana: (k) => `${k}\u306f\u3001\u3057\u3063\u3066\u3044\u305d\u3046\u3067\u3057\u3089\u306a\u3044\u3053\u3068\u3070\u3067\u3057\u305f\u3002`,
      en: (_m, _kind, w) => `"${w}" looked familiar, but I didn't actually know it.`,
    },
    {
      jp: (w) => `\u9593\u9055\u3048\u306a\u3044\u3088\u3046\u306b\u3001${w}\u306e\u8aad\u307f\u65b9\u3082\u78ba\u8a8d\u3057\u307e\u3059\u3002`,
      kana: (k) => `\u307e\u3061\u304c\u3048\u306a\u3044\u3088\u3046\u306b\u3001${k}\u306e\u3088\u307f\u304b\u305f\u3082\u304b\u304f\u306b\u3093\u3057\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `To avoid mistakes, I'll also check how "${w}" is read.`,
    },
    {
      jp: (w, kind) => `\u4eca\u5f8c\u3082${toNounPhrase(w, kind)}\u306e\u7df4\u7fd2\u3092\u7d9a\u3051\u308b\u3053\u3068\u306b\u3057\u307e\u3057\u305f\u3002`,
      kana: (k, kind) => `\u3053\u3093\u3054\u3082${toNounPhrase(k, kind)}\u306e\u308c\u3093\u3057\u3085\u3046\u3092\u3064\u3065\u3051\u308b\u3053\u3068\u306b\u3057\u307e\u3057\u305f\u3002`,
      en: (_m, _kind, w) => `I decided to keep practicing using "${w}".`,
    },
    {
      jp: (w, kind) => `\u5fd8\u308c\u305d\u3046\u306a\u306e\u3067\u3001${toNounPhrase(w, kind)}\u3092\u30ce\u30fc\u30c8\u306b\u66f8\u3044\u3066\u304a\u304d\u307e\u3059\u3002`,
      kana: (k, kind) => `\u308f\u3059\u308c\u305d\u3046\u306a\u306e\u3067\u3001${toNounPhrase(k, kind)}\u3092\u306e\u30fc\u3068\u306b\u304b\u3044\u3066\u304a\u304d\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `I might forget it, so I'll write "${w}" in my notebook.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306e\u6b63\u3057\u3044\u4f7f\u3044\u5206\u3051\u3092\u8aac\u660e\u3067\u304d\u308b\u3088\u3046\u306b\u306a\u308a\u305f\u3044\u3067\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306e\u305f\u3060\u3057\u3044\u3064\u304b\u3044\u308f\u3051\u3092\u305b\u3064\u3081\u3044\u3067\u304d\u308b\u3088\u3046\u306b\u306a\u308a\u305f\u3044\u3067\u3059\u3002`,
      en: (_m, _kind, w) => `I want to be able to explain the correct usage of "${w}".`,
    },
    {
      jp: (w, kind) => `\u4eca\u306e\u6642\u70b9\u3067\u306f\u3001${toNounPhrase(w, kind)}\u306e\u610f\u5473\u3092\u5b8c\u5168\u306b\u7406\u89e3\u3057\u3066\u3044\u308b\u308f\u3051\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      kana: (k, kind) => `\u3044\u307e\u306e\u3058\u3066\u3093\u3067\u306f\u3001${toNounPhrase(k, kind)}\u306e\u3044\u307f\u3092\u304b\u3093\u305c\u3093\u306b\u308a\u304b\u3044\u3057\u3066\u3044\u308b\u308f\u3051\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      en: (_m, _kind, w) => `At this point, I don't fully understand the meaning of "${w}" yet.`,
    },
    {
      jp: (w, kind) => `\u7d50\u5c40\u3001${toNounPhrase(w, kind)}\u304c\u4e00\u756a\u5206\u304b\u308a\u3084\u3059\u3044\u8868\u73fe\u3060\u3068\u601d\u3044\u307e\u3059\u3002`,
      kana: (k, kind) => `\u3051\u3063\u304d\u3087\u304f\u3001${toNounPhrase(k, kind)}\u304c\u3044\u3061\u3070\u3093\u308f\u304b\u308a\u3084\u3059\u3044\u3072\u3087\u3046\u3052\u3093\u3060\u3068\u304a\u3082\u3044\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `In the end, I think "${w}" is the easiest expression to understand.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306f\u9593\u9055\u3048\u3084\u3059\u3044\u306e\u3067\u3001\u4f7f\u3044\u65b9\u3092\u78ba\u8a8d\u3057\u3066\u304a\u304d\u305f\u3044\u3067\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306f\u307e\u3061\u304c\u3048\u3084\u3059\u3044\u306e\u3067\u3001\u3064\u304b\u3044\u304b\u305f\u3092\u304b\u304f\u306b\u3093\u3057\u3066\u304a\u304d\u305f\u3044\u3067\u3059\u3002`,
      en: (_m, _kind, w) => `"${w}" is easy to misuse, so I want to confirm its usage.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306e\u7406\u89e3\u5ea6\u306b\u3088\u3063\u3066\u3001\u6587\u306e\u8aad\u307f\u3084\u3059\u3055\u304c\u5927\u304d\u304f\u5de6\u53f3\u3055\u308c\u307e\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306e\u308a\u304b\u3044\u3069\u306b\u3088\u3063\u3066\u3001\u3076\u3093\u306e\u3088\u307f\u3084\u3059\u3055\u304c\u304a\u304a\u304d\u304f\u3055\u3086\u3046\u3055\u308c\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `How well you understand "${w}" greatly affects readability.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3092\u63a1\u7528\u3059\u308b\u304b\u3069\u3046\u304b\u306f\u3001\u7b46\u8005\u306e\u610f\u56f3\u306b\u3088\u3063\u3066\u7570\u306a\u308a\u307e\u3059\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3092\u3055\u3044\u3088\u3046\u3059\u308b\u304b\u3069\u3046\u304b\u306f\u3001\u3072\u3063\u3057\u3083\u306e\u3044\u3068\u306b\u3088\u3063\u3066\u3053\u3068\u306a\u308a\u307e\u3059\u3002`,
      en: (_m, _kind, w) => `Whether to adopt "${w}" depends on the author's intent.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3068\u3044\u3046\u8868\u73fe\u3092\u7d50\u8ad6\u3060\u3051\u3067\u5224\u65ad\u3059\u308b\u306e\u306f\u9069\u5207\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3068\u3044\u3046\u3072\u3087\u3046\u3052\u3093\u3092\u3051\u3063\u308d\u3093\u3060\u3051\u3067\u306f\u3093\u3060\u3093\u3059\u308b\u306e\u306f\u3066\u304d\u305b\u3064\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002`,
      en: (_m, _kind, w) => `It's not appropriate to judge based only on the conclusion when "${w}" appears.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3092\u8e0f\u307e\u3048\u3066\u3001\u6b21\u306e\u8a08\u753b\u3092\u7acb\u3066\u307e\u3057\u305f\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3092\u3075\u307e\u3048\u3066\u3001\u3064\u304e\u306e\u3051\u3044\u304b\u304f\u3092\u305f\u3066\u307e\u3057\u305f\u3002`,
      en: (_m, _kind, w) => `Based on "${w}", I made the next plan.`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u3092\u3081\u3050\u3063\u3066\u3001\u610f\u898b\u304c\u5206\u304b\u308c\u307e\u3057\u305f\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u3092\u3081\u3050\u3063\u3066\u3001\u3044\u3051\u3093\u304c\u308f\u304b\u308c\u307e\u3057\u305f\u3002`,
      en: (_m, _kind, w) => `Opinions were divided over "${w}".`,
    },
    {
      jp: (w, kind) => `${toNounPhrase(w, kind)}\u306b\u95a2\u3057\u3066\u306f\u3001\u7c21\u5358\u306b\u7d50\u8ad6\u3092\u51fa\u305b\u307e\u305b\u3093\u3002`,
      kana: (k, kind) => `${toNounPhrase(k, kind)}\u306b\u304b\u3093\u3057\u3066\u306f\u3001\u304b\u3093\u305f\u3093\u306b\u3051\u3063\u308d\u3093\u3092\u3060\u305b\u307e\u305b\u3093\u3002`,
      en: (_m, _kind, w) => `I can't draw an easy conclusion about "${w}".`,
    },
  ];

  const n5Sent = writeLevel("N5", n5, Math.max(200, n5.length * 2), n5Templates);
  const n4Sent = writeLevel("N4", n4, Math.max(200, n4.length * 2), n4Templates);
  const n3Sent = writeLevel("N3", n3, Math.max(200, n3.length * 2), n3Templates);

  if (!args.noGenerated) {
    // Generated output is written to *_generated.js so it never overwrites
    // the curated/manual sentence pools.
    fs.writeFileSync(path.join(dataDir, "n5sentence_generated.js"), renderJs("N5", n5Sent), "utf8");
    fs.writeFileSync(path.join(dataDir, "n4sentence_generated.js"), renderJs("N4", n4Sent), "utf8");
    fs.writeFileSync(path.join(dataDir, "n3sentence_generated.js"), renderJs("N3", n3Sent), "utf8");

    console.log("Wrote:");
    console.log("-", path.join(dataDir, "n5sentence_generated.js"), "(" + n5Sent.length + ")");
    console.log("-", path.join(dataDir, "n4sentence_generated.js"), "(" + n4Sent.length + ")");
    console.log("-", path.join(dataDir, "n3sentence_generated.js"), "(" + n3Sent.length + ")");
  } else {
    console.log("Skipped writing *_generated.js (flag: --no-generated)");
  }

  if (args.overwriteCanonical && args.n3Extra > 0) {
    const existingCurated = loadExistingSentences("n3sentence.js", "N3");
    const combinedVocab = n3.concat(n2).concat(n1);

    const built = [];
    for (const entry of combinedVocab) {
      built.push(...buildSentencesForEntry(entry, n3Templates));
    }
    const generatedUniq = uniqByKanji(built);
    const extra = generatedUniq.slice(0, args.n3Extra);
    const finalList = uniqByKanji(existingCurated.concat(extra));

    const canonicalPath = path.join(dataDir, "n3sentence.js");
    fs.writeFileSync(canonicalPath, renderJs("N3", finalList), "utf8");
    console.log("\nOverwrote:");
    console.log("-", canonicalPath, "(" + finalList.length + "; +" + extra.length + " requested)");
  }

  if (!n2.length && !n1.length) {
    console.log("\nNote: N1/N2 vocab lists are currently empty, so the combined pool is built from N3 vocab.");
  }
}

main();
