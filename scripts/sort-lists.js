// Rewrites every declared word list in the canonical form validate.js enforces:
// one word per line, sorted by UTF-8 byte order, no duplicates, no blank lines,
// a single trailing newline. Byte order lets consumers binary-search a list's raw
// bytes without turning millions of words into strings first.
//
// Usage: node scripts/sort-lists.js [lang ...]   (default: every language)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'reference.json'), 'utf8'));
const languages = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(reference);

for (const lang of languages) {
  for (const dict of Object.keys(reference[lang]?.dictionaries || {})) {
    const file = path.join(root, lang, `${dict}.txt`);
    const before = fs.readFileSync(file, 'utf8');
    const words = [...new Set(before.split('\n').map((w) => w.trim()).filter(Boolean))];
    // UTF-16 code-unit order equals UTF-8 byte order for every character outside
    // the astral planes, which no list uses (validate.js checks the bytes anyway).
    words.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const after = words.join('\n') + '\n';
    if (after === before) {
      console.log(`${lang}/${dict}.txt already sorted`);
      continue;
    }
    fs.writeFileSync(file, after);
    console.log(`${lang}/${dict}.txt sorted (${words.length} words)`);
  }
}
