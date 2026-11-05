# AudiCloudi (CloudiAudi) — AI-Driven Multi-Tenant Audio Streaming, Social Waveform & Beat Licensing Platform

[![TypeScript](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript_5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Backend-FastAPI_%2B_PyTorch-3776AB?logo=python&logoColor=white)](https://fastapi.tiangolo.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run_%2B_BigQuery_%2B_Firestore-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Web Audio API](https://img.shields.io/badge/Audio_Engine-EBU_R128_-14_LUFS_%2B_WebAudio-FF5500)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Cloudflare Pages](https://img.shields.io/badge/Live-cloudiaudi.cloud-F38020?logo=cloudflare&logoColor=white)](https://cloudiaudi.cloud)

**AudiCloudi** (*CloudiAudi*, `cloudiaudi.cloud`) is een multi-tenant muziek- en producerplatform dat drie domeinen verenigt: **streaming-retentie** (`-14 LUFS` EBU R128 normalisatie, 30s survival-curves), **sociale interactie** (1000-punts interactieve waveform scrubbing, timestamped comments) en een **B2B licentiemarktplaats** (`basic_mp3`, `wav_lease`, `trackout`, `exclusive` + royalty split-sheets). De repository combineert een **React 19 + Web Audio API** frontend met een wiskundig gespecificeerde **Python FastAPI, PyTorch CNN & Contextual Bandit** productie-backend (`backend/`).

---

## Technische Kernpunten

1. **Convolutional Deep Acoustic Embedding Netwerk (`backend/ml_kernel/cnn_feature_extractor.py`)**:
   - Verwerkt 30-seconden audiosegmenten ($f_s = 22{,}050\text{ Hz}$, STFT met $N_{\text{fft}} = 2048$, hop $H = 512$) tot een Log-Mel Spectrogram $\mathbf{S} \in \mathbb{R}^{1 \times 128 \times 1292}$.
   - De PyTorch `CloudiAudiFeatureExtractor` (4 convolutionele blokken met `BatchNorm2d`, `ELU`, `Dropout`, `MaxPool` en Global Average Pooling) projecteert elke track naar een $L_2$-genormaliseerde **256-dimensionale akoestische embedding** ($\|\mathbf{e}_i\|_2 = 1$), aangevuld met drie multi-task heads: **BPM-regressie**, **24-toonsoorten classificatie** en een **10-dimensionale Mood-vector**.
2. **Clustered LinUCB Contextual Bandit met Sherman-Morrison $O(d^2)$ Online Updates (`backend/ml_kernel/contextual_bandit.py`)**:
   - Partitioneert de 256-d embeddingruimte in $K=64$ latente microgenre-clusters en hanteert een **95% Exploit / 5% Cold-Start Exploration** beleid voor nieuwe uploads ($N_{\text{plays}} < 50$).
   - Elimineert de kostbare $O(d^3) \approx 1.67 \times 10^7$ matrix-inversie door de inverse covariantiematrix $\mathbf{M}_k = \mathbf{A}_k^{-1}$ direct in-memory bij te werken via het **Sherman-Morrison rang-1 update-theorema** in $O(d^2) = 65{,}536$ operaties (**$< 1.5\text{ ms}$ CPU-latentie**).
3. **Realtime Sessie-Intentie State Machine & Multi-Objective Re-Ranker (`backend/event_streaming/intent_engine.py`, `backend/reranker/`)**:
   - Berekent over de laatste $N=10$ gebruikersinteracties via een multinomiale logit-projectie realtime de a-posteriori kansverdeling $\vec{w}(I_u) = [P(\text{Streamer}), P(\text{Curator}), P(\text{Buyer})]^\top$.
   - Combineert retentiescore, exponentieel vervallende sociale dynamiek ($t_{1/2} = 48\text{u}$), commerciële licentie-conversie en een early-skip penalty ($\tau_{\text{skip}} = 10\text{s}$), gevolgd door **Maximal Marginal Relevance (MMR $< 0.85$)** deduplicatie en **Gini-coëfficiënt ($G_{\text{target}} = 0.55$)** eerlijkheidscorrectie voor opkomende producers.
4. **FFmpeg Audio Ingest Pipeline & 16-Way Sharded Firestore Counters (`backend/audio_pipeline/`, `backend/core/counters.py`)**:
   - Tweetraps **EBU R128 loudness normalisatie** naar `-14 LUFS` (`-1.0 dBFS` true-peak), **Chromaprint** akoestische fingerprinting tegen duplicaat-uploads, en 1000-peak JSON waveform extractie.
   - Omzeilt de Firestore `1 write/sec` documentlimiet bij virale tracks via **16 gedistribueerde teller-shards** (`/tracks/{id}/shards/shard_{0..15}`).
5. **Zero-Dead-Air Frontend met Web Audio API Synthesizer & IndexedDB Storage (`src/lib/audioSynthesizer.ts`, `src/lib/audioStorage.ts`)**:
   - De React 19 frontend beschikt over een procedurele **Web Audio API synthesizer** en **IndexedDB blob-opslag**, waardoor geüploade tracks én voorbeeldtracks direct in de browser afspelen met realtime 1000-punts waveform scrubbing, wachtrijbeheer, shuffle/repeat en track-analytics.

---

## Systeemarchitectuur

```mermaid
flowchart TD
    subgraph Frontend["Frontend Web Application (React 19 + Vite 7 + Web Audio API)"]
        Player["Global AudioPlayer & 1000-Peak Waveform Scrubber"]
        Studio["Artist Upload Studio, Verification & Analytics Charts"]
        Social["Direct Messaging, Timestamped Comments & Playlists"]
        LocalAudio["IndexedDB Audio Storage & WebAudio Procedural Synth"]
    end

    subgraph FastAPI["Cloud Run Backend (Python FastAPI Microservices)"]
        API["Unified RBAC API (Admin / Label / Artist / Consumer)"]
        Intent["Realtime Session Intent Engine (Streamer / Curator / Buyer)"]
        Bandit["Clustered LinUCB Bandit (Sherman-Morrison <1.5ms)"]
        ReRank["Production Re-Ranker (MMR <0.85 + Gini Fairness)"]
    end

    subgraph Ingest["Audio Ingest & Deep Learning Pipeline"]
        FFmpeg["FFmpeg EBU R128 (-14 LUFS) & Waveform Worker"]
        Chroma["Chromaprint Acoustic Fingerprint Guard"]
        CNN["PyTorch 4-Block CNN (256-d Embedding + BPM/Key/Mood)"]
    end

    subgraph Cloud["Google Cloud & Firebase Data Layer"]
        FS[("Cloud Firestore (Vector Search kNN + 16-Shard Counters)")]
        GCS[("Cloud Storage (Masters & HLS Segments)")]
        BQ[("Google BigQuery (Realtime Event Streaming)")]
    end

    Studio -->|Upload Master| GCS --> FFmpeg & Chroma
    FFmpeg -->|Log-Mel Matrix (1, 128, 1292)| CNN -->|256-d Vector| FS
    Player & Social <--> API
    Player --> LocalAudio
    API --> Intent --> Bandit --> ReRank <--> FS
    API -->|Telemetry| BQ
```

---

## Multi-Tenant Rolsegregatie (5-Tier RBAC)

| Rol | Custom Claim (`role`) | Tenant Scope | Kernfunctionaliteiten in Frontend & API |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `super_admin` | Globaal | Live hyperparameter tuning, moderatie, systeemdiagnostiek ($p95/p99$), artiestverificatie (`/admin`). |
| **Record Label** | `record_label` | `tenant_id == label_id` | Roster-beheer (bijv. *Zheavenzy* `/label/zheavenzy`), geaggregeerde royalty-omzet, 30-dagen cohort-retentie. |
| **Artiest / Producer** | `artist_producer` | Eigen UID & Tenant | Track uploads (`/upload`), 30s survival curves, Track Analytics (`TrackAnalyticsChart.tsx`), licentietiers & splits. |
| **Luisteraar** | `listener_user` | Sessie / Account | Gepersonaliseerde feed, playlists (`/library`), favorieten, DM's (`DirectMessageModal.tsx`), track sharing. |
| **Gastbezoeker** | `guest_visitor` | Publiek | Trending Charts (`/charts`), Artiestenoverzicht (`/artists`), zoeken (`/search`) en direct beluisteren. |

---

## Wiskundige Grondslagen (Samenvatting uit `backend/math_specification.md`)

De volledige LaTeX-specificatie is te vinden in [`backend/math_specification.md`](backend/math_specification.md). Enkele kernformules uit de productie-engine:

### 1. Multi-Objective Track Scoring met Dynamische Intentiegewichten
$$\text{Score}(u, i, c) = w_{\text{ret}}(I_u)\cdot S_{\text{retention}}(u, i) + w_{\text{soc}}(I_u)\cdot S_{\text{social}}(i) + w_{\text{com}}(I_u)\cdot S_{\text{commercial}}(i) - \beta \exp\!\left(-\frac{d_{\text{ms}}}{\tau_{\text{skip}}}\right)\mathbb{I}(d_{\text{ms}} < 30{,}000)$$

### 2. Sherman-Morrison Rang-1 Online Inverse Update ($O(d^2)$)
Voor cluster-arm $k \in \{1,\dots,64\}$ met inverse matrix $\mathbf{M}_{k,t} = \mathbf{A}_{k,t}^{-1} \in \mathbb{R}^{256 \times 256}$ en $\mathbf{v} = \mathbf{M}_{k,t}\mathbf{x}$:
$$\mathbf{M}_{k, t+1} = \mathbf{M}_{k, t} - \frac{\mathbf{v}\mathbf{v}^\top}{1 + \mathbf{x}^\top \mathbf{v}}, \quad \text{UCB}(k \mid \mathbf{x}) = (\mathbf{M}_k \mathbf{b}_k)^\top \mathbf{x} + \alpha \sqrt{\mathbf{x}^\top \mathbf{M}_k \mathbf{x}}$$

---

## Tech Stack

| Laag | Technologieën |
| :--- | :--- |
| **Frontend Core** | React 19.2, TypeScript 5.9, Vite 7.2, React Router v7 |
| **Audio & Visualisatie** | Web Audio API (`audioSynthesizer.ts`), IndexedDB (`audioStorage.ts`), Custom 1000-Peak `Waveform.tsx`, Recharts (`TrackAnalyticsChart.tsx`) |
| **UI & Design Systeem** | Tailwind CSS 3.4, Radix UI Primitives, shadcn/ui, Lucide React, Sonner |
| **Backend & ML Kernel** | Python 3.11+, FastAPI, Pydantic v2, PyTorch (`Conv2d` Acoustic CNN), NumPy/SciPy (LinUCB + Sherman-Morrison) |
| **Audio Pipeline** | FFmpeg (`ebur128` `-14 LUFS`), Librosa / STFT Log-Mel Spectrograms, Chromaprint / `fpcalc` |
| **Cloud & Data** | Firebase Auth, Cloud Firestore (Vector Search + 16-Shard Counters), Google Cloud Storage, BigQuery, Cloud Run (`Dockerfile`) |

---

## Projectstructuur

```text
AudiCloudi/
├── src/                                   # React 19 + TypeScript Frontend
│   ├── components/
│   │   ├── AudioPlayer.tsx                # Globale dock-player met queue, shuffle, repeat & volume
│   │   ├── Waveform.tsx                   # Interactieve waveform scrubber & progress-visualizer
│   │   ├── TrackAnalyticsChart.tsx        # Retentie- en stream-analyse voor artiesten
│   │   ├── ArtistVerificationModal.tsx    # Verificatieflow voor artiesten & producers
│   │   ├── DirectMessageModal.tsx         # In-app berichten tussen artiesten, labels & fans
│   │   └── ui/                            # 40+ Radix UI / shadcn componenten
│   ├── context/                           # AuthContext, PlayerContext, PlaylistContext, TrackContext
│   ├── lib/
│   │   ├── audioStorage.ts                # IndexedDB persistentie voor geüploade audiobestanden
│   │   ├── audioSynthesizer.ts            # Web Audio API synthesizer voor directe browser-playback
│   │   └── firebase.ts                    # Firebase Auth, Firestore & Storage integratie
│   └── pages/                             # Home, Charts, Artists, TrackDetail, PlaylistDetail, Upload, Library, Pricing, Admin
├── backend/                               # Python FastAPI + PyTorch Productie Backend
│   ├── api/                               # FastAPI routers (admin_api, label_api, artist_api, consumer_api)
│   ├── audio_pipeline/                    # FFmpeg EBU R128 worker, Log-Mel Spectrograms & Chromaprint
│   ├── event_streaming/                   # BigQuery event streamer & Realtime Session Intent Engine
│   ├── ml_kernel/                         # PyTorch 256-d CNN, Firestore Vector Search & LinUCB Bandit
│   ├── reranker/                          # Multi-objective scoring, MMR (<0.85) & Gini fairness engine
│   ├── core/                              # Pydantic v2 modellen, RBAC claims CLI & 16-shard counters
│   ├── benchmark_latency.py               # Latentie-benchmark voor de Sherman-Morrison & Re-ranker pijplijn
│   ├── math_specification.md              # Volledige wiskundige specificatie (LaTeX)
│   └── Dockerfile                         # Google Cloud Run productie-container
├── firestore.rules                        # Multi-tenant Firestore beveiligingsregels
└── firestore.indexes.json                 # Vector- en samengestelde Firestore-indexen
```

---

## Lokaal Starten (Frontend & Backend)

### 1. Frontend Web Applicatie Starten
```bash
git clone https://github.com/JamalDrenthe/AudiCloudi.git
cd AudiCloudi
npm install
npm run dev
```
De frontend is direct beschikbaar op `http://localhost:5173`.

### 2. Python ML & FastAPI Backend Starten
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Start de FastAPI server met live reload
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8080 --reload
```
Open vervolgens `http://localhost:8080/docs` voor de interactieve OpenAPI / Swagger documentatie, of voer de latentie-benchmark uit via `python backend/benchmark_latency.py`.

---

## Auteur & Contact

Ontworpen en ontwikkeld door **Jamal Drenthe** ([Quantum Initium](https://quantuminitium.com)).

- **Website**: [cloudiaudi.cloud](https://cloudiaudi.cloud)
- **GitHub**: [@JamalDrenthe](https://github.com/JamalDrenthe)
- **E-mail**: [info@jamaldrenthe.com](mailto:info@jamaldrenthe.com)
