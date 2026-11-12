// Downloads the word lists that are built from an upstream source (instead of
// copied as-is) and writes them as <lang>/<dictionary>.txt in canonical form
// (lowercase NFC, UTF-8 byte order, one word per line). See "Sources" in the
// README for what each filter keeps and why.
//
// Usage: node scripts/import-lists.js [lang ...]   (default: every language below)
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Readable } = require('stream');

const root = path.join(__dirname, '..');

const LOWERCASE_WORD = /^\p{Ll}+$/u;

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}

async function* lines(url) {
  const res = await download(url);
  yield* readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity });
}

function write(lang, dict, words) {
  const sorted = [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  fs.mkdirSync(path.join(root, lang), { recursive: true });
  fs.writeFileSync(path.join(root, lang, `${dict}.txt`), sorted.join('\n') + '\n');
  console.log(`${lang}/${dict}.txt: ${sorted.length} words`);
}

// Catalan: DISC, as normalized by kamilmielnik/scrabble-dictionaries. Words keep
// their accents and the "l·l" of the ela geminada, which is a single tile.
async function catalan() {
  const words = new Set();
  for await (const line of lines('https://raw.githubusercontent.com/kamilmielnik/scrabble-dictionaries/master/catalan/disc.txt')) {
    const word = line.trim().normalize('NFC').toLowerCase();
    if (word) words.add(word);
  }
  write('ca', 'disc', words);
}

// Danish: COR (Det Centrale Ordregister), a TSV of every inflected form of the
// words in Retskrivningsordbogen: id, lemma, gloss, grammatical label, form,
// normering. Filtered by Dansk Scrabbleforening's "Læsevejledning til
// Retskrivningsordbogen" (2 March 2026), which says which of those forms count:
// - no proper nouns, abbreviations, or forms with non-letters (apostrophes,
//   hyphens, so also compound-only forms like "hus-")
// - nouns take genitive -s (COR's "K" forms); pronouns only a fixed list
// - past participles can't take definite or plural forms (no "forbudte")
// - passive past tense ("spistes") only where the dictionary lists it, which COR
//   doesn't say, so it's left out
// - modal verbs have no imperative, passive or present participle
// - adjectives can be compared (COR's "U" forms, e.g. "dødere", "dødeste"). COR
//   generates these for every adjective, so a few odd ones like "førsteste" slip in.
const COR_VERSION = '1.5.1.0';
const COR_SKIPPED_LABELS = /^(prop|fork|romertal|præfiks|suffiks)\b|^vb\.perf\.part\.(pl|sg\.best)$|^vb\.præt\.pass$/;
const DANISH_MODALS = new Set(['burde', 'kunne', 'måtte', 'skulle', 'ville', 'turde', 'gide', 'monne']);
const DANISH_MODAL_SKIPPED_LABELS = new Set(['vb.imp', 'vb.inf.pass', 'vb.præs.pass', 'vb.præs.part']);
const DANISH_PRONOUN_GENITIVES = new Set([
  'ens', 'dens', 'dets', 'hans', 'deres', 'eders', 'jeres', 'vores', 'begges', 'dennes', 'dettes', 'disses',
  'hendes', 'ingens', 'intets', 'nogens', 'nogets', 'nogles', 'altings', 'enhvers', 'ethverts', 'hinandens',
  'hverandres', 'ingentings', 'allesammens',
]);

async function danish() {
  const words = new Set(DANISH_PRONOUN_GENITIVES);
  for await (const line of lines(`https://ordregister.dk/files/cor${COR_VERSION}.tsv`)) {
    const [, lemma, , label, form] = line.split('\t');
    if (!form || COR_SKIPPED_LABELS.test(label) || label === 'pron.gen') continue;
    if (DANISH_MODALS.has(lemma) && DANISH_MODAL_SKIPPED_LABELS.has(label)) continue;
    const word = form.normalize('NFC');
    if (LOWERCASE_WORD.test(word)) words.add(word);
  }
  write('da', 'cor', words);
}

// Swedish: the headwords of SAOL 14 (Svenska Akademiens ordlista). Svenska
// Scrabbleförbundet allows only SAOL's bold headwords, not their inflections
// (https://scrabbleforbundet.se/regler/). A multi-word entry counts only when it's
// a verb, and then only its first word ("arta sig" makes "arta" valid).
// The federation now plays SAOL 15 (2026); Språkbanken's open data is SAOL 14.
async function swedish() {
  const words = new Set();
  for await (const line of lines('https://spraakbanken.gu.se/resurser/data/karp/saol14-faksimil.jsonl')) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const headword = entry.normaliserat_ord.normalize('NFC').trim();
    const word = entry.upos === 'VERB' ? headword.split(/\s+/)[0] : headword;
    if (LOWERCASE_WORD.test(word)) words.add(word);
  }
  write('sv', 'saol', words);
}

const IMPORTERS = { ca: catalan, da: danish, sv: swedish };

async function main() {
  const langs = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(IMPORTERS);
  for (const lang of langs) {
    if (!IMPORTERS[lang]) throw new Error(`no importer for "${lang}" (have: ${Object.keys(IMPORTERS).join(', ')})`);
    await IMPORTERS[lang]();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
