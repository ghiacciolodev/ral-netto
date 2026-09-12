// @ts-check
'use strict';

/**
 * Calculation engine. Pure functions only: no DOM, no globals, no I/O.
 *
 * An engine instance is the rulebook of one tax year. Binding the year at
 * construction rather than per call means a single calculation can never mix two
 * years of rules, which is the failure mode that would be hardest to notice.
 *
 * This file is the wiring and nothing else. Every module below is a factory
 * that receives what it needs and returns what it offers, so the dependency
 * graph is written out here once instead of being implied by a shared scope.
 *
 * @param {any} source the year registry, or a single parameter set
 * @param {number} [taxYear] which year to bind; defaults to the latest available
 */
var createEngine = (function () {

  /**
   * In pagina i moduli sono caricati in ordine e ognuno lascia il suo globale,
   * sotto Node vanno richiesti. Il ramo require non viene mai valutato nel
   * browser, e il globale non esiste mai sotto Node.
   */
  function resolve(global, path) {
    return (typeof global !== 'undefined') ? global : require(path);
  }

  var makeNumbers = resolve(
    typeof ENGINE_NUMBERS !== 'undefined' ? ENGINE_NUMBERS : undefined,
    './engine/numbers.js');
  var makePosition = resolve(
    typeof ENGINE_POSITION !== 'undefined' ? ENGINE_POSITION : undefined,
    './engine/position.js');
  var makeSteps = resolve(
    typeof ENGINE_STEPS !== 'undefined' ? ENGINE_STEPS : undefined,
    './engine/steps.js');
  var makeRules = resolve(
    typeof ENGINE_RULES !== 'undefined' ? ENGINE_RULES : undefined,
    './engine/rules.js');
  var makeCalculation = resolve(
    typeof ENGINE_CALCULATION !== 'undefined' ? ENGINE_CALCULATION : undefined,
    './engine/calculation.js');
  var makeBreakpoints = resolve(
    typeof ENGINE_BREAKPOINTS !== 'undefined' ? ENGINE_BREAKPOINTS : undefined,
    './engine/breakpoints.js');
  var makeInverse = resolve(
    typeof ENGINE_INVERSE !== 'undefined' ? ENGINE_INVERSE : undefined,
    './engine/inverse.js');

  /**
   * The ceiling of the modelled range. Not a tax parameter: a guard against a
   * mistyped gross running the solver over absurd figures.
   */
  var MAX_RAL = 10000000;

  return function createEngine(source, taxYear) {

    var parameters = (source && typeof source.forYear === 'function')
      ? source.forYear(taxYear)
      : source;

    var numbers = makeNumbers(parameters);
    var position = makePosition(parameters, MAX_RAL, numbers);
    var steps = makeSteps(parameters, numbers);
    var rules = makeRules(parameters, numbers, steps);
    var calculation = makeCalculation(rules, position, steps);
    var breakpoints = makeBreakpoints(parameters, MAX_RAL, numbers, steps, rules, position);
    var inverse = makeInverse(MAX_RAL, position, breakpoints, calculation);

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
      truncate: numbers.truncate,
      roundTo: numbers.roundTo,
      applyBrackets: numbers.applyBrackets,
      formatAmount: numbers.formatAmount,
      formatRate: numbers.formatRate,
      normalizePosition: position.normalizePosition,
      withGross: position.withGross,
      calculateNet: calculation.calculateNet,
      grossFromTaxable: breakpoints.grossFromTaxable,
      getBreakpoints: breakpoints.getBreakpoints,
      solveGrossFromNet: inverse.solveGrossFromNet,
      solveGrossFromNetBinary: inverse.solveGrossFromNetBinary
    };
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createEngine;
}
