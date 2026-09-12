// @ts-check
'use strict';

/**
 * Passo 2 della pipeline: da comuni-raw.json a src/local-YYYY.js.
 *
 *   node tools/estrai-comuni.js            scarica, produce comuni-raw.json
 *   node tools/genera-locale.js            genera i due file dell anno
 *
 * Gli ingressi sono due e hanno natura diversa. `tools/regioni.js` sono
 * ventuno voci lette a mano, una pagina per volta. `comuni-raw.json` e un
 * estratto di massa di quasi ottomila pagine, che nessuno rilegge riga per
 * riga: per questo passa da `tools/fasce.js`, che riconosce le diciture note e
 * marca quelle che non sa leggere invece di indovinarle.
 *
 * Quello che esce e un file generato. Non va modificato a mano: si cambia
 * l ingresso e si rigenera.
 */
var fs = require('fs');
var path = require('path');

var FASCE = require('./fasce.js');
var REGIONI = require('./regioni.js');

var ANNI = [2025, 2026];
var RADICE = path.join(__dirname, '..');
var GREZZO = process.argv[2] || path.join(__dirname, 'dati', 'comuni-raw.json');
var ESTRATTO_IL = '12 settembre 2026';

var MEF = 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/';
var UFFICIO = 1;
var NON_MODELLATA = 2;

// --------------------------------------------------------------------- nomi

var MINUSCOLE = [
  'a', 'al', 'all', 'alla', 'agli', 'ai', 'con', 'd', 'da', 'dal', 'dall',
  'dalla', 'de', 'dei', 'degli', 'del', 'dell', 'della', 'delle', 'dello', 'di',
  'e', 'ed', 'i', 'il', 'in', 'la', 'le', 'lo', 'nel', 'nell', 'nella', 'per',
  'presso', 'su', 'sul', 'sull', 'sulla', 'un', 'una'
];

var ACCENTI = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' };

/**
 * Il portale scrive i nomi in maiuscolo e rende l accento finale con un
 * apostrofo: FORLI' e Forli con la i accentata. Qui tornano leggibili, con le
 * preposizioni minuscole tranne che a inizio nome.
 */
function titolo(nome) {
  var pezzi = String(nome).trim().toLowerCase().split(/([ \-'/])/);
  var fuori = [];
  var primo = true;

  pezzi.forEach(function (pezzo) {
    if (pezzo === ' ' || pezzo === '-' || pezzo === "'" || pezzo === '/') {
      fuori.push(pezzo);
      return;
    }
    if (!pezzo) return;

    fuori.push(!primo && MINUSCOLE.indexOf(pezzo) !== -1
      ? pezzo
      : pezzo.charAt(0).toUpperCase() + pezzo.slice(1));
    primo = false;
  });

  return fuori.join('')
    .replace(/([aeiou])'$/, function (tutto, vocale) { return ACCENTI[vocale]; })
    .replace(/([aeiou])' /g, function (tutto, vocale) { return ACCENTI[vocale] + ' '; });
}

/** Stessa regola del decodificatore dentro src/local-YYYY.js. */
function slug(nome) {
  return nome.toLowerCase()
    .replace(/à/g, 'a').replace(/[èé]/g, 'e')
    .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function js(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

// ------------------------------------------------------------------ comuni

var residuo = {};

/**
 * Le aliquote di un comune per l anno richiesto, prendendo l ultima delibera
 * pubblicata non successiva a quell anno. Se non ce n e nessuna il comune non
 * applica l addizionale, che non e la stessa cosa di un dato mancante.
 */
function leggiComune(codice, dato, annoTarget) {
  var anni = dato.anni || {};
  var validi = Object.keys(anni).map(Number).filter(function (anno) {
    return anno <= annoTarget;
  });

  if (!validi.length) {
    return { esenzione: 0, scaglioni: [[null, 0]], anno: null, estremi: '', flags: 0 };
  }

  var anno = Math.max.apply(null, validi);
  var blocco = anni[anno];
  var esenzione = 0;
  var scaglioni = [];
  var flags = 0;

  blocco.rows.forEach(function (riga) {
    var aliquota = FASCE.numero(riga[0]);
    var letto = FASCE.leggi(riga[1]);

    if (letto === null) {
      // Esenzione legata al tipo di reddito o alla persona: non e una soglia
      // sull imponibile e il modello non la applica.
      flags |= NON_MODELLATA;
      var chiave = FASCE.normalizza(riga[1]);
      residuo[chiave] = (residuo[chiave] || 0) + 1;
      return;
    }

    if (letto.tipo === 'esenzione') esenzione = Math.max(esenzione, letto.soglia);
    else if (letto.tipo === 'unica' || letto.tipo === 'oltre') scaglioni.push([null, aliquota]);
    else scaglioni.push([letto.soglia, aliquota]);
  });

  if (!scaglioni.length) scaglioni = [[null, 0]];

  scaglioni.sort(function (a, b) {
    if (a[0] === null) return 1;
    if (b[0] === null) return -1;
    return a[0] - b[0];
  });

  // Manca lo scaglione aperto: si prolunga l ultima aliquota, che e quello che
  // il portale intende quando scrive solo le fasce basse.
  if (scaglioni[scaglioni.length - 1][0] !== null) {
    scaglioni.push([null, scaglioni[scaglioni.length - 1][1]]);
  }

  var grezza = blocco.delibera || '';
  if (grezza.indexOf('*') !== -1) flags |= UFFICIO;
  var numero = grezza.replace(/\*/g, '').trim();
  var estremi = numero ? numero + '|' + (blocco.dataDelibera || '') : '';

  return { esenzione: esenzione, scaglioni: scaglioni, anno: anno, estremi: estremi, flags: flags };
}

// ------------------------------------------------------------------ scrittura

function testata(anno) {
  return [
    '// @ts-check',
    "'use strict';",
    '',
    '/**',
    ' * Addizionali regionali e comunali in vigore nell anno d imposta ' + anno + '.',
    ' *',
    ' * FILE GENERATO da tools/genera-locale.js. Non si modifica a mano: si',
    ' * cambia l ingresso e si rigenera.',
    ' *',
    ' * Estratto il ' + ESTRATTO_IL + ' dal portale del federalismo fiscale del',
    ' * MEF, che e la fonte che fa fede: raccoglie le delibere di regioni e comuni',
    ' * e pubblica le aliquote applicabili. Ogni voce porta il link alla sua pagina.',
    ' *',
    ' * Le ventuno regioni sono lette a mano, una pagina per volta. I comuni sono',
    ' * un estratto di massa e **non sono verificati voce per voce**: la verifica e',
    ' * campionaria, vedi il README.',
    ' *',
    ' * Tre cose che la colonna delle aliquote non dice e che vanno dette qui.',
    ' *',
    ' * Un ente che non delibera non azzera il tributo: le aliquote in vigore si',
    ' * intendono prorogate di anno in anno, art. 1 co. 169 L. 296/2006. Ogni',
    ' * comune porta percio `deliberatedFor`, l anno dell ultima delibera',
    ' * pubblicata. Se e minore dell anno d imposta, quelle aliquote valgono per',
    ' * proroga. I comuni che non hanno mai deliberato hanno addizionale zero.',
    ' *',
    ' * Alcuni comuni prevedono esenzioni legate al tipo di reddito, a pensione, a',
    ' * lavoro dipendente, a terreni, o alla persona. Non sono una soglia sull',
    ' * imponibile e il modello **non le applica**: portano `unmodelledRelief`.',
    ' *',
    ' * Lo stesso vale per le agevolazioni soggettive di diverse regioni. Il',
    ' * modello calcola le aliquote ordinarie per scaglione, e la nota della fonte',
    ' * segnala dove c e dell altro.',
    ' */',
    'var LOCAL_' + anno + ' = (function () {',
    '',
    "  var MEF = '" + MEF + "';",
    ''
  ].join('\n');
}

function decodificatore(anno) {
  return [
    '',
    '  /**',
    '   * Una riga di COMUNI e',
    '   *',
    '   *   [codice catastale, nome, provincia, regione, esenzione, scaglioni,',
    '   *    anno della delibera, "numero|data", bandiere]',
    '   *',
    '   * dove uno scaglione e [tetto, aliquota percentuale] con tetto 0 per lo',
    '   * scaglione aperto, e le bandiere sono 1 per aliquota inserita d ufficio',
    '   * e 2 per esenzione soggettiva non modellata.',
    '   *',
    '   * La chiave e il nome piu la sigla della provincia: i nomi dei comuni non',
    '   * sono unici in Italia, i codici catastali non si leggono.',
    '   *',
    '   * Le percentuali si arrotondano invece di dividere e basta: 1,1 diviso',
    '   * 100 non da lo stesso double di 0.011, e le due strade devono portare',
    '   * allo stesso numero.',
    '   */',
    '  function decode() {',
    '    var municipalities = {};',
    '    var sources = {};',
    '',
    '    COMUNI.forEach(function (row) {',
    '      var code = row[0];',
    '      var name = row[1];',
    '      var province = row[2];',
    '      var region = row[3];',
    '      var year = row[6];',
    '      var flags = row[8];',
    '      var place = PAGES[region];',
    '      var sourceId = \'addcom-\' + code.toLowerCase();',
    '',
    '      municipalities[slug(name) + \'-\' + province.toLowerCase()] = {',
    '        name: name,',
    '        province: province,',
    '        region: region,',
    '        brackets: row[5].map(function (bracket) {',
    '          return {',
    '            upTo: bracket[0] === 0 ? null : bracket[0],',
    '            rate: Math.round(bracket[1] * 1e6) / 1e8',
    '          };',
    '        }),',
    '        exemptionThreshold: row[4],',
    '        deliberatedFor: year,',
    '        unmodelledRelief: (flags & 2) !== 0,',
    '        sourceId: sourceId',
    '      };',
    '',
    '      var parts = row[7] ? row[7].split(\'|\') : null;',
    '      var notes = [];',
    '',
    '      if ((flags & 1) !== 0) notes.push(\'Aliquota non inviata dal comune e inserita d ufficio.\');',
    '      if (year === null) {',
    '        notes.push(\'Il portale non riporta alcuna delibera, in nessun anno: il comune non applica l addizionale.\');',
    '      } else if (year < ' + anno + ') {',
    '        notes.push(\'Ultima delibera pubblicata per l anno \' + year +',
    '          \': vale per proroga, art. 1 co. 169 L. 296/2006.\');',
    '      } else {',
    '        notes.push(\'Delibera pubblicata per l anno \' + year + \'.\');',
    '      }',
    '      if ((flags & 2) !== 0) {',
    '        notes.push(\'Il comune prevede un esenzione legata al tipo di reddito che il modello non applica.\');',
    '      }',
    '',
    '      sources[sourceId] = {',
    '        label: parts ? \'delibera \' + parts[0] + (parts[1] ? \' del \' + parts[1] : \'\')',
    '          : \'nessuna delibera pubblicata\',',
    '        title: \'Addizionale comunale IRPEF di \' + name + \' (\' + province + \')\',',
    '        url: MEF + \'nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=\' + place[1] +',
    '          \'&pagina=\' + place[0] + \'&pr=\' + province + \'&cc=\' + code,',
    '        inForceFrom: \'' + anno + '-01-01\',',
    '        note: notes.join(\' \')',
    '      };',
    '    });',
    '',
    '    return { municipalities: municipalities, sources: sources };',
    '  }',
    '',
    '  /** Stessa regola del generatore: senza accenti, senza apostrofi, a trattini. */',
    '  function slug(name) {',
    '    return name.toLowerCase()',
    "      .replace(/\\u00e0/g, 'a').replace(/[\\u00e8\\u00e9]/g, 'e')",
    "      .replace(/\\u00ec/g, 'i').replace(/\\u00f2/g, 'o').replace(/\\u00f9/g, 'u')",
    "      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');",
    '  }',
    '',
    '  var comuni = decode();',
    '  var sources = {};',
    '',
    '  Object.keys(REGION_SOURCES).forEach(function (id) { sources[id] = REGION_SOURCES[id]; });',
    '  Object.keys(comuni.sources).forEach(function (id) { sources[id] = comuni.sources[id]; });',
    '',
    '  return {',
    '    taxYear: ' + anno + ',',
    '',
    '    /**',
    '     * Su cosa cade il calcolo quando la posizione non lo dice. Non e una',
    '     * scelta fiscale, e il caso di partenza dell interfaccia.',
    '     */',
    '    defaults: {',
    "      region: 'lombardia',",
    "      municipality: 'milano-mi'",
    '    },',
    '',
    '    regions: REGIONS,',
    '    municipalities: comuni.municipalities,',
    '    sources: sources',
    '  };',
    '})();',
    '',
    "if (typeof module !== 'undefined' && module.exports) {",
    '  module.exports = LOCAL_' + anno + ';',
    '}',
    ''
  ].join('\n');
}

function chiaveOggetto(slugRegione) {
  return slugRegione.indexOf('-') === -1 ? slugRegione : "'" + slugRegione + "'";
}

function costruisci(anno, grezzo, pagine) {
  var out = [testata(anno)];

  out.push('  /** Da regione a pagina del portale, per ricostruire i link. */');
  out.push('  var PAGES = {');
  out.push(Object.keys(pagine).sort().map(function (regione) {
    return '    ' + chiaveOggetto(regione) + ": ['" + pagine[regione][0] + "', " +
      pagine[regione][1] + ']';
  }).join(',\n'));
  out.push('  };');
  out.push('');

  out.push('  var REGIONS = {');
  out.push(REGIONI.map(function (regione) {
    return [
      '    ' + chiaveOggetto(regione.slug) + ': {',
      '      name: ' + js(regione.nome) + ',',
      '      brackets: [',
      regione.aliquote[anno].map(function (scaglione) {
        return '        { upTo: ' + js(scaglione[0]) +
          ', rate: ' + (Math.round(scaglione[1] * 1e6) / 1e8) + ' }';
      }).join(',\n'),
      '      ],',
      "      sourceId: 'addreg-" + regione.slug + "'",
      '    }'
    ].join('\n');
  }).join(',\n'));
  out.push('  };');
  out.push('');

  out.push('  var REGION_SOURCES = {');
  out.push(REGIONI.map(function (regione) {
    var nota = 'Aliquote pubblicate sul portale il ' + regione.pubblicate[anno] + '.';
    if (regione.nota) nota += ' ' + regione.nota;

    return [
      "    'addreg-" + regione.slug + "': {",
      '      label: ' + js('addizionale regionale ' + regione.nome) + ',',
      '      title: ' + js(regione.norme) + ',',
      '      url: ' + js(MEF + 'addregirpef/addregirpef.php?reg=' + regione.codice) + ',',
      "      inForceFrom: '" + anno + "-01-01',",
      '      note: ' + js(nota),
      '    }'
    ].join('\n');
  }).join(',\n'));
  out.push('  };');
  out.push('');

  out.push('  var COMUNI = [');

  var chiavi = {};
  var conteggi = { deliberato: 0, proroga: 0, mai: 0, agevolazione: 0 };

  var righe = Object.keys(grezzo).sort().map(function (codice) {
    var dato = grezzo[codice];
    if (dato.errore) throw new Error('comune con errore di rete: ' + codice);

    var letto = leggiComune(codice, dato, anno);
    var nome = titolo(dato.nome);
    var chiave = slug(nome) + '-' + dato.pr.toLowerCase();

    if (chiavi[chiave]) {
      throw new Error('chiave duplicata ' + chiave + ': ' + chiavi[chiave] + ' e ' + codice);
    }
    chiavi[chiave] = codice;

    if (letto.anno === null) conteggi.mai++;
    else if (letto.anno < anno) conteggi.proroga++;
    else conteggi.deliberato++;
    if (letto.flags & NON_MODELLATA) conteggi.agevolazione++;

    return '    [' + [
      js(codice), js(nome), js(dato.pr), js(dato.region), js(letto.esenzione),
      '[' + letto.scaglioni.map(function (scaglione) {
        return '[' + (scaglione[0] === null ? 0 : scaglione[0]) + ',' + scaglione[1] + ']';
      }).join(',') + ']',
      js(letto.anno), js(letto.estremi), letto.flags
    ].join(',') + ']';
  });

  out.push(righe.join(',\n'));
  out.push('  ];');
  out.push(decodificatore(anno));

  return { testo: out.join('\n'), quanti: righe.length, conteggi: conteggi };
}

// ----------------------------------------------------------------- esecuzione

if (!fs.existsSync(GREZZO)) {
  console.error('manca ' + GREZZO + '\nEsegui prima: node tools/estrai-comuni.js');
  process.exit(1);
}

var grezzo = JSON.parse(fs.readFileSync(GREZZO, 'utf8'));
var pagine = {};

Object.keys(grezzo).forEach(function (codice) {
  pagine[grezzo[codice].region] = [grezzo[codice].pagina, Number(grezzo[codice].r)];
});

ANNI.forEach(function (anno) {
  var fatto = costruisci(anno, grezzo, pagine);
  var destinazione = path.join(RADICE, 'src', 'local-' + anno + '.js');
  fs.writeFileSync(destinazione, fatto.testo);

  console.log('src/local-' + anno + '.js  ' + fatto.quanti + ' comuni, ' +
    Math.round(Buffer.byteLength(fatto.testo) / 1024) + ' KB');
  console.log('   delibera dell anno ' + fatto.conteggi.deliberato +
    ', per proroga ' + fatto.conteggi.proroga +
    ', mai deliberata ' + fatto.conteggi.mai +
    ', esenzione non modellata ' + fatto.conteggi.agevolazione);
});

var fuori = Object.keys(residuo);
console.log('\ndiciture non riconosciute: ' + fuori.length + ' distinte, ' +
  fuori.reduce(function (somma, chiave) { return somma + residuo[chiave]; }, 0) + ' occorrenze');
fuori.sort(function (a, b) { return residuo[b] - residuo[a]; }).slice(0, 10).forEach(function (chiave) {
  console.log('  ' + residuo[chiave] + '  ' + chiave.slice(0, 110));
});
