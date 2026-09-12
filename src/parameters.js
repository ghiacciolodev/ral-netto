// @ts-check
'use strict';

/**
 * Registry of everything that varies by tax year: the state parameters, and the
 * table of local surtaxes that goes with them.
 *
 * The two are registered together because they share one clock, and kept in
 * separate files because they are different kinds of data. The state parameters
 * are a handful of values read one by one off the statute. The local ones are a
 * table nobody proofreads by hand.
 *
 * Income tax rules take effect "a decorrere dal periodo d'imposta X", so the
 * year is the natural unit of validity: a rule that changed mid-year would be
 * two entries, not a date range inside one.
 *
 * Adding a year means adding a file and one line here. The engine is bound to a
 * single year at construction, so a calculation can never mix two rulebooks.
 */
var PARAMETERS = (function () {

  // In pagina i file sono caricati in ordine e il set e gia globale; sotto Node
  // va richiesto. Il ramo require non viene mai valutato nel browser.
  function resolve(global, path) {
    return (typeof global !== 'undefined') ? global : require(path);
  }

  var byYear = {
    2025: resolve(typeof PARAMETERS_2025 !== 'undefined' ? PARAMETERS_2025 : undefined,
      './parameters-2025.js'),
    2026: resolve(typeof PARAMETERS_2026 !== 'undefined' ? PARAMETERS_2026 : undefined,
      './parameters-2026.js')
  };

  var localByYear = {
    2025: resolve(typeof LOCAL_2025 !== 'undefined' ? LOCAL_2025 : undefined,
      './local-2025.js'),
    2026: resolve(typeof LOCAL_2026 !== 'undefined' ? LOCAL_2026 : undefined,
      './local-2026.js')
  };

  var years = Object.keys(byYear)
    .map(Number)
    .sort(function (a, b) { return a - b; });

  return {
    byYear: byYear,
    localByYear: localByYear,
    years: years,
    latest: years[years.length - 1],

    /**
     * The rulebook for a year, or a clear refusal. Returning the wrong year's
     * rules silently would be the worst possible failure here.
     * @param {number} [taxYear]
     */
    forYear: function (taxYear) {
      var year = taxYear === undefined ? years[years.length - 1] : taxYear;

      if (!byYear[year]) {
        throw new RangeError(
          'Anno d imposta non disponibile: ' + year +
          '. Anni presenti: ' + years.join(', ') + '.');
      }

      return byYear[year];
    },

    /**
     * The local surtaxes of a year. Same year, same refusal: an engine that
     * silently mixed a year of state rules with another of local ones would be
     * wrong in a way nobody would spot.
     * @param {number} [taxYear]
     */
    localForYear: function (taxYear) {
      var year = taxYear === undefined ? years[years.length - 1] : taxYear;

      if (!localByYear[year]) {
        throw new RangeError(
          'Addizionali locali non disponibili per l anno ' + year +
          '. Anni presenti: ' + Object.keys(localByYear).join(', ') + '.');
      }

      return localByYear[year];
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PARAMETERS;
}
