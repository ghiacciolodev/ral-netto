// @ts-check
'use strict';

/** Marginal rate page. Loaded only by curva.html. */
(function () {

  var engine = createEngine(PARAMETERS);
  var ui = createUiHelpers(engine);

  // Starts well below 10.000 on purpose: the two lowest thresholds sit at 9.001
  // and 9.360, and one of them is the largest jump in the whole model. Leaving
  // them out would hide the part the chart exists to show.
  var CURVE_FROM = 8500;
  var CURVE_TO = 80000;
  var CURVE_SAMPLES = 250;

  var MONTHS = 13;
  // The subject stays fixed; only the gross is swept along the axis.
  var BASE = { months: MONTHS };
  var SMOOTH = { exactRatios: true };

  // Two salaries far apart in the brackets, used to show that the lower one can
  // keep less of a raise than the higher one. Illustrative choice; the rates
  // behind it are computed, never written down.
  var COMPARE_LOW = 40000;
  var COMPARE_HIGH = 70000;

  /** How much of one extra gross euro reaches the net, at this gross pay. */
  function marginalAt(ral) {
    var h = 1;
    return (engine.calculateNet(engine.withGross(BASE, ral + h), SMOOTH).netAnnual -
            engine.calculateNet(engine.withGross(BASE, ral - h), SMOOTH).netAnnual) / (2 * h);
  }

  /**
   * Marginal rate: how much of one extra gross euro survives to the net.
   *
   * Sampled on the smooth model, because the art. 13 truncation adds a sub-euro
   * sawtooth that a numerical derivative would turn into pure noise. The result
   * is flat within each band, which is not a drawing shortcut but the shape of
   * the model: between two thresholds net pay is affine in gross pay.
   */
  function renderCurve() {
    var width = 900;
    var height = 400;
    var padLeft = 48;
    var padRight = 16;
    var padTop = 20;
    var padBottom = 36;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;
    var step = 1;

    var marks = engine.getBreakpoints().filter(function (bp) {
      return bp.ral > CURVE_FROM && bp.ral < CURVE_TO;
    });

    function x(ral) { return padLeft + ((ral - CURVE_FROM) / (CURVE_TO - CURVE_FROM)) * plotW; }
    function y(rate) { return padTop + plotH - rate * plotH; }

    // Sampled band by band rather than on one even grid: at a threshold the
    // marginal rate is undefined, so each band gets its own run and the line
    // breaks where the dashed markers are. Samples are shared out by width.
    var bounds = [CURVE_FROM]
      .concat(marks.map(function (bp) { return bp.ral; }))
      .concat([CURVE_TO]);

    var runs = [];

    for (var s = 0; s < bounds.length - 1; s++) {
      var lo = bounds[s] + 2 * step;
      var hi = bounds[s + 1] - 2 * step;
      if (hi <= lo) continue;

      var share = Math.max(2, Math.round(
        (CURVE_SAMPLES * (hi - lo)) / (CURVE_TO - CURVE_FROM)));
      var run = [];

      for (var i = 0; i <= share; i++) {
        var ral = lo + ((hi - lo) * i) / share;
        var marginal =
          (engine.calculateNet(engine.withGross(BASE, ral + step), SMOOTH).netAnnual -
           engine.calculateNet(engine.withGross(BASE, ral - step), SMOOTH).netAnnual) / (2 * step);

        run.push(x(ral).toFixed(1) + ',' + y(marginal).toFixed(1));
      }

      runs.push(run);
    }

    var parts = [];

    for (var g = 0; g <= 4; g++) {
      var rate = g / 4;
      parts.push('<line class="cv-grid" x1="' + padLeft + '" y1="' + y(rate) +
        '" x2="' + (width - padRight) + '" y2="' + y(rate) + '"/>');
      parts.push('<text class="cv-axis-label" x="' + (padLeft - 8) + '" y="' + (y(rate) + 3.5) +
        '" text-anchor="end">' + (rate * 100) + '%</text>');
    }

    for (var tick = 10000; tick <= CURVE_TO; tick += 10000) {
      parts.push('<text class="cv-axis-label" x="' + x(tick) + '" y="' + (height - 12) +
        '" text-anchor="middle">' +
        ui.escapeText(engine.formatAmount(tick).replace(',00', '')) + '</text>');
    }

    // Thresholds only a few hundred euro apart land on top of each other, so a
    // badge that would collide with the previous one drops to a second row.
    var lastBadgeX = -Infinity;
    var lastBadgeRow = 1;

    marks.forEach(function (bp, index) {
      var at = x(bp.ral);
      var row = (at - lastBadgeX < 17 && lastBadgeRow === 0) ? 1 : 0;
      if (at - lastBadgeX >= 17) row = 0;
      lastBadgeX = at;
      lastBadgeRow = row;

      var cy = padTop + 7 + row * 17;

      parts.push('<line class="cv-mark" x1="' + at + '" y1="' + padTop +
        '" x2="' + at + '" y2="' + (padTop + plotH) + '"/>');
      parts.push('<circle class="cv-mark-dot" cx="' + at + '" cy="' + cy + '" r="7.5"/>');
      parts.push('<text class="cv-mark-index" x="' + at + '" y="' + (cy + 3.5) +
        '" text-anchor="middle">' + (index + 1) + '</text>');
    });

    runs.forEach(function (points) {
      parts.push('<polyline class="cv-line" points="' + points.join(' ') + '"/>');
    });

    document.getElementById('curve').innerHTML =
      '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' +
      'Aliquota marginale effettiva da ' + engine.formatAmount(CURVE_FROM) + ' a ' +
      engine.formatAmount(CURVE_TO) + ' euro di RAL">' + parts.join('') + '</svg>';

    return marks;
  }

  function renderBreakpointTable(marks) {
    var tbody = document.getElementById('breakpoint-table').querySelector('tbody');

    // The gap is measured across a hair of gross pay, on the smooth model. A
    // wider probe would fold the ordinary slope of the band into the figure and
    // make continuous thresholds look like jumps; the statutory model would add
    // the truncation sawtooth on top.
    var delta = 0.01;
    ui.clear(tbody);

    marks.forEach(function (bp, index) {
      var before = engine.calculateNet(engine.withGross(BASE, bp.ral - delta), SMOOTH).netAnnual;
      var after = engine.calculateNet(engine.withGross(BASE, bp.ral + delta), SMOOTH).netAnnual;
      var jump = after - before;
      var flat = Math.abs(jump) < 0.5;

      var row = document.createElement('tr');

      var first = ui.cell(row, '', 'num');
      var badge = document.createElement('span');
      badge.className = 'cv-badge';
      badge.textContent = String(index + 1);
      first.appendChild(badge);
      first.appendChild(document.createTextNode(' ' + engine.formatAmount(bp.ral)));

      ui.cell(row, bp.label);
      ui.cell(row, (bp.space === 'gross' ? 'RAL ' : 'imponibile ') +
        engine.formatAmount(bp.threshold), 'num');

      ui.cell(row,
        flat ? 'continuo' : (jump > 0 ? '+ ' : '− ') + ui.euro(Math.abs(jump)),
        'num amount ' + (flat ? 'is-flat' : (jump > 0 ? 'is-positive' : 'is-negative')));

      ui.cell(row,
        flat ? 'cambia solo la pendenza'
             : (jump > 0 ? 'lascia netti irraggiungibili' : 'stesso netto da due RAL'),
        'effect');

      tbody.appendChild(row);
    });
  }

  /**
   * The flat levels of the chart, as numbers. Adjacent bands can share a rate
   * when the threshold between them moves the net without bending the line, so
   * they are merged: showing them twice would suggest a change that is not there.
   */
  function computeBands(marks) {
    var bounds = [CURVE_FROM]
      .concat(marks.map(function (bp) { return bp.ral; }))
      .concat([CURVE_TO]);

    var bands = [];

    for (var i = 0; i < bounds.length - 1; i++) {
      var lo = bounds[i];
      var hi = bounds[i + 1];
      if (hi - lo < 1) continue;

      var rate = marginalAt((lo + hi) / 2);
      var last = bands[bands.length - 1];

      if (last && Math.abs(last.rate - rate) < 1e-6) {
        last.to = hi;
      } else {
        bands.push({ from: lo, to: hi, rate: rate });
      }
    }

    return bands;
  }

  function renderBands(bands) {
    var tbody = document.getElementById('band-table').querySelector('tbody');
    ui.clear(tbody);

    var worst = bands.reduce(function (a, b) { return b.rate < a.rate ? b : a; });

    bands.forEach(function (band) {
      var row = document.createElement('tr');
      if (band === worst) row.className = 'is-worst';

      ui.cell(row, engine.formatAmount(band.from) + '  -  ' + engine.formatAmount(band.to));
      ui.cell(row, engine.formatRate(band.rate), 'num');
      ui.cell(row, engine.formatAmount(band.rate * 100) + ' €', 'num amount');

      tbody.appendChild(row);
    });

    return worst;
  }

  /**
   * The point of the whole page: the marginal rate does not rise with income.
   * Both figures come from the engine, so the claim cannot go stale if a
   * parameter changes.
   */
  function renderFinding(worst) {
    var low = marginalAt(COMPARE_LOW);
    var high = marginalAt(COMPARE_HIGH);
    if (low >= high) return;

    var box = document.getElementById('finding');

    var title = document.createElement('p');
    title.className = 'finding-title';
    title.textContent = 'Chi guadagna meno tiene meno di ogni euro in più';
    box.appendChild(title);

    var body = document.createElement('p');
    body.textContent =
      'Con una RAL di ' + engine.formatAmount(COMPARE_LOW) + ' euro un aumento rende ' +
      engine.formatAmount(low * 100) + ' € ogni 100 lordi. Con una RAL di ' +
      engine.formatAmount(COMPARE_HIGH) + ' ne rende ' + engine.formatAmount(high * 100) +
      ', pur ricadendo in uno scaglione IRPEF più alto. La fascia peggiore è ' +
      engine.formatAmount(worst.from) + ' - ' + engine.formatAmount(worst.to) +
      ', dove la marginale scende al ' + engine.formatRate(worst.rate) + '.';
    box.appendChild(body);

    var why = document.createElement('p');
    why.textContent =
      'Il motivo è che lì tre effetti si sommano sullo stesso euro: l\'aliquota del ' +
      engine.formatRate(engine.parameters.irpef.brackets[1].rate) +
      ', il décalage della detrazione cuneo e la riduzione della detrazione art. 13. ' +
      'Nessuno dei tre da solo sarebbe vistoso.';
    box.appendChild(why);
  }

  var marks = renderCurve();
  renderBreakpointTable(marks);
  renderFinding(renderBands(computeBands(marks)));
})();
