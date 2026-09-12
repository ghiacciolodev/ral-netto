// @ts-check
'use strict';

/**
 * Il registro degli anni d imposta, e la guardia che tiene allineati due
 * insiemi di parametri che sono copie complete di proposito.
 */
var SUITE_YEARS = function (context) {
  var engine = context.engine;
  var t = context.t;
  var registry = context.registry;
  var VALUE_CASES_2025 = context.fixtures.VALUE_CASES_2025;
  var diffPaths = context.fixtures.diffPaths;

  t.group('Anno d imposta 2025');
  if (!registry) {
    t.ok('registro degli anni disponibile', false, 'runTests chiamato senza registro');
  } else {
    var e2025 = engine.forTaxYear(2025);

    t.equal('il registro contiene 2025 e 2026', registry.years.join(','), '2025,2026');
    t.equal('il motore 2025 e legato al suo anno', e2025.taxYear, 2025);

    VALUE_CASES_2025.forEach(function (c) {
      var r = e2025.calculateNet({ grossAnnual: c.ral, months: c.months });
      var tag = '2025 RAL ' + c.ral + ' (' + c.note + ')';
      t.close(tag + ' - contributi', r.contributions.total, c.contributions);
      t.close(tag + ' - imponibile', r.taxableIncome, c.taxable);
      t.close(tag + ' - IRPEF lorda', r.irpef.gross, c.irpefGross);
      t.close(tag + ' - IRPEF netta', r.irpef.net, c.irpefNet);
      t.close(tag + ' - addizionale regionale', r.surtaxes.regional, c.regional);
      t.close(tag + ' - addizionale comunale', r.surtaxes.municipal, c.municipal);
      t.close(tag + ' - netto annuo', r.netAnnual, c.netAnnual);
    });

    /**
     * Art. 12 is the same text in both years, so the deduction has to come out
     * identical while the tax on top of it does not. The drift guard below
     * proves the first claim on the parameters; this shows it on a result.
     */
    var family2025 = e2025.calculateNet({
      grossAnnual: 40000, months: 13,
      family: { spouse: true, children: 1, childrenSharePercent: 100 }
    });
    var family2026 = engine.calculateNet({
      grossAnnual: 40000, months: 13,
      family: { spouse: true, children: 1, childrenSharePercent: 100 }
    });
    t.close('2025, coniuge e un figlio', family2025.irpef.deductions.family.total, 1276.72);
    t.close('la detrazione art. 12 non cambia nel 2026',
      family2026.irpef.deductions.family.total, family2025.irpef.deductions.family.total, 1e-9);
    t.close('ma la seconda aliquota si, e il netto sale di 166,48',
      family2026.netAnnual - family2025.netAnnual, 166.48);

    /**
     * Drift guard. The two year files are full copies on purpose, so the risk is
     * that a fix lands in one and not the other. This asserts that the parameters
     * differ in exactly the places they are meant to, and nowhere else.
     */
    var expected = [
      'taxYear',
      'irpef.brackets.1.rate',
      'contributions.additionalThreshold',
      'contributions.cap',
      'contributions.sourceId'
    ].sort();

    var found = diffPaths(registry.byYear[2025], registry.byYear[2026], '')
      .filter(function (path) { return path.indexOf('sources') !== 0; })
      .sort();

    t.equal('2025 e 2026 differiscono solo dove devono',
      found.join(' | '), expected.join(' | '));

    /**
     * Same guard on the local table. Lombardia and Milano did not change
     * between the two years, so the only difference allowed is the year itself.
     * The day a comune moves its rate, this says so out loud.
     */
    /**
     * Sul locale la guardia cambia forma. Con quasi ottomila comuni un elenco
     * di percorsi non si legge, e i comuni **devono** poter cambiare aliquota
     * da un anno all altro: e il loro mestiere. Quello che non deve cambiare e
     * la loro identita, e quello che va tenuto d occhio e quanti si muovono.
     */
    var localFound = diffPaths(registry.localByYear[2025], registry.localByYear[2026], '')
      .filter(function (path) { return path.indexOf('sources') !== 0; });

    var regionDiff = localFound.filter(function (path) {
      return path.indexOf('regions.') === 0;
    }).sort();

    t.equal('fra 2025 e 2026 hanno cambiato aliquota tre regioni',
      regionDiff.join(' | '), [
        'regions.emilia-romagna.brackets.2.rate',
        'regions.piemonte.brackets.1.rate',
        'regions.piemonte.brackets.2.rate',
        'regions.puglia.brackets.1.rate',
        'regions.puglia.brackets.2.rate',
        'regions.puglia.brackets.3.rate'
      ].sort().join(' | '));

    var mutevoli = /\.(brackets(\.\d+(\.(upTo|rate))?)?|exemptionThreshold|deliberatedFor|unmodelledRelief)$/;
    var illeciti = localFound.filter(function (path) {
      return path.indexOf('municipalities.') === 0 && !mutevoli.test(path);
    });
    t.ok('nessun comune cambia nome, provincia o regione fra i due anni',
      illeciti.length === 0, illeciti.slice(0, 5).join(', '));

    var chiavi2025 = Object.keys(registry.localByYear[2025].municipalities).sort();
    var chiavi2026 = Object.keys(registry.localByYear[2026].municipalities).sort();
    t.equal('i due anni contengono gli stessi comuni',
      chiavi2025.join(',') === chiavi2026.join(','), true);

    var mossi = chiavi2026.filter(function (key) {
      return JSON.stringify(registry.localByYear[2025].municipalities[key]) !==
        JSON.stringify(registry.localByYear[2026].municipalities[key]);
    });
    t.equal('e 3.208 comuni hanno deliberato qualcosa di nuovo', mossi.length, 3208);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_YEARS;
}
