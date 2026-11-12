// Builds <lang>/frequency.txt: the most common words of each language, most
// frequent first, kept only when at least one of that language's dictionaries
// has them. Source: Hermit Dave's FrequencyWords (OpenSubtitles 2018 word
// counts, CC-BY-SA 4.0), https://github.com/hermitdave/FrequencyWords.
//
// Usage: node scripts/build-frequency.js [lang ...]   (default: every language)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const referencePath = path.join(root, 'reference.json');
const SOURCE = (lang) => `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${lang}/${lang}_50k.txt`;
const KEEP = 25000;
const ONLY_LETTERS = /^\p{L}+$/u;

const normalize = (word) => word.trim().toLowerCase().normalize('NFC');

function dictionaryWords(lang, dictionaries) {
  const words = new Set();
  for (const dict of Object.keys(dictionaries)) {
    for (const line of fs.readFileSync(path.join(root, lang, `${dict}.txt`), 'utf8').split('\n')) {
      const word = normalize(line);
      if (word) words.add(word);
    }
  }
  return words;
}

async function build(lang, meta) {
  const res = await fetch(SOURCE(lang));
  if (!res.ok) throw new Error(`${lang}: ${SOURCE(lang)} answered ${res.status}`);
  const known = dictionaryWords(lang, meta.dictionaries);
  const seen = new Set();
  const out = [];
  for (const line of (await res.text()).split('\n')) {
    const word = normalize(line.split(' ')[0] ?? '');
    if (!ONLY_LETTERS.test(word) || seen.has(word) || !known.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= KEEP) break;
  }
  fs.writeFileSync(path.join(root, lang, 'frequency.txt'), out.join('\n') + '\n');
  meta.hasFrequency = true;
  console.log(`${lang}: ${out.length} words`);
}

async function main() {
  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  const langs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : Object.keys(reference);
  for (const lang of langs) {
    if (!reference[lang]) throw new Error(`unknown language "${lang}"`);
    await build(lang, reference[lang]);
    // Keep the flag next to hasTiles, ahead of the long dictionary descriptions.
    const { version, hasTiles, hasFrequency, ...rest } = reference[lang];
    reference[lang] = { version, hasTiles, hasFrequency, ...rest };
  }
  fs.writeFileSync(referencePath, JSON.stringify(reference, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
