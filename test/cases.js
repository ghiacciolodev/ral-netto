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

/**
 * Values hand-computed for 2025, the year where the second bracket is still 35%
 * and the contribution thresholds are lower.
 */
var VALUE_CASES_2025 = [
  {
    ral: 50000, months: 13, note: 'seconda aliquota al 35%, non al 33%',
    contributions: 4595.00, taxable: 45405.00, irpefGross: 12531.75,
    irpefNet: 12132.94, regional: 689.27, municipal: 363.24,
    netAnnual: 32219.55
  },
  {
    ral: 56000, months: 13, note: 'sopra la prima fascia 2025, che nel 2026 non lo sarebbe',
    contributions: 5151.92, taxable: 50848.08, irpefGross: 14504.67,
    irpefNet: 14504.67, regional: 782.97, municipal: 406.78,
    netAnnual: 35153.65
  }
];

/** Every leaf path where two parameter sets disagree. */
function diffPaths(a, b, prefix) {
  var keys = {};
  Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { keys[k] = true; });

  return Object.keys(keys).reduce(function (paths, key) {
    var here = prefix ? prefix + '.' + key : key;
    var left = (a || {})[key];
    var right = (b || {})[key];

    if (left && right && typeof left === 'object' && typeof right === 'object') {
      return paths.concat(diffPaths(left, right, here));
    }
    return left === right ? paths : paths.concat([here]);
  }, []);
}

var runTests = function runTests(engine, t, registry) {

  // ------------------------------------------------------------- unit rules

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

  t.group('Rapporto inferiore all anno');

  /**
   * Worked example from circ. Agenzia Entrate 4/E 2025: 2.000 euro of employment
   * income over 62 days projects to about 11.774, which selects the 5,3% band,
   * and 5,3% of the 2.000 actually received is 106.
   */
  var short62 = engine.calculateNet({
    grossAnnual: engine.grossFromTaxable(2000), daysWorked: 62
  });
  t.close('esempio AdE: imponibile proiettato all anno', short62.wedge.projectedIncome, 11774.19, 0.05);
  t.close('esempio AdE: aliquota scelta sul proiettato', short62.wedge.rate, 0.053, 1e-12);
  t.close('esempio AdE: somma esente sul reddito percepito', short62.wedge.amount, 106.00, 0.01);

  /**
   * A short fixed-term contract: the apportioned deduction falls under the
   * guaranteed minimum, which is not itself apportioned and therefore wins.
   */
  var halfYear = engine.calculateNet({
    grossAnnual: 15000, months: 13, daysWorked: 180, contractType: 'fixed-term'
  });
  t.ok('il minimo garantito scatta', halfYear.irpef.deductions.minimumApplied === true);
  t.close('detrazione pari al minimo a tempo determinato', halfYear.irpef.deductions.employment, 1380.00);
  t.close('trattamento integrativo ragguagliato', halfYear.supplementaryAllowance.amount, 591.78);
  t.close('somma esente sul reddito percepito', halfYear.wedge.amount, 653.83);
  t.close('netto annuo', halfYear.netAnnual, 12946.62);

  var halfYearPermanent = engine.calculateNet({
    grossAnnual: 15000, months: 13, daysWorked: 180, contractType: 'permanent'
  });
  t.close('a tempo indeterminato il minimo e 690', halfYearPermanent.irpef.deductions.employment, 964.11);
  t.ok('sopra il minimo indeterminato non scatta nulla',
    halfYearPermanent.irpef.deductions.minimumApplied === false);

  /** Half the days on the same pay leaves more tax, never less. */
  var full = engine.calculateNet({ grossAnnual: 15000, months: 13 });
  t.ok('meno giorni non possono aumentare le detrazioni',
    halfYearPermanent.irpef.deductions.total <= full.irpef.deductions.total);

  t.close('a 365 giorni la detrazione resta quella piena', full.irpef.deductions.employment, 1955.00);
  t.ok('e il minimo non scatta mai su un anno intero', full.irpef.deductions.minimumApplied === false);

  t.group('Familiari a carico');

  /**
   * Art. 12 has its own clock. These two positions differ only in the days
   * worked, and the art. 13 deduction halves while the spouse deduction does
   * not move at all: comma 3 counts months of family, not days of work.
   */
  var spouseFullYear = engine.calculateNet({
    grossAnnual: 30000, months: 13, family: { spouse: true }
  });
  var spouseHalfYear = engine.calculateNet({
    grossAnnual: 30000, months: 13, daysWorked: 180, family: { spouse: true }
  });
  t.close('coniuge, seconda fascia a importo fisso', spouseFullYear.irpef.deductions.family.spouse, 690.00);
  t.close('i giorni non toccano l art. 12', spouseHalfYear.irpef.deductions.family.spouse, 690.00);
  t.close('mentre l art. 13 si dimezza', spouseHalfYear.irpef.deductions.employment, 976.07);

  var spouseSixMonths = engine.calculateNet({
    grossAnnual: 30000, months: 13, family: { spouse: true, months: 6 }
  });
  t.close('sei mesi di coniuge a carico valgono meta detrazione',
    spouseSixMonths.irpef.deductions.family.spouse, 345.00);

  /**
   * Two children at 30.000: the ceiling is 95.000 raised by 15.000 for the
   * second child, and the ratio is truncated to four decimals like art. 13.
   */
  var twoChildrenHalf = engine.calculateNet({
    grossAnnual: 30000, months: 13, family: { spouse: true, children: 2 }
  });
  t.close('due figli, quota di legge al 50%', twoChildrenHalf.irpef.deductions.family.children, 714.69);
  t.close('coniuge e figli insieme', twoChildrenHalf.irpef.deductions.family.total, 1404.69);
  t.close('netto annuo', twoChildrenHalf.netAnnual, 24830.17);

  var twoChildrenWhole = engine.calculateNet({
    grossAnnual: 30000, months: 13, family: { spouse: true, children: 2, childrenSharePercent: 100 }
  });
  t.close('la detrazione intera vale il doppio della meta',
    twoChildrenWhole.irpef.deductions.family.children, 1429.37);
  t.close('netto annuo con detrazione intera', twoChildrenWhole.netAnnual, 25544.85);

  var exactChildren = engine.calculateNet({
    grossAnnual: 30000, months: 13, family: { children: 2, childrenSharePercent: 100 }
  }, { exactRatios: true });
  t.ok('il troncamento del comma 4 non aumenta mai la detrazione',
    twoChildrenWhole.irpef.deductions.family.children - 690 <=
    exactChildren.irpef.deductions.family.children + 1e-9);

  t.close('ascendente convivente, rapporto su 80.000',
    engine.calculateNet({ grossAnnual: 60000, months: 13, family: { ascendants: 1 } })
      .irpef.deductions.family.ascendants, 239.48);

  /** Comma 4: a ratio of zero or less cancels the deduction outright. */
  var aboveCeiling = engine.calculateNet({
    grossAnnual: 90000, months: 13, family: { spouse: true, ascendants: 1 }
  });
  t.close('sopra 80.000 di reddito il coniuge non spetta piu',
    aboveCeiling.irpef.deductions.family.spouse, 0, 1e-9);
  t.close('e nemmeno l ascendente', aboveCeiling.irpef.deductions.family.ascendants, 0, 1e-9);

  /**
   * The second band of the trattamento integrativo, which was dead code until
   * art. 12 arrived. It pays the excess of the art. 12 and art. 13 comma 1
   * deductions over gross tax, capped at the flat amount.
   */
  var lowIncomeFamily = engine.calculateNet({
    grossAnnual: 20000, months: 13, family: { spouse: true, children: 3, childrenSharePercent: 100 }
  });
  t.close('detrazioni oltre l imposta lorda', lowIncomeFamily.irpef.deductions.total, 5936.37);
  t.close('imposta netta azzerata', lowIncomeFamily.irpef.net, 0, 1e-9);
  t.close('eccedenza persa per incapienza', lowIncomeFamily.irpef.deductions.lostToInsufficientTax, 1759.11);
  t.equal('siamo nella seconda fascia', lowIncomeFamily.supplementaryAllowance.band, 'differenziale');
  t.close('e il trattamento integrativo arriva al massimo',
    lowIncomeFamily.supplementaryAllowance.amount, 1200.00);
  t.ok('con una RAL di 20.000 arriva a casa quasi tutto',
    lowIncomeFamily.netAnnual > 19990 && lowIncomeFamily.netAnnual < 20000);
  t.close('netto annuo', lowIncomeFamily.netAnnual, 19999.32);

  /**
   * The list in DL 3/2020 does not include the wedge deduction, so a taxpayer
   * can lose part of it to insufficient tax and still receive nothing from the
   * second band. The two tests of capienza are not the same test.
   */
  var wedgeLost = engine.calculateNet({
    grossAnnual: 25000, months: 13, family: { spouse: true, children: 2, childrenSharePercent: 100 }
  });
  t.close('detrazioni perse per incapienza', wedgeLost.irpef.deductions.lostToInsufficientTax, 371.19);
  t.close('ma la detrazione cuneo non entra nel trattamento integrativo',
    wedgeLost.supplementaryAllowance.amount, 0, 1e-9);

  /**
   * Comma 1 lett. b) raises the spouse deduction in steps and then lets it fall
   * back. Going up in income can therefore cost money, which is a second source
   * of non monotonicity alongside the wedge and the municipal threshold.
   */
  function withSpouseAtTaxable(taxable) {
    return engine.calculateNet({
      grossAnnual: engine.grossFromTaxable(taxable), months: 13, family: { spouse: true }
    });
  }
  var beforeStep = withSpouseAtTaxable(28999);
  var afterStep = withSpouseAtTaxable(29001);
  t.close('sotto 29.000 nessuna maggiorazione', beforeStep.irpef.deductions.family.spouse, 690.00);
  t.close('sopra 29.000 la maggiorazione di 10 euro', afterStep.irpef.deductions.family.spouse, 700.00);
  t.ok('il gradino fa salire il netto piu di quanto salga il reddito',
    afterStep.netAnnual - beforeStep.netAnnual > 10);

  var beforeDrop = withSpouseAtTaxable(35199);
  var afterDrop = withSpouseAtTaxable(35201);
  t.close('l ultima maggiorazione vale 10 euro', beforeDrop.irpef.deductions.family.spouse, 700.00);
  t.close('e oltre 35.200 sparisce', afterDrop.irpef.deductions.family.spouse, 690.00);
  t.ok('due euro di reddito in piu fanno scendere il netto',
    afterDrop.netAnnual < beforeDrop.netAnnual);

  t.group('Soglie dei familiari a carico');

  function thresholdIds(family) {
    return engine.getBreakpoints({ family: family }).reduce(function (all, bp) {
      return all.concat(bp.ids);
    }, []);
  }
  var noFamilyIds = thresholdIds({});
  var spouseIds = thresholdIds({ spouse: true });
  var childIds = thresholdIds({ children: 2 });

  t.ok('senza familiari nessuna soglia art. 12',
    noFamilyIds.indexOf('spouse-band-1') === -1 && noFamilyIds.indexOf('children-deduction-end') === -1);
  t.ok('col coniuge compaiono le fasce del coniuge',
    spouseIds.indexOf('spouse-band-1') !== -1 && spouseIds.indexOf('spouse-band-3') !== -1);
  t.ok('e i gradini della maggiorazione', spouseIds.indexOf('spouse-increase-1-start') !== -1);

  var childCeiling = engine.getBreakpoints({ family: { children: 2 } }).filter(function (bp) {
    return bp.ids.indexOf('children-deduction-end') !== -1;
  })[0];
  t.ok('coi figli compare il tetto', !!childCeiling);
  t.close('che sale di 15.000 per il secondo figlio',
    childCeiling ? childCeiling.threshold : NaN, 110000, 1e-9);
  t.ok('senza figli il tetto non c e', childIds.indexOf('spouse-band-1') === -1);

  /**
   * With dependants the income can leave the incapienza and fall back into it:
   * the art. 13 deduction steps up at 15.000 and the wedge turns into a
   * deduction at 20.000, and each step can swallow gross tax again.
   */
  var reentry = engine.getBreakpoints({ family: { spouse: true, children: 2 } }).filter(function (bp) {
    return bp.ids.indexOf('no-tax-area-2') !== -1;
  });
  t.ok('l uscita dall incapienza puo avvenire piu di una volta', reentry.length === 1);

  t.group('Validazione dei familiari a carico');

  t.throws('familiari non oggetto', function () {
    engine.calculateNet({ grossAnnual: 30000, family: 'coniuge' });
  });
  t.throws('numero di figli non intero', function () {
    engine.calculateNet({ grossAnnual: 30000, family: { children: 1.5 } });
  });
  t.throws('numero di figli negativo', function () {
    engine.calculateNet({ grossAnnual: 30000, family: { children: -1 } });
  });
  t.throws('quota figli fuori scala', function () {
    engine.calculateNet({ grossAnnual: 30000, family: { children: 1, childrenSharePercent: 150 } });
  });
  t.throws('mesi a carico oltre dodici', function () {
    engine.calculateNet({ grossAnnual: 30000, family: { spouse: true, months: 13 } });
  });
  t.throws('mesi a carico a zero', function () {
    engine.calculateNet({ grossAnnual: 30000, family: { spouse: true, months: 0 } });
  });

  t.ok('senza familiari il risultato non cambia di un centesimo',
    Math.abs(engine.calculateNet({ grossAnnual: 30000, months: 13 }).netAnnual -
      engine.calculateNet({ grossAnnual: 30000, months: 13, family: {} }).netAnnual) < 1e-9);

  t.ok('withGross porta con se i familiari',
    engine.withGross({ months: 13, family: { spouse: true, children: 2 } }, 30000)
      .family.children === 2);

  t.group('Anno d imposta 2025');
  if (!registry) {
    t.ok('registro degli anni disponibile', false, 'runTests chiamato senza registro');
  } else {
    var e2025 = engine.forTaxYear(2025);

    t.equal('il registro contiene 2025 e 2026', registry.years.join(','), '2025,2026');
    t.equal('il motore 2025 e legato al suo anno', e2025.taxYear, 2025);

    VALUE_CASES_2025.forEach(function (c) {
      var r = e2025.calculateNet({ grossAnnual: c.ral, months: c.months });
      var tag = '2025 RAL ' + c.ral + ' (' + c.note + ')';
      t.close(tag + ' - contributi', r.contributions.total, c.contributions);
      t.close(tag + ' - imponibile', r.taxableIncome, c.taxable);
      t.close(tag + ' - IRPEF lorda', r.irpef.gross, c.irpefGross);
      t.close(tag + ' - IRPEF netta', r.irpef.net, c.irpefNet);
      t.close(tag + ' - addizionale regionale', r.surtaxes.regional, c.regional);
      t.close(tag + ' - addizionale comunale', r.surtaxes.municipal, c.municipal);
      t.close(tag + ' - netto annuo', r.netAnnual, c.netAnnual);
    });

    /**
     * Art. 12 is the same text in both years, so the deduction has to come out
     * identical while the tax on top of it does not. The drift guard below
     * proves the first claim on the parameters; this shows it on a result.
     */
    var family2025 = e2025.calculateNet({
      grossAnnual: 40000, months: 13,
      family: { spouse: true, children: 1, childrenSharePercent: 100 }
    });
    var family2026 = engine.calculateNet({
      grossAnnual: 40000, months: 13,
      family: { spouse: true, children: 1, childrenSharePercent: 100 }
    });
    t.close('2025, coniuge e un figlio', family2025.irpef.deductions.family.total, 1276.72);
    t.close('la detrazione art. 12 non cambia nel 2026',
      family2026.irpef.deductions.family.total, family2025.irpef.deductions.family.total, 1e-9);
    t.close('ma la seconda aliquota si, e il netto sale di 166,48',
      family2026.netAnnual - family2025.netAnnual, 166.48);

    /**
     * Drift guard. The two year files are full copies on purpose, so the risk is
     * that a fix lands in one and not the other. This asserts that the parameters
     * differ in exactly the places they are meant to, and nowhere else.
     */
    var expected = [
      'taxYear',
      'irpef.brackets.1.rate',
      'contributions.additionalThreshold',
      'contributions.cap',
      'contributions.sourceId'
    ].sort();

    var found = diffPaths(registry.byYear[2025], registry.byYear[2026], '')
      .filter(function (path) { return path.indexOf('sources') !== 0; })
      .sort();

    t.equal('2025 e 2026 differiscono solo dove devono',
      found.join(' | '), expected.join(' | '));
  }

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

  // ------------------------------------------------------------ value cases

  t.group('Casi di valore');
  VALUE_CASES.forEach(function (c) {
    var r = engine.calculateNet({ grossAnnual: c.ral, months: c.months });
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
    var r = engine.calculateNet({ grossAnnual: c.ral, months: c.months });
    var rebuilt = r.ledger.reduce(function (sum, entry) {
      return sum + entry.sign * entry.amount;
    }, r.ral);
    t.close('RAL ' + c.ral, rebuilt, r.netAnnual, 1e-9);
  });

  t.group('Ogni voce della traccia cita una fonte esistente');
  var orphans = [];
  VALUE_CASES.forEach(function (c) {
    engine.calculateNet({ grossAnnual: c.ral }).ledger.forEach(function (entry) {
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
  t.group('Scarto da troncamento con familiari a carico');
  var crowded = {
    months: 13,
    family: { spouse: true, children: 3, childrenSharePercent: 100, ascendants: 2 }
  };
  var employment = engine.parameters.employmentDeduction;
  var carichi = engine.parameters.familyDeduction;
  var unit = Math.pow(10, -carichi.truncationDigits);
  var bound = unit * (
    Math.max.apply(null, employment.bands.map(function (band) { return band.coefficient; })) +
    carichi.spouse.lastBand.amount +
    carichi.children.amount * crowded.family.children +
    carichi.ascendants.amount * crowded.family.ascendants
  );

  var crowdedWorst = 0;
  var crowdedNegative = false;
  for (var crowdedRal = 10000; crowdedRal <= 90000; crowdedRal += 17) {
    var statutoryNet = engine.calculateNet(engine.withGross(crowded, crowdedRal)).netAnnual;
    var smoothNet = engine.calculateNet(
      engine.withGross(crowded, crowdedRal), { exactRatios: true }).netAnnual;
    var drift = smoothNet - statutoryNet;
    if (drift > crowdedWorst) crowdedWorst = drift;
    if (drift < -1e-9) crowdedNegative = true;
  }

  t.ok('il troncamento non aumenta mai il netto', !crowdedNegative);
  t.ok('scarto massimo sotto il limite teorico di ' + bound.toFixed(4) +
    ' (' + crowdedWorst.toFixed(4) + ')', crowdedWorst < bound);

  // -------------------------------------------------- structural: emergent facts

  t.group('No tax area emergente');
  var noTaxArea = breakpoints.filter(function (bp) { return bp.ids.indexOf('no-tax-area') !== -1; })[0];
  t.ok('il punto esiste', !!noTaxArea);
  t.close('cade esattamente a imponibile 8.500', noTaxArea ? noTaxArea.threshold : NaN, 8500, 1e-9);
  t.close('IRPEF netta nulla appena sotto', engine.calculateNet({ grossAnnual: noTaxArea.ral - 1 }).irpef.net, 0, 1e-9);
  t.ok('IRPEF netta positiva appena sopra', engine.calculateNet({ grossAnnual: noTaxArea.ral + 1 }).irpef.net > 0);

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

  // ------------------------------------------------------ structural: inversion

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

  return t.summary();
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VALUE_CASES: VALUE_CASES, BREAKPOINT_CASES: BREAKPOINT_CASES, runTests: runTests };
}
