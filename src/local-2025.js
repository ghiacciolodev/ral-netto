// @ts-check
'use strict';

/**
 * Addizionali regionali e comunali in vigore nell anno d imposta 2025.
 *
 * Sta fuori dai parametri statali perche e un altro tipo di dato. I parametri
 * statali sono una manciata di valori scritti a mano, letti uno per uno sulla
 * norma. Questo e una tabella: venti regioni e quasi ottomila comuni, che
 * cambiano ogni anno e che nessuno rilegge a mano. Tenerli insieme avrebbe
 * voluto dire duplicare la tabella a ogni anno d imposta.
 *
 * Le aliquote comunali sono a scaglioni anche quando lo scaglione e uno solo.
 * Molti comuni hanno un addizionale progressiva, e la forma dei dati deve
 * reggerli senza che il motore cambi: qui c e un comune solo, ed e il momento
 * giusto per dargli la forma di tutti gli altri.
 */
var LOCAL_2025 = (function () {

  return {
    taxYear: 2025,

    /**
     * Su cosa cade il calcolo quando la posizione non lo dice. Non e una scelta
     * fiscale, e il caso di partenza dell interfaccia.
     */
    defaults: {
      region: 'lombardia',
      municipality: 'milano'
    },

    regions: {
      lombardia: {
        name: 'Lombardia',
        brackets: [
          { upTo: 15000, rate: 0.0123 },
          { upTo: 28000, rate: 0.0158 },
          { upTo: 50000, rate: 0.0172 },
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'lombardia-lr-10-2003'
      }
    },

    /**
     * `region` non e decorazione: lega il comune alla sua regione, cosi una
     * posizione che mette Milano nel Lazio viene rifiutata invece di produrre
     * un numero con l etichetta sbagliata.
     *
     * `exemptionThreshold` e una soglia, non una franchigia: un euro sopra e
     * l addizionale si paga su tutto l imponibile.
     */
    municipalities: {
      milano: {
        name: 'Milano',
        region: 'lombardia',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 23000,
        sourceId: 'milano-delibera-46-2020'
      }
    },

    sources: {
      'lombardia-lr-10-2003': {
        label: 'art. 72 co. 1 L.R. Lombardia 10/2003',
        title: 'Addizionale regionale IRPEF, come modificato da art. 1 co. 1 lett. a) L.R. 5/2022',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10',
        inForceFrom: '2022-01-01',
        note: 'Quattro scaglioni progressivi sul reddito complessivo al netto degli oneri deducibili.'
      },
      'milano-delibera-46-2020': {
        label: 'delibera Comune di Milano 46/2020',
        title: 'Addizionale comunale IRPEF, portale del federalismo fiscale MEF',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&pagina=lombardia.htm&cm=&pr=MI&cc=F205&r=1',
        inForceFrom: '2021-01-01',
        note: 'Aliquota unica 0,8% con soglia di esenzione a 23.000 di imponibile, confermata con pubblicazione del 20 dicembre 2025.'
      }
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOCAL_2025;
}
