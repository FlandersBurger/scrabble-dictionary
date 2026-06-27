const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const reference = JSON.parse(fs.readFileSync(path.join(root, 'reference.json'), 'utf8'));

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
    }
  }

  const declaredDicts = new Set(Object.keys(meta.dictionaries || {}));
  for (const file of fs.readdirSync(path.join(root, lang))) {
    if (file.endsWith('.txt') && !declaredDicts.has(file.replace(/\.txt$/, ''))) {
      fail(`language "${lang}" has ${lang}/${file} not described in reference.json`);
    }
  }
}

if (!ok) {
  process.exit(1);
}
console.log('reference.json is consistent with the language folders.');
