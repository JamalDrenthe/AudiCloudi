# CloudiAudi Wiskundige & Algoritmische Specificatie
*Production Architecture Mathematical Specification*

Dit document formuleert de exacte wiskundige grondslagen van het CloudiAudi multi-tenant audioplatform.

---

## 1. Sessie-Intentie Classificatie (Realtime State Machine)

Laat de interactiehistorie van gebruiker $u$ in sessie $s$ gerepresenteerd worden door de geordende sequentie van de laatste $N=10$ interactie-events:
$$\mathcal{H}_s = \{e_1, e_2, \dots, e_N\}$$

Elk event $e_t$ bevat een interactietype $k_t \in \{\text{stream\_play}, \text{stream\_complete}, \text{seek}, \text{comment}, \text{repost}, \text{like}, \text{preview\_license}, \text{add\_to\_cart}, \text{checkout}\}$, een tijdsduur $d_t$ (in milliseconden), en een relatieve voortgang $r_t = \frac{d_t}{D_{\text{total}}}$.

We construeren de geaggregeerde sessie-featurevector $\boldsymbol{\phi}(\mathcal{H}_s) \in \mathbb{R}^6$:
$$\boldsymbol{\phi}(\mathcal{H}_s) = \begin{bmatrix}
\frac{1}{N} \sum_{t=1}^N \mathbb{I}(r_t \ge 0.8) \\
\frac{1}{N} \sum_{t=1}^N \mathbb{I}(r_t < 0.3) \\
\frac{1}{N} \sum_{t=1}^N \mathbb{I}(k_t \in \{\text{comment}, \text{repost}, \text{like}\}) \\
\frac{1}{N} \sum_{t=1}^N \mathbb{I}(k_t \in \{\text{preview\_license}, \text{add\_to\_cart}\}) \\
\frac{1}{N} \sum_{t=1}^N \mathbb{I}(k_t = \text{checkout}) \\
\frac{1}{N} \sum_{t=1}^N \exp(-\mu(N - t))
\end{bmatrix}$$

De a-posteriori intentiekansen voor de drie toestanden $C \in \{\text{Streamer (Consumer)}, \text{Curator (Social)}, \text{Buyer (Artist/Licensee)}\}$ worden berekend via een multinomiale logit projectie:
$$P(\text{Intent} = c \mid \mathcal{H}_s) = \frac{\exp\left(\boldsymbol{\beta}_c^\top \boldsymbol{\phi}(\mathcal{H}_s) + \alpha_c\right)}{\sum_{j=1}^3 \exp\left(\boldsymbol{\beta}_j^\top \boldsymbol{\phi}(\mathcal{H}_s) + \alpha_j\right)}$$

De dynamische gewichtsvector $\vec{w}(I_u) = [w_{\text{ret}}, w_{\text{soc}}, w_{\text{com}}]^\top$ is het directe resultaat van deze gekalibreerde kansverdeling:
$$\vec{w}(I_u) = \begin{bmatrix} 
P(\text{Streamer} \mid \mathcal{H}_s) \\ 
P(\text{Curator} \mid \mathcal{H}_s) \\ 
P(\text{Buyer} \mid \mathcal{H}_s) 
\end{bmatrix}, \quad \text{waarbij } \sum_{i \in \{\text{ret}, \text{soc}, \text{com}\}} w_i = 1$$

---

## 2. Audio Verwerking & Log-Mel Spectrogram Extractie

Gegeven een raw master audiobestand $x(t)$, voeren we eerst tweetraps EBU R128 normalisatie uit naar $-14 \text{ LUFS}$ met een piekbegrenzing op $-1.0 \text{ dBFS}$.

Vervolgens resamplen we het audiosignaal naar $f_s = 22{,}050 \text{ Hz}$ en selecteren een representatief segment van $T = 30 \text{ s}$ ($L = 661{,}500$ samples).

De Short-Time Fourier Transform (STFT) wordt berekend met een Hann-venster van lengte $N_{\text{fft}} = 2048$ en hop size $H = 512$:
$$X(k, m) = \sum_{n=0}^{N_{\text{fft}}-1} x[n + mH] \cdot w[n] \cdot e^{-j 2\pi k n / N_{\text{fft}}}$$

Het vermogensspectrum $|X(k, m)|^2$ wordt geprojecteerd op een Mel-filterbank $M \in \mathbb{R}^{128 \times (1 + N_{\text{fft}}/2)}$:
$$S_{\text{mel}}(b, m) = \sum_{k=0}^{N_{\text{fft}}/2} M(b, k) \cdot |X(k, m)|^2, \quad b \in \{1, \dots, 128\}$$

Het log-mel spectrogram $\mathbf{S} \in \mathbb{R}^{1 \times 128 \times 1292}$ is gedefinieerd als:
$$\mathbf{S}(b, m) = \ln\left(\max(\epsilon, S_{\text{mel}}(b, m))\right), \quad \epsilon = 10^{-6}$$

---

## 3. Convolutionele Deep Acoustic Embedding CNN

De akoestische representatie wordt gegenereerd door het `CloudiAudiFeatureExtractor` neuraal netwerk. De input $\mathbf{S} \in \mathbb{R}^{B \times 1 \times 128 \times 1292}$ passeert door vier convolutionele blokken:

Voor elk blok $l \in \{1, 2, 3, 4\}$ met $C_l \in \{32, 64, 128, 256\}$ filters:
$$\mathbf{H}_l = \text{MaxPool}_{2\times 2}\left(\text{Dropout}_{p_l}\left(\text{ELU}\left(\text{BatchNorm2d}\left(\text{Conv2d}_{3\times 3}(\mathbf{H}_{l-1})\right)\right)\right)\right)$$

Na blok 4 voeren we Global Average Pooling (GAP) uit:
$$\mathbf{h}_{\text{gap}} = \frac{1}{H_4 \cdot W_4} \sum_{i=1}^{H_4} \sum_{j=1}^{W_4} \mathbf{H}_4[:, :, i, j] \in \mathbb{R}^{256}$$

De gedeelde representatieve akoestische embedding $\mathbf{e}_i \in \mathbb{R}^{256}$ wordt geprojecteerd via een lineaire laag $\mathbf{W}_p \in \mathbb{R}^{256 \times 256}$ en unit-norm genormaliseerd:
$$\mathbf{e}_i = \frac{\mathbf{W}_p \mathbf{h}_{\text{gap}} + \mathbf{b}_p}{\|\mathbf{W}_p \mathbf{h}_{\text{gap}} + \mathbf{b}_p\|_2}, \quad \|\mathbf{e}_i\|_2 = 1$$

### Multi-Task Heads:
1. **BPM Regressie Head:**
   $$\hat{y}_{\text{bpm}} = \text{Softplus}(\mathbf{w}_{\text{bpm}}^\top \mathbf{h}_{\text{gap}} + b_{\text{bpm}}) \cdot 180 + 40$$
2. **Key Classificatie Head (24 Toonsoorten):**
   $$\hat{\mathbf{y}}_{\text{key}} = \text{Softmax}(\mathbf{W}_{\text{key}} \mathbf{h}_{\text{gap}} + \mathbf{b}_{\text{key}}) \in \Delta^{23}$$
3. **Mood Vector Head (10 Stemmingen):**
   $$\hat{\mathbf{y}}_{\text{mood}} = \sigma(\mathbf{W}_{\text{mood}} \mathbf{h}_{\text{gap}} + \mathbf{b}_{\text{mood}}) \in [0, 1]^{10}$$

Totale optimalisatiefunctie tijdens training:
$$\mathcal{L}_{\text{total}} = \lambda_1 \|\hat{y}_{\text{bpm}} - y_{\text{bpm}}\|^2 + \lambda_2 \mathcal{L}_{\text{CE}}(\hat{\mathbf{y}}_{\text{key}}, y_{\text{key}}) + \lambda_3 \sum_{m=1}^{10} \mathcal{L}_{\text{BCE}}(\hat{y}_{\text{mood}, m}, y_{\text{mood}, m})$$

---

## 4. LinUCB Contextual Bandit met First-Play Exploration

Voor elke arm (track $a \in \mathcal{A}$) onderhouden we een ridge-regressiemodel over de gebruikerscontext $\mathbf{x} \in \mathbb{R}^d$ ($d=256$, gevormd door de gebruikersaffiniteitsvector):

$$\mathbf{A}_a = \mathbf{I}_d + \sum_{t=1}^T \mathbf{x}_t \mathbf{x}_t^\top, \quad \mathbf{b}_a = \sum_{t=1}^T r_t \mathbf{x}_t$$

De geschatte gewichtsvector $\hat{\boldsymbol{\theta}}_a$ en Upper Confidence Bound (UCB) score:
$$\hat{\boldsymbol{\theta}}_a = \mathbf{A}_a^{-1} \mathbf{b}_a$$
$$\text{UCB}(a \mid \mathbf{x}) = \hat{\boldsymbol{\theta}}_a^\top \mathbf{x} + \alpha \sqrt{\mathbf{x}^\top \mathbf{A}_a^{-1} \mathbf{x}}$$

### Allocatiebeleid (95% Exploit / 5% Cold-Start):
Voor een kandidaatverzameling $\mathcal{C}$:
$$\pi(a) = \begin{cases}
\arg\max_{a \in \mathcal{C}_{\text{mature}}} \text{UCB}(a \mid \mathbf{x}) & \text{met kans } 0.95 \\
\text{Sample}_{\text{cluster}}(a \in \mathcal{C}_{\text{cold}}, \mathbf{e}_a \approx \mathbf{x}) & \text{met kans } 0.05
\end{cases}$$

Waarbij $\mathcal{C}_{\text{cold}} = \{a \in \mathcal{C} \mid N_{\text{plays}}(a) < 50\}$.

---

## 5. Unified Multi-Objective Scoring Functie

Voor gebruiker $u$, track $i$, en context $c$:
$$\text{Score}(u, i, c) = w_1(I_u) \cdot S_{\text{retention}}(u, i) + w_2(I_u) \cdot S_{\text{social}}(i) + w_3(I_u) \cdot S_{\text{commercial}}(i) - \text{Penalty}_{\text{skip}}(u, i)$$

### Component Specificaties:

1. **Retentiescore $S_{\text{retention}}(u, i)$:**
   $$S_{\text{retention}}(u, i) = \gamma_1 (\mathbf{u}_u^\top \mathbf{e}_i) + \gamma_2 \bar{R}_i + \gamma_3 \log(1 + N_{\text{repeats}}(u, i))$$
   Waarbij $\mathbf{u}_u^\top \mathbf{e}_i$ de cosinusovereenkomst is tussen het luisterprofiel van de gebruiker en de akoestische embedding van de track, en $\bar{R}_i$ het historische voltooiingspercentage is: $\bar{R}_i = \frac{1}{|E_i|} \sum_{e \in E_i} \min\left(1.0, \frac{d_e}{D_i}\right)$.

2. **Sociale Dynamiek met Exponentieel Verval $S_{\text{social}}(i)$:**
   Laat $\mathcal{E}_{\text{soc}}(i) = \{(t_k, v_k)\}$ de tijdstempel en waarde zijn van sociale interacties op track $i$ (commentaar $v=2.0$, herplaatsing $v=3.5$, like $v=1.0$, follow artiest $v=5.0$):
   $$S_{\text{social}}(i) = \sum_{k \in \mathcal{E}_{\text{soc}}(i)} v_k \cdot \exp\left(-\lambda_{\text{soc}} (t_{\text{now}} - t_k)\right)$$
   Met vervalfactor $\lambda_{\text{soc}} = \frac{\ln(2)}{t_{1/2}^{\text{soc}}}$, waarbij de halfwaardetijd $t_{1/2}^{\text{soc}} = 48 \text{ uur}$.

3. **Commerciële Marktwaarde $S_{\text{commercial}}(i)$:**
   Over een rollend venster $W \in [24\text{u}, 72\text{u}]$:
   $$S_{\text{commercial}}(i) = \frac{\sum_{\tau \in W} \left[ \omega_{\text{cart}} \mathbb{I}(\text{cart}_\tau) + \sum_{l \in \text{tiers}} \omega_l \cdot \text{Volume}(l, \tau) \right]}{\max\left(1, N_{\text{previews}}(i, W)\right)} \cdot \log_{10}(10 + \text{Revenue}_{W}(i))$$
   Waarbij:
   $$\omega_{\text{exclusive}} = 10.0 > \omega_{\text{trackout}} = 5.0 > \omega_{\text{wav\_lease}} = 2.5 > \omega_{\text{basic\_mp3}} = 1.0$$

4. **Skip Boete $\text{Penalty}_{\text{skip}}(u, i)$:**
   $$ \text{Penalty}_{\text{skip}}(u, i) = \beta \cdot \exp\left(-\frac{\text{duration\_listened\_ms}}{\tau_{\text{skip}}}\right) \cdot \mathbb{I}(\text{duration\_listened\_ms} < 30{,}000)$$
   Met boeteschaal $\beta = 1.5$ en tijdsconstante $\tau_{\text{skip}} = 10{,}000 \text{ ms}$.

---

## 6. Maximal Marginal Relevance (MMR) & Gini Index Diversiteit

### MMR Re-ranking:
Gegeven de geselecteerde verzameling tracks $S$ en kandidaatverzameling $R \setminus S$:
$$i^* = \arg\max_{i \in R \setminus S} \left[ \lambda_{\text{div}} \cdot \text{Score}(u, i) - (1 - \lambda_{\text{div}}) \max_{j \in S} \text{Sim}(\mathbf{e}_i, \mathbf{e}_j) \right]$$
Met similariteitsdrempel: als $\text{Sim}(\mathbf{e}_i, \mathbf{e}_j) > 0.85$, wordt een extra redundantie-boete toegepast:
$$\text{Sim}(\mathbf{e}_i, \mathbf{e}_j) = \frac{\mathbf{e}_i^\top \mathbf{e}_j}{\|\mathbf{e}_i\|_2 \|\mathbf{e}_j\|_2}$$

### Gini Index & Roster Exposure Egalisatie:
Laat $y_k$ het cumulatieve impressie-aandeel zijn van producer $k$ over $M$ producers. De Gini-coëfficiënt:
$$G = \frac{\sum_{j=1}^M \sum_{k=1}^M |y_j - y_k|}{2 M \sum_{j=1}^M y_j}$$

Als $G > G_{\text{target}} = 0.55$, corrigeren we de rangschikking met een fairness boost multiplier $\gamma_{\text{fair}}(i)$:
$$\gamma_{\text{fair}}(i) = 1.0 + \delta \cdot \max\left(0, 1.0 - \frac{\text{Impressions}(\text{Producer}(i))}{K_{\text{fair}}}\right), \quad \delta = 0.25$$
$$\text{Score}_{\text{final}}(u, i) = \text{Score}(u, i) \cdot \gamma_{\text{fair}}(i)$$

---

## 7. Clustered Latent Microgenre Arms & Sherman-Morrison Online Update

### 7.1 Reductie van $N$ Track-Armen naar $K=64$ Latente Cluster-Armen:
In plaats van een aparte covariantiematrix per track te onderhouden, partitioneren we de 256-dimensionale akoestische embeddingruimte in $K=64$ centroids $\{\boldsymbol{\mu}_1, \dots, \boldsymbol{\mu}_{64}\} \subset \mathbb{R}^{256}$.

Elke track $i$ wordt deterministisch toegewezen aan het dichtstbijzijnde centroid:
$$c(i) = \arg\min_{k \in \{1, \dots, 64\}} \|\mathbf{e}_i - \boldsymbol{\mu}_k\|_2 = \arg\max_{k \in \{1, \dots, 64\}} \mathbf{e}_i^\top \boldsymbol{\mu}_k$$

Voor elk cluster $k \in \{1, \dots, 64\}$ onderhouden we:
$$\mathbf{A}_k \in \mathbb{R}^{d \times d}, \quad \mathbf{b}_k \in \mathbb{R}^d, \quad d = 256$$

### 7.2 Sherman-Morrison Rang-1 Matrix Inverse Update:
De klassieke LinUCB vereist de inversie $\mathbf{A}_k^{-1}$, wat $O(d^3) = O(256^3) \approx 16{,}777{,}216$ operaties vergt. 

Om sub-2ms runtime updates op de CPU te garanderen, onderhouden we de inverse matrix $\mathbf{M}_k = \mathbf{A}_k^{-1}$ direct in het geheugen. Wanneer contextvector $\mathbf{x} \in \mathbb{R}^d$ en beloning $r \in \mathbb{R}$ worden waargenomen:
$$\mathbf{A}_{k, t+1} = \mathbf{A}_{k, t} + \mathbf{x} \mathbf{x}^\top$$

Volgens het Sherman-Morrison theorema geldt voor de inverse:
$$\mathbf{A}_{k, t+1}^{-1} = \mathbf{A}_{k, t}^{-1} - \frac{\mathbf{A}_{k, t}^{-1} \mathbf{x} \mathbf{x}^\top \mathbf{A}_{k, t}^{-1}}{1 + \mathbf{x}^\top \mathbf{A}_{k, t}^{-1} \mathbf{x}}$$

Laat $\mathbf{v} = \mathbf{M}_{k, t} \mathbf{x} \in \mathbb{R}^{256}$. Dan:
$$\mathbf{M}_{k, t+1} = \mathbf{M}_{k, t} - \frac{\mathbf{v} \mathbf{v}^\top}{1 + \mathbf{x}^\top \mathbf{v}}$$

Dit reduceert de rekencomplexiteit van $O(d^3)$ naar $O(d^2) = 256^2 = 65{,}536$ bewerkingen, wat op een moderne multi-core processor in $< 1.5\text{ ms}$ executeert.

De Upper Confidence Bound score voor cluster $k$ gegeven gebruikerscontext $\mathbf{x}$:
$$\hat{\boldsymbol{\theta}}_k = \mathbf{M}_k \mathbf{b}_k$$
$$\text{UCB}(k \mid \mathbf{x}) = \hat{\boldsymbol{\theta}}_k^\top \mathbf{x} + \alpha \sqrt{\mathbf{x}^\top \mathbf{M}_k \mathbf{x}}$$

---

## 8. Distributed Sharded Counters & Write-Contention Eliminatie

### Poisson Aankomstmodel & Write-Lock Analyse:
Google Cloud Firestore handhaaft een harde limiet van circa 1 schrijfactie per seconde per individueel document ($1\text{ write/sec}$). Bij virale tracks met stream-aankomstsnelheid $\lambda \gg 1\text{ stream/sec}$ leidt een enkele teller op `/tracks/{track_id}.playsCount` tot $100\%$ lock-contention en `ABORTED / DEADLINE_EXCEEDED` fouten.

Met $N = 16$ onafhankelijke shards in de subcollection `/tracks/{track_id}/shards/shard_{s}`:
$$P(\text{Shard} = s) = \frac{1}{N} = \frac{1}{16}$$

De effectieve aankomstsnelheid per shard:
$$\lambda_s = \frac{\lambda}{N} = \frac{\lambda}{16}$$

Hierdoor kan de track tot $16 \times 1\text{ write/sec} = 16\text{ streams/sec}$ verwerken zonder write-locks.

De totale stroomteller $T$ wordt opgevraagd via server-side Aggregation Queries:
$$T = \sum_{s=0}^{N-1} \text{count}_s$$
en periodiek atomair geconsolideerd naar het hoofdtrackdocument via een scheduled worker.

