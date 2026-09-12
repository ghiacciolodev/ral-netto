// @ts-check
'use strict';

/** Command line runner. Same engine, same cases, same harness as the browser. */
var parameters = require('../src/parameters.js');
var createEngine = require('../src/engine.js');
var createHarness = require('./harness.js');
var cases = require('./cases.js');

var engine = createEngine(parameters);
var harness = createHarness();
var summary = cases.runTests(engine, harness, parameters, createEngine);

var lastGroup = '';
summary.results.forEach(function (r) {
  if (r.group !== lastGroup) {
    lastGroup = r.group;
    console.log('\n' + r.group);
  }
  if (r.passed) {
    console.log('  ok    ' + r.name);
  } else {
    console.log('  FAIL  ' + r.name + '  [' + r.detail + ']');
  }
});

console.log(
  '\n' + summary.passed + ' passati, ' + summary.failed + ' falliti, ' +
  summary.total + ' totali\n'
);

process.exit(summary.failed === 0 ? 0 : 1);
