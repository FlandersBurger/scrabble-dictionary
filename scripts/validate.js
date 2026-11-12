const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'reference.json'), 'utf8'));

/**
 * Why a word list isn't in canonical form, or null when it is: lowercase NFC words,
 * one per line, strictly increasing in UTF-8 byte order (so no duplicates), no
 * blank lines or carriage returns, ending with a single newline. Works on the raw
 * bytes so even Polish's 42 MB list never becomes millions of strings.
 */
function listProblem(bytes) {
  if (bytes.length === 0 || bytes[bytes.length - 1] !== 0x0a) return 'does not end with a newline';
  if (bytes.includes(0x0d)) return 'has carriage returns';
  let start = 0;
  let previous = null;
  let line = 1;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== 0x0a) continue;
    const word = bytes.subarray(start, i);
    if (word.length === 0) return `has a blank line at line ${line}`;
    if (previous && Buffer.compare(previous, word) >= 0) {
      return `is not in strictly increasing byte order at line ${line} ("${previous}" then "${word}")`;
    }
    // Only words with non-ASCII or uppercase letters need the string checks.
    if (word.some((b) => b >= 0x80 || (b >= 0x41 && b <= 0x5a))) {
      const text = word.toString('utf8');
      if (text !== text.toLowerCase()) return `has an uppercase word at line ${line} ("${text}")`;
      if (text !== text.normalize('NFC')) return `has a word not in NFC at line ${line} ("${text}")`;
    }
    previous = word;
    start = i + 1;
    line++;
  }
  return null;
}

let ok = true;
const fail = (message) => {
  ok = false;
  console.error('FAIL:', message);
};

for (const [lang, meta] of Object.entries(reference)) {
  if (!/^[a-z]{2}$/.test(lang)) {
    fail(`language key "${lang}" is not a 2-letter lowercase code`);
  }
  if (!fs.existsSync(path.join(root, lang))) {
    fail(`language folder "${lang}" does not exist`);
    continue;
  }
  if (typeof meta.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(meta.version)) {
    fail(`language "${lang}" has missing/invalid version "${meta.version}"`);
  }

  const tilesPath = path.join(root, lang, 'tiles.json');
  const tilesExists = fs.existsSync(tilesPath);
  if (tilesExists !== Boolean(meta.hasTiles)) {
    fail(`language "${lang}" hasTiles=${meta.hasTiles} but tiles.json exists=${tilesExists}`);
  }
  if (tilesExists) {
    const tiles = JSON.parse(fs.readFileSync(tilesPath, 'utf8'));
    for (const [tile, info] of Object.entries(tiles)) {
      if (typeof info.amount !== 'number' || typeof info.points !== 'number') {
        fail(`language "${lang}" tile "${tile}" must have numeric amount and points`);
      }
    }
  }

  for (const dict of Object.keys(meta.dictionaries || {})) {
    const txtPath = path.join(root, lang, `${dict}.txt`);
    if (!fs.existsSync(txtPath)) {
      fail(`language "${lang}" dictionary "${dict}" is missing ${lang}/${dict}.txt`);
      continue;
    }
    const problem = listProblem(fs.readFileSync(txtPath));
    if (problem) fail(`${lang}/${dict}.txt ${problem} (run npm run sort-lists)`);
  }

  const frequencyPath = path.join(root, lang, 'frequency.txt');
  const frequencyExists = fs.existsSync(frequencyPath);
  if (frequencyExists !== Boolean(meta.hasFrequency)) {
    fail(`language "${lang}" hasFrequency=${meta.hasFrequency} but frequency.txt exists=${frequencyExists}`);
  }
  if ('frequency' in (meta.dictionaries || {})) {
    fail(`language "${lang}" declares "frequency" as a dictionary; frequency.txt is a ranked list, not a word list`);
  }

  const declaredDicts = new Set(Object.keys(meta.dictionaries || {}));
  for (const file of fs.readdirSync(path.join(root, lang))) {
    if (file === 'frequency.txt') continue;
    if (file.endsWith('.txt') && !declaredDicts.has(file.replace(/\.txt$/, ''))) {
      fail(`language "${lang}" has ${lang}/${file} not described in reference.json`);
    }
  }
}

if (!ok) {
  process.exit(1);
}
console.log('reference.json is consistent with the language folders.');
