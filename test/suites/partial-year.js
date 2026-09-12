// @ts-check
'use strict';

/**
 * Rapporti che non coprono l anno intero. Quasi tutto si ragguaglia ai giorni,
 * ma non tutto, e le eccezioni sono il motivo per cui questa suite esiste.
 */
var SUITE_PARTIAL_YEAR = function (context) {
  var engine = context.engine;
  var t = context.t;

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
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_PARTIAL_YEAR;
}
