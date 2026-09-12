// @ts-check
'use strict';

/**
 * One function per provision, each computing its own figure and nothing else.
 *
 * Nothing here knows the order it runs in, or that it runs at all: that belongs
 * to the rules. These are the arithmetic of the statute, and they are pure.
 */

var ENGINE_STEPS = function (parameters, numbers) {
  var truncate = numbers.truncate;
  var applyBrackets = numbers.applyBrackets;

  /** The cap truncates the IVS rate and the additional 1% alike. */
  function computeContributions(ral) {
    var c = parameters.contributions;
    var base = Math.min(ral, c.cap);
    var ivs = c.ivsRate * base;
    var additional = c.additionalRate * Math.max(0, base - c.additionalThreshold);

    return {
      ivs: ivs,
      additionalRate: additional,
      total: ivs + additional,
      capApplied: ral > c.cap,
      base: base
    };
  }

  /**
   * Art. 13 TUIR.
   *
   * Comma 6 truncates the ratio to four decimals, which turns the deduction into
   * a staircase stepping every 1,30 euro of income rather than a straight line.
   * The step is worth at most `coefficient * 1e-4`, so under 20 cents. Passing
   * `exactRatios` drops the truncation to recover the underlying affine model.
   */
  function computeEmploymentDeduction(income, exactRatios, position) {
    var d = parameters.employmentDeduction;
    var share = position.daysWorked / parameters.employmentYear.days;

    var amount = 0;
    var ratio = null;
    var minimumApplied = false;

    if (income <= d.flatUpTo) {
      amount = d.flatAmount * share;

      // The guaranteed minimum is compared against the already apportioned
      // amount and is not itself apportioned: circ. Agenzia Entrate 15/2007.
      // It belongs to the first band only, which is why it never binds over a
      // full year, where the plain deduction sits well above it.
      var floor = position.contractType === 'fixed-term'
        ? d.minimum.fixedTerm
        : d.minimum.permanent;

      if (amount < floor) {
        amount = floor;
        minimumApplied = true;
      }
    } else {
      for (var i = 0; i < d.bands.length; i++) {
        var band = d.bands[i];
        if (income <= band.upTo) {
          ratio = (band.upTo - income) / band.span;
          if (!exactRatios) ratio = truncate(ratio, d.truncationDigits);
          amount = (band.base + band.coefficient * ratio) * share;
          break;
        }
      }
    }

    // The comma 1.1 increase is the one piece that is never apportioned.
    var bonus = (income > d.bonus.over && income <= d.bonus.upTo) ? d.bonus.amount : 0;

    return {
      employment: amount,
      bonus: bonus,
      ratio: ratio,
      minimumApplied: minimumApplied,
      total: amount + bonus
    };
  }

  /**
   * Detrazioni per carichi di famiglia, art. 12 TUIR.
   *
   * Three rules with one shape: a base amount scaled by the ratio between an
   * income ceiling and the income itself. Comma 4 truncates every ratio to four
   * decimals, exactly like art. 13 co. 6, and cancels the deduction when the
   * ratio comes out at zero, or at one for children and ascendants.
   *
   * The months counted here are months of family, not of work. A six month
   * contract with a spouse dependent all year takes the whole spouse deduction.
   */
  function computeFamilyDeduction(income, exactRatios, position) {
    var f = parameters.familyDeduction;
    var family = position.family;
    var monthShare = family.months / f.monthsInYear;

    function ratio(value) {
      return exactRatios ? value : truncate(value, f.truncationDigits);
    }

    var spouse = 0;
    if (family.spouse) {
      var a = f.spouse;

      if (income <= a.firstBand.upTo) {
        /**
         * The only ratio in the model that rises with income. At the top of the
         * band it reaches one and the formula already returns 690, so comma 4
         * is restating continuity, not correcting it. At the bottom it reaches
         * zero and the deduction vanishes, a cliff sitting at a euro and a half
         * of income: exact, and far below anything an employee earns.
         */
        var first = ratio(income / a.firstBand.divisor);
        if (first >= 1) spouse = a.firstBand.whenRatioIsOne;
        else if (first > 0) spouse = a.firstBand.base - a.firstBand.coefficient * first;
      } else if (income <= a.middleBand.upTo) {
        spouse = a.middleBand.amount;
      } else if (income <= a.lastBand.upTo) {
        var last = ratio((a.lastBand.ceiling - income) / a.lastBand.span);
        if (last > 0) spouse = a.lastBand.amount * last;
      }

      if (spouse > 0) {
        a.increases.forEach(function (step) {
          if (income > step.over && income <= step.upTo) spouse += step.amount;
        });
      }
    }

    var children = 0;
    if (family.children > 0) {
      var c = f.children;
      var ceiling = c.ceiling + c.ceilingIncrement * (family.children - 1);
      var childRatio = ratio((ceiling - income) / ceiling);

      if (childRatio > 0 && childRatio < 1) {
        children = c.amount * family.children * childRatio *
          (family.childrenSharePercent / 100);
      }
    }

    var ascendants = 0;
    if (family.ascendants > 0) {
      var d = f.ascendants;
      var ascendantRatio = ratio((d.ceiling - income) / d.ceiling);
      if (ascendantRatio > 0 && ascendantRatio < 1) {
        ascendants = d.amount * family.ascendants * ascendantRatio;
      }
    }

    return {
      spouse: spouse * monthShare,
      children: children * monthShare,
      ascendants: ascendants * monthShare,
      total: (spouse + children + ascendants) * monthShare
    };
  }

  /**
   * The two reliefs are alternative. The exempt sum is a percentage of
   * employment income applied to the whole amount, not by bracket, and it never
   * passes through IRPEF.
   */
  function computeWedgeRelief(totalIncome, employmentIncome, position) {
    var w = parameters.wedgeRelief;
    var share = position.daysWorked / parameters.employmentYear.days;

    if (totalIncome <= w.exempt.maxTotalIncome) {
      /**
       * Two incomes do two different jobs here, and swapping them is the easy
       * mistake. The band is picked on what a full year at this rate would have
       * paid; the percentage then applies to what was actually received.
       *
       * Worked example from circ. 4/E 2025: 2.000 euro over 62 days projects to
       * 11.744,19, which selects 5,3%, and 5,3% of 2.000 is 106.
       *
       * The last band has no ceiling on purpose. What limits entitlement is the
       * total income test above, not the rate table, so a short contract whose
       * projection lands above 20.000 still takes the last rate.
       */
      var projected = employmentIncome / share;
      var rate = 0;

      for (var i = 0; i < w.exempt.rates.length; i++) {
        var upTo = w.exempt.rates[i].upTo;
        if (upTo === null || projected <= upTo) {
          rate = w.exempt.rates[i].rate;
          break;
        }
      }

      return {
        type: 'exempt',
        amount: employmentIncome * rate,
        rate: rate,
        projectedIncome: projected
      };
    }

    var d = w.deduction;
    if (totalIncome <= d.fullUpTo) {
      return { type: 'deduction', amount: d.amount * share, rate: null };
    }
    if (totalIncome <= d.taperTo) {
      var taper = (d.taperTo - totalIncome) / (d.taperTo - d.fullUpTo);
      return { type: 'deduction', amount: d.amount * taper * share, rate: null };
    }

    return { type: 'none', amount: 0, rate: null };
  }

  /**
   * Trattamento integrativo. Paid in the payslip rather than deducted from tax,
   * so like the exempt wedge sum it never passes through IRPEF: it is added to
   * the net at the end.
   *
   * The capacity test compares gross tax against the art. 13 comma 1 deduction
   * alone. The comma 1.1 increase is a different comma and in any case only
   * applies well above this income band.
   *
   * @param {number} totalIncome
   * @param {number} grossTax
   * @param {number} employmentDeduction art. 13 comma 1, without the bonus
   * @param {number} familyDeduction art. 12, all of it
   */
  function computeSupplementaryAllowance(
      totalIncome, grossTax, employmentDeduction, familyDeduction, position) {
    var s = parameters.supplementaryAllowance;
    var share = position.daysWorked / parameters.employmentYear.days;

    if (totalIncome <= s.incomeUpTo) {
      // Both the allowance and the 75 euro of the capacity test follow the
      // period worked; the deduction they are compared against already does.
      var floor = employmentDeduction - s.capacityAllowance * share;
      return grossTax > floor
        ? { amount: s.amount * share, band: 'flat' }
        : { amount: 0, band: 'incapiente' };
    }

    if (totalIncome <= s.secondBandUpTo) {
      /**
       * The statute adds up the art. 12 and art. 13 comma 1 deductions, plus
       * art. 15 items this model does not carry, and pays the excess over gross
       * tax up to the cap. Without dependants the sum is art. 13 alone, which
       * never overtakes gross tax in this band, so the branch collapses to zero.
       * Dependants are what make it pay anything at all.
       */
      var excess = employmentDeduction + familyDeduction - grossTax;
      return { amount: Math.min(s.amount * share, Math.max(0, excess)), band: 'differenziale' };
    }

    return { amount: 0, band: 'nessuno' };
  }

  /** Charged on taxable income, never reduced by tax credits. */
  function computeSurtaxes(taxable) {
    var regional = applyBrackets(taxable, parameters.regionalSurtax.brackets);
    var m = parameters.municipalSurtax;
    var exempt = taxable <= m.exemptionThreshold;

    return {
      regional: regional.total,
      regionalDetail: regional.detail,
      municipal: exempt ? 0 : taxable * m.rate,
      municipalExempt: exempt,
      total: regional.total + (exempt ? 0 : taxable * m.rate)
    };
  }

  function computeEmployerCost(ral) {
    var e = parameters.employerCost;
    var contributions = ral * e.contributionRate;
    var tfr = ral / e.tfrDivisor;
    var inail = ral * e.inailRate;

    return {
      contributions: contributions,
      tfr: tfr,
      ivsSurcharge: ral * e.ivsSurchargeRate,
      tfrAccruedToEmployee: tfr - ral * e.ivsSurchargeRate,
      inail: inail,
      total: ral + contributions + tfr + inail
    };
  }

  return {
    computeContributions: computeContributions,
    computeEmploymentDeduction: computeEmploymentDeduction,
    computeFamilyDeduction: computeFamilyDeduction,
    computeWedgeRelief: computeWedgeRelief,
    computeSupplementaryAllowance: computeSupplementaryAllowance,
    computeSurtaxes: computeSurtaxes,
    computeEmployerCost: computeEmployerCost
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_STEPS;
}
