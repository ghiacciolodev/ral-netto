// @ts-check
'use strict';

/**
 * I casi di valore: RAL nota, netto atteso calcolato a mano sulla norma. Se il
 * motore non e d accordo, si guarda il motore.
 */
var SUITE_VALUES = function (context) {
  var engine = context.engine;
  var t = context.t;
  var VALUE_CASES = context.fixtures.VALUE_CASES;

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
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_VALUES;
}
