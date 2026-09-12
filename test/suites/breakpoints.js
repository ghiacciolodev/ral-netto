// @ts-check
'use strict';

/**
 * Le soglie del modello, e la prova piu forte della suite: fra due soglie il
 * netto e una retta, quindi una retta interpolata dentro un segmento deve
 * ritrovare il motore ovunque nel segmento. Se fallisce, manca una soglia.
 */
var SUITE_BREAKPOINTS = function (context) {
  var engine = context.engine;
  var t = context.t;
  var BREAKPOINT_CASES = context.fixtures.BREAKPOINT_CASES;

  t.group('Punti di rottura');
  var breakpoints = engine.getBreakpoints();

  BREAKPOINT_CASES.forEach(function (expected) {
    var found = breakpoints.filter(function (bp) {
      return bp.space === expected.space && Math.abs(bp.threshold - expected.threshold) < 0.01;
    })[0];

    if (!found) {
      t.ok('soglia ' + expected.threshold + ' (' + expected.space + ') presente', false, 'assente');
      return;
    }
    t.close('soglia ' + expected.threshold + ' (' + expected.space + ') -> RAL', found.ral, expected.ral);
  });

  t.ok('la lista e ordinata per RAL crescente', breakpoints.every(function (bp, i) {
    return i === 0 || breakpoints[i - 1].ral <= bp.ral;
  }));

  /**
   * The strongest test in the suite. Once the truncation is set aside the model
   * is affine between breakpoints, so a line fitted inside a segment must
   * reproduce the engine anywhere else inside it. A failure means a threshold
   * is missing from getBreakpoints().
   *
   * It runs on more than one position on purpose. Dependants bring thresholds
   * of their own, and they turn the second band of the trattamento integrativo
   * into two kinks that no statute states as a number.
   */

  t.group('Completezza dei punti di rottura (modello affine)');

  [
    { name: 'nessun familiare', position: { months: 13 } },
    {
      name: 'coniuge e due figli',
      position: { months: 13, family: { spouse: true, children: 2 } }
    },
    {
      name: 'rapporto parziale, famiglia numerosa',
      position: {
        months: 13, daysWorked: 200, contractType: 'fixed-term',
        family: { spouse: true, children: 4, childrenSharePercent: 100, ascendants: 2, months: 7 }
      }
    }
  ].forEach(function (variant) {
    var smooth = { exactRatios: true };
    var edges = [0].concat(
      engine.getBreakpoints(variant.position)
        .map(function (bp) { return bp.ral; })
        .filter(function (r) { return r > 0 && r < engine.maxRal; })
    ).concat([engine.maxRal]);

    edges.forEach(function (lo, index) {
      var hi = edges[index + 1];
      if (hi === undefined) return;

      var span = hi - lo;
      if (span < 1e-6) return;

      /**
       * Fitted near the edges rather than at the thirds. A kink sitting in the
       * first few per cent of a segment used to hide outside the sampled range
       * and the test read it as affine.
       */
      var x1 = lo + span * 0.05;
      var x2 = lo + span * 0.95;
      var y1 = engine.calculateNet(engine.withGross(variant.position, x1), smooth).netAnnual;
      var y2 = engine.calculateNet(engine.withGross(variant.position, x2), smooth).netAnnual;
      var slope = (y2 - y1) / (x2 - x1);

      var worst = 0;
      var tolerance = 1e-6;

      [0.1, 0.25, 0.5, 0.75, 0.9].forEach(function (fraction) {
        var probe = lo + span * fraction;
        var actual = engine.calculateNet(engine.withGross(variant.position, probe), smooth).netAnnual;
        var error = Math.abs(actual - (y1 + slope * (probe - x1)));

        // The last segment spans millions, where a fixed cent asks for more
        // precision than a double carries, so the tolerance follows the value.
        tolerance = Math.max(tolerance, Math.abs(actual) * 1e-12);
        if (error > worst) worst = error;
      });

      t.ok(
        variant.name + ', segmento ' + lo.toFixed(2) + ' - ' + hi.toFixed(2) + ' e affine',
        worst <= tolerance, 'scarto ' + worst.toExponential(3)
      );
    });
  });

  /**
   * The truncation turns the deduction into a staircase stepping every 1,30 euro
   * of income. The step is worth at most coefficient * 1e-4, so the statutory
   * result never drifts more than about 20 cents from the smooth model.
   */

  t.group('Scarto introdotto dal troncamento');
  var worstGap = 0;
  for (var ral = 10000; ral <= 80000; ral += 37) {
    var statutory = engine.calculateNet({ grossAnnual: ral, months: 13 }).netAnnual;
    var idealised = engine.calculateNet({ grossAnnual: ral, months: 13 }, { exactRatios: true }).netAnnual;
    var gap = idealised - statutory;
    if (gap > worstGap) worstGap = gap;
    if (gap < -1e-9) worstGap = 999;
  }
  t.ok('il troncamento non aumenta mai il netto', worstGap < 999);
  t.ok('scarto massimo sotto i 20 centesimi (' + worstGap.toFixed(4) + ')', worstGap < 0.20);

  /**
   * With dependants there are four truncated ratios in play instead of one, so
   * the staircase gets deeper. The bound is the sum of the coefficients times
   * one unit in the fourth decimal, which is the most a truncation can cost on
   * each of them.
   */

  t.group('No tax area emergente');
  var noTaxArea = breakpoints.filter(function (bp) { return bp.ids.indexOf('no-tax-area') !== -1; })[0];
  t.ok('il punto esiste', !!noTaxArea);
  t.close('cade esattamente a imponibile 8.500', noTaxArea ? noTaxArea.threshold : NaN, 8500, 1e-9);
  t.close('IRPEF netta nulla appena sotto', engine.calculateNet({ grossAnnual: noTaxArea.ral - 1 }).irpef.net, 0, 1e-9);
  t.ok('IRPEF netta positiva appena sopra', engine.calculateNet({ grossAnnual: noTaxArea.ral + 1 }).irpef.net > 0);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_BREAKPOINTS;
}
