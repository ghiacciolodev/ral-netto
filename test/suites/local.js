// @ts-check
'use strict';

/**
 * Addizionali regionali e comunali. Il dataset vero contiene un ente solo, ma
 * la forma deve reggerne molti: qui il motore viene montato su dati inventati
 * per verificarlo, compreso un comune con addizionale progressiva.
 */
var SUITE_LOCAL = function (context) {
  var engine = context.engine;
  var t = context.t;
  var registry = context.registry;
  var createEngine = context.createEngine;

  t.group('Il dataset locale');

  var local = engine.local;
  var regionKeys = Object.keys(local.regions);
  var municipalityKeys = Object.keys(local.municipalities);

  t.equal('venti regioni piu la provincia autonoma di Bolzano e quella di Trento',
    regionKeys.length, 21);
  t.equal('un comune per regione, il capoluogo', municipalityKeys.length, 21);

  var homeless = municipalityKeys.filter(function (key) {
    return !local.regions[local.municipalities[key].region];
  });
  t.ok('ogni comune sta in una regione che esiste', homeless.length === 0, homeless.join(', '));

  var empty = regionKeys.filter(function (region) {
    return !municipalityKeys.some(function (key) {
      return local.municipalities[key].region === region;
    });
  });
  t.ok('ogni regione ha almeno un comune', empty.length === 0, empty.join(', '));

  var missingSource = regionKeys.map(function (key) { return local.regions[key].sourceId; })
    .concat(municipalityKeys.map(function (key) { return local.municipalities[key].sourceId; }))
    .filter(function (id) { return !engine.sources[id]; });
  t.ok('ogni ente cita una fonte che esiste', missingSource.length === 0, missingSource.join(', '));

  var noBrackets = regionKeys.concat(municipalityKeys).filter(function (key) {
    var entity = local.regions[key] || local.municipalities[key];
    var last = entity.brackets[entity.brackets.length - 1];
    return !entity.brackets.length || last.upTo !== null;
  });
  t.ok('ogni scala di aliquote finisce con uno scaglione aperto',
    noBrackets.length === 0, noBrackets.join(', '));

  t.group('Addizionali sui dati veri');

  /**
   * Same gross, same family, different place. The whole point of the local
   * dataset is that this spread exists and is not small.
   */
  function at(region, municipality) {
    return engine.calculateNet({
      grossAnnual: 30000, months: 13, region: region, municipality: municipality
    });
  }

  var roma = at('lazio', 'roma');
  t.close('Lazio, 1,73% fino a 15.000 poi 3,33%', roma.surtaxes.regional, 667.19);
  t.close('Roma, 0,9% oltre l esenzione di 14.000', roma.surtaxes.municipal, 245.19);
  t.close('netto annuo a Roma', roma.netAnnual, 23108.99);

  /** Torino and Genova really do have a progressive comunale. */
  var torino = at('piemonte', 'torino');
  t.equal('Torino ha quattro scaglioni comunali',
    local.municipalities.torino.brackets.length, 4);
  t.close('Piemonte, quattro scaglioni', torino.surtaxes.regional, 571.11);
  t.close('Torino, 0,8% sui primi 28.000 di imponibile', torino.surtaxes.municipal, 217.94);
  t.equal('il dettaglio comunale segue gli scaglioni', torino.surtaxes.municipalDetail.length, 2);

  var genova = at('liguria', 'genova');
  t.close('Genova, 1% sotto i 28.000', genova.surtaxes.municipal, 272.43);

  /** Two places where the comunale is simply not levied, for different reasons. */
  var trento = at('trento', 'trento');
  t.equal('Trento non ha mai deliberato',
    local.municipalities.trento.deliberatedFor, null);
  t.close('e quindi non ha addizionale comunale', trento.surtaxes.municipal, 0, 1e-9);

  var bolzano = at('bolzano', 'bolzano');
  t.close('Bolzano delibera un aliquota a zero', bolzano.surtaxes.municipal, 0, 1e-9);

  t.ok('la stessa RAL rende di piu dove il comune non preleva',
    trento.netAnnual > roma.netAnnual + 500);

  /**
   * The exemption is a threshold, not an allowance. Firenze has the highest of
   * the twenty one, so the cliff is easy to stand on.
   */
  var soglia = local.municipalities.firenze.exemptionThreshold;
  t.close('Firenze esenta fino a 25.000 di imponibile', soglia, 25000, 1e-9);
  t.close('un euro sotto non si paga niente',
    engine.calculateNet({
      grossAnnual: engine.grossFromTaxable(soglia - 1), months: 13,
      region: 'toscana', municipality: 'firenze'
    }).surtaxes.municipal, 0, 1e-9);
  t.ok('un euro sopra si paga su tutto l imponibile',
    engine.calculateNet({
      grossAnnual: engine.grossFromTaxable(soglia + 1), months: 13,
      region: 'toscana', municipality: 'firenze'
    }).surtaxes.municipal > 49);

  /** Palermo is the one capital that deliberated for the current year. */
  t.equal('Palermo ha deliberato per il 2026',
    local.municipalities.palermo.deliberatedFor, engine.taxYear);
  t.ok('gli altri venti valgono per proroga',
    municipalityKeys.filter(function (key) {
      return local.municipalities[key].deliberatedFor === engine.taxYear;
    }).length === 1);

  /**
   * The affine completeness check again, on a place whose local rules are
   * progressive on both levels. A missing local threshold shows up here.
   */
  var torinoPosition = { months: 13, region: 'piemonte', municipality: 'torino' };
  var torinoSmooth = { exactRatios: true };
  var torinoEdges = [0].concat(
    engine.getBreakpoints(torinoPosition)
      .map(function (bp) { return bp.ral; })
      .filter(function (r) { return r > 0 && r < engine.maxRal; })
  ).concat([engine.maxRal]);

  var torinoWorst = 0;
  var torinoTolerance = 1e-6;

  torinoEdges.forEach(function (lo, index) {
    var hi = torinoEdges[index + 1];
    if (hi === undefined || hi - lo < 1e-6) return;

    var span = hi - lo;
    var x1 = lo + span * 0.05;
    var x2 = lo + span * 0.95;
    var y1 = engine.calculateNet(engine.withGross(torinoPosition, x1), torinoSmooth).netAnnual;
    var y2 = engine.calculateNet(engine.withGross(torinoPosition, x2), torinoSmooth).netAnnual;
    var slope = (y2 - y1) / (x2 - x1);

    [0.1, 0.5, 0.9].forEach(function (fraction) {
      var probe = lo + span * fraction;
      var actual = engine.calculateNet(engine.withGross(torinoPosition, probe), torinoSmooth).netAnnual;
      var error = Math.abs(actual - (y1 + slope * (probe - x1)));
      torinoTolerance = Math.max(torinoTolerance, Math.abs(actual) * 1e-12);
      if (error > torinoWorst) torinoWorst = error;
    });
  });

  t.ok('a Torino il modello resta affine fra le soglie (' +
    torinoWorst.toExponential(2) + ')', torinoWorst <= torinoTolerance);

  t.group('Addizionali locali');

  /**
   * The local dataset is a table, not a handful of hand read values, so the
   * engine has to work for entries nobody has entered yet. This builds a
   * rulebook on made up local data and checks the machinery on it: two regions,
   * and a comune whose addizionale is progressive, which most of them are and
   * Milano is not.
   *
   * Made up on purpose. Real rates belong in the dataset with their source, and
   * a test is not the place to smuggle them in.
   */
  if (!createEngine) {
    t.ok('costruttore del motore disponibile', false, 'runTests chiamato senza createEngine');
  } else {
    var realLocal = registry.localForYear(2026);

    function extend(base, additions) {
      var merged = {};
      Object.keys(base).forEach(function (key) { merged[key] = base[key]; });
      Object.keys(additions).forEach(function (key) { merged[key] = additions[key]; });
      return merged;
    }

    var invented = {
      taxYear: 2026,
      defaults: realLocal.defaults,
      regions: extend(realLocal.regions, {
        altrove: {
          name: 'Altrove',
          brackets: [
            { upTo: 28000, rate: 0.0173 },
            { upTo: null, rate: 0.0233 }
          ],
          sourceId: 'fonte-inventata'
        }
      }),
      municipalities: extend(realLocal.municipalities, {
        esempio: {
          name: 'Esempio',
          region: 'altrove',
          brackets: [
            { upTo: 20000, rate: 0.004 },
            { upTo: null, rate: 0.009 }
          ],
          exemptionThreshold: 12000,
          sourceId: 'fonte-inventata'
        }
      }),
      sources: extend(realLocal.sources, {
        'fonte-inventata': {
          label: 'dato inventato per i test',
          title: 'Non e una fonte, e un caso di prova',
          url: null,
          inForceFrom: '2026-01-01',
          note: 'Serve a verificare che il motore regga enti che non sono Milano.'
        }
      })
    };

    var invitedRegistry = {
      byYear: registry.byYear,
      localByYear: { 2026: invented },
      years: [2026],
      latest: 2026,
      forYear: function () { return registry.forYear(2026); },
      localForYear: function () { return invented; }
    };

    var elsewhere = createEngine(invitedRegistry, 2026);
    var elsewherePosition = { months: 13, region: 'altrove', municipality: 'esempio' };
    var progressive = elsewhere.calculateNet(
      elsewhere.withGross(elsewherePosition, 30000));

    t.close('imponibile invariato', progressive.taxableIncome, 27243.00);

    // 15.000 a 1,73% piu il resto a 2,33%, calcolato a mano sull imponibile.
    t.close('addizionale regionale a due scaglioni', progressive.surtaxes.regional, 471.30);

    // 20.000 allo 0,4% piu 7.243 allo 0,9%: il comune progressivo passa dagli
    // scaglioni come la regione, che e il punto di tutta la forma.
    t.close('addizionale comunale progressiva', progressive.surtaxes.municipal, 145.19);
    t.equal('il dettaglio comunale ha due righe', progressive.surtaxes.municipalDetail.length, 2);
    t.ok('sotto la soglia il comune non si paga',
      elsewhere.calculateNet(elsewhere.withGross(elsewherePosition, 12000)).surtaxes.municipal === 0);

    var elsewhereLedger = progressive.ledger.filter(function (entry) {
      return entry.id === 'surtax.municipal';
    })[0];
    t.equal('la traccia nomina il comune', elsewhereLedger.label, 'Addizionale comunale Esempio');
    t.equal('e per un progressivo parla di scaglioni',
      elsewhereLedger.formula.indexOf('scaglioni') === 0, true);

    var elsewhereIds = elsewhere.getBreakpoints(elsewherePosition).reduce(function (all, bp) {
      return all.concat(bp.ids);
    }, []);
    t.ok('gli scaglioni comunali diventano soglie',
      elsewhereIds.indexOf('municipal-bracket-1') !== -1);
    t.ok('e anche il secondo scaglione regionale',
      elsewhereIds.indexOf('regional-bracket-1') !== -1);

    /**
     * The same affine completeness check as above, on a position whose local
     * rules nobody wrote the engine around. If a local threshold went missing
     * this is what would catch it.
     */
    var elsewhereSmooth = { exactRatios: true };
    var elsewhereEdges = [0].concat(
      elsewhere.getBreakpoints(elsewherePosition)
        .map(function (bp) { return bp.ral; })
        .filter(function (r) { return r > 0 && r < elsewhere.maxRal; })
    ).concat([elsewhere.maxRal]);

    var elsewhereWorst = 0;
    var elsewhereTolerance = 1e-6;

    elsewhereEdges.forEach(function (lo, index) {
      var hi = elsewhereEdges[index + 1];
      if (hi === undefined || hi - lo < 1e-6) return;

      var span = hi - lo;
      var x1 = lo + span * 0.05;
      var x2 = lo + span * 0.95;
      var y1 = elsewhere.calculateNet(
        elsewhere.withGross(elsewherePosition, x1), elsewhereSmooth).netAnnual;
      var y2 = elsewhere.calculateNet(
        elsewhere.withGross(elsewherePosition, x2), elsewhereSmooth).netAnnual;
      var slope = (y2 - y1) / (x2 - x1);

      [0.1, 0.5, 0.9].forEach(function (fraction) {
        var probe = lo + span * fraction;
        var actual = elsewhere.calculateNet(
          elsewhere.withGross(elsewherePosition, probe), elsewhereSmooth).netAnnual;
        var error = Math.abs(actual - (y1 + slope * (probe - x1)));
        elsewhereTolerance = Math.max(elsewhereTolerance, Math.abs(actual) * 1e-12);
        if (error > elsewhereWorst) elsewhereWorst = error;
      });
    });

    t.ok('il modello resta affine anche con un comune progressivo (' +
      elsewhereWorst.toExponential(2) + ')', elsewhereWorst <= elsewhereTolerance);

    /** A comune belongs to one region, and the pair has to agree. */
    t.throws('comune fuori dalla sua regione', function () {
      elsewhere.calculateNet({ grossAnnual: 30000, region: 'lombardia', municipality: 'esempio' });
    });
    t.throws('regione non nel dataset', function () {
      elsewhere.calculateNet({ grossAnnual: 30000, region: 'atlantide', municipality: 'esempio' });
    });
    t.throws('comune non nel dataset', function () {
      elsewhere.calculateNet({ grossAnnual: 30000, region: 'altrove', municipality: 'atlantide' });
    });

    /** Milano still comes out of the real dataset, untouched. */
    t.close('il caso reale non si muove',
      elsewhere.calculateNet({ grossAnnual: 30000, months: 13 }).netAnnual,
      engine.calculateNet({ grossAnnual: 30000, months: 13 }).netAnnual, 1e-9);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_LOCAL;
}
