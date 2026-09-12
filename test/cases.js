// @ts-check
'use strict';

/**
 * Il registro delle suite, nell ordine in cui girano.
 *
 * Una suite riceve un contesto e non restituisce niente: registra le sue
 * asserzioni nell harness. Aggiungerne una vuol dire scrivere un file e una
 * riga qui, come per un anno d imposta.
 *
 * Le suite non condividono variabili. Quelle che hanno bisogno delle soglie se
 * le ricalcolano: costa poco e ognuna si legge da sola.
 */
var CASES = (function () {

  // Stesso meccanismo dei parametri e dei moduli del motore: in pagina i file
  // sono caricati in ordine e ognuno lascia il suo globale, sotto Node vanno
  // richiesti.
  function resolve(global, path) {
    return (typeof global !== 'undefined') ? global : require(path);
  }

  var fixtures = resolve(
    typeof TEST_FIXTURES !== 'undefined' ? TEST_FIXTURES : undefined, './fixtures.js');

  var SUITES = [
    resolve(typeof SUITE_NUMBERS !== 'undefined' ? SUITE_NUMBERS : undefined,
      './suites/numbers.js'),
    resolve(typeof SUITE_VALIDATION !== 'undefined' ? SUITE_VALIDATION : undefined,
      './suites/validation.js'),
    resolve(typeof SUITE_VALUES !== 'undefined' ? SUITE_VALUES : undefined,
      './suites/values.js'),
    resolve(typeof SUITE_PARTIAL_YEAR !== 'undefined' ? SUITE_PARTIAL_YEAR : undefined,
      './suites/partial-year.js'),
    resolve(typeof SUITE_FAMILY !== 'undefined' ? SUITE_FAMILY : undefined,
      './suites/family.js'),
    resolve(typeof SUITE_LOCAL !== 'undefined' ? SUITE_LOCAL : undefined,
      './suites/local.js'),
    resolve(typeof SUITE_YEARS !== 'undefined' ? SUITE_YEARS : undefined,
      './suites/years.js'),
    resolve(typeof SUITE_LEDGER !== 'undefined' ? SUITE_LEDGER : undefined,
      './suites/ledger.js'),
    resolve(typeof SUITE_BREAKPOINTS !== 'undefined' ? SUITE_BREAKPOINTS : undefined,
      './suites/breakpoints.js'),
    resolve(typeof SUITE_SHAPE !== 'undefined' ? SUITE_SHAPE : undefined,
      './suites/shape.js'),
    resolve(typeof SUITE_INVERSE !== 'undefined' ? SUITE_INVERSE : undefined,
      './suites/inverse.js')
  ];

  return {
    fixtures: fixtures,

    /**
     * @param {object} engine il motore sotto esame
     * @param {object} t l harness che raccoglie le asserzioni
     * @param {object} registry il registro degli anni d imposta
     * @param {function} createEngine per le suite che montano un motore proprio
     */
    runTests: function (engine, t, registry, createEngine) {
      var context = {
        engine: engine,
        t: t,
        registry: registry,
        createEngine: createEngine,
        fixtures: fixtures
      };

      SUITES.forEach(function (suite) {
        suite(context);
      });

      return t.summary();
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CASES;
}
