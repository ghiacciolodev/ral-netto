// @ts-check
'use strict';

/**
 * Il prospetto dei periodi di paga, art. 23 DPR 600/1973.
 *
 * Il modello annuale dice quanto resta in un anno. Questo dice come arriva, e
 * non e la stessa cosa divisa per tredici: dentro l anno il prelievo cambia da
 * un periodo di paga all altro, per ragioni scritte nella norma.
 *
 * Comma 2 lett. a): sui periodi ordinari la ritenuta si calcola ragguagliando
 * al periodo di paga gli scaglioni annui, e applicando le detrazioni degli
 * articoli 12 e 13 rapportate allo stesso periodo.
 *
 * Comma 2 lett. b): sulle **mensilita aggiuntive** si ragguagliano a mese gli
 * scaglioni, e le detrazioni non sono nominate. Non e una dimenticanza: le
 * detrazioni spettano per il periodo di paga, e la tredicesima non aggiunge
 * giorni. E il motivo per cui la tredicesima netta molto meno di uno stipendio.
 * E non e un anticipo che torna: le detrazioni sono comunque usate per intero
 * sui dodici periodi ordinari, e il totale annuo non cambia.
 *
 * Comma 3: il conguaglio confronta le ritenute operate con l imposta dovuta
 * sull ammontare complessivo. Qui e per costruzione la differenza fra il
 * modello annuale e la somma delle ritenute, il che rende il prospetto e il
 * modello annuale due strade che devono arrivare allo stesso numero. Un test
 * lo verifica, ed e l unica ragione per cui questo modulo si puo credere.
 */
var ENGINE_MONTHLY = function (parameters, numbers, calculation) {
  var applyBrackets = numbers.applyBrackets;
  var calculateNet = calculation.calculateNet;

  var MESI = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
  ];

  /**
   * Gli scaglioni annui ragguagliati al periodo di paga. Vale sia per i periodi
   * ordinari sia per le mensilita aggiuntive: il comma 2 dice mese in entrambi
   * i casi, non "una delle tredici parti".
   */
  function monthlyBrackets(brackets) {
    var ordinary = parameters.payroll.ordinaryPeriods;

    return brackets.map(function (bracket) {
      return {
        upTo: bracket.upTo === null ? null : bracket.upTo / ordinary,
        rate: bracket.rate
      };
    });
  }

  /**
   * Le addizionali non si trattengono nell anno di competenza. Nell anno entrano
   * il saldo dell anno prima, in un massimo di undici rate da gennaio, e il solo
   * acconto comunale dell anno in corso, in nove rate da marzo.
   *
   * Su una retribuzione costante i due anni coincidono, quindi quello che esce
   * per cassa in un anno e esattamente l addizionale dovuta per quell anno: e
   * la distribuzione dentro l anno a non essere uniforme, non il totale.
   */
  function instalmentFor(monthIndex, surtaxes) {
    var plan = parameters.payroll.surtaxInstalments;
    var advance = surtaxes.municipal * plan.municipalAdvanceShare;
    var balance = surtaxes.regional + surtaxes.municipal - advance;
    var month = monthIndex + 1;
    var amount = 0;

    if (month >= plan.balanceFirstMonth &&
        month < plan.balanceFirstMonth + plan.balanceInstalments) {
      amount += balance / plan.balanceInstalments;
    }

    if (month >= plan.municipalAdvanceFirstMonth &&
        month < plan.municipalAdvanceFirstMonth + plan.municipalAdvanceInstalments) {
      amount += advance / plan.municipalAdvanceInstalments;
    }

    return amount;
  }

  /**
   * Un anno di paghe, periodo per periodo.
   * @param {object} input la posizione, come per calculateNet
   */
  function monthlySchedule(input) {
    var annual = calculateNet(input);
    var payroll = parameters.payroll;
    var ordinary = payroll.ordinaryPeriods;
    var extraMonths = payroll.extraMonths[annual.position.months] || [];

    // Ogni mensilita vale la stessa quota di RAL: la tredicesima non e un
    // premio, e una parte della retribuzione annua spostata a dicembre.
    var perPayment = annual.ral / annual.position.months;
    var share = annual.position.months > 0 ? 1 / annual.position.months : 0;

    var brackets = monthlyBrackets(parameters.irpef.brackets);
    var deductions = annual.irpef.deductions;

    // Art. 12 e 13 rapportate al periodo di paga: un dodicesimo su ciascuno dei
    // periodi ordinari, e nulla sulle mensilita aggiuntive.
    var perPeriodDeduction = deductions.total / ordinary;

    // Il trattamento integrativo si rapporta al periodo di lavoro, la somma
    // esente del cuneo e una percentuale della retribuzione: il primo segue i
    // periodi ordinari, la seconda segue ogni euro pagato.
    var perPeriodAllowance = annual.supplementaryAllowance.amount / ordinary;
    var exemptShare = annual.wedge.type === 'exempt' ? annual.wedge.amount * share : 0;

    var periods = [];

    function addPeriod(monthIndex, extra) {
      var grossTax = applyBrackets(perPayment - annual.contributions.total * share, brackets).total;
      var applied = extra ? 0 : Math.min(perPeriodDeduction, grossTax);

      periods.push({
        month: monthIndex + 1,
        name: MESI[monthIndex],
        extra: extra,
        label: extra ? 'mensilita aggiuntiva' : MESI[monthIndex],
        gross: perPayment,
        contributions: annual.contributions.total * share,
        taxable: perPayment - annual.contributions.total * share,
        irpefGross: grossTax,
        deduction: applied,
        irpefWithheld: grossTax - applied,
        surtaxes: extra ? 0 : instalmentFor(monthIndex, annual.surtaxes),
        wedgeExempt: exemptShare,
        supplementaryAllowance: extra ? 0 : perPeriodAllowance,
        adjustment: 0,
        net: 0
      });
    }

    MESI.forEach(function (nome, index) {
      addPeriod(index, false);
      if (extraMonths.indexOf(index + 1) !== -1) addPeriod(index, true);
    });

    /**
     * Comma 3. Per costruzione questo porta la somma delle ritenute esattamente
     * sull imposta annua, che e quello che il conguaglio fa davvero: confronta
     * il gia trattenuto con il dovuto e sistema la differenza.
     */
    var withheld = periods.reduce(function (sum, period) {
      return sum + period.irpefWithheld;
    }, 0);

    var adjustment = annual.irpef.net - withheld;
    var december = periods.filter(function (period) { return !period.extra; }).pop();
    december.adjustment = adjustment;

    periods.forEach(function (period) {
      period.net = period.gross - period.contributions - period.irpefWithheld -
        period.adjustment - period.surtaxes + period.wedgeExempt +
        period.supplementaryAllowance;
    });

    return {
      position: annual.position,
      annual: annual,
      periods: periods,
      adjustment: adjustment,
      adjustmentMonth: december.name,
      totals: totals(periods)
    };
  }

  var COLUMNS = ['gross', 'contributions', 'taxable', 'irpefGross', 'deduction',
    'irpefWithheld', 'surtaxes', 'wedgeExempt', 'supplementaryAllowance',
    'adjustment', 'net'];

  function totals(periods) {
    var sum = {};
    COLUMNS.forEach(function (column) { sum[column] = 0; });

    periods.forEach(function (period) {
      COLUMNS.forEach(function (column) { sum[column] += period[column]; });
    });

    return sum;
  }

  return {
    monthlySchedule: monthlySchedule,
    monthlyBrackets: monthlyBrackets
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENGINE_MONTHLY;
}
