// @ts-check
'use strict';

/**
 * Arithmetic, and how a number is written down.
 *
 * The two belong together: how money reads on screen follows how it is rounded,
 * and how it is rounded is a parameter of the tax year, not a display choice.
 */

var ENGINE_NUMBERS = function (parameters) {
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

  return {
    truncate: truncate,
    roundTo: roundTo,
    applyBrackets: applyBrackets,
    isNotNull: isNotNull,
    formatAmount: formatAmount,
    formatRate: formatRate
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_NUMBERS;
}
