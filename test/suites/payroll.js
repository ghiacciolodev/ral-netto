// @ts-check
'use strict';

/**
 * Il prospetto dei periodi di paga.
 *
 * La prova che regge tutto e la riconciliazione: la somma dei netti di periodo
 * deve fare il netto annuo, al centesimo e su qualunque posizione. Il modello
 * annuale e questo sono due strade diverse per lo stesso numero, e il
 * conguaglio e il punto in cui si incontrano.
 */
var SUITE_PAYROLL = function (context) {
  var engine = context.engine;
  var t = context.t;

  t.group('Ragguaglio al periodo di paga');

  var mensili = engine.monthlySchedule({ grossAnnual: 30000, months: 13 });
  var ordinari = mensili.periods.filter(function (period) { return !period.extra; });
  var aggiuntive = mensili.periods.filter(function (period) { return period.extra; });

  t.equal('dodici periodi ordinari piu una mensilita aggiuntiva',
    ordinari.length + ':' + aggiuntive.length, '12:1');
  t.close('ogni periodo vale la stessa quota di RAL', ordinari[0].gross, 30000 / 13);
  t.close('anche la mensilita aggiuntiva', aggiuntive[0].gross, 30000 / 13);

  /**
   * Art. 23 co. 2 lett. b): sulle mensilita aggiuntive gli scaglioni si
   * ragguagliano a mese e le detrazioni non sono nominate. L imposta lorda del
   * periodo e la stessa, quello che cambia e che non c e niente da sottrarre.
   */
  t.group('La tredicesima non porta detrazioni');

  t.close('stessa imposta lorda di un mese ordinario',
    aggiuntive[0].irpefGross, ordinari[0].irpefGross, 1e-9);
  t.close('ma nessuna detrazione', aggiuntive[0].deduction, 0, 1e-9);
  t.ok('quindi trattiene piu del doppio',
    aggiuntive[0].irpefWithheld > 2 * ordinari[0].irpefWithheld);
  t.close('imposta trattenuta sulla tredicesima', aggiuntive[0].irpefWithheld, 481.99);
  t.close('netto di un mese ordinario', ordinari[6].net, 1811.82);
  t.close('netto della tredicesima', aggiuntive[0].net, 1613.62);
  t.ok('quasi duecento euro di differenza',
    ordinari[6].net - aggiuntive[0].net > 190);

  /**
   * E non e un anticipo che torna indietro: le detrazioni sono comunque usate
   * per intero sui dodici periodi ordinari, e il totale annuo non cambia.
   */
  var detrazioniUsate = mensili.periods.reduce(function (sum, period) {
    return sum + period.deduction;
  }, 0);
  t.close('le detrazioni annue finiscono tutte sui periodi ordinari',
    detrazioniUsate, mensili.annual.irpef.deductions.total);

  t.group('Conguaglio');

  /**
   * Comma 3: il conguaglio confronta il trattenuto con il dovuto. Su una
   * retribuzione costante tutta dentro uno scaglione non c e niente da
   * sistemare, e lo zero e un risultato, non una mancanza.
   */
  t.close('a 30.000 non c e niente da conguagliare', mensili.adjustment, 0, 0.01);
  t.equal('e comunque cadrebbe a dicembre', mensili.adjustmentMonth, 'dicembre');

  /**
   * A redditi alti invece scatta: ogni periodo vede un tredicesimo della RAL
   * attraverso scaglioni ragguagliati a un dodicesimo, quindi si presenta piu
   * povero di quello che e e la progressivita morde meno. A dicembre il conto
   * torna, e arriva in una volta sola.
   */
  var alto = engine.monthlySchedule({ grossAnnual: 80000, months: 13 });
  t.ok('a 80.000 dicembre chiede il resto', alto.adjustment > 600);
  t.close('e sono seicentocinquanta euro', alto.adjustment, 650.00, 1.00);

  /**
   * Al contrario, quando le detrazioni superano l imposta del mese la ritenuta
   * si ferma a zero e quello che avanza non si perde: torna al conguaglio.
   */
  var conFamiglia = engine.monthlySchedule({
    grossAnnual: 20000, months: 13,
    family: { spouse: true, children: 3, childrenSharePercent: 100 }
  });
  t.ok('con tre figli a 20.000 il conguaglio restituisce', conFamiglia.adjustment < -300);

  t.group('Le addizionali si trattengono a rate');

  /**
   * Saldo dell anno prima in undici rate da gennaio, acconto comunale del 30%
   * in nove rate da marzo. Su una retribuzione costante il totale dell anno e
   * esattamente l addizionale dovuta per l anno.
   */
  var addizionali = mensili.periods.reduce(function (sum, period) {
    return sum + period.surtaxes;
  }, 0);
  t.close('il totale trattenuto e quello dovuto',
    addizionali, mensili.annual.surtaxes.total);
  t.close('a dicembre le rate sono finite', ordinari[11].surtaxes, 0, 1e-9);
  t.ok('da marzo la rata cresce, entra l acconto comunale',
    ordinari[2].surtaxes > ordinari[1].surtaxes);
  t.close('gennaio e febbraio sono uguali', ordinari[0].surtaxes, ordinari[1].surtaxes, 1e-9);
  t.close('e sulla mensilita aggiuntiva non si trattiene nulla',
    aggiuntive[0].surtaxes, 0, 1e-9);

  t.group('Mensilita diverse');

  var dodici = engine.monthlySchedule({ grossAnnual: 30000, months: 12 });
  t.equal('dodici mensilita, dodici periodi', dodici.periods.length, 12);
  t.close('e nessun conguaglio, perche i periodi vedono tutta la RAL',
    dodici.adjustment, 0, 0.01);

  var quattordici = engine.monthlySchedule({ grossAnnual: 30000, months: 14 });
  t.equal('quattordici mensilita, quattordici periodi', quattordici.periods.length, 14);
  t.equal('due delle quali aggiuntive', quattordici.periods.filter(function (period) {
    return period.extra;
  }).length, 2);
  t.equal('a giugno e a dicembre', quattordici.periods.filter(function (period) {
    return period.extra;
  }).map(function (period) { return period.month; }).join(','), '6,12');

  t.group('Il prospetto e il modello annuale danno lo stesso numero');

  /**
   * La prova piu forte della suite. Due strade diverse, un solo numero: se il
   * prospetto sbagliasse una regola, la somma dei netti smetterebbe di tornare.
   */
  [
    { name: 'caso base', position: { grossAnnual: 30000, months: 13 } },
    { name: 'dodici mensilita', position: { grossAnnual: 30000, months: 12 } },
    { name: 'quattordici mensilita', position: { grossAnnual: 44000, months: 14 } },
    { name: 'incapiente', position: { grossAnnual: 11000, months: 13 } },
    { name: 'sopra il massimale', position: { grossAnnual: 150000, months: 13 } },
    {
      name: 'con familiari a carico',
      position: {
        grossAnnual: 26000, months: 13,
        family: { spouse: true, children: 2, ascendants: 1 }
      }
    },
    {
      name: 'rapporto parziale',
      position: { grossAnnual: 30000, months: 13, daysWorked: 200, contractType: 'fixed-term' }
    },
    {
      name: 'fuori Milano',
      position: { grossAnnual: 35000, months: 13, region: 'piemonte', municipality: 'torino-to' }
    },
    {
      name: 'dove il comune non preleva',
      position: { grossAnnual: 35000, months: 13, region: 'trento', municipality: 'trento-tn' }
    }
  ].forEach(function (caso) {
    var prospetto = engine.monthlySchedule(caso.position);

    t.close(caso.name + ': la somma dei netti fa il netto annuo',
      prospetto.totals.net, prospetto.annual.netAnnual, 1e-9);
    t.close(caso.name + ': i lordi tornano',
      prospetto.totals.gross, prospetto.annual.ral, 1e-9);
    t.close(caso.name + ': i contributi tornano',
      prospetto.totals.contributions, prospetto.annual.contributions.total, 1e-9);
    t.close(caso.name + ': l IRPEF trattenuta piu il conguaglio fa l IRPEF netta',
      prospetto.totals.irpefWithheld + prospetto.adjustment,
      prospetto.annual.irpef.net, 1e-9);
    t.close(caso.name + ': le addizionali tornano',
      prospetto.totals.surtaxes, prospetto.annual.surtaxes.total, 1e-9);
  });

  t.group('Scaglioni ragguagliati');

  var annui = engine.parameters.irpef.brackets;
  var mensili12 = engine.monthlySchedule({ grossAnnual: 30000, months: 13 });
  t.ok('il prospetto esiste', !!mensili12.periods.length);

  /** Il primo scaglione annuo diviso dodici e la soglia del periodo di paga. */
  var sogliaMese = annui[0].upTo / 12;
  var sotto = engine.monthlySchedule({
    grossAnnual: engine.grossFromTaxable(sogliaMese * 12) - 100, months: 12
  });
  t.ok('sotto la soglia si resta nella prima aliquota',
    sotto.periods[0].irpefGross <= sotto.periods[0].taxable * annui[0].rate + 1e-9);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_PAYROLL;
}
