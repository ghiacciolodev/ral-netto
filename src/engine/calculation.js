// @ts-check
'use strict';

/**
 * Running the rules once, and collecting what they leave behind.
 *
 * Nothing in here decides what happens or in what order. It builds the context,
 * folds the rules over it, and shapes the answer.
 */

var ENGINE_CALCULATION = function (RULES, position, steps) {
  var normalizePosition = position.normalizePosition;
  var normalizeOptions = position.normalizeOptions;
  var computeEmployerCost = steps.computeEmployerCost;

  /**
   * @param {object} input the position, see normalizePosition
   * @param {{exactRatios?: boolean}} [options]
   */
  function calculateNet(input, options) {
    var position = normalizePosition(input);
    var opts = normalizeOptions(options);

    /**
     * The calculation in progress. Each rule reads what the earlier ones left
     * here and adds its own result, so RULES is the pipeline and nothing else
     * decides the order.
     */
    var ctx = {
      position: position,
      exactRatios: opts.exactRatios,
      ral: position.grossAnnual,
      deductions: []
    };

    RULES.forEach(function (rule) {
      rule.apply(ctx);
    });

    /**
     * Written out rather than folded from the trail, on purpose. The trail has
     * to reconstruct this number and a test asserts that it does, which only
     * proves something as long as the two are arrived at separately. Adding a
     * trail entry means adding a term here, and forgetting to is exactly what
     * that test catches.
     */
    var netAnnual = ctx.ral - ctx.contributions.total - ctx.irpefNet -
      ctx.surtaxes.total + ctx.exemptSum + ctx.supplementary.amount;

    return {
      position: position,
      ral: ctx.ral,
      months: position.months,
      contributions: {
        ivs: ctx.contributions.ivs,
        additionalRate: ctx.contributions.additionalRate,
        total: ctx.contributions.total,
        capApplied: ctx.contributions.capApplied
      },
      taxableIncome: ctx.taxable,
      irpef: {
        gross: ctx.irpefGross.total,
        byBracket: ctx.irpefGross.detail,
        deductions: {
          employment: ctx.employmentDeduction.employment,
          bonus65: ctx.employmentDeduction.bonus,
          ratio: ctx.employmentDeduction.ratio,
          minimumApplied: ctx.employmentDeduction.minimumApplied,
          family: {
            spouse: ctx.familyDeduction.spouse,
            children: ctx.familyDeduction.children,
            ascendants: ctx.familyDeduction.ascendants,
            total: ctx.familyDeduction.total
          },
          wedge: ctx.wedgeDeduction,
          total: ctx.deductionsTotal,
          lostToInsufficientTax: ctx.lostToInsufficientTax
        },
        net: ctx.irpefNet
      },
      wedge: {
        type: ctx.wedge.type,
        amount: ctx.wedge.amount,
        rate: ctx.wedge.rate,
        projectedIncome: ctx.wedge.projectedIncome === undefined
          ? null
          : ctx.wedge.projectedIncome
      },
      supplementaryAllowance: {
        amount: ctx.supplementary.amount,
        band: ctx.supplementary.band
      },
      surtaxes: {
        regional: ctx.surtaxes.regional,
        regionalDetail: ctx.surtaxes.regionalDetail,
        municipal: ctx.surtaxes.municipal,
        municipalExempt: ctx.surtaxes.municipalExempt,
        total: ctx.surtaxes.total
      },
      netAnnual: netAnnual,
      netMonthly: netAnnual / position.months,
      employerCost: computeEmployerCost(ctx.ral),
      ledger: buildLedger(ctx)
    };
  }

  /**
   * The gross-to-net trail, collected from whichever rules declare one. Load
   * bearing, not decoration: the UI renders only this, and a test asserts that
   * it reconstructs the net exactly.
   *
   * What goes out is listed before what comes in. A payslip reads that way, and
   * the waterfall chart is drawn on it: the drops first, then the credits.
   */
  function buildLedger(ctx) {
    var entries = [];

    RULES.forEach(function (rule) {
      if (!rule.ledger) return;
      rule.ledger(ctx).forEach(function (entry) {
        entries.push(entry);
      });
    });

    function withSign(sign) {
      return entries.filter(function (entry) {
        return entry.sign === sign;
      });
    }

    return withSign(-1).concat(withSign(1));
  }

  return {
    calculateNet: calculateNet
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_CALCULATION;
}
