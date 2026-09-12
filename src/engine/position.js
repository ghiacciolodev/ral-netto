// @ts-check
'use strict';

/**
 * Who is being paid, and the one option that is about how to compute instead.
 * They sit side by side on purpose: telling the two apart is the point.
 */

var ENGINE_POSITION = function (parameters, maxRal, numbers) {
  var MAX_RAL = maxRal;
  var formatAmount = numbers.formatAmount;

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

  return {
    normalizePosition: normalizePosition,
    withGross: withGross,
    normalizeOptions: normalizeOptions
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_POSITION;
}
