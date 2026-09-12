// @ts-check
'use strict';

/**
 * Addizionali regionali e comunali in vigore nell anno d imposta 2025.
 *
 * Estratto dal portale del federalismo fiscale del MEF, che e la fonte che
 * fa fede: raccoglie le delibere di regioni e comuni e pubblica le aliquote
 * applicabili. Ogni voce porta il link alla sua pagina.
 *
 * Due cose che la tabella delle aliquote non dice e che vanno dette qui.
 *
 * Un ente che non delibera non azzera il tributo: le aliquote in vigore si
 * intendono prorogate di anno in anno, art. 1 co. 169 L. 296/2006. Per questo
 * ogni comune porta `deliberatedFor`, l anno dell ultima delibera pubblicata.
 * Se e minore dell anno d imposta, quelle aliquote valgono per proroga.
 *
 * Molte regioni prevedono agevolazioni soggettive, detrazioni per figli a
 * carico, per disabilita, soglie di esenzione legate alla persona. Il portale
 * le riporta a parte e questo modello **non le applica**: calcola le aliquote
 * ordinarie per scaglione. Dove ci sono, la fonte lo dice nella nota.
 */
var LOCAL_2025 = (function () {

  return {
    taxYear: 2025,

    /**
     * Su cosa cade il calcolo quando la posizione non lo dice. Non e una
     * scelta fiscale, e il caso di partenza dell interfaccia.
     */
    defaults: {
      region: 'lombardia',
      municipality: 'milano'
    },

    regions: {
      abruzzo: {
        name: 'Abruzzo',
        brackets: [
          { upTo: 28000, rate: 0.0167 },
          { upTo: 50000, rate: 0.0287 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-abruzzo'
      },
      basilicata: {
        name: 'Basilicata',
        brackets: [
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-basilicata'
      },
      bolzano: {
        name: 'Provincia autonoma di Bolzano',
        brackets: [
          { upTo: 28000, rate: 0.0123 },
          { upTo: 50000, rate: 0.0123 },
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'addreg-bolzano'
      },
      calabria: {
        name: 'Calabria',
        brackets: [
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'addreg-calabria'
      },
      campania: {
        name: 'Campania',
        brackets: [
          { upTo: 15000, rate: 0.0173 },
          { upTo: 28000, rate: 0.0296 },
          { upTo: 50000, rate: 0.032 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-campania'
      },
      'emilia-romagna': {
        name: 'Emilia-Romagna',
        brackets: [
          { upTo: 15000, rate: 0.0133 },
          { upTo: 28000, rate: 0.0193 },
          { upTo: 50000, rate: 0.0293 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-emilia-romagna'
      },
      'friuli-venezia-giulia': {
        name: 'Friuli Venezia Giulia',
        brackets: [
          { upTo: 15000, rate: 0.007 },
          { upTo: 28000, rate: 0.0123 },
          { upTo: 50000, rate: 0.0123 },
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-friuli-venezia-giulia'
      },
      lazio: {
        name: 'Lazio',
        brackets: [
          { upTo: 15000, rate: 0.0173 },
          { upTo: 28000, rate: 0.0333 },
          { upTo: 50000, rate: 0.0333 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-lazio'
      },
      liguria: {
        name: 'Liguria',
        brackets: [
          { upTo: 28000, rate: 0.0123 },
          { upTo: 50000, rate: 0.0318 },
          { upTo: null, rate: 0.0323 }
        ],
        sourceId: 'addreg-liguria'
      },
      lombardia: {
        name: 'Lombardia',
        brackets: [
          { upTo: 15000, rate: 0.0123 },
          { upTo: 28000, rate: 0.0158 },
          { upTo: 50000, rate: 0.0172 },
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'addreg-lombardia'
      },
      marche: {
        name: 'Marche',
        brackets: [
          { upTo: 15000, rate: 0.0123 },
          { upTo: 28000, rate: 0.0153 },
          { upTo: 50000, rate: 0.017 },
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'addreg-marche'
      },
      molise: {
        name: 'Molise',
        brackets: [
          { upTo: 15000, rate: 0.0203 },
          { upTo: 28000, rate: 0.0223 },
          { upTo: 50000, rate: 0.0363 },
          { upTo: null, rate: 0.0363 }
        ],
        sourceId: 'addreg-molise'
      },
      piemonte: {
        name: 'Piemonte',
        brackets: [
          { upTo: 15000, rate: 0.0162 },
          { upTo: 28000, rate: 0.0213 },
          { upTo: 50000, rate: 0.0275 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-piemonte'
      },
      puglia: {
        name: 'Puglia',
        brackets: [
          { upTo: 15000, rate: 0.0133 },
          { upTo: 28000, rate: 0.0143 },
          { upTo: 50000, rate: 0.0163 },
          { upTo: null, rate: 0.0185 }
        ],
        sourceId: 'addreg-puglia'
      },
      sardegna: {
        name: 'Sardegna',
        brackets: [
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-sardegna'
      },
      sicilia: {
        name: 'Sicilia',
        brackets: [
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-sicilia'
      },
      toscana: {
        name: 'Toscana',
        brackets: [
          { upTo: 15000, rate: 0.0142 },
          { upTo: 28000, rate: 0.0143 },
          { upTo: 50000, rate: 0.0332 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-toscana'
      },
      trento: {
        name: 'Provincia autonoma di Trento',
        brackets: [
          { upTo: 15000, rate: 0.0123 },
          { upTo: 28000, rate: 0.0123 },
          { upTo: 50000, rate: 0.0123 },
          { upTo: null, rate: 0.0173 }
        ],
        sourceId: 'addreg-trento'
      },
      umbria: {
        name: 'Umbria',
        brackets: [
          { upTo: 15000, rate: 0.0173 },
          { upTo: 28000, rate: 0.0302 },
          { upTo: 50000, rate: 0.0312 },
          { upTo: null, rate: 0.0333 }
        ],
        sourceId: 'addreg-umbria'
      },
      'valle-aosta': {
        name: 'Valle d\'Aosta',
        brackets: [
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-valle-aosta'
      },
      veneto: {
        name: 'Veneto',
        brackets: [
          { upTo: null, rate: 0.0123 }
        ],
        sourceId: 'addreg-veneto'
      }
    },

    /**
     * `region` lega il comune alla sua regione: le due addizionali si sommano
     * sulla stessa busta, e una posizione incoerente va rifiutata.
     *
     * `exemptionThreshold` e una soglia, non una franchigia: un euro sopra e
     * l addizionale si paga su tutto l imponibile.
     */
    municipalities: {
      aquila: {
        name: 'L\'Aquila',
        region: 'abruzzo',
        brackets: [
          { upTo: null, rate: 0.006 }
        ],
        exemptionThreshold: 15000,
        deliberatedFor: 2025,
        sourceId: 'addcom-aquila'
      },
      potenza: {
        name: 'Potenza',
        region: 'basilicata',
        brackets: [
          { upTo: 28000, rate: 0.008 },
          { upTo: 50000, rate: 0.008 },
          { upTo: null, rate: 0.01 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-potenza'
      },
      bolzano: {
        name: 'Bolzano',
        region: 'bolzano',
        brackets: [
          { upTo: null, rate: 0.0 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-bolzano'
      },
      catanzaro: {
        name: 'Catanzaro',
        region: 'calabria',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-catanzaro'
      },
      napoli: {
        name: 'Napoli',
        region: 'campania',
        brackets: [
          { upTo: null, rate: 0.01 }
        ],
        exemptionThreshold: 12000,
        deliberatedFor: 2025,
        sourceId: 'addcom-napoli'
      },
      bologna: {
        name: 'Bologna',
        region: 'emilia-romagna',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 15000,
        deliberatedFor: 2025,
        sourceId: 'addcom-bologna'
      },
      trieste: {
        name: 'Trieste',
        region: 'friuli-venezia-giulia',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 12500,
        deliberatedFor: 2025,
        sourceId: 'addcom-trieste'
      },
      roma: {
        name: 'Roma',
        region: 'lazio',
        brackets: [
          { upTo: null, rate: 0.009 }
        ],
        exemptionThreshold: 14000,
        deliberatedFor: 2025,
        sourceId: 'addcom-roma'
      },
      genova: {
        name: 'Genova',
        region: 'liguria',
        brackets: [
          { upTo: 28000, rate: 0.01 },
          { upTo: 50000, rate: 0.011 },
          { upTo: null, rate: 0.012 }
        ],
        exemptionThreshold: 14000,
        deliberatedFor: 2025,
        sourceId: 'addcom-genova'
      },
      milano: {
        name: 'Milano',
        region: 'lombardia',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 23000,
        deliberatedFor: 2025,
        sourceId: 'addcom-milano'
      },
      ancona: {
        name: 'Ancona',
        region: 'marche',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-ancona'
      },
      campobasso: {
        name: 'Campobasso',
        region: 'molise',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-campobasso'
      },
      torino: {
        name: 'Torino',
        region: 'piemonte',
        brackets: [
          { upTo: 15000, rate: 0.008 },
          { upTo: 28000, rate: 0.008 },
          { upTo: 50000, rate: 0.011 },
          { upTo: null, rate: 0.012 }
        ],
        exemptionThreshold: 11790,
        deliberatedFor: 2025,
        sourceId: 'addcom-torino'
      },
      bari: {
        name: 'Bari',
        region: 'puglia',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 15000,
        deliberatedFor: 2025,
        sourceId: 'addcom-bari'
      },
      cagliari: {
        name: 'Cagliari',
        region: 'sardegna',
        brackets: [
          { upTo: 15000, rate: 0.0066 },
          { upTo: 28000, rate: 0.0072 },
          { upTo: 50000, rate: 0.0078 },
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 10000,
        deliberatedFor: 2025,
        sourceId: 'addcom-cagliari'
      },
      palermo: {
        name: 'Palermo',
        region: 'sicilia',
        brackets: [
          { upTo: null, rate: 0.01014 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: 2025,
        sourceId: 'addcom-palermo'
      },
      firenze: {
        name: 'Firenze',
        region: 'toscana',
        brackets: [
          { upTo: null, rate: 0.002 }
        ],
        exemptionThreshold: 25000,
        deliberatedFor: 2025,
        sourceId: 'addcom-firenze'
      },
      trento: {
        name: 'Trento',
        region: 'trento',
        brackets: [
          { upTo: null, rate: 0.0 }
        ],
        exemptionThreshold: 0,
        deliberatedFor: null,
        sourceId: 'addcom-trento'
      },
      perugia: {
        name: 'Perugia',
        region: 'umbria',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 12500,
        deliberatedFor: 2025,
        sourceId: 'addcom-perugia'
      },
      aosta: {
        name: 'Aosta',
        region: 'valle-aosta',
        brackets: [
          { upTo: null, rate: 0.005 }
        ],
        exemptionThreshold: 9999.99,
        deliberatedFor: 2025,
        sourceId: 'addcom-aosta'
      },
      venezia: {
        name: 'Venezia',
        region: 'veneto',
        brackets: [
          { upTo: null, rate: 0.008 }
        ],
        exemptionThreshold: 10000,
        deliberatedFor: 2025,
        sourceId: 'addcom-venezia'
      }
    },

    sources: {
      'addreg-abruzzo': {
        label: 'addizionale regionale Abruzzo',
        title: 'Art. 6 D.Lgs. 68/2011, art. 1 co. 8 L.R. 44/2006, art. 1 co. 1 L.R. 9/2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=01',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 6 maggio 2025.'
      },
      'addreg-basilicata': {
        label: 'addizionale regionale Basilicata',
        title: 'Art. 6 D.Lgs. 68/2011 e art. 50 D.Lgs. 446/1997',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=02',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 15 maggio 2025.'
      },
      'addreg-bolzano': {
        label: 'addizionale regionale Provincia autonoma di Bolzano',
        title: 'Art. 21/sexiesdecies legge provinciale 9/1998',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=03',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 20 marzo 2025. La provincia prevede detrazioni non applicate da questo modello.'
      },
      'addreg-calabria': {
        label: 'addizionale regionale Calabria',
        title: 'Art. 1 L.R. 30/2002 come modificato da L.R. 1/2006, art. 29 co. 14 D.L. 216/2011',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=04',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 8 aprile 2025.'
      },
      'addreg-campania': {
        label: 'addizionale regionale Campania',
        title: 'Art. 50 D.Lgs. 446/1997, art. 6 D.Lgs. 68/2011, L.R. 4/2014, L.R. 31/2021, L.R. 7/2022',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=05',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 15 maggio 2025. La regione prevede detrazioni non applicate da questo modello.'
      },
      'addreg-emilia-romagna': {
        label: 'addizionale regionale Emilia-Romagna',
        title: 'Art. 6 D.Lgs. 68/2011, art. 2 L.R. 19/2006 come modificato da L.R. 1/2025 e L.R. 9/2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=06',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 7 maggio 2025.'
      },
      'addreg-friuli-venezia-giulia': {
        label: 'addizionale regionale Friuli Venezia Giulia',
        title: 'Art. 50 D.Lgs. 446/1997, art. 1 co. 5 L.R. 14/2012, art. 1 co. 727 L. 207/2024',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=07',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 8 aprile 2025.'
      },
      'addreg-lazio': {
        label: 'addizionale regionale Lazio',
        title: 'Legge regionale 20 del 31 dicembre 2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=08',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 7 marzo 2025.'
      },
      'addreg-liguria': {
        label: 'addizionale regionale Liguria',
        title: 'Art. 2 bis L.R. 17/2024 come modificata da L.R. 3/2025, art. 1 L.R. 3/2022, art. 6 D.Lgs. 68/2011',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=09',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 5 agosto 2025.'
      },
      'addreg-lombardia': {
        label: 'addizionale regionale Lombardia',
        title: 'Art. 72 co. 1 legge regionale 14 luglio 2003 n. 10',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 17 aprile 2025.'
      },
      'addreg-marche': {
        label: 'addizionale regionale Marche',
        title: 'Art. 1 L.R. 5/2022, art. 50 D.Lgs. 446/1997, art. 6 D.Lgs. 68/2011, art. 1 co. 728 L. 207/2024',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=11',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 2 maggio 2025.'
      },
      'addreg-molise': {
        label: 'addizionale regionale Molise',
        title: 'Art. 2 L.R. 9/2013, art. 1 co. 174 L. 311/2004, art. 2 co. 86 L. 191/2009, art. 1 L.R. 5/2023',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=12',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 9 settembre 2025. Per il 2026 il portale pubblica due delibere: il modello prende quella presentata per prima, la piu recente.'
      },
      'addreg-piemonte': {
        label: 'addizionale regionale Piemonte',
        title: 'Legge regionale 4/2022 e legge regionale 16/2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=13',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 27 ottobre 2025.'
      },
      'addreg-puglia': {
        label: 'addizionale regionale Puglia',
        title: 'Decreto 3 del 28 maggio 2026 del Commissario ad acta ex art. 1 co. 174 L. 311/2004, art. 3 L.R. 40/2015',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=14',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 8 aprile 2025. Aliquote rideterminate dal Commissario ad acta per il piano di rientro sanitario.'
      },
      'addreg-sardegna': {
        label: 'addizionale regionale Sardegna',
        title: 'Art. 28 D.L. 201/2011, art. 2 L.R. 48/2018, art. 1 co. 2 L. 234/2021, art. 1 L.R. 13/2022',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=15',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 8 aprile 2025. La regione prevede agevolazioni per minorenni a carico non applicate da questo modello.'
      },
      'addreg-sicilia': {
        label: 'addizionale regionale Sicilia',
        title: 'Art. 50 D.Lgs. 446/1997, art. 1 L.R. 12/2007, art. 28 D.L. 201/2011, art. 8 L.R. 15/2017',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=16',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 20 marzo 2025.'
      },
      'addreg-toscana': {
        label: 'addizionale regionale Toscana',
        title: 'Art. 1 legge regionale 48 del 28 dicembre 2023',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=17',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 15 maggio 2025.'
      },
      'addreg-trento': {
        label: 'addizionale regionale Provincia autonoma di Trento',
        title: 'Art. 1 co. 2 quater, 2 sexies e 3 bis legge provinciale 13/2019 come modificato da legge provinciale 11/2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=18',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 22 agosto 2025.'
      },
      'addreg-umbria': {
        label: 'addizionale regionale Umbria',
        title: 'Art. 1 legge regionale 2 dell 11 aprile 2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=19',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 2 maggio 2025. La regione prevede disposizioni agevolative non applicate da questo modello.'
      },
      'addreg-valle-aosta': {
        label: 'addizionale regionale Valle d\'Aosta',
        title: 'Art. 50 co. 2 e 3 D.Lgs. 446/1997, art. 1 legge regionale 29 del 23 dicembre 2025',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=20',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 6 maggio 2025.'
      },
      'addreg-veneto': {
        label: 'addizionale regionale Veneto',
        title: 'Art. 6 co. 1 D.Lgs. 68/2011, art. 1 co. 5 L.R. 19/2005 come modificato da L.R. 30/2022',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=21',
        inForceFrom: '2025-01-01',
        note: 'Aliquote pubblicate sul portale il 6 maggio 2025.'
      },
      'addcom-aquila': {
        label: 'delibera 17 del 3 marzo 2008',
        title: 'Addizionale comunale IRPEF di L\'Aquila',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=abruzzo.htm&pr=AQ&cc=A345',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-potenza': {
        label: 'delibera 12 dell 11 marzo 2025',
        title: 'Addizionale comunale IRPEF di Potenza',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=basilicata.htm&pr=PZ&cc=G942',
        inForceFrom: '2025-01-01',
        note: 'Delibera pubblicata per l anno 2025.'
      },
      'addcom-bolzano': {
        label: 'delibera 100 del 27 ottobre 2016, non applica',
        title: 'Addizionale comunale IRPEF di Bolzano',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=trentino.htm&pr=BZ&cc=A952',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-catanzaro': {
        label: 'delibera 51 del 30 luglio 2015',
        title: 'Addizionale comunale IRPEF di Catanzaro',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=calabria.htm&pr=CZ&cc=C352',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-napoli': {
        label: 'delibera 143 del 29 dicembre 2023',
        title: 'Addizionale comunale IRPEF di Napoli',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=campania.htm&pr=NA&cc=F839',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-bologna': {
        label: 'delibera 354/2016 del 22 dicembre 2016',
        title: 'Addizionale comunale IRPEF di Bologna',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=emiliaromagna.htm&pr=BO&cc=A944',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-trieste': {
        label: 'delibera 33 del 3 agosto 2015',
        title: 'Addizionale comunale IRPEF di Trieste',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=friuli.htm&pr=TS&cc=L424',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-roma': {
        label: 'delibera 186 del 19 dicembre 2024',
        title: 'Addizionale comunale IRPEF di Roma',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=lazio.htm&pr=RM&cc=H501',
        inForceFrom: '2025-01-01',
        note: 'Delibera pubblicata per l anno 2025.'
      },
      'addcom-genova': {
        label: 'delibera 55 del 19 dicembre 2024',
        title: 'Addizionale comunale IRPEF di Genova',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=liguria.htm&pr=GE&cc=D969',
        inForceFrom: '2025-01-01',
        note: 'Delibera pubblicata per l anno 2025.'
      },
      'addcom-milano': {
        label: 'delibera 46 del 28 settembre 2020',
        title: 'Addizionale comunale IRPEF di Milano',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=lombardia.htm&pr=MI&cc=F205',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-ancona': {
        label: 'delibera 176 del 21 dicembre 2007',
        title: 'Addizionale comunale IRPEF di Ancona',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=marche.htm&pr=AN&cc=A271',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-campobasso': {
        label: 'delibera 42 del 29 dicembre 2023',
        title: 'Addizionale comunale IRPEF di Campobasso',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=molise.htm&pr=CB&cc=B519',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-torino': {
        label: 'delibera 195 del 29 marzo 2022',
        title: 'Addizionale comunale IRPEF di Torino',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=piemonte.htm&pr=TO&cc=L219',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-bari': {
        label: 'delibera 42 del 31 luglio 2012',
        title: 'Addizionale comunale IRPEF di Bari',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=puglia.htm&pr=BA&cc=A662',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-cagliari': {
        label: 'delibera 69 del 30 maggio 2022',
        title: 'Addizionale comunale IRPEF di Cagliari',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=sardegna.htm&pr=CA&cc=B354',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-palermo': {
        label: 'delibera 6 del 25 febbraio 2025',
        title: 'Addizionale comunale IRPEF di Palermo',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=sicilia.htm&pr=PA&cc=G273',
        inForceFrom: '2025-01-01',
        note: 'Delibera pubblicata per l anno 2025.'
      },
      'addcom-firenze': {
        label: 'delibera 47 del 28 luglio 2014',
        title: 'Addizionale comunale IRPEF di Firenze',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=toscana.htm&pr=FI&cc=D612',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-trento': {
        label: 'nessuna delibera pubblicata',
        title: 'Addizionale comunale IRPEF di Trento',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=trentino.htm&pr=TN&cc=L378',
        inForceFrom: '2025-01-01',
        note: 'Il portale non riporta alcuna delibera, in nessun anno: il comune non applica l addizionale.'
      },
      'addcom-perugia': {
        label: 'delibera 110 del 25 novembre 2013',
        title: 'Addizionale comunale IRPEF di Perugia',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=umbria.htm&pr=PG&cc=G478',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-aosta': {
        label: 'delibera 32 del 17 marzo 2021',
        title: 'Addizionale comunale IRPEF di Aosta',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=valledaosta.htm&pr=AO&cc=A326',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      },
      'addcom-venezia': {
        label: 'delibera 67 del 20 dicembre 2023',
        title: 'Addizionale comunale IRPEF di Venezia',
        url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&r=1&pagina=veneto.htm&pr=VE&cc=L736',
        inForceFrom: '2025-01-01',
        note: 'Aliquota non inviata dal comune e inserita d ufficio. Delibera pubblicata per l anno 2025.'
      }
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOCAL_2025;
}
