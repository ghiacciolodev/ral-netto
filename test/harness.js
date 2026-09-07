// @ts-check
'use strict';

/** Minimal assertion runner: no dependencies, same code in browser and Node. */
var createHarness = function createHarness() {
  var results = [];
  var currentGroup = '';

  function record(name, passed, detail) {
    results.push({
      group: currentGroup,
      name: name,
      passed: passed,
      detail: detail || ''
    });
  }

  function group(name) {
    currentGroup = name;
  }

  /** Money comparison. Default tolerance is one cent, as agreed for the suite. */
  function close(name, actual, expected, tolerance) {
    var tol = tolerance === undefined ? 0.01 : tolerance;
    var passed = typeof actual === 'number' && isFinite(actual) &&
      Math.abs(actual - expected) <= tol;
    record(name, passed, passed ? '' :
      'atteso ' + expected + ', ottenuto ' + actual +
      ' (scarto ' + (typeof actual === 'number' ? (actual - expected).toFixed(6) : 'n.d.') + ')');
    return passed;
  }

  function equal(name, actual, expected) {
    var passed = actual === expected;
    record(name, passed, passed ? '' : 'atteso ' + String(expected) + ', ottenuto ' + String(actual));
    return passed;
  }

  function ok(name, condition, detail) {
    record(name, !!condition, condition ? '' : (detail || 'condizione falsa'));
    return !!condition;
  }

  function throws(name, fn) {
    var threw = false;
    try { fn(); } catch (e) { threw = true; }
    record(name, threw, threw ? '' : 'nessuna eccezione sollevata');
    return threw;
  }

  function summary() {
    var failed = results.filter(function (r) { return !r.passed; });
    return {
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
      failures: failed,
      results: results
    };
  }

  return {
    group: group,
    close: close,
    equal: equal,
    ok: ok,
    throws: throws,
    summary: summary
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createHarness;
}
