// @ts-check
'use strict';

/**
 * The provisions as objects, each carrying its calculation, its trail entry and
 * its thresholds together. The array is also the order of the steps.
 */

var ENGINE_RULES = function (parameters, numbers, steps) {
  var applyBrackets = numbers.applyBrackets;
  var isNotNull = numbers.isNotNull;
  var formatAmount = numbers.formatAmount;
  var formatRate = numbers.formatRate;

  var computeContributions = steps.computeContributions;
  var computeEmploymentDeduction = steps.computeEmploymentDeduction;
  var computeFamilyDeduction = steps.computeFamilyDeduction;
  var computeWedgeRelief = steps.computeWedgeRelief;
  var computeSupplementaryAllowance = steps.computeSupplementaryAllowance;
  var computeSurtaxes = steps.computeSurtaxes;

  /**
   * One object per provision, carrying up to three faces: what it computes,
   * what it writes in the trail, and which thresholds it introduces.
   *
   * They live together on purpose. They used to live in three separate
   * functions, and adding a provision while forgetting two of them failed
   * quietly: the figure came out right while the trail and the threshold list
   * went stale, and nothing said so.
   *
   * `apply` reads the calculation in progress and adds to it, so this array is
   * also the order of the steps. That order is the statute's, not an
   * implementation detail, which is why it is written out rather than inferred.
   *
   * `ledger` and `thresholds` are optional. A provision that reaches the net
   * through the tax rather than beside it, like the art. 13 deduction, has no
   * trail entry of its own.
   */
  var RULES = [
    /** The cap truncates the IVS rate and the additional 1% alike. */
    {
      id: 'contributions',
      apply: function (ctx) {
        ctx.contributions = computeContributions(ctx.ral);
        ctx.taxable = ctx.ral - ctx.contributions.total;

        // Single-income case: total income, employment income and taxable base
        // are the same number. Kept apart so that adding other income later
        // does not mean rewriting every rule that reads them.
        ctx.totalIncome = ctx.taxable;
        ctx.employmentIncome = ctx.taxable;
      },
      ledger: function (ctx) {
        var c = parameters.contributions;
        var entries = [{
          id: 'contributions.ivs',
          label: 'Contributi IVS a carico dipendente',
          sign: -1,
          base: ctx.contributions.base,
          formula: formatRate(c.ivsRate) + ' di ' + formatAmount(ctx.contributions.base) +
            (ctx.contributions.capApplied ? ' (base limitata al massimale)' : ''),
          amount: ctx.contributions.ivs,
          sourceId: c.ivsSourceId
        }];

        if (ctx.contributions.additionalRate > 0) {
          entries.push({
            id: 'contributions.additional',
            label: 'Contributo aggiuntivo IVS 1%',
            sign: -1,
            base: ctx.contributions.base - c.additionalThreshold,
            formula: formatRate(c.additionalRate) + ' sulla quota oltre ' +
              formatAmount(c.additionalThreshold),
            amount: ctx.contributions.additionalRate,
            sourceId: c.sourceId
          });
        }

        return entries;
      },
      thresholds: function () {
        var c = parameters.contributions;
        return [
          {
            space: 'gross', threshold: c.additionalThreshold,
            id: 'additional-contribution', label: 'Contributo aggiuntivo IVS 1%'
          },
          {
            space: 'gross', threshold: c.cap,
            id: 'contribution-cap', label: 'Massimale contributivo'
          }
        ];
      }
    },

    /** IRPEF lorda. No trail entry: only the net tax reaches the pay packet. */
    {
      id: 'gross-tax',
      apply: function (ctx) {
        ctx.irpefGross = applyBrackets(ctx.taxable, parameters.irpef.brackets);
      },
      thresholds: function () {
        return parameters.irpef.brackets.map(function (bracket, index) {
          return bracket.upTo === null ? null : {
            space: 'taxable', threshold: bracket.upTo,
            id: 'irpef-bracket-' + (index + 1), label: 'Scaglione IRPEF'
          };
        }).filter(isNotNull);
      }
    },

    /** Detrazione per lavoro dipendente, art. 13 TUIR. */
    {
      id: 'employment-deduction',
      apply: function (ctx) {
        ctx.employmentDeduction =
          computeEmploymentDeduction(ctx.totalIncome, ctx.exactRatios, ctx.position);
        ctx.deductions.push(ctx.employmentDeduction.total);
      },
      thresholds: function () {
        var d = parameters.employmentDeduction;
        var list = [
          {
            space: 'taxable', threshold: d.flatUpTo,
            id: 'employment-deduction-step', label: 'Gradino detrazione art. 13'
          },
          {
            space: 'taxable', threshold: d.bonus.over,
            id: 'bonus65-start', label: 'Inizio maggiorazione 65 euro'
          },
          {
            space: 'taxable', threshold: d.bonus.upTo,
            id: 'bonus65-end', label: 'Fine maggiorazione 65 euro'
          }
        ];

        d.bands.forEach(function (band, index) {
          list.push({
            space: 'taxable', threshold: band.upTo,
            id: 'employment-deduction-band-' + (index + 1),
            label: 'Cambio formula detrazione art. 13'
          });
        });

        return list;
      }
    },

    /** Detrazioni per carichi di famiglia, art. 12 TUIR. */
    {
      id: 'family-deduction',
      apply: function (ctx) {
        ctx.familyDeduction =
          computeFamilyDeduction(ctx.totalIncome, ctx.exactRatios, ctx.position);
        ctx.deductions.push(ctx.familyDeduction.total);
      },
      // These thresholds exist only for the dependants actually declared, which
      // is why this face takes the position and the others do not.
      thresholds: function (position) {
        var f = parameters.familyDeduction;
        var family = position.family;
        var list = [];

        if (family.spouse) {
          list.push({
            space: 'taxable', threshold: f.spouse.firstBand.upTo,
            id: 'spouse-band-1', label: 'Cambio formula detrazione coniuge'
          });
          list.push({
            space: 'taxable', threshold: f.spouse.middleBand.upTo,
            id: 'spouse-band-2', label: 'Cambio formula detrazione coniuge'
          });
          list.push({
            space: 'taxable', threshold: f.spouse.lastBand.upTo,
            id: 'spouse-band-3', label: 'Azzeramento detrazione coniuge'
          });

          f.spouse.increases.forEach(function (step, index) {
            list.push({
              space: 'taxable', threshold: step.over,
              id: 'spouse-increase-' + (index + 1) + '-start',
              label: 'Gradino maggiorazione coniuge'
            });
            list.push({
              space: 'taxable', threshold: step.upTo,
              id: 'spouse-increase-' + (index + 1) + '-end',
              label: 'Gradino maggiorazione coniuge'
            });
          });
        }

        if (family.children > 0) {
          list.push({
            space: 'taxable',
            threshold: f.children.ceiling +
              f.children.ceilingIncrement * (family.children - 1),
            id: 'children-deduction-end', label: 'Azzeramento detrazione figli'
          });
        }

        if (family.ascendants > 0) {
          list.push({
            space: 'taxable', threshold: f.ascendants.ceiling,
            id: 'ascendants-deduction-end', label: 'Azzeramento detrazione ascendenti'
          });
        }

        return list;
      }
    },

    /**
     * Riduzione del cuneo fiscale. The one provision that shows up in both
     * places: as a deduction it competes for available tax, as an exempt sum it
     * bypasses the tax entirely and lands in the trail on its own.
     */
    {
      id: 'wedge-relief',
      apply: function (ctx) {
        ctx.wedge = computeWedgeRelief(ctx.totalIncome, ctx.employmentIncome, ctx.position);
        ctx.wedgeDeduction = ctx.wedge.type === 'deduction' ? ctx.wedge.amount : 0;
        ctx.exemptSum = ctx.wedge.type === 'exempt' ? ctx.wedge.amount : 0;
        ctx.deductions.push(ctx.wedgeDeduction);
      },
      ledger: function (ctx) {
        if (ctx.exemptSum <= 0) return [];

        return [{
          id: 'wedge.exempt',
          label: 'Somma esente riduzione cuneo fiscale',
          sign: 1,
          base: ctx.taxable,
          formula: formatRate(ctx.wedge.rate) + ' di ' + formatAmount(ctx.taxable) +
            ', non concorre al reddito',
          amount: ctx.exemptSum,
          sourceId: parameters.wedgeRelief.sourceId
        }];
      },
      thresholds: function (position) {
        var w = parameters.wedgeRelief;
        var share = position.daysWorked / parameters.employmentYear.days;

        /**
         * The exempt bands are read on the income projected to a full year, so
         * on a short contract they sit proportionally lower in actual income.
         * The last band has no ceiling and therefore no threshold to mark.
         */
        var list = w.exempt.rates.map(function (rate, index) {
          return rate.upTo === null ? null : {
            space: 'taxable', threshold: rate.upTo * share,
            id: 'wedge-exempt-rate-' + (index + 1),
            label: 'Cambio fascia somma esente cuneo'
          };
        }).filter(isNotNull);

        list.push({
          space: 'taxable', threshold: w.deduction.over,
          id: 'wedge-mode-switch', label: 'Passaggio da somma esente a detrazione'
        });
        list.push({
          space: 'taxable', threshold: w.deduction.fullUpTo,
          id: 'wedge-taper-start', label: 'Inizio decalage detrazione cuneo'
        });
        list.push({
          space: 'taxable', threshold: w.deduction.taperTo,
          id: 'wedge-taper-end', label: 'Azzeramento detrazione cuneo'
        });

        return list;
      }
    },

    /**
     * IRPEF netta. Every deduction collected so far is summed here and nowhere
     * else, so a new one is a single push in its own rule. What exceeds gross
     * tax is lost: deductions cannot turn into a refund.
     *
     * The thresholds this creates are not written in any statute, so they are
     * not declared here but solved in getBreakpoints.
     */
    {
      id: 'net-tax',
      apply: function (ctx) {
        ctx.deductionsTotal = ctx.deductions.reduce(function (sum, amount) {
          return sum + amount;
        }, 0);

        ctx.irpefNet = Math.max(0, ctx.irpefGross.total - ctx.deductionsTotal);
        ctx.lostToInsufficientTax = Math.max(0, ctx.deductionsTotal - ctx.irpefGross.total);
      },
      ledger: function (ctx) {
        return [{
          id: 'irpef.net',
          label: 'IRPEF netta',
          sign: -1,
          base: ctx.taxable,
          formula: formatAmount(ctx.irpefGross.total) + ' di imposta lorda meno ' +
            formatAmount(ctx.deductionsTotal) + ' di detrazioni',
          amount: ctx.irpefNet,
          sourceId: parameters.irpef.sourceId
        }];
      }
    },

    /** Addizionali, sull imponibile e mai ridotte dalle detrazioni. */
    {
      id: 'surtaxes',
      apply: function (ctx) {
        ctx.surtaxes = computeSurtaxes(ctx.taxable);
      },
      ledger: function (ctx) {
        var m = parameters.municipalSurtax;

        return [
          {
            id: 'surtax.regional',
            label: 'Addizionale regionale ' + parameters.region.name,
            sign: -1,
            base: ctx.taxable,
            formula: 'scaglioni progressivi su ' + formatAmount(ctx.taxable),
            amount: ctx.surtaxes.regional,
            sourceId: parameters.regionalSurtax.sourceId
          },
          {
            id: 'surtax.municipal',
            label: 'Addizionale comunale ' + parameters.municipality.name,
            sign: -1,
            base: ctx.taxable,
            formula: ctx.surtaxes.municipalExempt
              ? 'esente, imponibile non superiore a ' + formatAmount(m.exemptionThreshold)
              : formatRate(m.rate) + ' di ' + formatAmount(ctx.taxable),
            amount: ctx.surtaxes.municipal,
            sourceId: m.sourceId
          }
        ];
      },
      thresholds: function () {
        var list = parameters.regionalSurtax.brackets.map(function (bracket, index) {
          return bracket.upTo === null ? null : {
            space: 'taxable', threshold: bracket.upTo,
            id: 'regional-bracket-' + (index + 1), label: 'Scaglione addizionale regionale'
          };
        }).filter(isNotNull);

        list.push({
          space: 'taxable', threshold: parameters.municipalSurtax.exemptionThreshold,
          id: 'municipal-exemption', label: 'Soglia esenzione addizionale comunale'
        });

        return list;
      }
    },

    /** Trattamento integrativo, che non passa dall IRPEF ma si somma al netto. */
    {
      id: 'supplementary-allowance',
      apply: function (ctx) {
        ctx.supplementary = computeSupplementaryAllowance(
          ctx.totalIncome, ctx.irpefGross.total, ctx.employmentDeduction.employment,
          ctx.familyDeduction.total, ctx.position);
      },
      ledger: function (ctx) {
        if (ctx.supplementary.amount <= 0) return [];

        var s = parameters.supplementaryAllowance;

        return [{
          id: 'supplementary.allowance',
          label: 'Trattamento integrativo',
          sign: 1,
          base: ctx.taxable,
          formula: ctx.supplementary.band === 'differenziale'
            ? 'eccedenza delle detrazioni art. 12 e 13 co. 1 sull imposta lorda, non concorre al reddito'
            : 'spetta fino a ' + formatAmount(s.incomeUpTo) +
              ' di reddito, non concorre al reddito',
          amount: ctx.supplementary.amount,
          sourceId: s.sourceId
        }];
      },
      thresholds: function () {
        return [{
          space: 'taxable', threshold: parameters.supplementaryAllowance.incomeUpTo,
          id: 'supplementary-allowance-end', label: 'Fine trattamento integrativo'
        }];
      }
    }
  ];

  return RULES;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_RULES;
}
