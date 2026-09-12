// @ts-check
'use strict';

/**
 * I dati attesi, condivisi fra le suite che ne hanno bisogno.
 */

/**
 * Expected values are computed by hand from the statutory formulas, never taken
 * from engine output. If the engine disagrees, the engine is what gets looked at.
 *
 * All figures include the art. 13 comma 6 truncation of the ratio.
 */
var VALUE_CASES = [
  {
    ral: 9001, months: 13, note: 'imposta lorda sotto la capienza, trattamento integrativo non spetta',
    contributions: 827.19, taxable: 8173.81, irpefGross: 1879.98,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 100.54, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 580.34, supplementary: 0.00, netAnnual: 8653.61
  },
  {
    ral: 9002, months: 13, note: 'capienza superata, entrano 1.200 di trattamento integrativo',
    contributions: 827.28, taxable: 8174.72, irpefGross: 1880.18,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 100.55, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 580.40, supplementary: 1200.00, netAnnual: 9854.57
  },
  {
    ral: 9360, months: 13, note: 'incapienza piena, fascia esente 7,1%',
    contributions: 860.18, taxable: 8499.82, irpefGross: 1954.96,
    deductionsTotal: 1955.00, irpefNet: 0.00,
    regional: 104.55, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 603.49, supplementary: 1200.00, netAnnual: 10198.76
  },
  {
    ral: 9361, months: 13, note: 'uscita dall incapienza, fascia esente scende a 5,3%',
    contributions: 860.28, taxable: 8500.72, irpefGross: 1955.17,
    deductionsTotal: 1955.00, irpefNet: 0.17,
    regional: 104.56, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 450.54, supplementary: 1200.00, netAnnual: 10046.54
  },
  {
    ral: 16518, months: 13, note: 'ultimo punto della detrazione piatta a 1.955',
    contributions: 1518.00, taxable: 15000.00, irpefGross: 3450.00,
    deductionsTotal: 1955.00, irpefNet: 1495.00,
    regional: 184.50, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 795.00, supplementary: 1200.00, netAnnual: 15315.50
  },
  {
    ral: 16519, months: 13, note: 'gradino art. 13, la detrazione salta a 3.099,88',
    contributions: 1518.10, taxable: 15000.90, irpefGross: 3450.21,
    deductionsTotal: 3099.88, irpefNet: 350.33,
    regional: 184.51, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 720.04, supplementary: 0.00, netAnnual: 15186.11
  },
  {
    ral: 18000, months: 13, note: 'somma esente cuneo, fascia 4,8%',
    contributions: 1654.20, taxable: 16345.80, irpefGross: 3759.53,
    deductionsTotal: 2976.72, irpefNet: 782.82,
    regional: 205.76, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 784.60, supplementary: 0.00, netAnnual: 16141.82
  },
  {
    ral: 22024, months: 13, note: 'ultimo punto della somma esente',
    contributions: 2024.01, taxable: 19999.99, irpefGross: 4600.00,
    deductionsTotal: 2642.21, irpefNet: 1957.79,
    regional: 263.50, municipal: 0.00,
    wedgeType: 'exempt', wedgeAmount: 960.00, supplementary: 0.00, netAnnual: 18738.70
  },
  {
    ral: 22025, months: 13, note: 'passaggio a ulteriore detrazione da 1.000',
    contributions: 2024.10, taxable: 20000.90, irpefGross: 4600.21,
    deductionsTotal: 3642.21, irpefNet: 958.00,
    regional: 263.51, municipal: 0.00,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 18779.39
  },
  {
    ral: 25327, months: 13, note: 'ultimo punto esente da addizionale comunale',
    contributions: 2327.55, taxable: 22999.45, irpefGross: 5289.87,
    deductionsTotal: 3367.67, irpefNet: 1922.20,
    regional: 310.89, municipal: 0.00,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 20766.36
  },
  {
    ral: 25329, months: 13, note: 'soglia comunale superata, si paga sull intero imponibile',
    contributions: 2327.74, taxable: 23001.26, irpefGross: 5290.29,
    deductionsTotal: 3367.56, irpefNet: 1922.74,
    regional: 310.92, municipal: 184.01,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00, netAnnual: 20583.60
  },
  {
    ral: 30000, months: 13, note: 'caso standard verificato a mano',
    contributions: 2757.00, taxable: 27243.00, irpefGross: 6265.89,
    deductionsTotal: 3044.26, irpefNet: 3221.63,
    regional: 377.94, municipal: 217.94,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00,
    netAnnual: 23425.48, netMonthly: 1801.96
  },
  {
    ral: 35000, months: 13, note: 'caso standard verificato a mano, imponibile sotto i 32.000',
    contributions: 3216.50, taxable: 31783.50, irpefGross: 7688.56,
    deductionsTotal: 2646.48, irpefNet: 5042.08,
    regional: 454.98, municipal: 254.27,
    wedgeType: 'deduction', wedgeAmount: 1000.00, supplementary: 0.00,
    netAnnual: 26032.18, netMonthly: 2002.48
  },
  {
    ral: 36000, months: 13, note: 'decalage del cuneo',
    contributions: 3308.40, taxable: 32691.60, irpefGross: 7988.23,
    deductionsTotal: 2481.15, irpefNet: 5507.08,
    regional: 470.60, municipal: 261.53,
    wedgeType: 'deduction', wedgeAmount: 913.55, supplementary: 0.00, netAnnual: 26452.39
  },
  {
    ral: 60000, months: 13, note: '43%, detrazione azzerata, contributo aggiuntivo 1%',
    contributions: 5551.76, taxable: 54448.24, irpefGross: 15612.74,
    deductionsTotal: 0.00, irpefNet: 15612.74,
    regional: 845.25, municipal: 435.59,
    wedgeType: 'none', wedgeAmount: 0.00, supplementary: 0.00, netAnnual: 37554.66
  },
  {
    ral: 130000, months: 13, note: 'massimale contributivo, tronca IVS e aggiuntivo',
    contributions: 11899.62, taxable: 118100.38, irpefGross: 42983.16,
    deductionsTotal: 0.00, irpefNet: 42983.16,
    regional: 1946.44, municipal: 944.80,
    wedgeType: 'none', wedgeAmount: 0.00, supplementary: 0.00, netAnnual: 72225.98
  }
];

/** Expected gross-pay position of each threshold, to check the derivation. */
var BREAKPOINT_CASES = [
  { threshold: 8173.91, space: 'taxable', ral: 9001.12 },
  { threshold: 8500, space: 'taxable', ral: 9360.20 },
  { threshold: 15000, space: 'taxable', ral: 16518.00 },
  { threshold: 20000, space: 'taxable', ral: 22024.01 },
  { threshold: 23000, space: 'taxable', ral: 25327.61 },
  { threshold: 25000, space: 'taxable', ral: 27530.01 },
  { threshold: 28000, space: 'taxable', ral: 30833.61 },
  { threshold: 32000, space: 'taxable', ral: 35238.41 },
  { threshold: 35000, space: 'taxable', ral: 38542.01 },
  { threshold: 40000, space: 'taxable', ral: 44048.01 },
  { threshold: 50000, space: 'taxable', ral: 55060.02 },
  { threshold: 56224, space: 'gross', ral: 56224.00 },
  { threshold: 122295, space: 'gross', ral: 122295.00 }
];

/**
 * Values hand-computed for 2025, the year where the second bracket is still 35%
 * and the contribution thresholds are lower.
 */
var VALUE_CASES_2025 = [
  {
    ral: 50000, months: 13, note: 'seconda aliquota al 35%, non al 33%',
    contributions: 4595.00, taxable: 45405.00, irpefGross: 12531.75,
    irpefNet: 12132.94, regional: 689.27, municipal: 363.24,
    netAnnual: 32219.55
  },
  {
    ral: 56000, months: 13, note: 'sopra la prima fascia 2025, che nel 2026 non lo sarebbe',
    contributions: 5151.92, taxable: 50848.08, irpefGross: 14504.67,
    irpefNet: 14504.67, regional: 782.97, municipal: 406.78,
    netAnnual: 35153.65
  }
];

/** Every leaf path where two parameter sets disagree. */
function diffPaths(a, b, prefix) {
  var keys = {};
  Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { keys[k] = true; });

  return Object.keys(keys).reduce(function (paths, key) {
    var here = prefix ? prefix + '.' + key : key;
    var left = (a || {})[key];
    var right = (b || {})[key];

    if (left && right && typeof left === 'object' && typeof right === 'object') {
      return paths.concat(diffPaths(left, right, here));
    }
    return left === right ? paths : paths.concat([here]);
  }, []);
}

var TEST_FIXTURES = {
  VALUE_CASES: VALUE_CASES,
  VALUE_CASES_2025: VALUE_CASES_2025,
  BREAKPOINT_CASES: BREAKPOINT_CASES,
  diffPaths: diffPaths
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEST_FIXTURES;
}
