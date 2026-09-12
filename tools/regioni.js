// @ts-check
'use strict';

/**
 * Le addizionali regionali, lette una per una sul portale del federalismo
 * fiscale del MEF, con la norma regionale che ogni pagina dichiara.
 *
 * Sono ventuno e stanno qui scritte a mano, a differenza dei comuni che sono
 * un estratto di massa: ventuno pagine si aprono e si leggono.
 *
 * `nota` segnala le regioni che prevedono agevolazioni soggettive, detrazioni
 * per figli a carico o per disabilita, che il modello non applica.
 */
var REGIONI = [
  {
    slug: 'abruzzo',
    codice: '01',
    nome: 'Abruzzo',
    norme: 'Art. 6 D.Lgs. 68/2011, art. 1 co. 8 L.R. 44/2006, art. 1 co. 1 L.R. 9/2025',
    nota: '',
    aliquote: {
      2025: [[28000, 1.67], [50000, 2.87], [null, 3.33]],
      2026: [[28000, 1.67], [50000, 2.87], [null, 3.33]]
    },
    pubblicate: {
      2025: '6 maggio 2025',
      2026: '28 gennaio 2026'
    }
  },
  {
    slug: 'basilicata',
    codice: '02',
    nome: 'Basilicata',
    norme: 'Art. 6 D.Lgs. 68/2011 e art. 50 D.Lgs. 446/1997',
    nota: '',
    aliquote: {
      2025: [[null, 1.23]],
      2026: [[null, 1.23]]
    },
    pubblicate: {
      2025: '15 maggio 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'bolzano',
    codice: '03',
    nome: 'Provincia autonoma di Bolzano',
    norme: 'Art. 21/sexiesdecies legge provinciale 9/1998',
    nota: 'La provincia prevede detrazioni non applicate da questo modello.',
    aliquote: {
      2025: [[28000, 1.23], [50000, 1.23], [null, 1.73]],
      2026: [[28000, 1.23], [50000, 1.23], [null, 1.73]]
    },
    pubblicate: {
      2025: '20 marzo 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'calabria',
    codice: '04',
    nome: 'Calabria',
    norme: 'Art. 1 L.R. 30/2002 come modificato da L.R. 1/2006, art. 29 co. 14 D.L. 216/2011',
    nota: '',
    aliquote: {
      2025: [[null, 1.73]],
      2026: [[null, 1.73]]
    },
    pubblicate: {
      2025: '8 aprile 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'campania',
    codice: '05',
    nome: 'Campania',
    norme: 'Art. 50 D.Lgs. 446/1997, art. 6 D.Lgs. 68/2011, L.R. 4/2014, L.R. 31/2021, L.R. 7/2022',
    nota: 'La regione prevede detrazioni non applicate da questo modello.',
    aliquote: {
      2025: [[15000, 1.73], [28000, 2.96], [50000, 3.2], [null, 3.33]],
      2026: [[15000, 1.73], [28000, 2.96], [50000, 3.2], [null, 3.33]]
    },
    pubblicate: {
      2025: '15 maggio 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'emilia-romagna',
    codice: '06',
    nome: 'Emilia-Romagna',
    norme: 'Art. 6 D.Lgs. 68/2011, art. 2 L.R. 19/2006 come modificato da L.R. 1/2025 e L.R. 9/2025',
    nota: '',
    aliquote: {
      2025: [[15000, 1.33], [28000, 1.93], [50000, 2.93], [null, 3.33]],
      2026: [[15000, 1.33], [28000, 1.93], [50000, 2.78], [null, 3.33]]
    },
    pubblicate: {
      2025: '7 maggio 2025',
      2026: '19 gennaio 2026'
    }
  },
  {
    slug: 'friuli-venezia-giulia',
    codice: '07',
    nome: 'Friuli Venezia Giulia',
    norme: 'Art. 50 D.Lgs. 446/1997, art. 1 co. 5 L.R. 14/2012, art. 1 co. 727 L. 207/2024',
    nota: '',
    aliquote: {
      2025: [[15000, 0.7], [28000, 1.23], [50000, 1.23], [null, 1.23]],
      2026: [[15000, 0.7], [28000, 1.23], [50000, 1.23], [null, 1.23]]
    },
    pubblicate: {
      2025: '8 aprile 2025',
      2026: '19 gennaio 2026'
    }
  },
  {
    slug: 'lazio',
    codice: '08',
    nome: 'Lazio',
    norme: 'Legge regionale 20 del 31 dicembre 2025',
    nota: '',
    aliquote: {
      2025: [[15000, 1.73], [28000, 3.33], [50000, 3.33], [null, 3.33]],
      2026: [[15000, 1.73], [28000, 3.33], [50000, 3.33], [null, 3.33]]
    },
    pubblicate: {
      2025: '7 marzo 2025',
      2026: '22 gennaio 2026'
    }
  },
  {
    slug: 'liguria',
    codice: '09',
    nome: 'Liguria',
    norme: 'Art. 2 bis L.R. 17/2024 come modificata da L.R. 3/2025, art. 1 L.R. 3/2022, art. 6 D.Lgs. 68/2011',
    nota: '',
    aliquote: {
      2025: [[28000, 1.23], [50000, 3.18], [null, 3.23]],
      2026: [[28000, 1.23], [50000, 3.18], [null, 3.23]]
    },
    pubblicate: {
      2025: '5 agosto 2025',
      2026: '28 gennaio 2026'
    }
  },
  {
    slug: 'lombardia',
    codice: '10',
    nome: 'Lombardia',
    norme: 'Art. 72 co. 1 legge regionale 14 luglio 2003 n. 10',
    nota: '',
    aliquote: {
      2025: [[15000, 1.23], [28000, 1.58], [50000, 1.72], [null, 1.73]],
      2026: [[15000, 1.23], [28000, 1.58], [50000, 1.72], [null, 1.73]]
    },
    pubblicate: {
      2025: '17 aprile 2025',
      2026: '28 gennaio 2026'
    }
  },
  {
    slug: 'marche',
    codice: '11',
    nome: 'Marche',
    norme: 'Art. 1 L.R. 5/2022, art. 50 D.Lgs. 446/1997, art. 6 D.Lgs. 68/2011, art. 1 co. 728 L. 207/2024',
    nota: '',
    aliquote: {
      2025: [[15000, 1.23], [28000, 1.53], [50000, 1.7], [null, 1.73]],
      2026: [[15000, 1.23], [28000, 1.53], [50000, 1.7], [null, 1.73]]
    },
    pubblicate: {
      2025: '2 maggio 2025',
      2026: '22 gennaio 2026'
    }
  },
  {
    slug: 'molise',
    codice: '12',
    nome: 'Molise',
    norme: 'Art. 2 L.R. 9/2013, art. 1 co. 174 L. 311/2004, art. 2 co. 86 L. 191/2009, art. 1 L.R. 5/2023',
    nota: 'Per il 2026 il portale pubblica due delibere: il modello prende quella presentata per prima, la piu recente.',
    aliquote: {
      2025: [[15000, 2.03], [28000, 2.23], [50000, 3.63], [null, 3.63]],
      2026: [[15000, 2.03], [28000, 2.23], [50000, 3.63], [null, 3.63]]
    },
    pubblicate: {
      2025: '9 settembre 2025',
      2026: '19 giugno 2026'
    }
  },
  {
    slug: 'piemonte',
    codice: '13',
    nome: 'Piemonte',
    norme: 'Legge regionale 4/2022 e legge regionale 16/2025',
    nota: '',
    aliquote: {
      2025: [[15000, 1.62], [28000, 2.13], [50000, 2.75], [null, 3.33]],
      2026: [[15000, 1.62], [28000, 2.68], [50000, 3.31], [null, 3.33]]
    },
    pubblicate: {
      2025: '27 ottobre 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'puglia',
    codice: '14',
    nome: 'Puglia',
    norme: 'Decreto 3 del 28 maggio 2026 del Commissario ad acta ex art. 1 co. 174 L. 311/2004, art. 3 L.R. 40/2015',
    nota: 'Aliquote rideterminate dal Commissario ad acta per il piano di rientro sanitario.',
    aliquote: {
      2025: [[15000, 1.33], [28000, 1.43], [50000, 1.63], [null, 1.85]],
      2026: [[15000, 1.33], [28000, 2.13], [50000, 3.23], [null, 3.33]]
    },
    pubblicate: {
      2025: '8 aprile 2025',
      2026: '29 maggio 2026'
    }
  },
  {
    slug: 'sardegna',
    codice: '15',
    nome: 'Sardegna',
    norme: 'Art. 28 D.L. 201/2011, art. 2 L.R. 48/2018, art. 1 co. 2 L. 234/2021, art. 1 L.R. 13/2022',
    nota: 'La regione prevede agevolazioni per minorenni a carico non applicate da questo modello.',
    aliquote: {
      2025: [[null, 1.23]],
      2026: [[null, 1.23]]
    },
    pubblicate: {
      2025: '8 aprile 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'sicilia',
    codice: '16',
    nome: 'Sicilia',
    norme: 'Art. 50 D.Lgs. 446/1997, art. 1 L.R. 12/2007, art. 28 D.L. 201/2011, art. 8 L.R. 15/2017',
    nota: '',
    aliquote: {
      2025: [[null, 1.23]],
      2026: [[null, 1.23]]
    },
    pubblicate: {
      2025: '20 marzo 2025',
      2026: '29 gennaio 2026'
    }
  },
  {
    slug: 'toscana',
    codice: '17',
    nome: 'Toscana',
    norme: 'Art. 1 legge regionale 48 del 28 dicembre 2023',
    nota: '',
    aliquote: {
      2025: [[15000, 1.42], [28000, 1.43], [50000, 3.32], [null, 3.33]],
      2026: [[15000, 1.42], [28000, 1.43], [50000, 3.32], [null, 3.33]]
    },
    pubblicate: {
      2025: '15 maggio 2025',
      2026: '30 gennaio 2026'
    }
  },
  {
    slug: 'trento',
    codice: '18',
    nome: 'Provincia autonoma di Trento',
    norme: 'Art. 1 co. 2 quater, 2 sexies e 3 bis legge provinciale 13/2019 come modificato da legge provinciale 11/2025',
    nota: '',
    aliquote: {
      2025: [[15000, 1.23], [28000, 1.23], [50000, 1.23], [null, 1.73]],
      2026: [[15000, 1.23], [28000, 1.23], [50000, 1.23], [null, 1.73]]
    },
    pubblicate: {
      2025: '22 agosto 2025',
      2026: '22 gennaio 2026'
    }
  },
  {
    slug: 'umbria',
    codice: '19',
    nome: 'Umbria',
    norme: 'Art. 1 legge regionale 2 dell 11 aprile 2025',
    nota: 'La regione prevede disposizioni agevolative non applicate da questo modello.',
    aliquote: {
      2025: [[15000, 1.73], [28000, 3.02], [50000, 3.12], [null, 3.33]],
      2026: [[15000, 1.73], [28000, 3.02], [50000, 3.12], [null, 3.33]]
    },
    pubblicate: {
      2025: '2 maggio 2025',
      2026: '19 gennaio 2026'
    }
  },
  {
    slug: 'valle-aosta',
    codice: '20',
    nome: 'Valle d\'Aosta',
    norme: 'Art. 50 co. 2 e 3 D.Lgs. 446/1997, art. 1 legge regionale 29 del 23 dicembre 2025',
    nota: '',
    aliquote: {
      2025: [[null, 1.23]],
      2026: [[null, 1.23]]
    },
    pubblicate: {
      2025: '6 maggio 2025',
      2026: '19 gennaio 2026'
    }
  },
  {
    slug: 'veneto',
    codice: '21',
    nome: 'Veneto',
    norme: 'Art. 6 co. 1 D.Lgs. 68/2011, art. 1 co. 5 L.R. 19/2005 come modificato da L.R. 30/2022',
    nota: '',
    aliquote: {
      2025: [[null, 1.23]],
      2026: [[null, 1.23]]
    },
    pubblicate: {
      2025: '6 maggio 2025',
      2026: '22 gennaio 2026'
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = REGIONI;
}
