// @ts-check
'use strict';

/**
 * Rendering helpers shared by the two pages. Nothing here computes tax: every
 * figure, formula string and citation arrives already made from the engine, so
 * what is on screen cannot drift from what was calculated.
 *
 * @param {any} engine
 */
var createUiHelpers = function createUiHelpers(engine) {

  var sources = engine.parameters.sources;

  /** Italian convention: dot groups thousands, comma opens the decimals. */
  function parseAmount(raw) {
    var text = String(raw).trim().replace(/[\s €]/g, '');
    if (text === '') return NaN;

    var normalized = text.replace(/\./g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return NaN;

    return parseFloat(normalized);
  }

  function euro(value) {
    return engine.formatAmount(value) + ' €';
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function cell(row, text, className) {
    var td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    row.appendChild(td);
    return td;
  }

  /** Renders the citation as a link when the source carries a url. */
  function sourceCell(row, sourceId) {
    var td = document.createElement('td');
    td.className = 'ref';
    var source = sources[sourceId];

    if (!source) {
      row.appendChild(td);
      return td;
    }

    if (source.url) {
      var link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.label;
      link.title = source.title + (source.note ? '. ' + source.note : '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      td.appendChild(link);
    } else {
      td.textContent = source.label;
    }

    row.appendChild(td);
    return td;
  }

  function detailRow(tbody, label, value, className) {
    var row = document.createElement('tr');
    if (className) row.className = className;
    cell(row, label);
    cell(row, value);
    tbody.appendChild(row);
  }

  function figure(label, value, note) {
    var box = document.createElement('div');
    box.className = 'inverse-figure';

    var l = document.createElement('p');
    l.className = 'summary-label';
    l.textContent = label;
    box.appendChild(l);

    var v = document.createElement('p');
    v.className = 'summary-value';
    v.textContent = value;
    box.appendChild(v);

    if (note) {
      var n = document.createElement('p');
      n.className = 'summary-note';
      n.textContent = note;
      box.appendChild(n);
    }

    return box;
  }

  /** Greedy wrap, so long voice names keep their column instead of colliding. */
  function wrapLabel(text, maxChars, maxLines) {
    var words = String(text).split(' ');
    var lines = [];
    var current = '';

    words.forEach(function (word) {
      var candidate = current ? current + ' ' + word : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });

    if (current) lines.push(current);
    return lines.slice(0, maxLines || 3);
  }

  return {
    engine: engine,
    parseAmount: parseAmount,
    euro: euro,
    escapeText: escapeText,
    clear: clear,
    cell: cell,
    sourceCell: sourceCell,
    detailRow: detailRow,
    figure: figure,
    wrapLabel: wrapLabel
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = createUiHelpers;
}
