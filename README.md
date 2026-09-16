# AudiCloudi

AudiCloudi is een moderne muziekcommunity voor het ontdekken, streamen en delen van muziek. Bezoekers kunnen trending tracks en genres verkennen, terwijl ingelogde gebruikers nummers kunnen afspelen, opslaan, uploaden en hun profiel beheren.

## Functionaliteiten

- Homepagina met featured artists, trending tracks en muziekgenres
- Audioplayer met afspelen/pauzeren, vorige/volgende track, volume, shuffle, herhalen en wachtrij
- Trackdetailpagina's met artiestinformatie, metadata en acties
- Zoeken naar tracks en artiesten
- Gebruikersregistratie, inloggen en profielpagina's
- Persoonlijke library en favorieten
- Track uploaden en een adminomgeving
- Responsive dark interface met Tailwind CSS en herbruikbare UI-componenten

De huidige versie gebruikt mockdata en voorbeeld-audiobestanden. De authenticatie, uploads en beheerfuncties zijn voorbereid in de frontend en kunnen later op een backend worden aangesloten.

## Tech stack

- React 19 met TypeScript
- Vite 7
- React Router
- Tailwind CSS 3 met shadcn/ui-componenten
- Radix UI
- Lucide React
- ESLint en TypeScript

## Lokaal starten

### Vereisten

- Node.js 20 of nieuwer
- npm

### Installeren en uitvoeren

```bash
npm install
npm run dev
```

Open vervolgens de lokale URL die Vite toont, standaard `http://localhost:5173`.

### Productiebuild

```bash
npm run build
npm run preview
```

## Scripts

| Script | Beschrijving |
| --- | --- |
| `npm run dev` | Start de Vite-ontwikkelserver met HMR |
| `npm run build` | Voert de TypeScript-build uit en maakt een productiebuild |
| `npm run lint` | Controleert de code met ESLint |
| `npm run preview` | Serveert de productiebuild lokaal |

## Projectstructuur

```text
.
├── src/
│   ├── components/     Herbruikbare applicatie- en UI-componenten
│   ├── context/        Auth- en playercontext
│   ├── data/           Mockdata voor gebruikers, tracks en genres
│   ├── hooks/          Herbruikbare React hooks
│   ├── lib/            Algemene hulpfuncties
│   ├── pages/          Routes voor home, zoeken, library, profiel en beheer
│   ├── sections/       Visuele secties van de homepagina
│   ├── types/          TypeScript-datamodellen
│   ├── App.tsx         Router en globale providers
│   └── main.tsx        Frontend-entrypoint
├── index.html          HTML-entrypoint
├── package.json        Scripts en dependencies
├── tailwind.config.js  Tailwind-configuratie
├── vite.config.ts      Vite-configuratie
└── dist/               Gegenereerde productiebuild
```
