// @ts-check
'use strict';

/**
 * Statutory parameters for tax year 2026.
 *
 * Every rate, threshold and formula constant lives here so that moving to the
 * next tax year is a new file, never an edit to the engine. Each group carries
 * the id of the source that establishes it; the UI resolves those ids against
 * `sources` to print a citation next to each amount.
 */
var PARAMETERS_2026 = (function () {
  return {
    taxYear: 2026,
    region: 'Lombardia',
    municipality: 'Milano',

    payrollMonths: { allowed: [12, 13, 14], defaultValue: 13 },

    // Employee social security. The cap truncates both the IVS rate and the
    // additional 1%, so a single capped base feeds both.
    contributions: {
      ivsRate: 0.0919,
      ivsSourceId: 'inps-fpld-rates',
      additionalRate: 0.01,
      additionalThreshold: 56224,
      cap: 122295,
      sourceId: 'inps-circ-6-2026'
    },

    irpef: {
      brackets: [
        { upTo: 28000, rate: 0.23 },
        { upTo: 50000, rate: 0.33 },
        { upTo: null, rate: 0.43 }
      ],
      sourceId: 'tuir-art-11'
    },

    // Art. 13 TUIR. The two tapering bands share the shape
    // base + coefficient * ratio, with ratio truncated per comma 6.
    employmentDeduction: {
      flatAmount: 1955,
      flatUpTo: 15000,
      bands: [
        { upTo: 28000, base: 1910, coefficient: 1190, span: 13000 },
        { upTo: 50000, base: 0, coefficient: 1910, span: 22000 }
      ],
      bonus: { amount: 65, over: 25000, upTo: 35000, sourceId: 'tuir-art-13-c1-1' },
      truncationDigits: 4,
      truncationSourceId: 'tuir-art-13-c6',
      sourceId: 'tuir-art-13-c1'
    },

    // Two alternative reliefs, never cumulative. The exempt sum bypasses IRPEF
    // entirely; the deduction competes with the others for available tax.
    wedgeRelief: {
      exempt: {
        maxTotalIncome: 20000,
        rates: [
          { upTo: 8500, rate: 0.071 },
          { upTo: 15000, rate: 0.053 },
          { upTo: 20000, rate: 0.048 }
        ]
      },
      deduction: {
        over: 20000,
        fullUpTo: 32000,
        amount: 1000,
        taperTo: 40000
      },
      sourceId: 'l-207-2024-c4-9',
      guidanceSourceId: 'ade-circ-4e-2025'
    },

    regionalSurtax: {
      brackets: [
        { upTo: 15000, rate: 0.0123 },
        { upTo: 28000, rate: 0.0158 },
        { upTo: 50000, rate: 0.0172 },
        { upTo: null, rate: 0.0173 }
      ],
      sourceId: 'lombardia-lr-10-2003'
    },

    // A threshold, not an allowance: one euro over and the whole taxable base
    // is charged.
    municipalSurtax: {
      rate: 0.008,
      exemptionThreshold: 23000,
      sourceId: 'milano-delibera-46-2020'
    },

    // Estimates calibrated on CCNL Commercio, not statutory values.
    employerCost: {
      contributionRate: 0.294,
      tfrDivisor: 13.5,
      tfrGuaranteeFundRate: 0.005,
      inailRate: 0.005,
      sourceId: 'employer-cost-estimate',
      tfrSourceId: 'cc-art-2120'
    },

    /**
     * Only primary sources: Normattiva for statute, the issuing body for
     * administrative guidance, the MEF portal for local rates. Every url below
     * was opened and checked to land on the document it claims.
     */
    sources: {
      'tuir-art-11': {
        label: 'art. 11 TUIR',
        title: 'DPR 22 dicembre 1986 n. 917, art. 11, come modificato da L. 199/2025 art. 1 co. 3',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
        inForceFrom: '2026-01-01',
        note: 'La seconda aliquota e passata dal 35% al 33% dal periodo d imposta 2026.'
      },
      'tuir-art-13-c1': {
        label: 'art. 13 co. 1 TUIR',
        title: 'DPR 917/1986 art. 13 co. 1, formulazione D.Lgs. 216/2023 confermata da L. 207/2024',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
        inForceFrom: '2024-01-01',
        note: 'L importo della prima fascia e passato da 1.880 a 1.955 dal periodo d imposta 2024.'
      },
      'tuir-art-13-c1-1': {
        label: 'art. 13 co. 1.1 TUIR',
        title: 'DPR 917/1986 art. 13 co. 1.1, maggiorazione di 65 euro tra 25.000 e 35.000',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
        inForceFrom: '2025-01-01',
        note: 'Unica componente della detrazione non ragguagliata ai giorni lavorati.'
      },
      'tuir-art-13-c6': {
        label: 'art. 13 co. 6 TUIR',
        title: 'DPR 917/1986 art. 13 co. 6, il rapporto si assume nelle prime quattro cifre decimali',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
        inForceFrom: '2024-01-01',
        note: 'Troncamento, non arrotondamento. Esempio dell Agenzia delle Entrate: 0,623381 diventa 0,6233.'
      },
      'l-199-2025': {
        label: 'L. 199/2025 art. 1 co. 3',
        title: 'Legge 30 dicembre 2025 n. 199, legge di bilancio 2026',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2025-12-30;199',
        inForceFrom: '2026-01-01',
        note: 'Riduce al 33% la seconda aliquota e conferma strutturale la riduzione del cuneo.'
      },
      'l-207-2024-c4-9': {
        label: 'L. 207/2024 art. 1 co. 4-9',
        title: 'Legge 30 dicembre 2024 n. 207, riduzione del cuneo fiscale',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207',
        inForceFrom: '2025-01-01',
        note: 'Dal 2025 la misura agisce su IRPEF e reddito, non piu come esonero contributivo.'
      },
      'ade-circ-4e-2025': {
        label: 'circ. Agenzia Entrate 4/E del 16 maggio 2025',
        title: 'Istruzioni operative su IRPEF e tassazione dei redditi di lavoro dipendente',
        url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91',
        inForceFrom: '2025-05-16',
        note: 'La fascia si determina sul reddito ragguagliato all anno, la percentuale si applica al reddito percepito.'
      },
      'inps-circ-6-2026': {
        label: 'circ. INPS 6/2026',
        title: 'Circolare INPS n. 6 del 30 gennaio 2026, valori contributivi per l anno 2026',
        url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html',
        inForceFrom: '2026-01-01',
        note: 'Paragrafo 5 per la quota soggetta all aliquota aggiuntiva dell 1%, paragrafo 6 per il massimale.'
      },
      'inps-fpld-rates': {
        label: 'aliquote FPLD settore privato',
        title: 'Aliquota IVS complessiva 33%, di cui 9,19% a carico del lavoratore',
        url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html',
        inForceFrom: '2026-01-01',
        note: 'Ripartizione standard del FPLD. La norma che fissa il riparto 23,81 / 9,19 non e stata verificata su fonte primaria, vedi ASSUNZIONI.md.'
      },
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
      },
      'cc-art-2120': {
        label: 'art. 2120 codice civile',
        title: 'Regio decreto 16 marzo 1942 n. 262, trattamento di fine rapporto',
        url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262',
        inForceFrom: '1982-06-01',
        note: 'Quota annua pari alla retribuzione divisa per 13,5, meno lo 0,50% al Fondo di garanzia INPS.'
      },
      'employer-cost-estimate': {
        label: 'stima su CCNL Commercio',
        title: 'Medie di categoria, non valori di legge',
        url: null,
        inForceFrom: '2026-01-01',
        note: 'Nessuna fonte primaria: contributi a carico datore e INAIL variano per CCNL, dimensione aziendale e mansione.'
      }
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PARAMETERS_2026;
}
