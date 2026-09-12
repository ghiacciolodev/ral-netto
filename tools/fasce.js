// @ts-check
'use strict';

/**
 * Lettura della colonna "Fascia di applicazione" del portale MEF.
 *
 * Su quasi ottomila comuni le stesse quattro regole sono scritte in decine di
 * modi diversi: entita HTML non decodificate, spazi mancanti, maiuscole, "ad
 * euro" invece di "a euro", refusi. Qui si normalizza la forma e si riconosce
 * la sostanza.
 *
 * Quello che resta fuori non viene indovinato. Sono esenzioni legate al tipo di
 * reddito, a pensione, a lavoro dipendente, a terreni, o alla persona: non sono
 * una soglia sull imponibile complessivo, e sono una cosa diversa. Il
 * generatore le marca invece di trasformarle in un numero plausibile.
 */
var FASCE = (function () {

  var ENTITA = [
    ['&euro;', 'euro '], ['&agrave;', 'a'], ['&egrave;', 'e'], ['&eacute;', 'e'],
    ['&igrave;', 'i'], ['&ograve;', 'o'], ['&ugrave;', 'u'], ['&deg;', ' '],
    ['&apos;', "'"], ['&#39;', "'"], ['&quot;', '"'], ['&nbsp;', ' '], ['&amp;', '&']
  ];

  var REFUSI = [
    [/\breddiito\b/g, 'reddito'],
    [/\bscaglioni\b/g, 'scaglione'],
    [/\bad euro\b/g, 'a euro'],
    [/\bad\b/g, 'a'],

    [/\beuro a (\d)/g, 'euro $1'],
    [/\bnon superiori? a\b/g, 'fino a'],
    [/\binferiore o uguale a\b/g, 'fino a'],
    [/\bfino ad\b/g, 'fino a']
  ];

  function normalizza(fascia) {
    var testo = String(fascia);
    ENTITA.forEach(function (coppia) {
      testo = testo.split(coppia[0]).join(coppia[1]);
    });
    testo = testo.toLowerCase();
    REFUSI.forEach(function (coppia) {
      testo = testo.replace(coppia[0], coppia[1]);
    });
    return testo.replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  }

  var SOGLIA = '([\\d.]+(?:,\\d+)?)';
  var EURO = '(?:euro\\s*)?';
  var SCAGLIONE = 'applicabile a (?:scaglione(?: di reddito)?|redditi|reddito|tutti i redditi)?\\s*';

  var PATTERNS = [
    ['unica', /^aliquota unica$/],
    ['unica', /^applicabile a tutti i redditi$/],

    // Una soglia sull imponibile complessivo: l unica forma di esenzione che il
    // modello applica, perche e l unica che si puo valutare su un imponibile.
    ['esenzione', new RegExp('^esenzione per redditi imponibili fino a ' + EURO + SOGLIA + '$')],
    ['esenzione', new RegExp('^esenzione per i contribuenti con reddito complessivo.*?fino a ' + EURO + SOGLIA + '$')],
    ['esenzione', new RegExp('^esenzione per reddito complessivo fino a ' + EURO + SOGLIA + '$')],
    ['esenzione', new RegExp('^esenzione per redditi complessivi fino a ' + EURO + SOGLIA + '$')],

    ['fino', new RegExp('^' + SCAGLIONE + 'fino a ' + EURO + SOGLIA + '$')],
    ['da-a', new RegExp('^' + SCAGLIONE + '(?:da a|da|oltre) ' + EURO + SOGLIA +
      '(?: e)? (?:fino a|a) ' + EURO + SOGLIA + '$')],
    ['oltre', new RegExp('^' + SCAGLIONE + 'oltre ' + EURO + SOGLIA + '$')],

    // "da euro X" senza tetto e uno scaglione aperto scritto male
    ['oltre', new RegExp('^' + SCAGLIONE + 'da ' + EURO + SOGLIA + '$')]
  ];

  /**
   * Il portale scrive gli importi all italiana, ma non sempre: 15.000,00 e
   * quindicimila, 8000.00 e ottomila, 185,92 e centottantacinque e novantadue.
   */
  function numero(testo) {
    var pulito = String(testo).replace(/\.+$/, '');

    if (pulito.indexOf(',') !== -1) {
      return Number(pulito.split('.').join('').replace(',', '.'));
    }

    var pezzi = pulito.split('.');
    if (pezzi.length > 1 && pezzi[pezzi.length - 1].length === 3) {
      return Number(pezzi.join(''));
    }
    return Number(pulito);
  }

  /**
   * @returns {{tipo: string, soglia: number|null}|null} null quando la dicitura
   * non e una delle regole che il modello sa applicare.
   */
  function leggi(fascia) {
    var testo = normalizza(fascia);

    for (var i = 0; i < PATTERNS.length; i++) {
      var tipo = PATTERNS[i][0];
      var trovato = testo.match(PATTERNS[i][1]);
      if (!trovato) continue;

      if (tipo === 'unica') return { tipo: tipo, soglia: null };
      if (tipo === 'da-a') return { tipo: tipo, soglia: numero(trovato[2]) };
      return { tipo: tipo, soglia: numero(trovato[1]) };
    }

    return null;
  }

  return { normalizza: normalizza, numero: numero, leggi: leggi };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FASCE;
}
