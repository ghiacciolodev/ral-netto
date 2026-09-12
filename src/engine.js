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
   *          contractType?: string, region?: string, municipality?: string,
   *          taxYear?: number}} input
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

  /** Step 1. The cap truncates the IVS rate and the additional 1% alike. */
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
   * Step 4. Art. 13 TUIR.
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
   * Step 5. The two reliefs are alternative. The exempt sum is a percentage of
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
   */
  function computeSupplementaryAllowance(totalIncome, grossTax, employmentDeduction, position) {
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
      // Art. 12 and art. 15 deductions are out of scope, so the only term left
      // is art. 13, which never exceeds gross tax in this band: zero in practice.
      var excess = employmentDeduction - grossTax;
      return { amount: Math.min(s.amount * share, Math.max(0, excess)), band: 'differenziale' };
    }

    return { amount: 0, band: 'nessuno' };
  }

  /** Step 7. Charged on taxable income, never reduced by tax credits. */
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

  // ------------------------------------------------------------------ main

  /**
   * @param {object} input the position, see normalizePosition
   * @param {{exactRatios?: boolean}} [options]
   */
  function calculateNet(input, options) {
    var position = normalizePosition(input);
    var opts = normalizeOptions(options);
    var ral = position.grossAnnual;

    var contributions = computeContributions(ral);
    var taxable = ral - contributions.total;

    // Single-income case: total income, employment income and taxable base are
    // the same number. Kept as separate arguments so adding other income later
    // does not mean rewriting the logic.
    var totalIncome = taxable;
    var employmentIncome = taxable;

    var irpefGross = applyBrackets(taxable, parameters.irpef.brackets);
    var deduction = computeEmploymentDeduction(totalIncome, opts.exactRatios, position);
    var wedge = computeWedgeRelief(totalIncome, employmentIncome, position);

    var wedgeDeduction = wedge.type === 'deduction' ? wedge.amount : 0;
    var deductionsTotal = deduction.total + wedgeDeduction;
    var irpefNet = Math.max(0, irpefGross.total - deductionsTotal);
    var lostToInsufficientTax = Math.max(0, deductionsTotal - irpefGross.total);

    var surtaxes = computeSurtaxes(taxable);
    var exemptSum = wedge.type === 'exempt' ? wedge.amount : 0;

    var supplementary = computeSupplementaryAllowance(
      totalIncome, irpefGross.total, deduction.employment, position);

    var netAnnual = ral - contributions.total - irpefNet - surtaxes.total +
      exemptSum + supplementary.amount;

    var ledger = buildLedger({
      ral: ral,
      contributions: contributions,
      taxable: taxable,
      irpefGross: irpefGross.total,
      deductionsTotal: deductionsTotal,
      irpefNet: irpefNet,
      surtaxes: surtaxes,
      wedge: wedge,
      exemptSum: exemptSum,
      supplementary: supplementary
    });

    return {
      position: position,
      ral: ral,
      months: position.months,
      contributions: {
        ivs: contributions.ivs,
        additionalRate: contributions.additionalRate,
        total: contributions.total,
        capApplied: contributions.capApplied
      },
      taxableIncome: taxable,
      irpef: {
        gross: irpefGross.total,
        byBracket: irpefGross.detail,
        deductions: {
          employment: deduction.employment,
          bonus65: deduction.bonus,
          ratio: deduction.ratio,
          minimumApplied: deduction.minimumApplied,
          wedge: wedgeDeduction,
          total: deductionsTotal,
          lostToInsufficientTax: lostToInsufficientTax
        },
        net: irpefNet
      },
      wedge: {
        type: wedge.type,
        amount: wedge.amount,
        rate: wedge.rate,
        projectedIncome: wedge.projectedIncome === undefined ? null : wedge.projectedIncome
      },
      supplementaryAllowance: { amount: supplementary.amount, band: supplementary.band },
      surtaxes: {
        regional: surtaxes.regional,
        regionalDetail: surtaxes.regionalDetail,
        municipal: surtaxes.municipal,
        municipalExempt: surtaxes.municipalExempt,
        total: surtaxes.total
      },
      netAnnual: netAnnual,
      netMonthly: netAnnual / position.months,
      employerCost: computeEmployerCost(ral),
      ledger: ledger
    };
  }

  /**
   * The ordered gross-to-net trail. Load bearing, not decoration: the UI renders
   * only this, and a test asserts that it reconstructs the net exactly.
   */
  function buildLedger(s) {
    var c = parameters.contributions;
    var entries = [];

    entries.push({
      id: 'contributions.ivs',
      label: 'Contributi IVS a carico dipendente',
      sign: -1,
      base: s.contributions.base,
      formula: formatRate(c.ivsRate) + ' di ' + formatAmount(s.contributions.base) +
        (s.contributions.capApplied ? ' (base limitata al massimale)' : ''),
      amount: s.contributions.ivs,
      sourceId: c.ivsSourceId
    });

    if (s.contributions.additionalRate > 0) {
      entries.push({
        id: 'contributions.additional',
        label: 'Contributo aggiuntivo IVS 1%',
        sign: -1,
        base: s.contributions.base - c.additionalThreshold,
        formula: formatRate(c.additionalRate) + ' sulla quota oltre ' + formatAmount(c.additionalThreshold),
        amount: s.contributions.additionalRate,
        sourceId: c.sourceId
      });
    }

    entries.push({
      id: 'irpef.net',
      label: 'IRPEF netta',
      sign: -1,
      base: s.taxable,
      formula: formatAmount(s.irpefGross) + ' di imposta lorda meno ' +
        formatAmount(s.deductionsTotal) + ' di detrazioni',
      amount: s.irpefNet,
      sourceId: parameters.irpef.sourceId
    });

    entries.push({
      id: 'surtax.regional',
      label: 'Addizionale regionale ' + parameters.region.name,
      sign: -1,
      base: s.taxable,
      formula: 'scaglioni progressivi su ' + formatAmount(s.taxable),
      amount: s.surtaxes.regional,
      sourceId: parameters.regionalSurtax.sourceId
    });

    entries.push({
      id: 'surtax.municipal',
      label: 'Addizionale comunale ' + parameters.municipality.name,
      sign: -1,
      base: s.taxable,
      formula: s.surtaxes.municipalExempt
        ? 'esente, imponibile non superiore a ' + formatAmount(parameters.municipalSurtax.exemptionThreshold)
        : formatRate(parameters.municipalSurtax.rate) + ' di ' + formatAmount(s.taxable),
      amount: s.surtaxes.municipal,
      sourceId: parameters.municipalSurtax.sourceId
    });

    if (s.supplementary.amount > 0) {
      entries.push({
        id: 'supplementary.allowance',
        label: 'Trattamento integrativo',
        sign: 1,
        base: s.taxable,
        formula: 'spetta fino a ' +
          formatAmount(parameters.supplementaryAllowance.incomeUpTo) +
          ' di reddito, non concorre al reddito',
        amount: s.supplementary.amount,
        sourceId: parameters.supplementaryAllowance.sourceId
      });
    }

    if (s.exemptSum > 0) {
      entries.push({
        id: 'wedge.exempt',
        label: 'Somma esente riduzione cuneo fiscale',
        sign: 1,
        base: s.taxable,
        formula: formatRate(s.wedge.rate) + ' di ' + formatAmount(s.taxable) + ', non concorre al reddito',
        amount: s.exemptSum,
        sourceId: parameters.wedgeRelief.sourceId
      });
    }

    return entries;
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
    var d = parameters.employmentDeduction;
    var w = parameters.wedgeRelief;
    var candidates = [];

    function add(space, threshold, id, label) {
      candidates.push({ space: space, threshold: threshold, id: id, label: label });
    }

    // The no-tax area is not a parameter: it falls out of the capacity limit,
    // because the minimum deduction exactly offsets tax at the first rate.
    add('taxable', d.flatAmount / parameters.irpef.brackets[0].rate,
      'no-tax-area', 'Uscita dall incapienza (no tax area)');

    // Capacity test of the trattamento integrativo: gross tax has to clear the
    // art. 13 deduction less the allowance. Below the flat band both sides are
    // straight lines, so the crossing solves directly.
    add('taxable',
      (d.flatAmount - parameters.supplementaryAllowance.capacityAllowance) /
        parameters.irpef.brackets[0].rate,
      'supplementary-allowance-start', 'Inizio trattamento integrativo');

    add('taxable', parameters.supplementaryAllowance.incomeUpTo,
      'supplementary-allowance-end', 'Fine trattamento integrativo');

    add('taxable', d.flatUpTo, 'employment-deduction-step', 'Gradino detrazione art. 13');
    d.bands.forEach(function (band, i) {
      add('taxable', band.upTo, 'employment-deduction-band-' + (i + 1),
        'Cambio formula detrazione art. 13');
    });
    add('taxable', d.bonus.over, 'bonus65-start', 'Inizio maggiorazione 65 euro');
    add('taxable', d.bonus.upTo, 'bonus65-end', 'Fine maggiorazione 65 euro');

    /**
     * The exempt bands are read on the income projected to a full year, so on
     * a short contract they sit proportionally lower in actual income. The
     * last band has no ceiling and therefore no threshold to mark.
     */
    w.exempt.rates.forEach(function (r, i) {
      if (r.upTo === null) return;
      add('taxable', r.upTo * share, 'wedge-exempt-rate-' + (i + 1),
        'Cambio fascia somma esente cuneo');
    });
    add('taxable', w.deduction.over, 'wedge-mode-switch', 'Passaggio da somma esente a detrazione');
    add('taxable', w.deduction.fullUpTo, 'wedge-taper-start', 'Inizio decalage detrazione cuneo');
    add('taxable', w.deduction.taperTo, 'wedge-taper-end', 'Azzeramento detrazione cuneo');

    parameters.irpef.brackets.forEach(function (b, i) {
      if (b.upTo !== null) add('taxable', b.upTo, 'irpef-bracket-' + (i + 1), 'Scaglione IRPEF');
    });
    parameters.regionalSurtax.brackets.forEach(function (b, i) {
      if (b.upTo !== null) add('taxable', b.upTo, 'regional-bracket-' + (i + 1),
        'Scaglione addizionale regionale');
    });

    add('taxable', parameters.municipalSurtax.exemptionThreshold,
      'municipal-exemption', 'Soglia esenzione addizionale comunale');

    add('gross', parameters.contributions.additionalThreshold,
      'additional-contribution', 'Contributo aggiuntivo IVS 1%');
    add('gross', parameters.contributions.cap,
      'contribution-cap', 'Massimale contributivo');

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
