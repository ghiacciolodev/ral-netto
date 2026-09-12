# Come si rigenera il dataset locale

`src/local-2025.js` e `src/local-2026.js` sono **file generati**. Non si modificano a
mano: si cambia l'ingresso e si rigenera.

```bash
node tools/estrai-comuni.js     # passo 1, una decina di minuti
node tools/genera-locale.js     # passo 2, qualche secondo
```

## I due passi

**Passo 1, `estrai-comuni.js`.** Il portale del federalismo fiscale non pubblica un
file scaricabile: le aliquote stanno solo nella pagina del singolo ente. Lo script
passa da regione a provincia a elenco a comune e scarica una pagina per comune, sei
richieste in parallelo, con ritentativi e ripresa da dove si era fermato. Produce
`tools/dati/comuni-raw.json`, circa trenta megabyte, che non sta nel repository.

Usa `anno=9999`, che restituisce la storia completa di un comune: così basta una
richiesta per avere tutti gli anni.

**Passo 2, `genera-locale.js`.** Trasforma il grezzo in `src/local-YYYY.js`, prendendo
per ogni comune **l'ultima delibera pubblicata non successiva all'anno d'imposta**.
Non è un ripiego: le aliquote in vigore si intendono prorogate di anno in anno,
art. 1 co. 169 L. 296/2006, e ogni comune porta `deliberatedFor` per dire da che anno
arrivano le sue.

## I due ingressi, che hanno natura diversa

`regioni.js` sono **ventuno voci lette a mano**, una pagina per volta, con la norma
regionale che ogni pagina dichiara. Ventuno pagine si aprono e si leggono.

`dati/comuni-raw.json` è un **estratto di massa** di quasi ottomila pagine, che nessuno
rilegge riga per riga.

## Il pezzo che sbaglierebbe in silenzio

`fasce.js` legge la colonna "Fascia di applicazione". Le stesse quattro regole sono
scritte in decine di modi: entità HTML non decodificate, spazi mancanti, maiuscole,
"ad euro" invece di "a euro", refusi. Le varianti tipografiche vengono normalizzate.

Quello che resta **non viene indovinato**. Sono esenzioni legate al tipo di reddito o
alla persona, redditi di pensione, redditi di terreni, abitazione principale: non sono
una soglia sull'imponibile complessivo, e sono una cosa diversa. Il generatore marca
quei comuni con `unmodelledRelief` invece di trasformarli in un numero plausibile.

È l'unica parte di `tools/` che ha una suite di test propria, `test/suites/fasce.js`,
con casi presi tutti dal portale. Un errore qui non si vedrebbe: si propagherebbe in
un netto credibile.

## Quando finisce la generazione

Il generatore stampa quante diciture sono rimaste fuori. Se il numero cresce molto da
una scaricata all'altra, qualche comune ha cambiato modo di scrivere e le regole di
`fasce.js` vanno guardate, non allargate a caso.
