// @ts-check
'use strict';

/**
 * Calculation engine. Pure functions only: no DOM, no globals, no I/O.
 *
 * An engine instance is the rulebook of one tax year. Binding the year at
 * construction rather than per call means a single calculation can never mix two
 * years of rules, which is the failure mode that would be hardest to notice.
 *
 * @param {any} source the year registry, or a single parameter set
 * @param {number} [taxYear] which year to bind; defaults to the latest available
 */
var createEngine = function createEngine(source, taxYear) {

  var parameters = (source && typeof source.forYear === 'function')
    ? source.forYear(taxYear)
    : source;

  var MAX_RAL = 10000000;

  // ---------------------------------------------------------------- helpers

  /**
   * Keep the first `digits` decimals, truncating toward zero.
   * Scaling alone misfires on binary-float values such as 0.0582 stored as
   * 0.05819999..., so the scaled value is settled to a safe precision first.
   * @param {number} value
   * @param {number} digits
   */
  function truncate(value, digits) {
    var factor = Math.pow(10, digits);
    var scaled = Number((value * factor).toFixed(6));
    return Math.trunc(scaled) / factor;
  }

  /**
   * Progressive brackets. Used by both IRPEF and the regional surtax: same
   * arithmetic, so it must not be written twice.
   * @param {number} base
   * @param {Array<{upTo: number|null, rate: number}>} brackets
   */
  function applyBrackets(base, brackets) {
    var detail = [];
    var total = 0;
    var lower = 0;

    for (var i = 0; i < brackets.length; i++) {
      if (base <= lower) break;
      var upper = brackets[i].upTo === null ? Infinity : brackets[i].upTo;
      var amountInBracket = Math.min(base, upper) - lower;
      var tax = amountInBracket * brackets[i].rate;

      detail.push({
        from: lower,
        to: brackets[i].upTo,
        rate: brackets[i].rate,
        amountInBracket: amountInBracket,
        tax: tax
      });

      total += tax;
      lower = upper;
    }

    return { total: total, detail: detail };
  }

  /**
   * Half-up rounding: the third decimal decides, five goes up.
   *
   * `toFixed` cannot be used for this. It rounds the binary double, not the
   * decimal value, so 2.675 comes out 2.67 because the stored number is really
   * 2.67499999999999982. Settling the scaled value first, the same trick used by
   * truncate(), makes the comparison happen on the decimal the user sees.
   *
   * @param {number} value
   * @param {number} decimals
   */
  function roundTo(value, decimals) {
    var factor = Math.pow(10, decimals);
    var scaled = Number((Math.abs(value) * factor).toFixed(6));
    var rounded = Math.round(scaled) / factor;
    return value < 0 ? -rounded : rounded;
  }

  /** Italian thousands separator and decimal comma, for on-screen formulas. */
  function formatAmount(value) {
    var sign = value < 0 ? '-' : '';
    var parts = roundTo(Math.abs(value), parameters.rounding.decimals)
      .toFixed(parameters.rounding.decimals).split('.');
    return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + parts[1];
  }

  /** Used by the threshold faces, which skip the open ended last band. */
  function isNotNull(value) {
    return value !== null;
  }

  function formatRate(rate) {
    var pct = (rate * 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return pct.replace('.', ',') + '%';
  }

  // -------------------------------------------------------------- position

  /**
   * A position is the subject of the calculation: who is paid, how and where.
   * Anything left out falls back to the modelled case.
   *
   * Some fields accept exactly one value today. They are in the contract anyway,
   * on purpose: it turns a documented simplification into an enforced one. Asking
   * for Lazio returns an error instead of a Lombardy figure with the wrong label.
   *
   * @param {{grossAnnual: number, months?: number, daysWorked?: number,
   *          contractType?: string, family?: object, region?: string,
   *          municipality?: string, taxYear?: number}} input
   */
  function normalizePosition(input) {
    if (input === null || typeof input !== 'object') {
      throw new TypeError(
        'La posizione deve essere un oggetto, per esempio { grossAnnual: 30000, months: 13 }.');
    }

    function fallback(value, standard) {
      return value === undefined ? standard : value;
    }

    var position = {
      taxYear: fallback(input.taxYear, parameters.taxYear),
      grossAnnual: input.grossAnnual,
      months: fallback(input.months, parameters.payrollMonths.defaultValue),
      daysWorked: fallback(input.daysWorked, parameters.employmentYear.days),
      contractType: String(fallback(input.contractType, 'permanent')).toLowerCase(),
      family: normalizeFamily(input.family),
      region: String(fallback(input.region, parameters.region.key)).toLowerCase(),
      municipality: String(fallback(input.municipality, parameters.municipality.key)).toLowerCase()
    };

    if (position.taxYear !== parameters.taxYear) {
      throw new RangeError(
        'Questo motore calcola l anno d imposta ' + parameters.taxYear +
        ', non ' + position.taxYear + '. Costruiscine uno per l anno voluto.');
    }

    if (typeof position.grossAnnual !== 'number' || !isFinite(position.grossAnnual)) {
      throw new TypeError('La RAL deve essere un numero.');
    }
    if (position.grossAnnual < 0) {
      throw new RangeError('La RAL non puo essere negativa.');
    }
    if (position.grossAnnual > MAX_RAL) {
      throw new RangeError('La RAL supera il limite gestito di ' + formatAmount(MAX_RAL) + ' euro.');
    }

    if (parameters.payrollMonths.allowed.indexOf(position.months) === -1) {
      throw new RangeError(
        'Mensilita non ammesse: ' + position.months +
        '. Valori consentiti: ' + parameters.payrollMonths.allowed.join(', ') + '.');
    }

    if (typeof position.daysWorked !== 'number' || !isFinite(position.daysWorked) ||
        position.daysWorked <= 0 || position.daysWorked > parameters.employmentYear.days) {
      throw new RangeError(
        'I giorni di rapporto devono stare fra 1 e ' + parameters.employmentYear.days +
        '. Ricevuto: ' + position.daysWorked + '.');
    }

    if (position.contractType !== 'permanent' && position.contractType !== 'fixed-term') {
      throw new RangeError(
        'Tipo di contratto non riconosciuto: ' + position.contractType +
        '. Valori ammessi: permanent, fixed-term.');
    }

    if (position.region !== parameters.region.key) {
      throw new RangeError(
        'Regione non supportata: ' + position.region +
        '. Il modello copre solo ' + parameters.region.name + '.');
    }

    if (position.municipality !== parameters.municipality.key) {
      throw new RangeError(
        'Comune non supportato: ' + position.municipality +
        '. Il modello copre solo ' + parameters.municipality.name + '.');
    }

    return position;
  }

  /**
   * Who is on the tax card. Its own object because these fields answer a
   * different question from the rest of the position, and because art. 12
   * counts months of family, which have nothing to do with days of work.
   *
   * Ages and income limits are not arguments: the caller asserts that these
   * people are a carico, and the interface states the condition instead.
   */
  function normalizeFamily(input) {
    var f = parameters.familyDeduction;

    if (input !== undefined && input !== null &&
        (typeof input !== 'object' || Array.isArray(input))) {
      throw new TypeError(
        'I familiari a carico devono essere un oggetto, per esempio { spouse: true, children: 2 }.');
    }
    var raw = input || {};

    function count(value, label, max) {
      var n = value === undefined ? 0 : value;
      if (typeof n !== 'number' || !isFinite(n) || n < 0 || n > max || Math.floor(n) !== n) {
        throw new RangeError(
          label + ': serve un intero fra 0 e ' + max + '. Ricevuto: ' + value + '.');
      }
      return n;
    }

    var family = {
      spouse: raw.spouse === true,
      children: count(raw.children, 'Figli a carico', 10),
      childrenSharePercent: raw.childrenSharePercent === undefined
        ? f.children.defaultSharePercent
        : raw.childrenSharePercent,
      ascendants: count(raw.ascendants, 'Ascendenti conviventi a carico', 6),
      months: raw.months === undefined ? f.monthsInYear : raw.months
    };

    if (typeof family.childrenSharePercent !== 'number' ||
        !isFinite(family.childrenSharePercent) ||
        family.childrenSharePercent < 0 || family.childrenSharePercent > 100) {
      throw new RangeError(
        'La quota di detrazione per i figli va da 0 a 100. Ricevuto: ' +
        family.childrenSharePercent + '.');
    }

    if (typeof family.months !== 'number' || !isFinite(family.months) ||
        family.months < 1 || family.months > f.monthsInYear ||
        Math.floor(family.months) !== family.months) {
      throw new RangeError(
        'I mesi a carico vanno da 1 a ' + f.monthsInYear + '. Ricevuto: ' + family.months + '.');
    }

    return family;
  }

  /**
   * Same subject, different gross. Used wherever the gross is swept.
   * Takes a partial position too, so a template without a gross is a valid
   * starting point: the merge happens before validation, not after.
   */
  function withGross(position, grossAnnual) {
    var merged = { grossAnnual: grossAnnual };
    Object.keys(position || {}).forEach(function (key) {
      if (key !== 'grossAnnual') merged[key] = position[key];
    });
    return normalizePosition(merged);
  }

  /**
   * How to compute, not who for. `exactRatios` skips the statutory truncation to
   * recover the smooth model that the inverse solver fits and the tests use to
   * prove the breakpoint list is complete.
   */
  function normalizeOptions(options) {
    return { exactRatios: (options || {}).exactRatios === true };
  }

  // ------------------------------------------------------------- the steps

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

  // -------------------------------------------------------------- the rules

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

  // ------------------------------------------------------------------ main

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

  // ----------------------------------------------------------- breakpoints

  /**
   * Invert step 2. Contributions are piecewise linear in gross pay, so each
   * regime inverts in closed form; the right one is the regime whose result
   * lands inside its own range.
   * @param {number} taxable
   */
  function grossFromTaxable(taxable) {
    var c = parameters.contributions;

    var plain = taxable / (1 - c.ivsRate);
    if (plain <= c.additionalThreshold) return plain;

    var withAdditional =
      (taxable - c.additionalRate * c.additionalThreshold) /
      (1 - c.ivsRate - c.additionalRate);
    if (withAdditional <= c.cap) return withAdditional;

    var frozen = c.ivsRate * c.cap + c.additionalRate * (c.cap - c.additionalThreshold);
    return taxable + frozen;
  }

  /**
   * Every threshold in the model, in one list. Three things read it: the chart
   * annotations, the segment bounds of the exact inversion, and the choice of
   * test cases. Values are derived from the parameters, never written twice.
   */
  function getBreakpoints(input) {
    var position = withGross(input, 0);
    var share = position.daysWorked / parameters.employmentYear.days;
    var candidates = [];

    function add(space, threshold, id, label) {
      candidates.push({ space: space, threshold: threshold, id: id, label: label });
    }

    /**
     * Everything a provision states as a number. Whatever a rule declares turns
     * up here without anyone having to remember to copy it across, which is the
     * whole point of keeping the three faces of a rule together.
     */
    RULES.forEach(function (rule) {
      if (!rule.thresholds) return;
      rule.thresholds(position).forEach(function (threshold) {
        candidates.push(threshold);
      });
    });

    /**
     * Two thresholds are written in no statute: they are where two straight
     * lines cross, and both move with the position. The no-tax area used to be
     * the flat deduction over the first rate, which stopped being true the
     * moment the deduction could be cut down to days or joined by art. 12. So
     * they are solved instead of written. Between the thresholds collected
     * above every term is affine, so fitting a line on the one segment where
     * the sign changes gives the crossing exactly.
     */
    var scanBounds = [0];
    candidates.forEach(function (candidate) {
      if (candidate.space === 'taxable' && candidate.threshold > 0) {
        scanBounds.push(candidate.threshold);
      }
    });
    scanBounds.push(MAX_RAL - computeContributions(MAX_RAL).total);
    scanBounds.sort(function (a, b) { return a - b; });

    function crossings(gap) {
      var roots = [];

      for (var i = 0; i < scanBounds.length - 1; i++) {
        var lo = scanBounds[i];
        var hi = scanBounds[i + 1];
        if (hi - lo < 1e-6) continue;

        var x1 = lo + (hi - lo) / 3;
        var x2 = lo + (2 * (hi - lo)) / 3;
        var y1 = gap(x1);
        var y2 = gap(x2);
        if (y1 === y2) continue;

        // The two samples only fix the line. Where the root actually falls
        // inside the segment is what decides, so a crossing in the first few
        // per cent of a segment is found just like one in the middle.
        var root = x1 - (y1 * (x2 - x1)) / (y2 - y1);
        if (root >= lo - 1e-6 && root <= hi + 1e-6) roots.push(root);
      }

      return roots;
    }

    function grossTaxAt(taxable) {
      return applyBrackets(taxable, parameters.irpef.brackets).total;
    }

    /**
     * Every one of these is a crossing, not just the first. Income can leave
     * the incapienza and fall back into it: the art. 13 deduction steps up at
     * 15.000, and with dependants on top of it the step is enough to swallow
     * gross tax again for another thousand euro or so.
     */
    crossings(function (taxable) {
      var relief = computeWedgeRelief(taxable, taxable, position);
      return grossTaxAt(taxable) -
        computeEmploymentDeduction(taxable, true, position).total -
        computeFamilyDeduction(taxable, true, position).total -
        (relief.type === 'deduction' ? relief.amount : 0);
    }).forEach(function (root, i) {
      add('taxable', root, i === 0 ? 'no-tax-area' : 'no-tax-area-' + (i + 1),
        'Uscita dall incapienza (no tax area)');
    });

    // Same idea for the capacity test of the trattamento integrativo, except
    // that a crossing above the income ceiling means it never starts at all.
    var s = parameters.supplementaryAllowance;

    crossings(function (taxable) {
      return grossTaxAt(taxable) -
        computeEmploymentDeduction(taxable, true, position).employment +
        s.capacityAllowance * share;
    }).filter(function (root) {
      return root <= s.incomeUpTo;
    }).forEach(function (root) {
      add('taxable', root, 'supplementary-allowance-start', 'Inizio trattamento integrativo');
    });

    /**
     * The second band pays the excess of the art. 12 and art. 13 comma 1
     * deductions over gross tax, capped. Both the point where that excess
     * reaches the cap and the point where it runs out are kinks in the net, and
     * neither exists until there are dependants big enough to create an excess.
     */
    [
      { target: s.amount * share, id: 'supplementary-second-band-cap',
        label: 'Il trattamento integrativo scende sotto il massimo' },
      { target: 0, id: 'supplementary-second-band-end',
        label: 'Fine del trattamento integrativo differenziale' }
    ].forEach(function (kink) {
      crossings(function (taxable) {
        return grossTaxAt(taxable) + kink.target -
          computeEmploymentDeduction(taxable, true, position).employment -
          computeFamilyDeduction(taxable, true, position).total;
      }).filter(function (root) {
        return root > s.incomeUpTo && root <= s.secondBandUpTo;
      }).forEach(function (root) {
        add('taxable', root, kink.id, kink.label);
      });
    });

    // Several rules share a threshold, so merge by position and keep every label.
    var byKey = {};
    candidates.forEach(function (candidate) {
      var ral = candidate.space === 'gross'
        ? candidate.threshold
        : grossFromTaxable(candidate.threshold);
      var key = candidate.space + ':' + candidate.threshold.toFixed(6);

      if (!byKey[key]) {
        byKey[key] = {
          ids: [candidate.id],
          space: candidate.space,
          threshold: candidate.threshold,
          ral: ral,
          labels: [candidate.label]
        };
      } else if (byKey[key].labels.indexOf(candidate.label) === -1) {
        byKey[key].ids.push(candidate.id);
        byKey[key].labels.push(candidate.label);
      }
    });

    return Object.keys(byKey)
      .map(function (key) {
        var entry = byKey[key];
        return {
          id: entry.ids[0],
          ids: entry.ids,
          space: entry.space,
          threshold: entry.threshold,
          ral: entry.ral,
          label: entry.labels.join(' + ')
        };
      })
      .sort(function (a, b) { return a.ral - b.ral; });
  }

  // ------------------------------------------------------------- inversion

  function segmentBounds(position) {
    var points = [0];
    getBreakpoints(position).forEach(function (bp) {
      if (bp.ral > 0 && bp.ral < MAX_RAL) points.push(bp.ral);
    });
    points.push(MAX_RAL);
    return points;
  }

  var REFINE_WINDOW = 0.5;
  var REFINE_STEP = 0.001;

  /**
   * Smallest gross in the window whose net reaches the target. The affine
   * candidate is within about 0.3 euro of the answer, so a short scan settles
   * the staircase that the smooth model cannot see.
   */
  function refineCandidate(candidate, lo, hi, targetNet, position) {
    var from = Math.max(lo, candidate - REFINE_WINDOW);
    var to = Math.min(hi, candidate + REFINE_WINDOW);

    for (var x = from; x <= to + 1e-9; x += REFINE_STEP) {
      if (calculateNet(withGross(position, x)).netAnnual >= targetNet - 1e-9) return x;
    }

    return null;
  }

  /**
   * Inverse: the smallest gross whose net reaches the target.
   *
   * Net pay is affine between breakpoints once the art. 13 truncation is set
   * aside, so each segment yields one closed-form candidate from two interior
   * points; interior rather than endpoints, because the endpoints straddle the
   * jumps. Each candidate is then refined against the statutory model.
   *
   * Two facts make "smallest gross reaching the target" the only sound
   * definition. The model falls at two thresholds, so a target can have several
   * solutions or land in a gap; and the truncation staircase leaves sub-euro
   * gaps, so an exact hit need not exist at all.
   *
   * @param {number} targetNet
   * @param {object} [input] the position whose gross is being solved for
   */
  function solveGrossFromNet(targetNet, input) {
    var position = withGross(input, 0);

    if (typeof targetNet !== 'number' || !isFinite(targetNet) || targetNet < 0) {
      throw new RangeError('Il netto obiettivo deve essere un numero non negativo.');
    }

    var smooth = { exactRatios: true };
    var points = segmentBounds(position);
    var solutions = [];
    var reachable = [];

    for (var i = 0; i < points.length - 1; i++) {
      var lo = points[i];
      var hi = points[i + 1];
      if (hi - lo < 1e-9) continue;

      var span = hi - lo;
      var p1 = lo + span / 3;
      var p2 = lo + (2 * span) / 3;
      var n1 = calculateNet(withGross(position, p1), smooth).netAnnual;
      var n2 = calculateNet(withGross(position, p2), smooth).netAnnual;

      var slope = (n2 - n1) / (p2 - p1);

      var edge = Math.min(span * 1e-9, 1e-6);
      reachable.push({ ral: lo + edge, net: calculateNet(withGross(position, lo + edge)).netAnnual });
      reachable.push({ ral: hi - edge, net: calculateNet(withGross(position, hi - edge)).netAnnual });

      if (Math.abs(slope) < 1e-12) continue;

      var intercept = n1 - slope * p1;
      var candidate = (targetNet - intercept) / slope;
      if (candidate < lo - 1 || candidate > hi + 1) continue;

      var refined = refineCandidate(
        Math.min(Math.max(candidate, lo), hi), lo, hi, targetNet, position);

      if (refined !== null) solutions.push(refined);
    }

    if (solutions.length > 0) {
      solutions.sort(function (a, b) { return a - b; });
      var best = solutions[0];
      var result = calculateNet(withGross(position, best));
      return {
        found: true,
        ral: best,
        solutions: solutions,
        achievedNet: result.netAnnual,
        residual: result.netAnnual - targetNet,
        result: result
      };
    }

    var below = null;
    var above = null;
    reachable.forEach(function (point) {
      if (point.net <= targetNet && (below === null || point.net > below.net)) below = point;
      if (point.net >= targetNet && (above === null || point.net < above.net)) above = point;
    });

    return { found: false, ral: null, solutions: [], nearestBelow: below, nearestAbove: above };
  }

  /**
   * Independent oracle for the tests only. Assumes monotonicity, which the model
   * violates at two thresholds; outside those it must agree with the exact
   * solver, and two implementations agreeing is a real correctness argument.
   */
  function solveGrossFromNetBinary(targetNet, input) {
    var position = withGross(input, 0);
    var lo = 0;
    var hi = MAX_RAL;

    for (var i = 0; i < 100; i++) {
      var mid = (lo + hi) / 2;
      if (calculateNet(withGross(position, mid)).netAnnual < targetNet) lo = mid; else hi = mid;
    }

    return hi;
  }

  return {
    parameters: parameters,
    taxYear: parameters.taxYear,

    /** The same engine for another year, when built from the registry. */
    forTaxYear: function (otherYear) {
      if (!source || typeof source.forYear !== 'function') {
        throw new Error('Questo motore non e stato costruito da un registro di anni.');
      }
      return createEngine(source, otherYear);
    },

    maxRal: MAX_RAL,
    truncate: truncate,
    roundTo: roundTo,
    applyBrackets: applyBrackets,
    normalizePosition: normalizePosition,
    withGross: withGross,
    formatAmount: formatAmount,
    formatRate: formatRate,
    calculateNet: calculateNet,
    grossFromTaxable: grossFromTaxable,
    getBreakpoints: getBreakpoints,
    solveGrossFromNet: solveGrossFromNet,
    solveGrossFromNetBinary: solveGrossFromNetBinary
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createEngine;
}
