// @ts-check
'use strict';

/**
 * Quello che il motore rifiuta. Una posizione che non sa rappresentare deve
 * dare un errore, non un numero plausibile con l etichetta sbagliata.
 */
var SUITE_VALIDATION = function (context) {
  var engine = context.engine;
  var t = context.t;

  t.group('Anno d imposta');
  t.equal('il motore e legato a un anno solo', engine.taxYear, engine.parameters.taxYear);
  t.ok('la posizione eredita l anno del motore',
    engine.calculateNet({ grossAnnual: 30000 }).position.taxYear === engine.taxYear);
  t.throws('un anno diverso da quello legato viene rifiutato', function () {
    engine.calculateNet({ grossAnnual: 30000, taxYear: engine.taxYear - 1 });
  });

  t.group('Validazione input');
  t.throws('RAL negativa', function () { engine.calculateNet({ grossAnnual: -1 }); });
  t.throws('RAL non numerica', function () { engine.calculateNet({ grossAnnual: '30000' }); });
  t.throws('RAL oltre il limite', function () { engine.calculateNet({ grossAnnual: engine.maxRal + 1 }); });
  t.throws('mensilita non ammesse', function () { engine.calculateNet({ grossAnnual: 30000, months: 15 }); });
  t.ok('RAL zero e ammessa', engine.calculateNet({ grossAnnual: 0 }).netAnnual === 0);
  t.throws('posizione non oggetto', function () { engine.calculateNet(30000); });
  t.throws('regione non modellata', function () {
    engine.calculateNet({ grossAnnual: 30000, region: 'lazio' });
  });
  t.throws('comune non modellato', function () {
    engine.calculateNet({ grossAnnual: 30000, municipality: 'roma' });
  });
  t.throws('giorni fuori intervallo', function () {
    engine.calculateNet({ grossAnnual: 30000, daysWorked: 400 });
  });
  t.throws('giorni a zero', function () {
    engine.calculateNet({ grossAnnual: 30000, daysWorked: 0 });
  });
  t.throws('tipo di contratto non riconosciuto', function () {
    engine.calculateNet({ grossAnnual: 30000, contractType: 'stagionale' });
  });
  t.ok('la posizione normalizzata torna nel risultato',
    engine.calculateNet({ grossAnnual: 30000 }).position.region === 'lombardia');
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_VALIDATION;
}
