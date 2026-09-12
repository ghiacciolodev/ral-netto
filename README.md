# Da RAL a netto, anni d'imposta 2025 e 2026

Calcolatore che, data una retribuzione annua lorda, mostra il netto annuo e mensile
di un dipendente e ogni voce trattenuta, con accanto la norma che la produce.

> **Sito live:** https://ghiacciolodev.github.io/ral-netto/

## Perché esiste

L'ho costruito come esercizio per una selezione da Product Builder in Jet HR. La
richiesta era un prototipo funzionante su un caso semplice e standard, con libertà
di fare le semplificazioni che ritenevo opportune.

Ho scelto di spendere il tempo sulla parte verificabile invece che sull'interfaccia.
Da qui tre decisioni che spiegano tutto il resto: ogni numero mostrato è risalibile
alla fonte primaria che lo stabilisce, ogni valore atteso nei test è calcolato a mano
dalle formule di legge e mai preso dall'output del codice, e tutto quello che il
modello non copre è scritto qui sotto invece che lasciato implicito.

Caso modellato: **impiegato residente a Milano (Lombardia), nessuna agevolazione,
nessun onere deducibile o detraibile.** Il rapporto può coprire l'intero anno o una
parte, a tempo indeterminato o determinato, con o senza familiari a carico. Fuori da questo caso il modello non è valido;
l'elenco completo di cosa non copre è più sotto, in
[Assunzioni e semplificazioni](#assunzioni-e-semplificazioni).

Sito statico: zero dipendenze, zero build, nessun cookie e nessuna richiesta di rete.
Il calcolo avviene interamente nel browser.

## Come si usa

Due pagine:

- **`index.html`** calcolo da lordo a netto, modalità inversa da netto a RAL, costo azienda
- **`curva.html`** aliquota marginale effettiva e le soglie che la determinano

Si aprono con un doppio clic, oppure servendole da una qualsiasi cartella statica.

## Il modello di calcolo

Nove passi, nessuna iterazione.

1. **Contributi.** IVS 9,19% sulla RAL, più 1% sulla quota oltre 56.224 €. Il massimale di 122.295 € tronca entrambe le componenti, non solo l'IVS.
2. **Imponibile fiscale** = RAL meno contributi. È anche il reddito complessivo che parametra detrazioni, cuneo e addizionali: **non si usa la RAL**.
3. **IRPEF lorda** a scaglioni, 23% / 33% / 43%.
4. **Detrazione per lavoro dipendente**, art. 13 TUIR, con la maggiorazione di 65 € e il troncamento del rapporto a quattro decimali.
5. **Riduzione del cuneo fiscale**: somma esente sotto i 20.000 di reddito, oppure ulteriore detrazione fra 20.000 e 40.000. Le due misure sono alternative fra loro.
6. **Detrazioni per carichi di famiglia** (art. 12 TUIR): coniuge, figli dai 21 ai 29 anni e ascendenti conviventi. Sotto i 21 anni c'è l'assegno unico, che dal marzo 2022 ha sostituito la detrazione.
7. **Trattamento integrativo**: 1.200 € fino a 15.000 di reddito, se l'imposta lorda supera la detrazione art. 13 co. 1 ridotta di 75 €. Fra 15.000 e 28.000 spetta invece per l'eccedenza delle detrazioni art. 12 e 13 co. 1 sull'imposta lorda. È una misura distinta dal cuneo e **cumulabile** con esso.

Su un rapporto che non copre l'intero anno, quasi tutto si ragguaglia ai giorni, ma
non tutto, e le eccezioni contano:

| Voce | Si ragguaglia ai giorni? |
|---|---|
| Detrazione art. 13 co. 1 | sì |
| Minimo garantito, 690 € o 1.380 € a tempo determinato | **no**, e si confronta con la detrazione già ragguagliata (circ. AdE 15/2007) |
| Maggiorazione di 65 € | **no** |
| Ulteriore detrazione cuneo | sì (L. 207/2024 co. 6) |
| Somma esente cuneo | la **fascia** si sceglie sul reddito proiettato all'anno, la percentuale si applica al reddito percepito |
| Trattamento integrativo, e i 75 € della capienza | sì |
| Addizionali | no, sono sull'imponibile effettivo |

Il minimo garantito esiste proprio per questo: su un anno intero non scatta mai,
perché la detrazione piena vale 1.955 €. Su mezzo anno a tempo determinato la
detrazione ragguagliata scende a 964 € e il minimo di 1.380 € la supera.
8. **IRPEF netta** = max(0, lorda meno detrazioni). L'eccedenza per incapienza si perde e non è rimborsabile.
9. **Addizionali**: regionale Lombardia a scaglioni, comunale Milano ad aliquota unica con soglia di esenzione. Entrambe sull'imponibile, non ridotte dalle detrazioni.
10. **Netto** = RAL meno contributi meno IRPEF netta meno addizionali, più la somma esente del cuneo e il trattamento integrativo.

Il netto mensile è il netto annuo diviso le mensilità. **La RAL le include già**: la
tredicesima non si somma al netto, ne fa parte.

### Due dettagli facili da perdere

**La seconda aliquota è al 33%,** scesa dal 35% con la legge di bilancio 2026
(L. 199/2025 art. 1 co. 3) a decorrere dal periodo d'imposta 2026. Durante la ricerca
ho trovato parecchie fonti secondarie che riportano ancora il 35%.

**Il rapporto nelle formule della detrazione si tronca a quattro decimali, non si
arrotonda** (art. 13 co. 6 TUIR). Vale pochi centesimi ma è una regola di legge, ed è
implementato: nella tabella delle detrazioni il rapporto troncato è mostrato a schermo.

### Una proprietà emergente

`1.955 / 0,23 = 8.500` esatto.

La detrazione minima per lavoro dipendente è calibrata al centesimo perché la no tax
area cada esattamente a 8.500 € di imponibile. Il numero 8.500 non compare da nessuna
parte nei parametri: emerge dal vincolo di capienza del passo 6, e c'è un test che lo
verifica.

### I familiari a carico hanno un orologio diverso

L'art. 12 si rapporta **ai mesi in cui la condizione di famiglia è durata**, l'art. 13
**ai giorni di lavoro**. Non è una sfumatura: chi lavora sei mesi con il coniuge a
carico tutto l'anno prende metà della detrazione da lavoro dipendente e **l'intera**
detrazione per il coniuge.

| RAL 30.000, coniuge a carico | Detrazione art. 13 | Detrazione coniuge |
|---|---|---|
| 365 giorni, 12 mesi a carico | 1.979,26 € | 690,00 € |
| 180 giorni, 12 mesi a carico | 976,07 € | 690,00 € |
| 365 giorni, 6 mesi a carico | 1.979,26 € | 345,00 € |

### Le detrazioni per famiglia accendono il trattamento integrativo

La seconda fascia del trattamento integrativo, fra 15.000 e 28.000 € di reddito, paga
l'eccedenza delle detrazioni art. 12 e art. 13 co. 1 sull'imposta lorda. Senza
familiari a carico quell'eccedenza non si forma mai e la fascia resta a zero: era
codice morto fino a qui.

Con RAL 20.000, coniuge e tre figli a carico al 100%, l'imposta lorda è 4.177,26 € e le
detrazioni arrivano a 5.936,37 €. L'IRPEF si azzera, 1.759,11 € di detrazioni restano
inutilizzate, e il trattamento integrativo paga il massimo, 1.200 €. **Il netto è
19.999,32 € su una RAL di 20.000.**

Un dettaglio che va detto: l'elenco del DL 3/2020 è chiuso e **non comprende la
detrazione per il cuneo fiscale**. Con RAL 25.000, coniuge e due figli, 371,19 € di
detrazioni si perdono per incapienza e il trattamento integrativo resta comunque zero.
Le due prove di capienza non sono la stessa prova.

### La maggiorazione per il coniuge rompe la monotonia una terza volta

L'art. 12 co. 1 lett. b) aumenta la detrazione per il coniuge di 10, 20 o 30 € in cinque
scalini fra 29.000 e 35.200 € di reddito. Sono gradini, non un decalage: la detrazione
sale e poi torna giù. Due euro di imponibile in più sopra 35.200 fanno **scendere** il
netto di circa nove euro. Si aggiunge ai due casi già noti, il gradino dell'art. 13 e la
soglia dell'addizionale comunale.

## Assunzioni e semplificazioni

Ogni riga è una cosa che il modello **non** fa, con il motivo.

| Semplificazione | Effetto e motivo |
|---|---|
| Nessun onere deducibile o detraibile | Ridurrebbero rispettivamente imponibile e imposta. |
| Il part-time non è un input separato | Non cambia il calcolo fiscale: un part-time con 15.000 di RAL è tassato come un full time con 15.000, perché la RAL riflette già l'orario. Entra solo attraverso i giorni, che il part-time verticale riduce e quello orizzontale no. |
| Iscrizione previdenziale successiva al 31/12/1995 | Senza questa, il massimale di 122.295 € non si applicherebbe. La circolare INPS 6/2026 distingue esplicitamente le due platee. |
| Il dataset locale contiene una regione e un comune | Lombardia e Milano. La forma dei dati regge gli altri, comprese le addizionali comunali progressive, e c'è un test che lo verifica su un ente inventato. Quello che manca sono i dati, non il motore. |
| Nessun regime agevolato (impatriati, forfettario) né agevolazione contributiva | Ognuno avrebbe una base imponibile propria. |
| TFR escluso dal netto | È accantonato, non erogato. Compare solo nel costo azienda. |
| Nessuna rivalutazione del TFR | Il TFR accantonato si rivaluta di 1,5% più il 75% dell'indice ISTAT. |
| Nessun fringe benefit, welfare, premio di risultato o straordinario a tassazione agevolata | Ognuno avrebbe una base imponibile propria. |
| Addizionali per competenza sull'anno corrente | Il meccanismo reale è saldo dell'anno precedente più acconto. |
| Nessun conguaglio di fine anno | Il modello calcola l'anno intero in una volta. |
| Imponibile previdenziale assunto uguale a imponibile fiscale | Nel caso reale differiscono per alcune voci. |
| Reddito complessivo assunto uguale al reddito da lavoro dipendente | Vero solo perché monoreddito. Nel motore restano due parametri distinti. |
| Netto mensile come media annua | Non è un cedolino: la ritenuta reale varia di mese in mese. |
| Costo azienda su medie CCNL Commercio | Unico blocco non normativo. Contributi datore e INAIL variano per CCNL, dimensione e mansione. |
| Le detrazioni art. 12 valgono per tutti i familiari gli stessi mesi | Se il coniuge è a carico tutto l'anno e un figlio da settembre, servirebbero due decorrenze diverse. Il modello ne ha una sola. |
| Nessuna verifica che i familiari siano davvero a carico | Il limite di 2.840,51 € di reddito proprio, 4.000 € per i figli fino a 24 anni, è dichiarato nel form ma non controllato: chi calcola afferma la condizione. |
| Nessuna detrazione art. 15 | Interessi su mutui, spese sanitarie e le altre detrazioni d'imposta non ci sono. Contano anche per la seconda fascia del trattamento integrativo, che le somma all'art. 12 e all'art. 13. |
| Arrotondamenti interni al calcolo non modellati | Il risultato mostrato è arrotondato al centesimo con la regola del terzo decimale. Il payroll reale arrotonda anche in punti interni al calcolo: quei punti non sono modellati perché non li ho chiusi su fonte primaria, ed è dichiarato nel parametro invece di essere deciso per caso. |
| Aritmetica in virgola mobile | Senza arrotondamenti intermedi la deriva resta sotto 1e-12, molto sotto il centesimo. Diventerà rappresentazione esatta in centesimi quando i punti di arrotondamento interni saranno modellati: prima non servirebbe a niente. |
| Sterilizzazione del beneficio sopra 200.000 € di reddito non implementata | Il modello **non è valido** sopra quella soglia. |
| Décalage del cuneo senza troncamento a quattro decimali | Il troncamento è previsto dall'art. 13 TUIR, non dalla L. 207/2024 che disciplina il cuneo. Incide di circa 5 centesimi. Da verificare. |

## Parametri e fonti

Solo fonti primarie: Normattiva per le norme, l'ente emittente per la prassi, il
portale del federalismo fiscale del MEF per le addizionali locali. Ogni indirizzo è
stato aperto e controllato che porti al documento che dichiara.

| Parametro | Valore | Fonte |
|---|---|---|
| Scaglioni IRPEF | 23% / 33% / 43% | [art. 11 TUIR](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917), modificato da [L. 199/2025 art. 1 co. 3](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2025-12-30;199) |
| Detrazione lavoro dipendente | 1.955 € e formule per fascia | [art. 13 co. 1 TUIR](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917), formulazione D.Lgs. 216/2023 confermata da L. 207/2024 |
| Maggiorazione | 65 € fra 25.000 e 35.000 | art. 13 **co. 1.1** TUIR |
| Troncamento del rapporto | 4 cifre decimali | art. 13 **co. 6** TUIR |
| Trattamento integrativo | 1.200 € fino a 15.000 di reddito | [DL 3/2020 art. 1](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-02-05;3), reso strutturale da L. 207/2024 e non modificato da L. 199/2025 |
| Cuneo fiscale | 7,1% / 5,3% / 4,8% e 1.000 € con décalage | [L. 207/2024 art. 1 co. 4-9 e 11](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207), confermata strutturale da L. 199/2025 |
| Detrazioni per carichi di famiglia | 800 / 690 € coniuge, 950 € per figlio, 750 € per ascendente | [art. 12 TUIR](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917) |
| Restrizione della platea dal 2025 | figli fino a 30 anni non compiuti, solo ascendenti conviventi | [L. 207/2024 art. 1 co. 11](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207) |
| Minimi garantiti non ragguagliati | 690 € e 1.380 € | circ. Agenzia delle Entrate 15/2007 |
| Prassi applicativa del cuneo | | [circ. Agenzia delle Entrate 4/E del 16 maggio 2025](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91) |
| Prima fascia e massimale | 56.224 € e 122.295 € | [circ. INPS n. 6 del 30 gennaio 2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) |
| Addizionale regionale Lombardia | 1,23% / 1,58% / 1,72% / 1,73% a scaglioni | [art. 72 co. 1 L.R. 10/2003, portale MEF](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10) |
| Addizionale comunale Milano | 0,80% con esenzione fino a 23.000 € | [portale del federalismo fiscale MEF](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&pagina=lombardia.htm&cm=&pr=MI&cc=F205&r=1) |
| TFR | quota annua pari a RAL / 13,5 | [art. 2120 codice civile](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262) |
| Contributo aggiuntivo IVS sul TFR | 0,50%, detratto dalla quota | [art. 3 L. 297/1982](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1982-05-29;297). Non è il Fondo di garanzia TFR, che è l'art. 2 della stessa legge ed è lo 0,20% |
| Costo azienda | 29,4% datore, INAIL 0,5% | Nessuna fonte primaria: sono medie di categoria |

**Due fonti non le ho aperte in originale.** La circolare 15/2007 sui minimi non
ragguagliati e la regola di arrotondamento al centesimo arrivano da fonti che le
citano, non dal documento stesso. L'esempio lavorato del cuneo su periodo parziale
viene invece dalla circolare 4/E 2025, che è linkata.

**Il 9,19% è un'assunzione dichiarata del modello,** non un'aliquota universale.
Assumo un lavoratore iscritto al FPLD con aliquota ordinaria a carico del dipendente,
e non modello le contribuzioni minori che dipendono dall'inquadramento aziendale.
L'aliquota è pacifica e confermata dalla prassi INPS; non ho individuato su fonte
primaria la norma che fissa il riparto 23,81 / 9,19 del 33% complessivo, ed è
segnalato anche nella nota del parametro.

## Scelte di architettura

**Il motore non restituisce un numero, restituisce il percorso.** Ogni calcolo
produce l'elenco ordinato delle voci che portano dal lordo al netto, ciascuna con il
proprio segno, la base su cui si applica, la formula in chiaro e la norma che la
stabilisce. Il grafico a cascata, la tabella voce per voce e le citazioni sono tre
modi di guardare quello stesso elenco. Ne segue che l'interfaccia non fa conti e non
contiene testo normativo scritto a mano, quindi non può mostrare qualcosa di diverso
da ciò che è stato calcolato. Un test verifica che sommando le voci si riottenga
esattamente il netto.

**Fra due soglie il netto è una retta.** Cambia pendenza solo quando si attraversa
una soglia di legge. Accorgersene ha risolto tre problemi in una volta: il grafico
dell'aliquota marginale diventa una scala leggibile invece di una curva rumorosa, la
modalità inversa si risolve in forma chiusa invece che per tentativi, e i casi di
test si scelgono da soli, perché i punti che vale la pena provare sono le soglie. Un
test verifica che l'elenco delle soglie sia completo: se ne mancasse una, il tratto
corrispondente non risulterebbe più una retta.

**Le soglie stanno sull'imponibile, il grafico ha la RAL sull'asse.** Sono due
grandezze diverse, separate dalla trattenuta contributiva: la soglia dei 23.000 di
imponibile cade a 25.327,61 di RAL. La conversione è calcolata, non stimata.

**Zero dipendenze e zero build.** Il deliverable è un link, quindi il repository è il
sito: quello che si legge è esattamente quello che viene eseguito, senza passare da
una toolchain. Il costo è l'interfaccia scritta a mano, accettato perché la superficie
è una form e qualche tabella. Niente moduli ES e niente lettura di file JSON, perché
il protocollo `file://` li blocca entrambi e il requisito era che funzionasse anche
con un doppio clic.

## Come far girare i test

Da riga di comando, senza installare niente:

```bash
node test/run.js
```

Oppure aprendo `test/runner.html` nel browser, che esegue gli stessi file e mostra
verde o rosso.

464 asserzioni, divise in undici suite per area. Se il codice e un valore atteso non
concordano, si guarda il codice.

## Come si aggiorna all'anno successivo

Si copiano `src/parameters-2026.js` e `src/local-2026.js` nei corrispondenti file
del 2027, si aggiornano valori e fonti, si aggiungono due righe al registro in
`src/parameters.js` e si caricano i file nuovi nelle pagine.

Nel fisco le regole valgono "a decorrere dal periodo d'imposta X", quindi l'anno è
l'unità di validità naturale: una regola cambiata a metà anno sarebbe due voci del
registro, non un intervallo di date dentro una. **Un motore è legato a un anno solo**,
scelto alla costruzione, così un singolo calcolo non può mescolare due regolamenti.

Ogni anno è un file completo, non una variazione sull'anno vicino. Deve poter essere
letto e verificato da solo contro le fonti di quell'anno, e una base condivisa
significherebbe che correggere qualcosa per il 2026 cambia in silenzio quello che il
file dice fosse la legge nel 2025. Il prezzo è la duplicazione, e contro la deriva
accidentale c'è un test: confronta i due insiemi e pretende che differiscano
**esattamente** nei cinque punti previsti, e in nessun altro.

Le differenze fra i due anni presenti:

| | 2025 | 2026 |
|---|---|---|
| Seconda aliquota IRPEF | 35% | 33% |
| Prima fascia contributiva | 55.448 € | 56.224 € |
| Massimale contributivo | 120.607 € | 122.295 € |

Detrazioni, cuneo, trattamento integrativo e addizionali locali sono identici.

Il motore non si tocca, perché non contiene nessun numero: aliquote, soglie, formule
e perfino la posizione delle soglie sul grafico sono derivate dai parametri. Se un
aggiornamento richiedesse di modificare il motore, sarebbe un difetto del motore.

## Architettura

I dati stanno in due posti, perche sono due tipi di dato. I **parametri statali**
sono una manciata di valori scritti a mano, letti uno per uno sulla norma e rivisti a
ogni modifica. Le **addizionali locali** sono una tabella: venti regioni e quasi
ottomila comuni, che cambiano ogni anno e che nessuno rilegge. Tenerli insieme
avrebbe voluto dire duplicare la tabella a ogni anno d'imposta.

Le aliquote comunali sono a scaglioni anche dove lo scaglione e uno solo, perche
molti comuni hanno un'addizionale progressiva e la forma deve reggerli senza che il
motore cambi. E ogni comune dichiara la sua regione, cosi chiedere Milano nel Lazio
viene rifiutato invece di produrre un numero con l'etichetta sbagliata.

Il motore e diviso in moduli e `src/engine.js` non contiene logica: monta i pezzi e
dichiara cosa espone. Ogni modulo e una funzione che riceve quello che gli serve e
restituisce quello che offre, quindi il grafo delle dipendenze e scritto una volta
sola invece di essere implicito in uno scope condiviso.

Il pezzo che regge tutto sono le **regole**. Ogni provvedimento e un oggetto con fino
a tre facce, e stanno insieme apposta:

```js
{
  id: 'family-deduction',
  apply:      function (ctx) { ... },      // cosa calcola
  ledger:     function (ctx) { ... },      // cosa scrive nella traccia
  thresholds: function (position) { ... }  // quali soglie introduce
}
```

Prima quelle tre cose vivevano in tre funzioni diverse, e aggiungere un provvedimento
dimenticandone due falliva in silenzio: il numero usciva giusto mentre la traccia e
l'elenco delle soglie mentivano. Adesso l'array delle regole e anche l'ordine dei
passi, che e quello della norma.

Una duplicazione e rimasta di proposito: il netto annuo e scritto a mano invece di
essere sommato dalla traccia. Se lo derivassi, il test che verifica che la traccia
ricostruisce il netto diventerebbe una tautologia. Sono due strade indipendenti che
devono arrivare allo stesso numero.

Niente moduli ES: su `file://` sono bloccati come `fetch`, e il sito deve funzionare
col doppio clic. Quindi classic script caricati in ordine, con lo stesso meccanismo
che i parametri usavano gia: globale in pagina, `require` sotto Node.

## Struttura

```
index.html                 calcolatore, inversa, costo azienda
curva.html                 aliquota marginale e soglie
src/parameters.js          registro degli anni: parametri statali e tabella locale
src/parameters-2025.js     valori normativi statali e fonti dell anno 2025
src/parameters-2026.js     valori normativi statali e fonti dell anno 2026
src/local-2025.js          addizionali regionali e comunali 2025
src/local-2026.js          addizionali regionali e comunali 2026
src/engine.js              il cablaggio: monta i moduli e ne espone l interfaccia
src/engine/numbers.js      troncamento, arrotondamento, scaglioni, formattazione
src/engine/position.js     chi viene pagato, e la validazione di quel che si chiede
src/engine/steps.js        una funzione per provvedimento, pure e senza ordine
src/engine/rules.js        i provvedimenti come oggetti: calcolo, traccia, soglie
src/engine/calculation.js  esegue le regole una volta e raccoglie il risultato
src/engine/breakpoints.js  le soglie dichiarate e quelle che emergono
src/engine/inverse.js      dal netto alla RAL, piu l oracolo binario dei test
src/ui-common.js           helper di rendering condivisi
src/ui-calculator.js       pagina calcolatore
src/ui-curve.js            pagina curva
src/styles.css
test/cases.js              registro delle suite, nell ordine in cui girano
test/fixtures.js           valori attesi condivisi fra le suite
test/suites/*.js           una suite per area, undici file
test/harness.js            runner di asserzioni
test/run.js                esecuzione da riga di comando
test/runner.html           esecuzione in browser
.nojekyll                  dice a GitHub Pages di pubblicare i file cosi come sono
```

## Nota finale

È stato più divertente di quanto mi aspettassi. La cosa che mi ha sorpreso di più è
l'aliquota marginale: non avevo idea che a 40.000 € di RAL un aumento rendesse meno
che a 70.000, e vederlo uscire dal codice invece che leggerlo da qualche parte è
tutta un'altra cosa.

Effetto collaterale non previsto: adesso so quanta RAL chiedere per arrivare a un
certo netto, e quanto costo davvero a un'azienda. Prima avrei sparato un numero a caso.
