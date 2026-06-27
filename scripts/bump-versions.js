const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const referencePath = path.join(root, 'reference.json');

const baseRef = process.argv[2];
const headRef = process.argv[3] || 'HEAD';

if (!baseRef) {
  console.error('Usage: node scripts/bump-versions.js <base-ref> [head-ref]');
  process.exit(1);
}

const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', `${baseRef}...${headRef}`],
  { cwd: root, encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
const languages = Object.keys(reference);

const changedLanguages = new Set();
for (const file of changedFiles) {
  const lang = file.split('/')[0];
  if (languages.includes(lang) && file !== `${lang}/`) {
    changedLanguages.add(lang);
  }
}

if (changedLanguages.size === 0) {
  console.log('No language data changed, nothing to bump.');
  process.exit(0);
}

const bumpPatch = (version) => {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

for (const lang of changedLanguages) {
  const previous = reference[lang].version;
  reference[lang].version = bumpPatch(previous);
  console.log(`${lang}: ${previous} -> ${reference[lang].version}`);
}

fs.writeFileSync(referencePath, JSON.stringify(reference, null, 2) + '\n');
