// @ts-check
'use strict';

/**
 * Expected values are computed by hand from the statutory formulas, never taken
 * from engine output. If the engine disagrees, the engine is what gets looked at.
 *
 * All figures include the art. 13 comma 6 truncation of the ratio.
 */
var VALUE_CASES = [
  {
    ral: 9001, months: 13, note: 'imposta lorda sotto la capienza, trattamento integrativo non spetta',
    contributions: 827.19, taxable: 8173.81, irpefGross: 1879.98,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 100.54, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 580.34, supplementary: 0.00, netAnnual: 8653.61
  },
  {
    ral: 9002, months: 13, note: 'capienza superata, entrano 1.200 di trattamento integrativo',
    contributions: 827.28, taxable: 8174.72, irpefGross: 1880.18,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 100.55, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 580.40, supplementary: 1200.00, netAnnual: 9854.57
  },
  {
    ral: 9360, months: 13, note: 'incapienza piena, fascia esente 7,1%',
    contributions: 860.18, taxable: 8499.82, irpefGross: 1954.96,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 104.55, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 603.49, supplementary: 1200.00, netAnnual: 10198.76
  },
  {
    ral: 9361, months: 13, note: 'uscita dall incapienza, fascia esente scende a 5,3%',
    contributions: 860.28, taxable: 8500.72, irpefGross: 1955.17,
    deductionsTotal: 1955.00, irpefNet: 0.17,
    regional: 104.56, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 450.54, supplementary: 1200.00, netAnnual: 10046.54
  },
  {
    ral: 16518, months: 13, note: 'ultimo punto della detrazione piatta a 1.955',
    contributions: 1518.00, taxable: 15000.00, irpefGross: 3450.00,
    deductionsTotal: 1955.00, irpefNet: 1495.00,
    regional: 184.50, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 795.00, supplementary: 1200.00, netAnnual: 15315.50
  },
  {
    ral: 16519, months: 13, note: 'gradino art. 13, la detrazione salta a 3.099,88',
    contributions: 1518.10, taxable: 15000.90, irpefGross: 3450.21,
    deductionsTotal: 3099.88, irpefNet: 350.33,
    regional: 184.51, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 720.04, supplementary: 0.00, netAnnual: 15186.11
  },
  {
    ral: 18000, months: 13, note: 'somma esente cuneo, fascia 4,8%',
    contributions: 1654.20, taxable: 16345.80, irpefGross: 3759.53,
    deductionsTotal: 2976.72, irpefNet: 782.82,
    regional: 205.76, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 784.60, supplementary: 0.00, netAnnual: 16141.82
  },
  {
    ral: 22024, months: 13, note: 'ultimo punto della somma esente',
    contributions: 2024.01, taxable: 19999.99, irpefGross: 4600.00,
    deductionsTotal: 2642.21, irpefNet: 1957.79,
    regional: 263.50, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 960.00, supplementary: 0.00, netAnnual: 18738.70
  },
  {
    ral: 22025, months: 13, note: 'passaggio a ulteriore detrazione da 1.000',
    contributions: 2024.10, taxable: 20000.90, irpefGross: 4600.21,
    deductionsTotal: 3642.21, irpefNet: 958.00,
    regional: 263.51, municipal: 0.00,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 18779.39
  },
  {
    ral: 25327, months: 13, note: 'ultimo punto esente da addizionale comunale',
    contributions: 2327.55, taxable: 22999.45, irpefGross: 5289.87,
    deductionsTotal: 3367.67, irpefNet: 1922.20,
    regional: 310.89, municipal: 0.00,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 20766.36
  },
  {
    ral: 25329, months: 13, note: 'soglia comunale superata, si paga sull intero imponibile',
    contributions: 2327.74, taxable: 23001.26, irpefGross: 5290.29,
    deductionsTotal: 3367.56, irpefNet: 1922.74,
    regional: 310.92, municipal: 184.01,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 20583.60
  },
  {
    ral: 30000, months: 13, note: 'caso standard verificato a mano',
    contributions: 2757.00, taxable: 27243.00, irpefGross: 6265.89,
    deductionsTotal: 3044.26, irpefNet: 3221.63,
    regional: 377.94, municipal: 217.94,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00,
    netAnnual: 23425.48, netMonthly: 1801.96
  },
  {
    ral: 35000, months: 13, note: 'caso standard verificato a mano, imponibile sotto i 32.000',
    contributions: 3216.50, taxable: 31783.50, irpefGross: 7688.56,
    deductionsTotal: 2646.48, irpefNet: 5042.08,
    regional: 454.98, municipal: 254.27,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00,
    netAnnual: 26032.18, netMonthly: 2002.48
  },
  {
    ral: 36000, months: 13, note: 'decalage del cuneo',
    contributions: 3308.40, taxable: 32691.60, irpefGross: 7988.23,
    deductionsTotal: 2481.15, irpefNet: 5507.08,
    regional: 470.60, municipal: 261.53,
    wedgeType: 'deduction', wedgeAmount: 913.55, supplementary: 0.00, netAnnual: 26452.39
  },
  {
    ral: 60000, months: 13, note: '43%, detrazione azzerata, contributo aggiuntivo 1%',
    contributions: 5551.76, taxable: 54448.24, irpefGross: 15612.74,
    deductionsTotal: 0.00, irpefNet: 15612.74,
    regional: 845.25, municipal: 435.59,
    wedgeType: 'none', wedgeAmount: 0.00, supplementary: 0.00, netAnnual: 37554.66
  },
  {
    ral: 130000, months: 13, note: 'massimale contributivo, tronca IVS e aggiuntivo',
    contributions: 11899.62, taxable: 118100.38, irpefGross: 42983.16,
    deductionsTotal: 0.00, irpefNet: 42983.16,
    regional: 1946.44, municipal: 944.80,
    wedgeType: 'none', wedgeAmount: 0.00, supplementary: 0.00, netAnnual: 72225.98
  }
];

/** Expected gross-pay position of each threshold, to check the derivation. */
var BREAKPOINT_CASES = [
  { threshold: 8173.91, space: 'taxable', ral: 9001.12 },
  { threshold: 8500, space: 'taxable', ral: 9360.20 },
  { threshold: 15000, space: 'taxable', ral: 16518.00 },
  { threshold: 20000, space: 'taxable', ral: 22024.01 },
  { threshold: 23000, space: 'taxable', ral: 25327.61 },
  { threshold: 25000, space: 'taxable', ral: 27530.01 },
  { threshold: 28000, space: 'taxable', ral: 30833.61 },
  { threshold: 32000, space: 'taxable', ral: 35238.41 },
  { threshold: 35000, space: 'taxable', ral: 38542.01 },
  { threshold: 40000, space: 'taxable', ral: 44048.01 },
  { threshold: 50000, space: 'taxable', ral: 55060.02 },
  { threshold: 56224, space: 'gross', ral: 56224.00 },
  { threshold: 122295, space: 'gross', ral: 122295.00 }
];

var runTests = function runTests(engine, t) {

  // ------------------------------------------------------------- unit rules

  t.group('Troncamento art. 13 comma 6');
  t.close('esempio Agenzia Entrate 0,623381 -> 0,6233', engine.truncate(0.623381, 4), 0.6233, 1e-12);
  t.close('tronca, non arrotonda: 0,99999 -> 0,9999', engine.truncate(0.99999, 4), 0.9999, 1e-12);
  t.close('valore gia a quattro cifre resta invariato', engine.truncate(0.0582, 4), 0.0582, 1e-12);
  t.close('caso a rischio virgola mobile 0,29', engine.truncate(0.29, 4), 0.29, 1e-12);
  t.close('caso a rischio virgola mobile 0,615', engine.truncate(0.615, 4), 0.615, 1e-12);
  t.close('rapporto del caso 30.000', engine.truncate(757 / 13000, 4), 0.0582, 1e-12);
  t.close('rapporto del caso 35.000', engine.truncate(18216.5 / 22000, 4), 0.8280, 1e-12);

  t.group('Validazione input');
  t.throws('RAL negativa', function () { engine.calculateNet(-1); });
  t.throws('RAL non numerica', function () { engine.calculateNet('30000'); });
  t.throws('RAL oltre il limite', function () { engine.calculateNet(engine.maxRal + 1); });
  t.throws('mensilita non ammesse', function () { engine.calculateNet(30000, { months: 15 }); });
  t.ok('RAL zero e ammessa', engine.calculateNet(0).netAnnual === 0);

  // ------------------------------------------------------------ value cases

  t.group('Casi di valore');
  VALUE_CASES.forEach(function (c) {
    var r = engine.calculateNet(c.ral, { months: c.months });
    var tag = 'RAL ' + c.ral + ' (' + c.note + ')';

    t.close(tag + ' - contributi', r.contributions.total, c.contributions);
    t.close(tag + ' - imponibile', r.taxableIncome, c.taxable);
    t.close(tag + ' - IRPEF lorda', r.irpef.gross, c.irpefGross);
    t.close(tag + ' - detrazioni totali', r.irpef.deductions.total, c.deductionsTotal);
    t.close(tag + ' - IRPEF netta', r.irpef.net, c.irpefNet);
    t.close(tag + ' - addizionale regionale', r.surtaxes.regional, c.regional);
    t.close(tag + ' - addizionale comunale', r.surtaxes.municipal, c.municipal);
    t.equal(tag + ' - tipo cuneo', r.wedge.type, c.wedgeType);
    t.close(tag + ' - importo cuneo', r.wedge.amount, c.wedgeAmount);
    t.close(tag + ' - trattamento integrativo', r.supplementaryAllowance.amount, c.supplementary);
    t.close(tag + ' - netto annuo', r.netAnnual, c.netAnnual);

    if (c.netMonthly !== undefined) {
      t.close(tag + ' - netto mensile', r.netMonthly, c.netMonthly);
    }
  });

  // -------------------------------------------------------- structural: ledger

  t.group('La traccia ricostruisce il netto');
  VALUE_CASES.forEach(function (c) {
    var r = engine.calculateNet(c.ral, { months: c.months });
    var rebuilt = r.ledger.reduce(function (sum, entry) {
      return sum + entry.sign * entry.amount;
    }, r.ral);
    t.close('RAL ' + c.ral, rebuilt, r.netAnnual, 1e-9);
  });

  t.group('Ogni voce della traccia cita una fonte esistente');
  var orphans = [];
  VALUE_CASES.forEach(function (c) {
    engine.calculateNet(c.ral).ledger.forEach(function (entry) {
      if (!engine.parameters.sources[entry.sourceId]) orphans.push(entry.id + ' -> ' + entry.sourceId);
    });
  });
  t.ok('nessuna citazione orfana', orphans.length === 0, orphans.join(', '));

  // --------------------------------------------------- structural: breakpoints

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
   * is affine between breakpoints, so a line fitted on two interior points must
   * reproduce the engine at a third. A failure means a threshold is missing from
   * getBreakpoints().
   */
  t.group('Completezza dei punti di rottura (modello affine)');
  var bounds = [0].concat(
    breakpoints.map(function (bp) { return bp.ral; }).filter(function (r) {
      return r > 0 && r < engine.maxRal;
    })
  ).concat([engine.maxRal]);

  for (var i = 0; i < bounds.length - 1; i++) {
    var lo = bounds[i];
    var hi = bounds[i + 1];
    if (hi - lo < 1e-6) continue;

    var span = hi - lo;
    var smooth = { months: 13, exactRatios: true };
    var x1 = lo + span / 3;
    var x2 = lo + (2 * span) / 3;
    var y1 = engine.calculateNet(x1, smooth).netAnnual;
    var y2 = engine.calculateNet(x2, smooth).netAnnual;

    var slope = (y2 - y1) / (x2 - x1);
    var intercept = y1 - slope * x1;

    var probe = lo + span / 2;
    var predicted = slope * probe + intercept;
    var actual = engine.calculateNet(probe, smooth).netAnnual;

    t.close(
      'segmento ' + lo.toFixed(2) + ' - ' + hi.toFixed(2) + ' e affine',
      actual, predicted, 1e-6
    );
  }

  /**
   * The truncation turns the deduction into a staircase stepping every 1,30 euro
   * of income. The step is worth at most coefficient * 1e-4, so the statutory
   * result never drifts more than about 20 cents from the smooth model.
   */
  t.group('Scarto introdotto dal troncamento');
  var worstGap = 0;
  for (var ral = 10000; ral <= 80000; ral += 37) {
    var statutory = engine.calculateNet(ral, { months: 13 }).netAnnual;
    var idealised = engine.calculateNet(ral, { months: 13, exactRatios: true }).netAnnual;
    var gap = idealised - statutory;
    if (gap > worstGap) worstGap = gap;
    if (gap < -1e-9) worstGap = 999;
  }
  t.ok('il troncamento non aumenta mai il netto', worstGap < 999);
  t.ok('scarto massimo sotto i 20 centesimi (' + worstGap.toFixed(4) + ')', worstGap < 0.20);

  // -------------------------------------------------- structural: emergent facts

  t.group('No tax area emergente');
  var noTaxArea = breakpoints.filter(function (bp) { return bp.id === 'no-tax-area'; })[0];
  t.ok('il punto esiste', !!noTaxArea);
  t.close('cade esattamente a imponibile 8.500', noTaxArea ? noTaxArea.threshold : NaN, 8500, 1e-9);
  t.close('IRPEF netta nulla appena sotto', engine.calculateNet(noTaxArea.ral - 1).irpef.net, 0, 1e-9);
  t.ok('IRPEF netta positiva appena sopra', engine.calculateNet(noTaxArea.ral + 1).irpef.net > 0);

  t.group('Limiti e monotonia');
  [5000, 12000, 20000, 30000, 45000, 70000, 150000].forEach(function (ral) {
    var r = engine.calculateNet(ral);
    t.ok('RAL ' + ral + ': netto tra zero e lordo', r.netAnnual >= 0 && r.netAnnual <= ral);
  });

  var drops = [
    { taxable: 8500, label: 'cambio fascia somma esente' },
    { taxable: 23000, label: 'soglia esenzione comunale' }
  ];
  drops.forEach(function (d) {
    var ral = engine.grossFromTaxable(d.taxable);
    var before = engine.calculateNet(ral - 1).netAnnual;
    var after = engine.calculateNet(ral + 1).netAnnual;
    t.ok('il netto scende attraversando imponibile ' + d.taxable + ' (' + d.label + ')',
      after < before, 'prima ' + before.toFixed(2) + ', dopo ' + after.toFixed(2));
  });

  // ------------------------------------------------------ structural: inversion

  t.group('Inversione, andata e ritorno');
  [18000, 30000, 35000, 45000, 60000, 90000].forEach(function (ral) {
    var target = engine.calculateNet(ral, { months: 13 }).netAnnual;
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
    var target = engine.calculateNet(ral, { months: 13 }).netAnnual;
    var exact = engine.solveGrossFromNet(target, { months: 13 });
    var oracle = engine.solveGrossFromNetBinary(target, { months: 13 });
    t.close('netto da RAL ' + ral + ': i due metodi concordano',
      exact.found ? exact.ral : NaN, oracle, 0.05);
  });

  /**
   * The two kinds of discontinuity behave in opposite ways, and confusing them
   * is easy: a jump up leaves net values no gross can reach, a jump down lets
   * two different gross figures land on the same net.
   */
  t.group('Salti in su: netti irraggiungibili');
  var upBp = breakpoints.filter(function (bp) {
    return bp.id === 'supplementary-allowance-start';
  })[0];

  t.ok('la soglia di capienza del trattamento integrativo esiste', !!upBp);

  var upRal = upBp.ral;
  var underGap = engine.calculateNet(upRal - 0.5, { months: 13 }).netAnnual;
  var overGap = engine.calculateNet(upRal + 0.5, { months: 13 }).netAnnual;

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
    engine.calculateNet(upRal + 1).supplementaryAllowance.amount, ti.amount);
  t.close('non spetta appena sotto',
    engine.calculateNet(upRal - 1).supplementaryAllowance.amount, 0);
  t.close('spetta ancora all ultimo euro della prima fascia',
    engine.calculateNet(engine.grossFromTaxable(ti.incomeUpTo) - 0.5).supplementaryAllowance.amount,
    ti.amount);

  /**
   * Above the flat band only the art. 13 deduction feeds the differential, and
   * it never exceeds gross tax without dependants or deductible charges, so the
   * allowance is zero throughout. Worth asserting: it is the reason the second
   * band needs no further modelling.
   */
  var anyInSecondBand = 0;
  for (var band = ti.incomeUpTo + 100; band <= ti.secondBandUpTo; band += 250) {
    anyInSecondBand += engine.calculateNet(engine.grossFromTaxable(band)).supplementaryAllowance.amount;
  }
  t.close('nella seconda fascia resta sempre zero nel caso modellato', anyInSecondBand, 0);

  t.group('Salti in giu: stesso netto da due RAL');
  var stepRal = engine.grossFromTaxable(engine.parameters.employmentDeduction.flatUpTo);
  t.ok('perso il trattamento integrativo, il gradino art. 13 diventa un salto in giu',
    engine.calculateNet(stepRal + 0.5).netAnnual < engine.calculateNet(stepRal - 0.5).netAnnual,
    'sotto ' + engine.calculateNet(stepRal - 0.5).netAnnual.toFixed(2) +
    ', sopra ' + engine.calculateNet(stepRal + 0.5).netAnnual.toFixed(2));

  var downRal = engine.grossFromTaxable(23000);
  var beforeDrop = engine.calculateNet(downRal - 0.5, { months: 13 }).netAnnual;
  var afterDrop = engine.calculateNet(downRal + 0.5, { months: 13 }).netAnnual;

  t.ok('la soglia comunale fa scendere il netto', afterDrop < beforeDrop,
    'sotto ' + beforeDrop.toFixed(2) + ', sopra ' + afterDrop.toFixed(2));

  var doubled = engine.solveGrossFromNet((beforeDrop + afterDrop) / 2, { months: 13 });
  t.ok('lo stesso netto e prodotto da piu di una RAL', doubled.found && doubled.solutions.length > 1,
    doubled.found ? doubled.solutions.length + ' soluzioni' : 'nessuna soluzione');
  t.ok('viene restituita la RAL minima',
    doubled.found && doubled.ral === Math.min.apply(null, doubled.solutions));

  return t.summary();
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VALUE_CASES: VALUE_CASES, BREAKPOINT_CASES: BREAKPOINT_CASES, runTests: runTests };
}
