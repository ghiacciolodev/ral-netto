// @ts-check
'use strict';

/**
 * Le primitive numeriche, prese da sole. Il troncamento a quattro decimali e
 * l arrotondamento al centesimo non sono dettagli: entrambi spostano il
 * risultato, e entrambi sbagliano se affidati a toFixed.
 */
var SUITE_NUMBERS = function (context) {
  var engine = context.engine;
  var t = context.t;

  t.group('Troncamento art. 13 comma 6');
  t.close('esempio Agenzia Entrate 0,623381 -> 0,6233', engine.truncate(0.623381, 4), 0.6233, 1e-12);
  t.close('tronca, non arrotonda: 0,99999 -> 0,9999', engine.truncate(0.99999, 4), 0.9999, 1e-12);
  t.close('valore gia a quattro cifre resta invariato', engine.truncate(0.0582, 4), 0.0582, 1e-12);
  t.close('caso a rischio virgola mobile 0,29', engine.truncate(0.29, 4), 0.29, 1e-12);
  t.close('caso a rischio virgola mobile 0,615', engine.truncate(0.615, 4), 0.615, 1e-12);
  t.close('rapporto del caso 30.000', engine.truncate(757 / 13000, 4), 0.0582, 1e-12);
  t.close('rapporto del caso 35.000', engine.truncate(18216.5 / 22000, 4), 0.8280, 1e-12);

  t.group('Arrotondamento al centesimo');
  /**
   * Half-up on the decimal, not on the binary double. toFixed gets these wrong
   * because it rounds the stored value: 2.675 is really 2.67499999999999982.
   */
  [[2.675, '2,68'], [1.115, '1,12'], [8.365, '8,37'], [1.005, '1,01'],
   [0.125, '0,13'], [-2.675, '-2,68']].forEach(function (c) {
    t.equal('half-up su ' + c[0], engine.formatAmount(c[0]), c[1]);
  });
  // I tre esempi lavorati nelle istruzioni della Certificazione Unica.
  t.equal('esempio CU 55,505 -> 55,51', engine.formatAmount(55.505), '55,51');
  t.equal('esempio CU 65,626 -> 65,63', engine.formatAmount(65.626), '65,63');
  t.equal('esempio CU 65,493 -> 65,49', engine.formatAmount(65.493), '65,49');

  t.close('roundTo non sposta un valore gia netto', engine.roundTo(1234.56, 2), 1234.56, 1e-12);
  t.close('roundTo sotto la meta arrotonda per difetto', engine.roundTo(2.674, 2), 2.67, 1e-12);

  /**
   * The two gross figures where the old toFixed path produced the wrong cent.
   * Kept as a regression guard: they are not special, just the ones that caught it.
   */
  t.equal('RAL 47.000: IRPEF netta al centesimo giusto',
    engine.formatAmount(engine.calculateNet({ grossAnnual: 47000, months: 13 }).irpef.net),
    '10.649,37');
  t.equal('RAL 74.600: IRPEF netta al centesimo giusto',
    engine.formatAmount(engine.calculateNet({ grossAnnual: 74600, months: 13 }).irpef.net),
    '21.251,02');
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_NUMBERS;
}
