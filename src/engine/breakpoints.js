// @ts-check
'use strict';

/**
 * Every threshold in the model, and the inverse of the contribution step.
 *
 * Two kinds of threshold live here and they are not the same thing. The ones a
 * provision states as a number come from the rules. The ones that exist only
 * because two lines cross are solved, because they move with the position and
 * no statute writes them down.
 */

var ENGINE_BREAKPOINTS = function (parameters, maxRal, numbers, steps, RULES, position) {
  var MAX_RAL = maxRal;
  var applyBrackets = numbers.applyBrackets;
  var withGross = position.withGross;

  var computeContributions = steps.computeContributions;
  var computeEmploymentDeduction = steps.computeEmploymentDeduction;
  var computeFamilyDeduction = steps.computeFamilyDeduction;
  var computeWedgeRelief = steps.computeWedgeRelief;

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

  return {
    grossFromTaxable: grossFromTaxable,
    getBreakpoints: getBreakpoints
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_BREAKPOINTS;
}
