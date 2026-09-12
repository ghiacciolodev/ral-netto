// @ts-check
'use strict';

/**
 * La traccia. Non e decorazione: l interfaccia rende solo quella, deve
 * ricostruire il netto esattamente e ogni voce deve citare una fonte che c e.
 */
var SUITE_LEDGER = function (context) {
  var engine = context.engine;
  var t = context.t;
  var VALUE_CASES = context.fixtures.VALUE_CASES;

  t.group('La traccia ricostruisce il netto');
  VALUE_CASES.forEach(function (c) {
    var r = engine.calculateNet({ grossAnnual: c.ral, months: c.months });
    var rebuilt = r.ledger.reduce(function (sum, entry) {
      return sum + entry.sign * entry.amount;
    }, r.ral);
    t.close('RAL ' + c.ral, rebuilt, r.netAnnual, 1e-9);
  });

  t.group('Ogni voce della traccia cita una fonte esistente');
  var orphans = [];
  VALUE_CASES.forEach(function (c) {
    engine.calculateNet({ grossAnnual: c.ral }).ledger.forEach(function (entry) {
      if (!engine.sources[entry.sourceId]) orphans.push(entry.id + ' -> ' + entry.sourceId);
    });
  });
  t.ok('nessuna citazione orfana', orphans.length === 0, orphans.join(', '));
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUITE_LEDGER;
}
