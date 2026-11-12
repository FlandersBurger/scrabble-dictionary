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

// Danish: COR (Det Centrale Ordregister), a TSV of every inflected form:
// id, lemma, gloss, grammatical label, form, normering. Only forms with
// normering "N" are kept: those are the ones Retskrivningsordbogen lists. "K"
// forms are generated noun genitives and "U" forms are generated adjective forms
// the dictionary doesn't vouch for (e.g. "førsteste").
const COR_VERSION = '1.5.1.0';
const COR_SKIPPED_LABELS = /^(prop|fork|romertal|præfiks|suffiks)\b/;

async function danish() {
  const words = new Set();
  for await (const line of lines(`https://ordregister.dk/files/cor${COR_VERSION}.tsv`)) {
    const [, , , label, form, norm] = line.split('\t');
    if (norm !== 'N' || COR_SKIPPED_LABELS.test(label)) continue;
    const word = form.normalize('NFC');
    if (LOWERCASE_WORD.test(word)) words.add(word);
  }
  write('da', 'cor', words);
}

// Swedish: the headwords of SAOL 14 (Svenska Akademiens ordlista), expanded with
// their inflections from SALDO's morphology. SAOL itself only abbreviates
// inflections ("+n +r"), so SALDO spells them out. A SALDO entry is used only when
// its lemma is a SAOL headword of a matching part of speech. Compound-only forms
// (msd c/ci/cm/sms, e.g. "upphäv-") and genitives are left out, since neither is a
// word that SAOL lists.
const SAOL_TO_SALDO_POS = { NOUN: ['nn'], VERB: ['vb'], ADJ: ['av'], PRON: ['pn'] };
const SALDO_COMPOUND_MSD = new Set(['c', 'ci', 'cm', 'sms']);
const SALDO_NAME_POS = new Set(['pm', 'pma', 'pmm']);

function posMatches(saolPos, saldoPos) {
  for (const pos of saolPos) {
    const wanted = SAOL_TO_SALDO_POS[pos];
    if (wanted ? wanted.includes(saldoPos) : !SALDO_NAME_POS.has(saldoPos)) return true;
  }
  return false;
}

async function swedish() {
  const headwords = new Map(); // word -> Set of SAOL upos
  for await (const line of lines('https://spraakbanken.gu.se/resurser/data/karp/saol14-faksimil.jsonl')) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const word = entry.normaliserat_ord.normalize('NFC');
    if (!LOWERCASE_WORD.test(word)) continue;
    if (!headwords.has(word)) headwords.set(word, new Set());
    headwords.get(word).add(entry.upos);
  }

  const words = new Set(headwords.keys());
  const FEAT = /<feat att="(\w+)" val="([^"]*)"\/>/;
  let lemma = null;
  let pos = null;
  let form = null;
  let forms = [];
  for await (const line of lines('https://svn.spraakbanken.gu.se/sb-arkiv/pub/lmf/saldom/saldom.xml')) {
    if (line.startsWith('<LexicalEntry>')) {
      lemma = pos = form = null;
      forms = [];
    } else if (line.startsWith('</LexicalEntry>')) {
      if (headwords.has(lemma) && posMatches(headwords.get(lemma), pos)) {
        for (const word of forms) words.add(word);
      }
    } else {
      const feat = FEAT.exec(line);
      if (!feat) continue;
      const [, att, val] = feat;
      if (att === 'writtenForm') {
        if (lemma === null) lemma = val.normalize('NFC');
        else form = val.normalize('NFC');
      } else if (att === 'partOfSpeech') {
        pos = val;
      } else if (att === 'msd' && form !== null) {
        const msd = val.split(' ');
        if (!SALDO_COMPOUND_MSD.has(msd[0]) && !msd.includes('gen') && LOWERCASE_WORD.test(form)) {
          forms.push(form);
        }
        form = null;
      }
    }
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
