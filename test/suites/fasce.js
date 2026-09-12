// @ts-check
'use strict';

/**
 * La lettura delle diciture del portale MEF.
 *
 * E il pezzo piu rischioso del dataset comunale: quasi ottomila comuni scrivono
 * le stesse quattro regole in decine di modi, e un errore qui non si vede, si
 * propaga in un numero plausibile. Questi casi sono tutti presi dal portale,
 * nessuno e inventato.
 */
var SUITE_FASCE = function (context) {
  var t = context.t;
  var fasce = context.fasce;

  if (!fasce) {
    t.ok('lettore delle fasce disponibile', false, 'runTests chiamato senza FASCE');
    return;
  }

  t.group('Importi scritti all italiana, e non solo');
  t.close('15.000,00 sono quindicimila', fasce.numero('15.000,00'), 15000, 1e-9);
  t.close('185,92 sono centottantacinque e novantadue', fasce.numero('185,92'), 185.92, 1e-9);
  t.close('9.999,99', fasce.numero('9.999,99'), 9999.99, 1e-9);
  t.close('8000.00 col punto decimale', fasce.numero('8000.00'), 8000, 1e-9);
  t.close('28.000 senza decimali sono ventottomila', fasce.numero('28.000'), 28000, 1e-9);
  t.close('4.000 idem', fasce.numero('4.000'), 4000, 1e-9);
  t.close('1,014 e un aliquota', fasce.numero('1,014'), 1.014, 1e-9);
  t.close('0,8', fasce.numero('0,8'), 0.8, 1e-9);

  t.group('Le quattro regole, scritte bene');

  function tipo(fascia) {
    var letto = fasce.leggi(fascia);
    return letto === null ? 'non riconosciuta' : letto.tipo;
  }

  function soglia(fascia) {
    var letto = fasce.leggi(fascia);
    return letto === null ? NaN : letto.soglia;
  }

  t.equal('aliquota unica', tipo('Aliquota unica'), 'unica');
  t.equal('esenzione sull imponibile',
    tipo('Esenzione per redditi imponibili fino a euro 23.000,00'), 'esenzione');
  t.close('e la sua soglia',
    soglia('Esenzione per redditi imponibili fino a euro 23.000,00'), 23000, 1e-9);
  t.equal('primo scaglione',
    tipo('Applicabile a scaglione di reddito fino a euro 15.000,00'), 'fino');
  t.equal('scaglione intermedio',
    tipo('Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00'), 'da-a');
  t.close('di cui conta il tetto',
    soglia('Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00'),
    28000, 1e-9);
  t.equal('scaglione aperto',
    tipo('Applicabile a scaglione di reddito oltre euro 50.000,00'), 'oltre');

  t.group('Le stesse regole, scritte male');

  /**
   * Tutte prese dal portale. Entita HTML non decodificate, spazi mancanti,
   * maiuscole, preposizioni diverse, refusi: e sempre la stessa regola.
   */
  [
    ['entita HTML non decodificata', 'Applicabile a scaglione di reddito fino a &euro; 15.000,00', 'fino', 15000],
    ['spazio mancante dopo euro', 'Applicabile a scaglione di reddito fino a euro15.000,00', 'fino', 15000],
    ['scaglioni al plurale', 'Applicabile a scaglioni di reddito fino a euro 15.000,00', 'fino', 15000],
    ['tutto maiuscolo', 'Applicabile a scaglione di reddito FINO A 15.000,00', 'fino', 15000],
    ['a euro invece di fino a euro', 'Applicabile a scaglione di reddito da euro 28.000,01 a euro 50.000,00', 'da-a', 50000],
    ['ad euro', 'Applicabile a scaglione di reddito DA EURO 15.000,01 AD EURO 28.000,00', 'da-a', 28000],
    ['oltre X e fino a Y', 'Applicabile a scaglione di reddito oltre euro 28.001 e fino a euro 50.000', 'da-a', 50000],
    ['senza la parola scaglione', 'Applicabile a oltre euro 50.000,00', 'oltre', 50000],
    ['senza euro', 'Applicabile a scaglione di reddito oltre 50.000,00', 'oltre', 50000],
    ['refuso reddiito', 'Applicabile a scaglione di reddiito oltre euro 50.000,00', 'oltre', 50000],
    ['redditi invece di scaglione', 'Applicabile a REDDITI FINO A &euro; 15.000,00', 'fino', 15000],
    ['da X senza tetto e uno scaglione aperto', 'Applicabile a scaglione di reddito da euro 50.000,01', 'oltre', 50000.01]
  ].forEach(function (caso) {
    t.equal(caso[0], tipo(caso[1]), caso[2]);
    t.close(caso[0] + ', soglia', soglia(caso[1]), caso[3], 1e-9);
  });

  t.group('Quello che non si indovina');

  /**
   * Esenzioni legate al tipo di reddito o alla persona. Per un dipendente con
   * solo reddito da lavoro alcune coinciderebbero con una soglia
   * sull imponibile, ma altre no, e distinguerle vorrebbe dire interpretare
   * duecento stringhe di testo libero. Il generatore le marca e non le applica.
   */
  [
    'Esenzione per redditi di pensione - lavoro dipendente non superiori a euro 7.500,00 annui',
    'Esenzione per redditi di terreni per un importo non superiore &euro; 185,92',
    "Esenzione per reddito dell'unita' immobiliare adibita ad abitazione principale e relative pertinenze",
    'Esenzione per redditi assimilati al lavoro dipendente fino a euro 5.500,00',
    'Esenzione per CONTRIBUENTI CON REDDITO COMPLESSIVO ANNUO DI LAVORO AUTONOMO O DI IMPRESA INFERIORE A EURO 4.000',
    'Esenzione per i pensionati fino a un reddito da pensione di 8.500,00 euro'
  ].forEach(function (fascia) {
    t.equal('non riconosciuta: ' + fascia.slice(0, 46), tipo(fascia), 'non riconosciuta');
  });

  t.group('Le cinque righe vere di Torino');

  /** Quattro scaglioni piu un esenzione, e l esenzione arriva per ultima. */
  var torino = [
    'Applicabile a scaglione di reddito fino a euro 15.000,00',
    'Applicabile a scaglione di reddito da euro 15.000,01 fino a euro 28.000,00',
    'Applicabile a scaglione di reddito da euro 28.000,01 fino a euro 50.000,00',
    'Applicabile a scaglione di reddito oltre euro 50.000,00',
    'Esenzione per redditi imponibili fino a euro 11.790,00'
  ].map(function (fascia) { return fasce.leggi(fascia); });

  t.ok('tutte e cinque riconosciute', torino.every(function (letto) { return letto !== null; }));
  t.equal('quattro scaglioni', torino.filter(function (letto) {
    return letto.tipo !== 'esenzione';
  }).length, 4);
  t.close('e una soglia di esenzione a 11.790', torino[4].soglia, 11790, 1e-9);

  t.group('Normalizzazione');
  t.equal('le entita spariscono',
    fasce.normalizza('Fino a &euro; 100 e &agrave;'), 'fino a euro 100 e a');
  t.equal('il punto finale sparisce', fasce.normalizza('Aliquota unica.'), 'aliquota unica');
  t.equal('gli spazi si comprimono', fasce.normalizza('  Aliquota   unica  '), 'aliquota unica');
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_FASCE;
}
