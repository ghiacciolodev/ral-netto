// @ts-check
'use strict';

/**
 * Le spiegazioni delle voci del calcolo.
 *
 * Stanno fuori dal motore perche sono un altra cosa: il motore dice cosa e
 * successo e con quale formula, qui si dice a una persona perche.
 *
 * La chiave e l id della voce di traccia. Un test verifica che ogni voce che il
 * motore puo produrre ne abbia una: una spiegazione che manca deve far rumore,
 * non lasciare un pulsante che non si apre.
 */
var SPIEGAZIONI = (function () {

  return {
    'ral': [
      'La retribuzione annua lorda è il punto di partenza, e comprende già le ' +
      'mensilità aggiuntive: la tredicesima non si somma dopo, ne fa parte.',
      'Non comprende invece il TFR, che matura ma non viene erogato, né i ' +
      'contributi a carico del datore di lavoro, che non passano dalla busta.'
    ],

    'contributions.ivs': [
      'I contributi previdenziali a carico del dipendente si calcolano sulla ' +
      'RAL e si tolgono per primi. Quello che resta è l\'imponibile fiscale, ' +
      'che è la base di tutto il resto del calcolo.',
      'È il punto in cui sbagliano quasi tutti i conti fatti a mente: l\'IRPEF ' +
      'non si calcola sulla RAL, si calcola su quello che resta dopo i ' +
      'contributi. Sopra il massimale contributivo la base si ferma, e da lì in ' +
      'poi ogni euro lordo in più è interamente imponibile.'
    ],

    'contributions.additional': [
      'Un punto percentuale in più sulla quota di retribuzione che supera la ' +
      'prima fascia di pensionabilità. Non sostituisce l\'aliquota ordinaria: ' +
      'si somma, e si applica solo alla parte eccedente.',
      'Anche questo si ferma al massimale, insieme all\'IVS ordinaria.'
    ],

    'irpef.net': [
      'L\'imposta lorda si calcola a scaglioni sull\'imponibile, poi le ' +
      'detrazioni la riducono. Le detrazioni sono quelle per lavoro dipendente, ' +
      'per carichi di famiglia e, sopra i 20.000 di reddito, quella per la ' +
      'riduzione del cuneo.',
      'Non può scendere sotto zero. Se le detrazioni superano l\'imposta, ' +
      'l\'eccedenza si perde e non diventa un credito: è la cosiddetta ' +
      'incapienza, ed è il motivo per cui sotto una certa soglia aggiungere ' +
      'detrazioni non cambia niente.'
    ],

    'surtax.regional': [
      'Si paga alla regione in cui si ha la residenza, sull\'imponibile e senza ' +
      'che le detrazioni la riducano. Quasi tutte le regioni la applicano a ' +
      'scaglioni, con soglie proprie che non coincidono con quelle IRPEF.',
      'Esiste però solo se esiste l\'IRPEF netta: l\'art. 50 co. 2 D.Lgs. ' +
      '446/1997 dice che è dovuta se per lo stesso anno l\'imposta sul reddito, ' +
      'al netto delle detrazioni, risulta dovuta. Chi è incapiente non la paga.'
    ],

    'surtax.municipal': [
      'Si paga al comune di domicilio fiscale al 1° gennaio. Molti comuni hanno ' +
      'una soglia di esenzione, che è una soglia e non una franchigia: un euro ' +
      'sopra e si paga sull\'intero imponibile, non sulla parte eccedente.',
      'Come la regionale, è dovuta solo se risulta dovuta l\'IRPEF netta, ' +
      'art. 1 co. 4 D.Lgs. 360/1998. Ottocentocinquantanove comuni non l\'hanno ' +
      'mai deliberata e quindi non la applicano affatto.'
    ],

    'supplementary.allowance': [
      'Il trattamento integrativo, quello che si chiamava bonus Renzi. Non è ' +
      'una detrazione: è una somma che il datore di lavoro eroga in busta e che ' +
      'non concorre a formare il reddito.',
      'Fino a 15.000 € di reddito spetta per intero, a condizione che l\'imposta ' +
      'lorda superi la detrazione da lavoro dipendente ridotta di 75 €. Fra ' +
      '15.000 e 28.000 spetta invece per l\'eccedenza delle detrazioni degli ' +
      'articoli 12 e 13 sull\'imposta lorda, e senza familiari a carico ' +
      'quell\'eccedenza non si forma mai.'
    ],

    'wedge.exempt': [
      'La riduzione del cuneo fiscale sotto i 20.000 € di reddito prende la ' +
      'forma di una somma che non concorre a formare il reddito: non passa ' +
      'dall\'IRPEF, si aggiunge al netto.',
      'La percentuale dipende da una fascia che si legge sul reddito proiettato ' +
      'all\'anno intero, mentre si applica al reddito effettivamente percepito. ' +
      'Sopra i 20.000 la misura cambia natura e diventa una detrazione, che ' +
      'compete con le altre per l\'imposta disponibile.'
    ],

    'irpef.gross': [
      'L\'imposta lorda si calcola per scaglioni: ogni aliquota si applica solo ' +
      'alla parte di imponibile che cade nel proprio scaglione, non a tutto.'
    ]
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPIEGAZIONI;
}
