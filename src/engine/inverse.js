// @ts-check
'use strict';

/**
 * From a net figure back to the gross that produces it.
 *
 * Reads the model rather than reimplementing it: the segments come from the
 * breakpoints, each candidate is checked against the same calculateNet everyone
 * else uses. A second, cruder solver is kept for the tests to argue with.
 */

var ENGINE_INVERSE = function (maxRal, position, breakpoints, calculation) {
  var MAX_RAL = maxRal;
  var withGross = position.withGross;
  var getBreakpoints = breakpoints.getBreakpoints;
  var calculateNet = calculation.calculateNet;

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
    solveGrossFromNet: solveGrossFromNet,
    solveGrossFromNetBinary: solveGrossFromNetBinary
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_INVERSE;
}
