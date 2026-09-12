/**
 * Estrae le addizionali comunali di tutti i comuni dal portale del federalismo
 * fiscale del MEF.
 *
 * Il portale non pubblica un file scaricabile: le aliquote stanno solo nella
 * pagina del singolo ente. Si passa da regione a provincia a elenco comuni, e
 * poi una pagina per comune. La pagina con anno=9999 porta tutta la storia, per
 * cui basta una richiesta per comune per avere ogni anno.
 *
 * Scrive su disco a ogni provincia e riparte da dove si era fermato: la
 * scaricata intera sono quasi ottomila richieste e una decina di minuti.
 *
 * Passo 1 di 2. Qui esce tools/dati/comuni-raw.json, la storia completa di ogni
 * comune cosi come il portale la pubblica. Il passo 2 e tools/genera-locale.js,
 * che la trasforma in src/local-YYYY.js.
 */
var fs = require('fs');
var path = require('path');

var HOST = 'https://www1.finanze.gov.it';
var BASE = HOST + '/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/';
var OUT = path.join(__dirname, 'dati');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

var INDEX_FILE = path.join(OUT, 'comuni-index.json');
var RAW_FILE = path.join(OUT, 'comuni-raw.json');

var REGION_PAGES = {
  'abruzzo.htm': 'abruzzo',
  'basilicata.htm': 'basilicata',
  'calabria.htm': 'calabria',
  'campania.htm': 'campania',
  'emiliaromagna.htm': 'emilia-romagna',
  'friuli.htm': 'friuli-venezia-giulia',
  'lazio.htm': 'lazio',
  'liguria.htm': 'liguria',
  'lombardia.htm': 'lombardia',
  'marche.htm': 'marche',
  'molise.htm': 'molise',
  'piemonte.htm': 'piemonte',
  'puglia.htm': 'puglia',
  'sardegna.htm': 'sardegna',
  'sicilia.htm': 'sicilia',
  'toscana.htm': 'toscana',
  'trentino.htm': null,
  'umbria.htm': 'umbria',
  'valledaosta.htm': 'valle-aosta',
  'veneto.htm': 'veneto'
};

// Il Trentino e una pagina sola per due province autonome, che pero sono due
// enti distinti con due addizionali regionali diverse.
var TRENTINO = { BZ: 'bolzano', TN: 'trento' };

var CONCURRENCY = 6;

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function get(url, attempt) {
  attempt = attempt || 1;
  try {
    var res = await fetch(url, {
      headers: { 'User-Agent': 'ral-netto dataset addizionali comunali' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(400 * attempt * attempt);
    return get(url, attempt + 1);
  }
}

function tidy(value) {
  return value.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------------- indice

async function buildIndex() {
  if (fs.existsSync(INDEX_FILE)) {
    console.log('indice gia presente');
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  }

  var comuni = [];

  for (var page of Object.keys(REGION_PAGES)) {
    var html = await get(BASE + page);
    var provinces = {};
    var re = /lista\.htm\?r=(\d+)&amp;pagina=([a-z]+\.htm)&amp;pr=([A-Z]{2})/g;
    var m;
    while ((m = re.exec(html)) !== null) provinces[m[3]] = { r: m[1], pagina: m[2] };

    for (var pr of Object.keys(provinces)) {
      var region = REGION_PAGES[page] || TRENTINO[pr];
      if (!region) {
        console.log('  provincia senza regione: ' + page + ' ' + pr);
        continue;
      }

      var list = await get(BASE + 'lista.htm?r=' + provinces[pr].r +
        '&pagina=' + provinces[pr].pagina + '&pr=' + pr);

      var linkRe = /<a\s[^>]*href="risultato\.htm\?([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      var link;
      var found = 0;

      while ((link = linkRe.exec(list)) !== null) {
        var query = link[1].replace(/&amp;/g, '&').replace(/\s+/g, '');
        var label = tidy(link[2]);
        if (/comune soppresso/i.test(label)) continue;

        var cc = (query.match(/cc=([A-Z0-9]+)/) || [])[1];
        if (!cc) continue;

        comuni.push({
          cc: cc,
          nome: label,
          pr: pr,
          region: region,
          r: provinces[pr].r,
          pagina: provinces[pr].pagina
        });
        found++;
      }

      console.log('  ' + page + ' ' + pr + ': ' + found + ' comuni');
    }
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(comuni));
  console.log('indice: ' + comuni.length + ' comuni');
  return comuni;
}

// ------------------------------------------------------------------- parser

/** Le celle di ogni riga, ignorando i </tr> che il portale non chiude sempre. */
function tableRows(table) {
  return table.split(/<tr[^>]*>/).map(function (chunk) {
    return (chunk.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(tidy);
  }).filter(function (cells) { return cells.length > 0; });
}

/** Le sezioni per anno della pagina anno=9999, dalla piu recente. */
function parseYears(html) {
  var years = {};
  var parts = html.split(/<p class="irpefanni">\s*Anno\s*(\d{4})\s*<\/p>/);

  for (var i = 1; i < parts.length; i += 2) {
    var year = Number(parts[i]);
    var body = parts[i + 1] || '';

    if (/Non ci sono dati per il comune/i.test(body)) continue;

    var rates = null;
    var head = null;

    (body.match(/<table[\s\S]*?<\/table>/g) || []).forEach(function (table) {
      var rows = tableRows(table);
      if (/Fascia di applicazione/i.test(table)) {
        rates = rows.filter(function (cells) { return cells.length === 2; });
      } else if (/Num\. delibera/i.test(table)) {
        head = rows.filter(function (cells) { return cells.length === 4; })[0];
      }
    });

    if (!rates || !rates.length) continue;

    years[year] = {
      rows: rates,
      delibera: head ? head[0] : null,
      dataDelibera: head ? head[1] : null,
      pubblicazione: head ? head[2] : null,
      note: head ? head[3] : null
    };
  }

  return years;
}

// ---------------------------------------------------------------- estrazione

async function run() {
  var comuni = await buildIndex();
  var done = fs.existsSync(RAW_FILE) ? JSON.parse(fs.readFileSync(RAW_FILE, 'utf8')) : {};
  var todo = comuni.filter(function (c) { return !done[c.cc]; });

  console.log('da scaricare: ' + todo.length + ' su ' + comuni.length);

  var index = 0;
  var errors = 0;
  var started = Date.now();

  async function worker() {
    while (index < todo.length) {
      var mine = todo[index++];
      try {
        var html = await get(BASE + 'risultato.htm?anno=9999&lista=1&r=' + mine.r +
          '&pagina=' + mine.pagina + '&pr=' + mine.pr + '&cc=' + mine.cc);
        done[mine.cc] = {
          nome: mine.nome, pr: mine.pr, region: mine.region,
          pagina: mine.pagina, r: mine.r, anni: parseYears(html)
        };
      } catch (error) {
        errors++;
        done[mine.cc] = { nome: mine.nome, pr: mine.pr, region: mine.region,
          pagina: mine.pagina, r: mine.r, errore: String(error.message || error) };
      }

      if (index % 250 === 0) {
        fs.writeFileSync(RAW_FILE, JSON.stringify(done));
        var rate = index / ((Date.now() - started) / 1000);
        console.log(index + '/' + todo.length + '  ' + rate.toFixed(1) + '/s  errori ' + errors);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(RAW_FILE, JSON.stringify(done));
  console.log('finito: ' + Object.keys(done).length + ' comuni, ' + errors + ' errori');
}

run().catch(function (error) {
  console.error('interrotto: ' + (error && error.stack || error));
  process.exit(1);
});
