// @ts-check
'use strict';

/**
 * Dal netto alla RAL. Andata e ritorno, accordo con un oracolo binario
 * indipendente, e lo stesso giro su una posizione con familiari a carico, che
 * sposta ogni soglia su cui l inversione monta i suoi segmenti.
 */
var SUITE_INVERSE = function (context) {
  var engine = context.engine;
  var t = context.t;

  t.group('Inversione, andata e ritorno');
  [18000, 30000, 35000, 45000, 60000, 90000].forEach(function (ral) {
    var target = engine.calculateNet({ grossAnnual: ral, months: 13 }).netAnnual;
    var solved = engine.solveGrossFromNet(target, { months: 13 });
    t.ok('RAL ' + ral + ': soluzione trovata', solved.found);
    if (solved.found) {
      t.close('RAL ' + ral + ': ritorna alla RAL di partenza', solved.ral, ral, 0.05);
      t.ok('RAL ' + ral + ': il netto raggiunto non e inferiore al target',
        solved.achievedNet >= target - 1e-9);
    }
  });

  t.group('Inversione esatta contro oracolo binario');
  [30000, 35000, 45000, 60000, 90000].forEach(function (ral) {
    var target = engine.calculateNet({ grossAnnual: ral, months: 13 }).netAnnual;
    var exact = engine.solveGrossFromNet(target, { months: 13 });
    var oracle = engine.solveGrossFromNetBinary(target, { months: 13 });
    t.close('netto da RAL ' + ral + ': i due metodi concordano',
      exact.found ? exact.ral : NaN, oracle, 0.05);
  });

  /**
   * The inversion has to survive the position it is given. Dependants move
   * every threshold it fits its segments on, so the round trip is worth
   * repeating with a crowded tax card.
   */

  t.group('Inversione con familiari a carico');
  var invertedFamily = { months: 13, family: { spouse: true, children: 2, ascendants: 1 } };
  [18000, 30000, 45000, 70000].forEach(function (ral) {
    var target = engine.calculateNet(engine.withGross(invertedFamily, ral)).netAnnual;
    var solved = engine.solveGrossFromNet(target, invertedFamily);
    t.ok('RAL ' + ral + ': soluzione trovata', solved.found);
    if (solved.found) {
      t.close('RAL ' + ral + ': ritorna alla RAL di partenza', solved.ral, ral, 0.05);
      t.close('RAL ' + ral + ': concorda con l oracolo binario',
        solved.ral, engine.solveGrossFromNetBinary(target, invertedFamily), 0.05);
    }
  });

  /**
   * The two kinds of discontinuity behave in opposite ways, and confusing them
   * is easy: a jump up leaves net values no gross can reach, a jump down lets
   * two different gross figures land on the same net.
   */
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_INVERSE;
}
