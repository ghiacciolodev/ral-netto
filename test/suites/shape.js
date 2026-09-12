// @ts-check
'use strict';

/**
 * La forma della curva. Il netto non e monotono: in due punti sale di scatto,
 * lasciando netti che nessuna RAL raggiunge, e in altri scende, facendo
 * arrivare due RAL diverse allo stesso netto. Confondere i due versi e facile.
 */
var SUITE_SHAPE = function (context) {
  var engine = context.engine;
  var t = context.t;
  var breakpoints = engine.getBreakpoints();

  t.group('Limiti e monotonia');
  [5000, 12000, 20000, 30000, 45000, 70000, 150000].forEach(function (ral) {
    var r = engine.calculateNet({ grossAnnual: ral });
    t.ok('RAL ' + ral + ': netto tra zero e lordo', r.netAnnual >= 0 && r.netAnnual <= ral);
  });

  var drops = [
    { taxable: 8500, label: 'cambio fascia somma esente' },
    { taxable: 23000, label: 'soglia esenzione comunale' }
  ];
  drops.forEach(function (d) {
    var ral = engine.grossFromTaxable(d.taxable);
    var before = engine.calculateNet({ grossAnnual: ral - 1 }).netAnnual;
    var after = engine.calculateNet({ grossAnnual: ral + 1 }).netAnnual;
    t.ok('il netto scende attraversando imponibile ' + d.taxable + ' (' + d.label + ')',
      after < before, 'prima ' + before.toFixed(2) + ', dopo ' + after.toFixed(2));
  });


  t.group('Salti in su: netti irraggiungibili');
  var upBp = breakpoints.filter(function (bp) {
    return bp.ids.indexOf('supplementary-allowance-start') !== -1;
  })[0];

  t.ok('la soglia di capienza del trattamento integrativo esiste', !!upBp);

  var upRal = upBp.ral;
  var underGap = engine.calculateNet({ grossAnnual: upRal - 0.5, months: 13 }).netAnnual;
  var overGap = engine.calculateNet({ grossAnnual: upRal + 0.5, months: 13 }).netAnnual;

  t.ok('l ingresso del trattamento integrativo fa salire il netto', overGap > underGap,
    'sotto ' + underGap.toFixed(2) + ', sopra ' + overGap.toFixed(2));
  t.ok('la fascia irraggiungibile supera i 1.000 euro annui', overGap - underGap > 1000);

  var unreachable = (underGap + overGap) / 2;
  var gapSolve = engine.solveGrossFromNet(unreachable, { months: 13 });

  t.ok('un netto nel buco non trova soluzione', gapSolve.found === false);
  t.ok('e vengono indicati i due netti raggiungibili piu vicini',
    !!gapSolve.nearestBelow && !!gapSolve.nearestAbove);
  t.ok('quello sotto e minore del target',
    gapSolve.nearestBelow && gapSolve.nearestBelow.net <= unreachable);
  t.ok('quello sopra e maggiore del target',
    gapSolve.nearestAbove && gapSolve.nearestAbove.net >= unreachable);

  t.group('Trattamento integrativo');
  var ti = engine.parameters.supplementaryAllowance;
  t.close('spetta pieno appena sopra la soglia di capienza',
    engine.calculateNet({ grossAnnual: upRal + 1 }).supplementaryAllowance.amount, ti.amount);
  t.close('non spetta appena sotto',
    engine.calculateNet({ grossAnnual: upRal - 1 }).supplementaryAllowance.amount, 0);
  t.close('spetta ancora all ultimo euro della prima fascia',
    engine.calculateNet({ grossAnnual: engine.grossFromTaxable(ti.incomeUpTo) - 0.5 }).supplementaryAllowance.amount,
    ti.amount);

  /**
   * Above the flat band only the art. 13 deduction feeds the differential, and
   * it never exceeds gross tax without dependants or deductible charges, so the
   * allowance is zero throughout. Worth asserting: it is the reason the second
   * band needs no further modelling.
   */
  var anyInSecondBand = 0;
  for (var band = ti.incomeUpTo + 100; band <= ti.secondBandUpTo; band += 250) {
    anyInSecondBand += engine.calculateNet({ grossAnnual: engine.grossFromTaxable(band) }).supplementaryAllowance.amount;
  }
  t.close('senza familiari a carico la seconda fascia resta a zero', anyInSecondBand, 0);

  t.group('Salti in giu: stesso netto da due RAL');
  var stepRal = engine.grossFromTaxable(engine.parameters.employmentDeduction.flatUpTo);
  t.ok('perso il trattamento integrativo, il gradino art. 13 diventa un salto in giu',
    engine.calculateNet({ grossAnnual: stepRal + 0.5 }).netAnnual < engine.calculateNet({ grossAnnual: stepRal - 0.5 }).netAnnual,
    'sotto ' + engine.calculateNet({ grossAnnual: stepRal - 0.5 }).netAnnual.toFixed(2) +
    ', sopra ' + engine.calculateNet({ grossAnnual: stepRal + 0.5 }).netAnnual.toFixed(2));

  var downRal = engine.grossFromTaxable(23000);
  var beforeDrop = engine.calculateNet({ grossAnnual: downRal - 0.5, months: 13 }).netAnnual;
  var afterDrop = engine.calculateNet({ grossAnnual: downRal + 0.5, months: 13 }).netAnnual;

  t.ok('la soglia comunale fa scendere il netto', afterDrop < beforeDrop,
    'sotto ' + beforeDrop.toFixed(2) + ', sopra ' + afterDrop.toFixed(2));

  var doubled = engine.solveGrossFromNet((beforeDrop + afterDrop) / 2, { months: 13 });
  t.ok('lo stesso netto e prodotto da piu di una RAL', doubled.found && doubled.solutions.length > 1,
    doubled.found ? doubled.solutions.length + ' soluzioni' : 'nessuna soluzione');
  t.ok('viene restituita la RAL minima',
    doubled.found && doubled.ral === Math.min.apply(null, doubled.solutions));
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_SHAPE;
}
