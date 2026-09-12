// @ts-check
'use strict';

/**
 * Pagina dei parametri. Niente di quello che si legge qui e scritto nella
 * pagina: tutto viene letto dal registro dell anno scelto.
 *
 * La tabella si costruisce percorrendo l oggetto dei parametri invece di
 * elencare a mano le voci da mostrare. E una scelta precisa: cosi un parametro
 * nuovo compare da solo, magari con un etichetta brutta, invece di restare
 * invisibile perche nessuno si e ricordato di aggiungerlo a un elenco.
 */
(function () {

  var ETICHETTE = {
    taxYear: 'Anno d imposta',
    payrollMonths: 'Mensilita ammesse',
    payroll: 'Periodi di paga e conguaglio',
    employmentYear: 'Giorni dell anno',
    rounding: 'Arrotondamento',
    contributions: 'Contributi a carico del dipendente',
    irpef: 'Scaglioni IRPEF',
    employmentDeduction: 'Detrazione per lavoro dipendente, art. 13 TUIR',
    familyDeduction: 'Detrazioni per carichi di famiglia, art. 12 TUIR',
    fringeBenefits: 'Fringe benefit',
    wedgeRelief: 'Riduzione del cuneo fiscale',
    supplementaryAllowance: 'Trattamento integrativo',
    employerCost: 'Costo azienda, stime non normative'
  };

  /**
   * `taxYear` non compare: e il nome dell insieme, non una regola, e non ha
   * senso chiedergli una fonte.
   */
  var ORDINE = [
    'contributions', 'irpef', 'employmentDeduction', 'familyDeduction',
    'wedgeRelief', 'supplementaryAllowance', 'fringeBenefits', 'payroll',
    'payrollMonths', 'employmentYear', 'rounding', 'employerCost'
  ];

  var container = document.getElementById('parameters');
  var summary = document.getElementById('parameters-summary');
  var yearSwitch = document.getElementById('year-switch');

  /** Un valore come si legge, non come e scritto in JavaScript. */
  function leggibile(value) {
    if (value === null) return 'nessun limite';
    if (typeof value === 'boolean') return value ? 'si' : 'no';
    if (typeof value !== 'number') return String(value);
    if (value > 0 && value < 1) return String(value).replace('.', ',');
    return String(value).replace('.', ',');
  }

  /**
   * Percorre un sottoalbero e restituisce le foglie con il loro percorso e la
   * fonte piu vicina che le copre: un `sourceId` vale per tutto il ramo in cui
   * si trova, che e il modo in cui i parametri sono scritti.
   */
  function foglie(node, path, inheritedSource, out) {
    if (node === null || typeof node !== 'object') {
      out.push({ path: path, value: node, sourceId: inheritedSource });
      return out;
    }

    var source = inheritedSource;
    Object.keys(node).forEach(function (key) {
      if (/SourceId$/.test(key) || key === 'sourceId') source = node[key] || source;
    });

    Object.keys(node).forEach(function (key) {
      if (key === 'sourceId' || /SourceId$/.test(key)) return;
      foglie(node[key], path ? path + '.' + key : key, source, out);
    });

    return out;
  }

  function rigaFonte(engine, row, sourceId) {
    var cell = document.createElement('td');
    cell.className = 'ref';
    var source = engine.sources[sourceId];

    if (source && source.url) {
      var link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.label;
      link.title = source.title + (source.note ? '. ' + source.note : '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      cell.appendChild(link);
    } else if (source) {
      cell.textContent = source.label;
      cell.title = source.title;
    } else {
      // Un parametro senza fonte e una cosa da vedere, non uno spazio vuoto.
      cell.textContent = 'senza fonte';
      cell.className = 'ref is-subtle';
    }

    row.appendChild(cell);
    return cell;
  }

  function cella(row, testo, className) {
    var td = document.createElement('td');
    td.textContent = testo;
    if (className) td.className = className;
    row.appendChild(td);
    return td;
  }

  function gruppo(engine, chiave) {
    var valore = engine.parameters[chiave];
    if (valore === undefined) return null;

    var section = document.createElement('section');
    section.className = 'param-group';

    var titolo = document.createElement('h2');
    titolo.textContent = ETICHETTE[chiave] || chiave;
    section.appendChild(titolo);

    var wrap = document.createElement('div');
    wrap.className = 'table-scroll';

    var table = document.createElement('table');
    table.className = 'ledger';
    table.innerHTML =
      '<thead><tr><th scope="col">Voce</th><th scope="col" class="num">Valore</th>' +
      '<th scope="col">Fonte</th></tr></thead>';

    var tbody = document.createElement('tbody');

    foglie(valore, '', engine.parameters[chiave] && engine.parameters[chiave].sourceId, [])
      .forEach(function (foglia) {
        var row = document.createElement('tr');
        cella(row, foglia.path || chiave, 'voice param-path');
        cella(row, leggibile(foglia.value), 'num');
        rigaFonte(engine, row, foglia.sourceId);
        tbody.appendChild(row);
      });

    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  /** Le regioni sono ventuno e ci stanno. I comuni sono quasi ottomila e no. */
  function locali(engine) {
    var section = document.createElement('section');
    section.className = 'param-group';

    var titolo = document.createElement('h2');
    titolo.textContent = 'Addizionali regionali';
    section.appendChild(titolo);

    var nota = document.createElement('p');
    nota.textContent = 'Lette una per una sul portale del federalismo fiscale. ' +
      'Il calcolo passa dagli scaglioni, e la scala di ogni regione e quella ' +
      'che il portale pubblica per l anno.';
    section.appendChild(nota);

    var wrap = document.createElement('div');
    wrap.className = 'table-scroll';

    var table = document.createElement('table');
    table.className = 'ledger';
    table.innerHTML = '<thead><tr><th scope="col">Regione</th>' +
      '<th scope="col">Aliquote per scaglione</th><th scope="col">Fonte</th></tr></thead>';

    var tbody = document.createElement('tbody');

    Object.keys(engine.local.regions).sort(function (a, b) {
      return engine.local.regions[a].name.localeCompare(engine.local.regions[b].name, 'it');
    }).forEach(function (key) {
      var regione = engine.local.regions[key];
      var row = document.createElement('tr');

      cella(row, regione.name, 'voice');
      cella(row, regione.brackets.map(function (bracket) {
        return engine.formatRate(bracket.rate) +
          (bracket.upTo === null ? ' oltre' : ' fino a ' + engine.formatAmount(bracket.upTo));
      }).join(' · '), 'formula');
      rigaFonte(engine, row, regione.sourceId);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  function comuni(engine) {
    var chiavi = Object.keys(engine.local.municipalities);
    var conto = { deliberato: 0, proroga: 0, mai: 0, agevolazione: 0 };

    chiavi.forEach(function (key) {
      var comune = engine.local.municipalities[key];
      if (comune.deliberatedFor === null) conto.mai++;
      else if (comune.deliberatedFor < engine.taxYear) conto.proroga++;
      else conto.deliberato++;
      if (comune.unmodelledRelief) conto.agevolazione++;
    });

    var section = document.createElement('section');
    section.className = 'param-group';

    var titolo = document.createElement('h2');
    titolo.textContent = 'Addizionali comunali';
    section.appendChild(titolo);

    var nota = document.createElement('p');
    nota.textContent = 'Tutti i ' + chiavi.length + ' comuni, estratti in blocco dal ' +
      'portale del federalismo fiscale. La fonte di ciascuno e linkata dal ' +
      'calcolatore quando lo si sceglie: qui ci sono i numeri d insieme.';
    section.appendChild(nota);

    var wrap = document.createElement('div');
    wrap.className = 'table-scroll';

    var table = document.createElement('table');
    table.className = 'ledger';
    table.innerHTML = '<thead><tr><th scope="col">Situazione</th>' +
      '<th scope="col" class="num">Comuni</th></tr></thead>';

    var tbody = document.createElement('tbody');

    [
      ['Hanno deliberato per il ' + engine.taxYear, conto.deliberato],
      ['Valgono per proroga, art. 1 co. 169 L. 296/2006', conto.proroga],
      ['Non hanno mai deliberato, addizionale zero', conto.mai],
      ['Esentano per tipo di reddito, esenzione non applicata', conto.agevolazione]
    ].forEach(function (riga) {
      var row = document.createElement('tr');
      cella(row, riga[0], 'voice');
      cella(row, String(riga[1]), 'num');
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  function render(anno) {
    var engine = createEngine(PARAMETERS, anno);

    while (container.firstChild) container.removeChild(container.firstChild);

    summary.textContent = 'Anno d imposta ' + engine.taxYear + '. ' +
      Object.keys(engine.sources).length + ' fonti citate, di cui ' +
      Object.keys(engine.local.municipalities).length + ' comuni e ' +
      Object.keys(engine.local.regions).length + ' regioni. ' +
      'Ogni valore che il calcolatore usa compare in questa pagina.';

    ORDINE.forEach(function (chiave) {
      var section = gruppo(engine, chiave);
      if (section) container.appendChild(section);
    });

    // Quello che non e nell ordine dichiarato compare comunque, in fondo: un
    // parametro nuovo deve farsi vedere, non sparire.
    Object.keys(engine.parameters).forEach(function (chiave) {
      if (chiave === 'sources' || chiave === 'taxYear') return;
      if (ORDINE.indexOf(chiave) !== -1) return;
      var section = gruppo(engine, chiave);
      if (section) container.appendChild(section);
    });

    container.appendChild(locali(engine));
    container.appendChild(comuni(engine));
  }

  PARAMETERS.years.slice().sort().reverse().forEach(function (anno) {
    var bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.textContent = String(anno);
    bottone.className = anno === PARAMETERS.latest ? 'is-current' : '';

    bottone.addEventListener('click', function () {
      [].forEach.call(yearSwitch.querySelectorAll('button'), function (altro) {
        altro.className = altro === bottone ? 'is-current' : '';
      });
      render(anno);
    });

    yearSwitch.appendChild(bottone);
  });

  render(PARAMETERS.latest);
})();
