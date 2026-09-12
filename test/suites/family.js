// @ts-check
'use strict';

/**
 * Detrazioni per carichi di famiglia. Hanno un orologio proprio, i mesi di
 * famiglia e non i giorni di lavoro, e sono quelle che accendono la seconda
 * fascia del trattamento integrativo.
 */
var SUITE_FAMILY = function (context) {
  var engine = context.engine;
  var t = context.t;

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
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_FAMILY;
}
