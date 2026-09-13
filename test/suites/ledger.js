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

  t.group('Ogni voce della traccia ha una spiegazione');

  /**
   * L interfaccia apre ogni voce per dire che cos e. Una voce senza
   * spiegazione lascerebbe un pulsante che non si apre, e sarebbe invisibile
   * fino a che qualcuno non ci clicca sopra: meglio che fallisca qui.
   */
  var spiegazioni = context.spiegazioni;
  var mute = [];

  [
    { grossAnnual: 9500, months: 13 },
    { grossAnnual: 30000, months: 13 },
    { grossAnnual: 150000, months: 13 },
    { grossAnnual: 20000, months: 13, family: { spouse: true, children: 3 } }
  ].forEach(function (position) {
    engine.calculateNet(position).ledger.forEach(function (entry) {
      if (!spiegazioni[entry.id] && mute.indexOf(entry.id) === -1) mute.push(entry.id);
    });
  });

  t.ok('nessuna voce senza spiegazione', mute.length === 0, mute.join(', '));
  t.ok('e la riga di apertura ce l ha', !!spiegazioni.ral);
  t.ok('ogni spiegazione e fatta di paragrafi', Object.keys(spiegazioni).every(function (id) {
    return Array.isArray(spiegazioni[id]) && spiegazioni[id].every(function (p) {
      return typeof p === 'string' && p.length > 40;
    });
  }));

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
