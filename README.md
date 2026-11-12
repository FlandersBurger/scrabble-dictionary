# scrabble-dictionary

Scrabble word lists, tile distributions and common-word frequency lists for multiple languages, shipped as plain data files (no runtime code) so you can use them from any language or tool.

## Structure

```
reference.json        index of every language/dictionary, with a description and a version
<lang>/                two-letter language code (en, fr, de, ...)
  <dictionary>.txt     one word per line, e.g. en/sowpods.txt, en/twl.txt; lowercase,
                       NFC, sorted by UTF-8 byte order (see "Word list format" below)
  tiles.json           letter -> { amount, points } tile distribution (omitted where no
                       reliable official distribution could be sourced — see "Tile
                       distributions" below)
  frequency.txt        the language's most common words, one per line, most frequent
                       first (up to 25,000; only words found in one of its dictionaries).
                       For picking everyday words, e.g. for bots or random secrets.
                       Not a dictionary: it is not listed under "dictionaries".
```

`reference.json` looks like:

```json
{
  "en": {
    "version": "1.0.0",
    "hasTiles": true,
    "hasFrequency": true,
    "dictionaries": {
      "sowpods": "Collins Scrabble Words (CSW, formerly SOWPODS) — ...",
      "twl": "NASPA Word List (NWL, formerly TWL/OTCWL/OWL) — ..."
    }
  }
}
```

Each dictionary key matches a `<lang>/<dictionary>.txt` file 1:1. `version` is bumped automatically per language whenever that language's files change in a merged PR (see "Versioning" below) — it is not the same as the npm package version in `package.json`.

## Languages

| Code | Dictionaries | Tiles? | Frequency? |
|---|---|---|---|
| en | sowpods, twl | yes | yes |
| fr | ods8 | yes | yes |
| de | wordlist | yes | yes |
| es | file2017, fise2 | yes | yes |
| nl | letterlicious | yes | yes |
| pl | sjp | yes | yes |
| pt | wordlist | yes | yes |
| ro | loc5, loc6 | yes | yes |
| it | zinga | yes | yes |
| fa | moein | no | yes |
| tr | kelimelik, tla | no | yes |
| id | kbbi | no | yes |

## Sources

### Word lists

| Lang | Dictionary | Source |
|---|---|---|
| en | sowpods | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/english/sowpods.txt), originally [wordgamedictionary.com](https://www.wordgamedictionary.com/sowpods/download/sowpods.txt) |
| en | twl | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/english/twl06.txt), originally [wordgamedictionary.com](https://www.wordgamedictionary.com/twl06/download/twl06.txt) |
| fr | ods8 | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/french/ods8.txt), originally [Thecoolsim/French-Scrabble-ODS8](https://github.com/Thecoolsim/French-Scrabble-ODS8) |
| de | wordlist | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/german/german.txt), originally [hippler/german-wordlist](https://github.com/hippler/german-wordlist) (used by [Tanglet](https://gottcode.org/tanglet)) |
| es | file2017 | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/spanish/file-2017.txt) — official [FILE](https://www.filexico.com/) lexicon |
| es | fise2 | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/spanish/fise-2.txt) — official [FISE](http://fisescrabble.org) lexicon |
| nl | letterlicious | [letterlicious.com/data/Words_NL.txt](https://www.letterlicious.com/data/Words_NL.txt), merged with 5+ letter words from [OpenTaal/opentaal-wordlist](https://github.com/OpenTaal/opentaal-wordlist) to fill gaps such as present participles ("deelwoorden", e.g. *spelend*, *etend*, *wonend*) that the Letterlicious list lacks. 2/3/4-letter words were separately reconciled against [scrabblewoord.nl's 2-letter list](https://www.scrabblewoord.nl/2-letterwoorden/) and the ISC Dutch SWL [3-letter](https://www.isc.ro/lists/dutch3.html)/[4-letter](https://www.isc.ro/lists/dutch4.html) lists: missing valid short words (e.g. *me*, *je*, *ik*, *we*) were added, and 2-letter entries absent from both authoritative lists (*cd*, *pc*, *pk*, *tv*, *wc* — abbreviations, not real words) were removed. No 3/4-letter words were removed in this pass since the existing list has many entries the ISC lists don't cover and there's no reliable signal those are invalid. |
| pl | sjp | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/polish/sjp.txt), originally [sjp.pl/sl/growy](https://sjp.pl/sl/growy/) |
| pt | wordlist | [pythonprobr/palavras](https://github.com/pythonprobr/palavras) (derived from the [LibreOffice pt_BR](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR) spell-check dictionary). **Not** the originally-suggested [Kasama gist](https://gist.github.com/Kasama/b75f8d57432b7e9e18e49843485d69e9) — that list strips all accents (e.g. "nao" instead of "não"), which is incorrect Portuguese spelling, so a properly-accented source was used instead. |
| ro | loc5, loc6 | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/tree/master/romanian), originally [dexonline.ro/scrabble](https://dexonline.ro/scrabble) |
| it | zinga | [scrabblewords/scrabblewords](https://github.com/scrabblewords/scrabblewords/blob/main/words/Italian/ZINGA.txt) — Zingarelli-dictionary-based Italian Scrabble word list |
| fa | moein | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/persian/persian.txt), originally [MansourM/persian-to-persian-dictionary](https://github.com/MansourM/persian-to-persian-dictionary) (Moein dictionary). Multi-word phrase entries were filtered out to keep single playable words. |
| tr | kelimelik | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/turkish/kelimelik.txt) — modeled on the [Kelimelik](https://scrabblecozucu.com/) database |
| tr | tla | [kamilmielnik/scrabble-dictionaries](https://github.com/kamilmielnik/scrabble-dictionaries/blob/master/turkish/tla.txt) — Turkish Language Association (TDK) based, via [kkrypt0nn/wordlists](https://github.com/kkrypt0nn/wordlists) |
| id | kbbi | [aryakdaniswara/kbbi-v6-wordlist](https://github.com/aryakdaniswara/kbbi-v6-wordlist) (KBBI v6.1.0). The raw list mixes in multi-word phrases, abbreviations and numerals; it was filtered down to single alphabetic words. |

### Frequency lists

`<lang>/frequency.txt` comes from [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (`content/2018/<lang>/<lang>_50k.txt`, word counts from OpenSubtitles 2018), filtered to letters-only words that appear in at least one of the language's dictionaries, keeping the order and the top 25,000. Some languages end up with fewer (Portuguese, Turkish, Indonesian and Persian, where many subtitle words aren't in the word list). Regenerate with `npm run build-frequency -- [lang ...]`.

### Tile distributions

Sourced and cross-checked against [Wikipedia: Scrabble letter distributions](https://en.wikipedia.org/wiki/Scrabble_letter_distributions) (official Mattel/Hasbro/Spear's-licensed editions), with every table re-summed to confirm it adds up to the documented total tile count before being committed.

`tiles.json` is intentionally **omitted** for Persian, Turkish, and Indonesian: no sufficiently credible, independently-corroborated official/standard tile distribution could be found for these languages (only fan-made or single-source data with material gaps or inconsistencies). If you have an authoritative source for one of these, contributions are welcome.

## Licensing

The code in this repository (scripts, workflows) is MIT licensed. The bundled word lists come from third-party sources with their own terms, some of which are not explicitly stated by the original maintainers:

- **pt/wordlist.txt** is MPL-2.0 (via [pythonprobr/palavras](https://github.com/pythonprobr/palavras), itself derived from LibreOffice's MPL-2.0-licensed pt_BR dictionary).
- **nl/letterlicious.txt** includes words merged in from [OpenTaal/opentaal-wordlist](https://github.com/OpenTaal/opentaal-wordlist), licensed under Revised BSD License (3-clause) and/or CC BY 3.0, © OpenTaal (https://opentaal.org).
- **`*/frequency.txt`** is derived from [FrequencyWords](https://github.com/hermitdave/FrequencyWords), whose content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), © Hermit Dave. The derived lists are shared under the same license.
- All other word lists: no explicit license is stated by their upstream source (see the table above). They are widely redistributed/archived as-is (e.g. by `kamilmielnik/scrabble-dictionaries`), but if you plan to redistribute or use this data commercially, verify the terms of the original source yourself first.

## Word list format

`npm run validate` (which runs in CI) guarantees that every `<dictionary>.txt` is:

- one word per line, every line ending in `\n` (the last one too), no `\r`, no blank lines
- lowercase and Unicode NFC
- sorted in strictly increasing UTF-8 byte order, so there are no duplicates

Byte order is not alphabetical order for accented letters (`ą` sorts after `z`), but it makes the raw file binary-searchable: words and prefixes can be looked up in the file's bytes without turning every line into a string first (see "Usage"). A few lists contain entries that aren't letters only, such as apostrophes or hyphens (Turkish `tla`, Persian, a handful of Dutch words). Skip those if you only want letter words.

`frequency.txt` is not sorted this way: it is in rank order, most frequent first.

## Versioning

Each language has its own `version` field in `reference.json`, independent of the npm package version. When a pull request changes any file inside a language folder (e.g. `en/`), a GitHub Action bumps that language's patch version automatically and pushes the bump onto the PR branch before merge — so the per-language version always reflects a real content change, not a manual/sometimes-forgotten step.

This only works automatically for PRs from branches within this repository (GitHub's `GITHUB_TOKEN` can't push to fork branches). For PRs from forks, bump `version` for any language you touched by hand before merging.

## Repository setup (do once on GitHub)

This repo is meant to disallow direct pushes/merges to `main` — all changes go through PRs. After pushing this repo to GitHub:

1. Settings → Branches → Add branch protection rule for `main`.
2. Require a pull request before merging (disable direct pushes).
3. Require status checks to pass before merging → select the `Validate` check.
4. Do not allow bypassing the above settings (including for admins, if you want it strict).

## Usage

No JS API is published — read the files directly:

```js
const fs = require('fs');
const dir = 'node_modules/scrabble-dictionary';
const reference = JSON.parse(fs.readFileSync(`${dir}/reference.json`));
const tiles = JSON.parse(fs.readFileSync(`${dir}/en/tiles.json`));
const common = fs.readFileSync(`${dir}/en/frequency.txt`, 'utf8').split('\n').filter(Boolean); // most frequent first
```

For the smaller lists, a `Set` is fine:

```js
const words = new Set(fs.readFileSync(`${dir}/en/sowpods.txt`, 'utf8').split('\n').filter(Boolean));
```

Watch the memory with the big ones. `pl/sjp.txt` is 42 MB and 3.2 million words: as JS strings in a `Set` that is several hundred MB of heap. Because every list is byte-sorted (see "Word list format"), you can keep the raw bytes instead (about the file's size plus 4 bytes per word) and binary-search them:

```js
const bytes = fs.readFileSync(`${dir}/pl/sjp.txt`); // a Buffer, not a string
let count = 0;
for (const b of bytes) if (b === 0x0a) count++;
// offsets[i] is where word i starts; offsets[count] is the end of the file.
const offsets = new Uint32Array(count + 1);
for (let i = 0, w = 1; i < bytes.length; i++) if (bytes[i] === 0x0a) offsets[w++] = i + 1;
const wordAt = (i) => bytes.subarray(offsets[i], offsets[i + 1] - 1);

/** Index of the first word >= target (a Buffer). Prefix checks use the same search. */
function lowerBound(target) {
  let lo = 0;
  let hi = count;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (Buffer.compare(wordAt(mid), target) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function isWord(word) {
  const target = Buffer.from(word);
  const i = lowerBound(target);
  return i < count && wordAt(i).equals(target);
}
```

## Contributing

Run `npm run sort-lists` after adding or editing a word list, then `npm run validate` before opening a PR. The validator checks that every word list is in the canonical format above, and that `reference.json` stays consistent with the files on disk (every declared dictionary has a matching `.txt` file, every other `.txt` file is declared, `hasTiles` matches whether `tiles.json` exists, `hasFrequency` matches whether `frequency.txt` exists, and `tiles.json` values are well-formed).
