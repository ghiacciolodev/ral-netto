# Da RAL a netto, anno d'imposta 2026

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

Caso modellato: **impiegato, tempo indeterminato, full time, rapporto di lavoro per
l'intero anno, residente a Milano (Lombardia), nessun familiare a carico, nessuna
agevolazione, nessun onere deducibile o detraibile.** Fuori da questo caso il modello non è valido;
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
6. **Trattamento integrativo**: 1.200 € fino a 15.000 di reddito, se l'imposta lorda supera la detrazione art. 13 co. 1 ridotta di 75 €. È una misura distinta dal cuneo e **cumulabile** con esso.
7. **IRPEF netta** = max(0, lorda meno detrazioni). L'eccedenza per incapienza si perde e non è rimborsabile.
8. **Addizionali**: regionale Lombardia a scaglioni, comunale Milano ad aliquota unica con soglia di esenzione. Entrambe sull'imponibile, non ridotte dalle detrazioni.
9. **Netto** = RAL meno contributi meno IRPEF netta meno addizionali, più la somma esente del cuneo e il trattamento integrativo.

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

## Assunzioni e semplificazioni

Ogni riga è una cosa che il modello **non** fa, con il motivo.

| Semplificazione | Effetto e motivo |
|---|---|
| Nessun familiare a carico | Aggiungerli richiederebbe le detrazioni art. 12 e l'assegno unico. |
| Nessun onere deducibile o detraibile | Ridurrebbero rispettivamente imponibile e imposta. |
| Full time, rapporto di lavoro per l'intero anno | Il ragguaglio ai giorni delle detrazioni e del trattamento integrativo non si attiva mai. |
| Niente part-time né assunzione infrannuale con ratei | Servirebbe il ragguaglio, che è previsto dalla norma ma non implementato. |
| Iscrizione previdenziale successiva al 31/12/1995 | Senza questa, il massimale di 122.295 € non si applicherebbe. La circolare INPS 6/2026 distingue esplicitamente le due platee. |
| Solo Lombardia e Milano | Addizionali regionali e comunali cambiano per ogni ente. |
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
| Seconda fascia del trattamento integrativo non rilevante | Fra 15.000 e 28.000 spetta per la differenza fra alcune detrazioni e l'imposta lorda. Senza familiari a carico né oneri detraibili resta solo l'art. 13, che in quella fascia non supera mai l'imposta lorda: il risultato è sempre zero, ed è verificato da un test. |
| Arrotondamenti interni al calcolo non modellati | Il risultato mostrato è arrotondato al centesimo con la regola del terzo decimale. Il payroll reale arrotonda anche in punti interni al calcolo: quei punti non sono modellati perché non li ho chiusi su fonte primaria, ed è dichiarato nel parametro invece di essere deciso per caso. |
| Aritmetica in virgola mobile | Senza arrotondamenti intermedi la deriva resta sotto 1e-12, molto sotto il centesimo. Diventerà rappresentazione esatta in centesimi quando i punti di arrotondamento interni saranno modellati: prima non servirebbe a niente. |
| Minimo garantito della detrazione (690 € a tempo indeterminato, 1.380 € a determinato) non implementato | Con il rapporto sull'intero anno non si attiva mai, perché la detrazione piena vale 1.955 €. |
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
| Prassi applicativa del cuneo | | [circ. Agenzia delle Entrate 4/E del 16 maggio 2025](https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf/36979eaa-9fc5-a4ec-a7aa-136497c53f91) |
| Prima fascia e massimale | 56.224 € e 122.295 € | [circ. INPS n. 6 del 30 gennaio 2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) |
| Addizionale regionale Lombardia | 1,23% / 1,58% / 1,72% / 1,73% a scaglioni | [art. 72 co. 1 L.R. 10/2003, portale MEF](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10) |
| Addizionale comunale Milano | 0,80% con esenzione fino a 23.000 € | [portale del federalismo fiscale MEF](https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/risultato.htm?anno=9999&lista=1&pagina=lombardia.htm&cm=&pr=MI&cc=F205&r=1) |
| TFR | quota annua pari a RAL / 13,5 | [art. 2120 codice civile](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262) |
| Contributo aggiuntivo IVS sul TFR | 0,50%, detratto dalla quota | [art. 3 L. 297/1982](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1982-05-29;297). Non è il Fondo di garanzia TFR, che è l'art. 2 della stessa legge ed è lo 0,20% |
| Costo azienda | 29,4% datore, INAIL 0,5% | Nessuna fonte primaria: sono medie di categoria |

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

303 asserzioni. Se il codice e un valore atteso non concordano, si guarda il codice.

## Come si aggiorna all'anno successivo

Si copia `src/parameters-2026.js` in `src/parameters-2027.js`, si aggiornano valori e
fonti, e si cambia il nome nei due tag `<script>` delle pagine.

Il motore non si tocca, perché non contiene nessun numero: aliquote, soglie, formule
e perfino la posizione delle soglie sul grafico sono derivate dai parametri. Se un
aggiornamento richiedesse di modificare il motore, sarebbe un difetto del motore.

## Struttura

```
index.html                 calcolatore, inversa, costo azienda
curva.html                 aliquota marginale e soglie
src/parameters-2026.js     valori normativi e fonti, unico posto con dei numeri
src/engine.js              logica di calcolo, funzioni pure
src/ui-common.js           helper di rendering condivisi
src/ui-calculator.js       pagina calcolatore
src/ui-curve.js            pagina curva
src/styles.css
test/cases.js              casi di valore e test strutturali
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
