// @ts-check
'use strict';

/**
 * Fringe benefit.
 *
 * L art. 51 co. 3 dice che se il valore supera il limite "lo stesso concorre
 * interamente a formare il reddito". Non e una franchigia da scorporare: e una
 * scogliera, e un centesimo di troppo costa l imposta su tutto il benefit.
 */
var SUITE_BENEFITS = function (context) {
  var engine = context.engine;
  var t = context.t;

  function at(value, family) {
    return engine.calculateNet({
      grossAnnual: 30000, months: 13, fringeBenefits: value, family: family || {}
    });
  }

  t.group('La soglia dei fringe benefit');

  t.close('mille euro senza figli', at(0).fringeBenefits.threshold, 1000, 1e-9);
  t.close('duemila con un figlio che da detrazione',
    at(0, { children: 1 }).fringeBenefits.threshold, 2000, 1e-9);

  /**
   * La soglia doppia guarda l art. 12 co. 2, che parla di reddito e non di
   * eta: spetta anche per un figlio di cinque anni, che una detrazione non la
   * prende perche dal marzo 2022 c e l assegno unico al suo posto.
   */
  var conPiccolo = at(0, { childrenUnder21: 1 });
  t.close('e anche con un figlio sotto i 21 anni',
    conPiccolo.fringeBenefits.threshold, 2000, 1e-9);
  t.close('che pero non porta nessuna detrazione art. 12',
    conPiccolo.irpef.deductions.family.total, 0, 1e-9);

  t.group('Sotto la soglia il benefit non si vede');

  var senza = at(0);
  var soglia = at(1000);

  t.close('mille euro esatti non cambiano l imponibile',
    soglia.taxableIncome, senza.taxableIncome, 1e-9);
  t.close('ne il netto', soglia.netAnnual, senza.netAnnual, 1e-9);
  t.ok('e non risultano sopra soglia', soglia.fringeBenefits.overThreshold === false);
  t.close('quindi niente concorre al reddito', soglia.fringeBenefits.taxable, 0, 1e-9);

  t.group('Un centesimo sopra e concorre tutto');

  var sopra = at(1000.01);

  t.ok('adesso si e sopra soglia', sopra.fringeBenefits.overThreshold === true);
  t.close('e il valore che concorre e l intero benefit, non l eccedenza',
    sopra.fringeBenefits.taxable, 1000.01, 1e-9);
  t.close('l imponibile sale di tutto il benefit al netto dei contributi',
    sopra.taxableIncome - senza.taxableIncome,
    1000.01 * (1 - engine.parameters.contributions.ivsRate), 0.01);

  /**
   * Il conto vero: il benefit arriva in beni e servizi, le imposte in euro. Un
   * centesimo in piu fa perdere piu di quattrocento euro di busta.
   */
  t.close('il centesimo costa 420,14 euro di netto',
    senza.netAnnual - sopra.netAnnual, 420.14, 0.02);

  t.ok('e la retribuzione complessiva peggiora',
    sopra.netAnnual + 1000.01 < senza.netAnnual + 1000);
  t.close('di poco piu di quattrocentoventi euro',
    (senza.netAnnual + 1000) - (sopra.netAnnual + 1000.01), 420.13, 0.02);

  /**
   * L imponibile previdenziale segue quello fiscale dal D.Lgs. 314/1997: sopra
   * la soglia si pagano anche i contributi sul benefit.
   */
  t.ok('e si pagano anche i contributi',
    sopra.contributions.total > senza.contributions.total + 90);

  t.group('Con figli la scogliera e piu alta e costa di piu');

  var conFigli = at(2000, { children: 2 });
  var conFigliSopra = at(2000.01, { children: 2 });

  t.ok('a duemila esatti non succede niente', conFigli.fringeBenefits.overThreshold === false);
  t.ok('un centesimo sopra e tutto imponibile', conFigliSopra.fringeBenefits.overThreshold === true);
  t.ok('e costa piu che senza figli, perche eroso anche l art. 12',
    conFigli.netAnnual - conFigliSopra.netAnnual > 900);

  t.group('Il resto del modello regge');

  t.throws('un benefit negativo non si accetta', function () {
    engine.calculateNet({ grossAnnual: 30000, fringeBenefits: -1 });
  });

  /** A benefit sotto soglia il modello e identico a quello senza benefit. */
  t.close('la traccia ricostruisce il netto anche con un benefit imponibile',
    sopra.ledger.reduce(function (sum, entry) {
      return sum + entry.sign * entry.amount;
    }, sopra.ral), sopra.netAnnual, 1e-9);

  /**
   * Le soglie del modello restano dove sono, e la RAL che le raggiunge scende
   * del valore che concorre al reddito: se la conversione non lo sapesse,
   * l inversione e la curva punterebbero al posto sbagliato.
   */
  var senzaBenefit = engine.getBreakpoints({ months: 13 });
  var conBenefit = engine.getBreakpoints({ months: 13, fringeBenefits: 1000.01 });
  var primaSenza = senzaBenefit.filter(function (bp) {
    return bp.ids.indexOf('irpef-bracket-1') !== -1;
  })[0];
  var primaCon = conBenefit.filter(function (bp) {
    return bp.ids.indexOf('irpef-bracket-1') !== -1;
  })[0];

  t.close('stessa soglia in imponibile', primaCon.threshold, primaSenza.threshold, 1e-9);
  t.close('ma la RAL che la raggiunge e piu bassa di tutto il benefit',
    primaSenza.ral - primaCon.ral, 1000.01, 1e-6);

  /** E il prospetto mensile continua a chiudere. */
  var prospetto = engine.monthlySchedule({
    grossAnnual: 30000, months: 13, fringeBenefits: 1500
  });
  t.close('la somma dei netti fa ancora il netto annuo',
    prospetto.totals.net, prospetto.annual.netAnnual, 1e-9);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_BENEFITS;
}
