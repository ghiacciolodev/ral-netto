// @ts-check
'use strict';

/**
 * Registry of parameter sets, one per tax year.
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
  var set2026 = (typeof PARAMETERS_2026 !== 'undefined')
    ? PARAMETERS_2026
    : require('./parameters-2026.js');

  var byYear = {
    2026: set2026
  };

  var years = Object.keys(byYear)
    .map(Number)
    .sort(function (a, b) { return a - b; });

  return {
    byYear: byYear,
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
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PARAMETERS;
}
