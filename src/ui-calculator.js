// @ts-check
'use strict';

/** Calculator page: gross to net, and the inverse. Loaded only by index.html. */
(function () {

  var engine = createEngine(PARAMETERS);
  var ui = createUiHelpers(engine);

  var form = document.getElementById('calc-form');
  var inputRal = /** @type {HTMLInputElement} */ (document.getElementById('input-ral'));
  var inputMonths = /** @type {HTMLSelectElement} */ (document.getElementById('input-months'));
  var inputDays = /** @type {HTMLInputElement} */ (document.getElementById('input-days'));
  var inputContract = /** @type {HTMLSelectElement} */ (document.getElementById('input-contract'));
  var inputSpouse = /** @type {HTMLInputElement} */ (document.getElementById('input-spouse'));
  var inputChildren = /** @type {HTMLInputElement} */ (document.getElementById('input-children'));
  var inputChildrenShare = /** @type {HTMLSelectElement} */ (document.getElementById('input-children-share'));
  var inputAscendants = /** @type {HTMLInputElement} */ (document.getElementById('input-ascendants'));
  var inputFamilyMonths = /** @type {HTMLInputElement} */ (document.getElementById('input-family-months'));
  var errorBox = document.getElementById('error-box');
  var results = document.getElementById('results');

  var inverseForm = document.getElementById('inverse-form');
  var inputNet = /** @type {HTMLInputElement} */ (document.getElementById('input-net'));
  var inputNetBasis = /** @type {HTMLSelectElement} */ (document.getElementById('input-net-basis'));
  var inverseError = document.getElementById('inverse-error');
  var inverseResult = document.getElementById('inverse-result');

  /** The subject as the form currently describes it. */
  function currentPosition(grossAnnual) {
    return {
      grossAnnual: grossAnnual,
      months: parseInt(inputMonths.value, 10),
      daysWorked: parseInt(inputDays.value, 10),
      contractType: inputContract.value,
      family: {
        spouse: inputSpouse.checked,
        children: parseInt(inputChildren.value, 10) || 0,
        childrenSharePercent: parseInt(inputChildrenShare.value, 10),
        ascendants: parseInt(inputAscendants.value, 10) || 0,
        months: parseInt(inputFamilyMonths.value, 10)
      }
    };
  }

  function bracketRange(bracket) {
    if (bracket.from === 0) return 'fino a ' + engine.formatAmount(bracket.to);
    if (bracket.to === null) return 'oltre ' + engine.formatAmount(bracket.from);
    return 'da ' + engine.formatAmount(bracket.from) + ' a ' + engine.formatAmount(bracket.to);
  }

  // -------------------------------------------------------- direct calculation

  function renderSummary(result) {
    var withheld = result.ledger.reduce(function (sum, entry) {
      return entry.sign < 0 ? sum + entry.amount : sum;
    }, 0);

    document.getElementById('net-annual').textContent = ui.euro(result.netAnnual);
    document.getElementById('net-monthly').textContent = ui.euro(result.netMonthly);

    document.getElementById('net-monthly-note').textContent =
      'Netto annuo diviso ' + result.months + ' mensilità. La RAL le include già: ' +
      'la tredicesima non si somma al netto, ne fa parte.';

    document.getElementById('total-withheld').textContent = ui.euro(withheld);
    document.getElementById('effective-rate').textContent =
      'Pari al ' + engine.formatRate(withheld / result.ral) + ' della RAL. ' +
      'Imponibile fiscale ' + ui.euro(result.taxableIncome) + '.';
  }

  function renderLedger(result) {
    var table = document.getElementById('ledger-table');
    var tbody = table.querySelector('tbody');
    var tfoot = table.querySelector('tfoot');
    ui.clear(tbody);
    ui.clear(tfoot);

    var opening = document.createElement('tr');
    ui.cell(opening, 'RAL, retribuzione annua lorda', 'voice');
    ui.cell(opening, 'importo di partenza', 'formula');
    ui.cell(opening, ui.euro(result.ral), 'num amount');
    ui.sourceCell(opening, null);
    tbody.appendChild(opening);

    result.ledger.forEach(function (entry) {
      var row = document.createElement('tr');
      ui.cell(row, entry.label, 'voice');
      ui.cell(row, entry.formula, 'formula');

      var signed = entry.amount === 0
        ? ui.euro(0)
        : (entry.sign < 0 ? '− ' : '+ ') + ui.euro(entry.amount);

      var tone = entry.amount === 0 ? 'is-zero' : (entry.sign < 0 ? 'is-negative' : 'is-positive');
      ui.cell(row, signed, 'num amount ' + tone);
      ui.sourceCell(row, entry.sourceId);
      tbody.appendChild(row);
    });

    var closing = document.createElement('tr');
    ui.cell(closing, 'Netto annuo', 'voice');
    ui.cell(closing, '', 'formula');
    ui.cell(closing, ui.euro(result.netAnnual), 'num amount');
    ui.cell(closing, '', 'ref');
    tfoot.appendChild(closing);
  }

  function renderBrackets(result) {
    var tbody = document.getElementById('bracket-table').querySelector('tbody');
    ui.clear(tbody);

    result.irpef.byBracket.forEach(function (bracket) {
      var row = document.createElement('tr');
      ui.cell(row, bracketRange(bracket));
      ui.cell(row, engine.formatRate(bracket.rate), 'num');
      ui.cell(row, engine.formatAmount(bracket.amountInBracket), 'num');
      ui.cell(row, engine.formatAmount(bracket.tax), 'num');
      tbody.appendChild(row);
    });

    var total = document.createElement('tr');
    total.className = 'is-total';
    ui.cell(total, 'IRPEF lorda');
    ui.cell(total, '', 'num');
    ui.cell(total, '', 'num');
    ui.cell(total, engine.formatAmount(result.irpef.gross), 'num');
    tbody.appendChild(total);
  }

  function renderDeductions(result) {
    var tbody = document.getElementById('deduction-table').querySelector('tbody');
    var d = result.irpef.deductions;
    ui.clear(tbody);

    ui.detailRow(tbody, 'Lavoro dipendente, art. 13 TUIR', ui.euro(d.employment));

    // Showing the truncated ratio makes art. 13 comma 6 visible instead of
    // hiding a rule that moves the result by a few cents.
    if (d.ratio !== null) {
      ui.detailRow(tbody, 'Rapporto troncato a 4 decimali',
        String(d.ratio).replace('.', ','), 'is-subtle');
    }
    if (d.minimumApplied) {
      ui.detailRow(tbody, 'Minimo garantito, non ragguagliato ai giorni',
        'applicato', 'is-subtle');
    }
    if (d.bonus65 > 0) {
      ui.detailRow(tbody, 'Maggiorazione art. 13 co. 1.1', ui.euro(d.bonus65));
    }
    if (d.family.spouse > 0) {
      ui.detailRow(tbody, 'Coniuge a carico, art. 12 TUIR', ui.euro(d.family.spouse));
    }
    if (d.family.children > 0) {
      ui.detailRow(tbody, 'Figli a carico, art. 12 TUIR', ui.euro(d.family.children));
    }
    if (d.family.ascendants > 0) {
      ui.detailRow(tbody, 'Ascendenti a carico, art. 12 TUIR', ui.euro(d.family.ascendants));
    }
    if (result.wedge.type === 'deduction') {
      ui.detailRow(tbody, 'Ulteriore detrazione cuneo fiscale', ui.euro(d.wedge));
    }
    if (result.wedge.type === 'exempt') {
      ui.detailRow(tbody, 'Cuneo erogato come somma esente, non detrazione',
        ui.euro(result.wedge.amount), 'is-subtle');
    }

    ui.detailRow(tbody, 'Totale detrazioni', ui.euro(d.total), 'is-total');

    if (d.lostToInsufficientTax > 0) {
      ui.detailRow(tbody, 'Persa per incapienza, non rimborsabile',
        ui.euro(d.lostToInsufficientTax), 'is-subtle');
    }
  }

  /**
   * Stepped waterfall built by hand. Bars sit on the running total, so each
   * deduction reads as the drop it causes rather than as a bare number.
   */
  function renderWaterfall(result) {
    var width = 720;
    var height = 268;
    var padTop = 26;
    var padBottom = 52;
    var padSide = 10;
    var plot = height - padTop - padBottom;

    var steps = [{ label: 'RAL', from: 0, to: result.ral, kind: 'total' }];
    var running = result.ral;

    result.ledger.forEach(function (entry) {
      var next = running + entry.sign * entry.amount;
      steps.push({
        label: entry.label,
        from: Math.min(running, next),
        to: Math.max(running, next),
        kind: entry.sign < 0 ? 'down' : 'up',
        amount: entry.amount,
        sign: entry.sign
      });
      running = next;
    });

    steps.push({ label: 'Netto annuo', from: 0, to: result.netAnnual, kind: 'total' });

    var scale = result.ral || 1;
    var slot = (width - padSide * 2) / steps.length;
    var barWidth = Math.min(58, slot * 0.62);

    function y(value) { return padTop + plot - (value / scale) * plot; }

    // Classes rather than inline fills, so every colour stays in the stylesheet.
    var barClass = { total: 'wf-total', down: 'wf-down', up: 'wf-up' };
    var parts = [];

    parts.push('<line class="wf-axis" x1="' + padSide + '" y1="' + (padTop + plot) +
      '" x2="' + (width - padSide) + '" y2="' + (padTop + plot) + '"/>');

    steps.forEach(function (step, index) {
      var cx = padSide + slot * index + slot / 2;
      var x = cx - barWidth / 2;
      var top = y(step.to);
      var barHeight = Math.max(1, y(step.from) - y(step.to));

      if (index > 0) {
        var previous = steps[index - 1];
        var linkY = y(previous.kind === 'total'
          ? previous.to
          : (previous.sign < 0 ? previous.from : previous.to));
        parts.push('<line class="wf-connector" x1="' +
          (padSide + slot * (index - 1) + slot / 2 + barWidth / 2) +
          '" y1="' + linkY + '" x2="' + x + '" y2="' + linkY + '"/>');
      }

      parts.push('<rect class="' + barClass[step.kind] + '" x="' + x + '" y="' + top +
        '" width="' + barWidth + '" height="' + barHeight + '" rx="2"/>');

      var shown = step.kind === 'total' ? step.to : step.amount;
      parts.push('<text class="wf-value" x="' + cx + '" y="' + (top - 6) +
        '" text-anchor="middle">' + ui.escapeText(engine.formatAmount(shown)) + '</text>');

      ui.wrapLabel(step.label, 13).forEach(function (line, lineIndex) {
        parts.push('<text class="wf-label" x="' + cx + '" y="' +
          (padTop + plot + 15 + lineIndex * 11) + '" text-anchor="middle">' +
          ui.escapeText(line) + '</text>');
      });
    });

    document.getElementById('waterfall').innerHTML =
      '<svg viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="' +
      'Composizione dal lordo al netto">' + parts.join('') + '</svg>';
  }

  // ---------------------------------------------------------- employer view

  var employerBlock = document.getElementById('employer-block');

  /**
   * The same gross pay seen from the employer. Kept visually apart because it is
   * the only estimate on the page: everything above comes from statute, this
   * comes from category averages.
   */
  function renderEmployerCost(result) {
    var e = engine.parameters.employerCost;
    var cost = result.employerCost;

    var figures = document.getElementById('employer-figures');
    ui.clear(figures);

    figures.appendChild(ui.figure('Costo azienda annuo', ui.euro(cost.total),
      'Pari a ' + engine.formatAmount(cost.total / result.ral) + ' volte la RAL.'));

    figures.appendChild(ui.figure('Sopra la RAL', ui.euro(cost.total - result.ral),
      'Quanto costa il dipendente oltre la retribuzione lorda.'));

    figures.appendChild(ui.figure('Arriva netto al dipendente',
      engine.formatRate(result.netAnnual / cost.total),
      'Di ogni 100 € spesi dall azienda, ' +
      engine.formatAmount((result.netAnnual / cost.total) * 100) + ' € finiscono in busta.'));

    var tbody = document.getElementById('employer-table').querySelector('tbody');
    ui.clear(tbody);

    function line(label, formula, amount) {
      var row = document.createElement('tr');
      ui.cell(row, label, 'voice');
      ui.cell(row, formula, 'formula');
      ui.cell(row, ui.euro(amount), 'num amount');
      tbody.appendChild(row);
    }

    line('RAL, retribuzione annua lorda', 'importo di partenza', result.ral);
    line('Contributi a carico del datore',
      engine.formatRate(e.contributionRate) + ' di ' + engine.formatAmount(result.ral),
      cost.contributions);
    line('Accantonamento TFR',
      'RAL divisa per ' + String(e.tfrDivisor).replace('.', ',') +
      ', pari al ' + engine.formatRate(1 / e.tfrDivisor),
      cost.tfr);
    line('Premio INAIL',
      engine.formatRate(e.inailRate) + ' di ' + engine.formatAmount(result.ral),
      cost.inail);

    var total = document.createElement('tr');
    total.className = 'is-total';
    ui.cell(total, 'Costo azienda', 'voice');
    ui.cell(total, '', 'formula');
    ui.cell(total, ui.euro(cost.total), 'num amount');
    tbody.appendChild(total);

    document.getElementById('employer-caveat').textContent =
      'Il TFR mostrato è il costo per il datore. Al dipendente se ne accantona meno, ' +
      ui.euro(cost.tfrAccruedToEmployee) + ', perché dalla quota si detrae lo ' +
      engine.formatRate(e.ivsSurchargeRate) +
      ' della retribuzione come contributo aggiuntivo IVS (art. 3 L. 297/1982). ' +
      'Non è il Fondo di garanzia TFR, che è una voce diversa. Il TFR non entra nel ' +
      'netto perché è accantonato e non erogato. Il premio INAIL varia molto per ' +
      'mansione, dallo 0,5% al 12%: qui è fissato al valore più basso.';

    employerBlock.hidden = false;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    results.hidden = true;
  }

  function calculate() {
    var ral = ui.parseAmount(inputRal.value);

    if (isNaN(ral)) {
      showError('La RAL inserita non e un importo valido. Usa il punto per le migliaia e la virgola per i decimali.');
      employerBlock.hidden = true;
      return;
    }

    var result;
    try {
      result = engine.calculateNet(currentPosition(ral));
    } catch (e) {
      showError(e.message);
      employerBlock.hidden = true;
      return;
    }

    errorBox.hidden = true;
    results.hidden = false;

    renderSummary(result);
    renderWaterfall(result);
    renderLedger(result);
    renderBrackets(result);
    renderDeductions(result);
    renderEmployerCost(result);

    inputRal.value = engine.formatAmount(ral);
  }

  // ---------------------------------------------------------------- inverse

  function renderInverse(solved, targetAnnual, months) {
    ui.clear(inverseResult);

    if (!solved.found) {
      // A gap always sits on one upward jump, so both nearest points share the
      // same threshold. Naming it once reads better than printing it twice as if
      // two different gross figures were involved.
      var threshold = solved.nearestAbove ? solved.nearestAbove.ral
        : (solved.nearestBelow ? solved.nearestBelow.ral : null);

      var head = document.createElement('p');
      head.className = 'inverse-gap-head';
      head.textContent = 'Nessuna RAL produce ' + ui.euro(targetAnnual) +
        ' di netto annuo. Superata la soglia di ' +
        (threshold === null ? 'una soglia' : ui.euro(threshold)) +
        ' il netto salta da ' + ui.euro(solved.nearestBelow ? solved.nearestBelow.net : 0) +
        ' a ' + ui.euro(solved.nearestAbove ? solved.nearestAbove.net : 0) +
        ', e i valori intermedi non sono raggiungibili da nessuna RAL.';
      inverseResult.appendChild(head);

      var gapRow = document.createElement('div');
      gapRow.className = 'inverse-row';
      if (solved.nearestBelow) {
        gapRow.appendChild(ui.figure('Massimo raggiungibile sotto la soglia',
          ui.euro(solved.nearestBelow.net),
          'Serve una RAL di ' + ui.euro(solved.nearestBelow.ral) + ' o poco meno.'));
      }
      if (solved.nearestAbove) {
        gapRow.appendChild(ui.figure('Minimo raggiungibile sopra la soglia',
          ui.euro(solved.nearestAbove.net),
          'Basta superare di un soffio la stessa RAL.'));
      }
      inverseResult.appendChild(gapRow);
      return;
    }

    var result = solved.result;
    var row = document.createElement('div');
    row.className = 'inverse-row';

    row.appendChild(ui.figure('RAL da offrire', ui.euro(solved.ral),
      'La più bassa che raggiunge il netto richiesto.'));

    row.appendChild(ui.figure('Netto annuo ottenuto', ui.euro(result.netAnnual),
      solved.residual > 0.005
        ? 'Supera il target di ' + ui.euro(solved.residual) + ', il netto esatto non è raggiungibile.'
        : 'Coincide con il target richiesto.'));

    row.appendChild(ui.figure('Netto mensile su ' + months + ' mensilità',
      ui.euro(result.netMonthly),
      'Costo azienda stimato ' + ui.euro(result.employerCost.total) + '.'));

    inverseResult.appendChild(row);

    if (solved.solutions.length > 1) {
      var multi = document.createElement('p');
      multi.className = 'inverse-note';
      multi.textContent = 'Attenzione: ' + solved.solutions.length +
        ' RAL diverse producono questo netto, perché a una soglia il netto scende ' +
        'invece di salire. Qui è mostrata la più bassa, cioè la meno costosa.';
      inverseResult.appendChild(multi);
    }
  }

  function solveInverse() {
    var months = parseInt(inputMonths.value, 10);
    var entered = ui.parseAmount(inputNet.value);

    if (isNaN(entered) || entered < 0) {
      inverseError.textContent = 'Il netto inserito non e un importo valido.';
      inverseError.hidden = false;
      ui.clear(inverseResult);
      return;
    }

    var targetAnnual = inputNetBasis.value === 'monthly' ? entered * months : entered;

    var solved;
    try {
      solved = engine.solveGrossFromNet(targetAnnual, currentPosition(0));
    } catch (e) {
      inverseError.textContent = e.message;
      inverseError.hidden = false;
      ui.clear(inverseResult);
      return;
    }

    inverseError.hidden = true;
    renderInverse(solved, targetAnnual, months);
    inputNet.value = engine.formatAmount(entered);
  }

  // ------------------------------------------------------------ what I learnt

  var LEARNT_LOW = 40000;
  var LEARNT_HIGH = 70000;

  /**
   * Teaser for the marginal rate page. The claim is only worth making if it is
   * true of the current parameters, so both rates are computed and the card
   * stays hidden if the inversion ever stops holding.
   */
  function renderLearnt() {
    var card = document.getElementById('learned-card');
    var base = { months: 13 };
    var smooth = { exactRatios: true };
    var h = 1;

    function marginalAt(ral) {
      return (engine.calculateNet(engine.withGross(base, ral + h), smooth).netAnnual -
              engine.calculateNet(engine.withGross(base, ral - h), smooth).netAnnual) / (2 * h);
    }

    var low = marginalAt(LEARNT_LOW);
    var high = marginalAt(LEARNT_HIGH);

    if (low >= high) {
      card.hidden = true;
      return;
    }

    // Round figures read better without the trailing cents in a headline.
    function round(value) { return engine.formatAmount(value).replace(',00', ''); }

    document.getElementById('learned-headline').textContent =
      'Con una RAL di ' + round(LEARNT_LOW) + ' € un aumento rende meno ' +
      'che con una RAL di ' + round(LEARNT_HIGH) + ' €.';

    document.getElementById('learned-body').textContent =
      'Di 100 € lordi in più ne restano ' + engine.formatAmount(low * 100) + ' nel primo caso e ' +
      engine.formatAmount(high * 100) + ' nel secondo, pur essendo il secondo in uno scaglione ' +
      'IRPEF più alto. Non me lo aspettavo, e non l\'ho letto da nessuna parte: è uscito ' +
      'dal modello quando ho provato a disegnare quanto rende ogni euro aggiuntivo.';
  }

  // ----------------------------------------------------------------- events

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    calculate();
  });

  inverseForm.addEventListener('submit', function (event) {
    event.preventDefault();
    solveInverse();
  });

  [inputMonths, inputDays, inputContract, inputSpouse, inputChildren,
    inputChildrenShare, inputAscendants, inputFamilyMonths].forEach(function (field) {
    field.addEventListener('change', function () {
      if (!results.hidden) calculate();
      solveInverse();
    });
  });

  inputNetBasis.addEventListener('change', solveInverse);

  // The condition for being a carico is a parameter, not prose: reading it from
  // the year in force keeps the form honest when the limits move.
  document.getElementById('hint-family-limit').textContent =
    'A carico significa reddito proprio non superiore a ' +
    engine.formatAmount(engine.parameters.familyDeduction.incomeLimit) +
    ' euro, che salgono a ' +
    engine.formatAmount(engine.parameters.familyDeduction.incomeLimitUpToAge24) +
    ' per i figli fino a 24 anni.';

  calculate();
  solveInverse();
  renderLearnt();
})();
