# Landbys Cup

En webbaserad applikation för hantering av skyttetävlingar, resultatlistor och cupresultat.

## Översikt

Landbys Cup är en produktionsklar Vite + React-applikation som migrerades från en single-file HTML-applikation. Appen använder Firebase för autentisering och datalagring (Firestore) och tillhandahåller funktionalitet för att:

- Registrera skyttar med automatiska startnummer
- Hantera deltävlingar med skiljemålstationer
- Registrera poäng per station och tävling
- Visa resultatlistor med automatisk ranking
- Beräkna och visa cupresultat baserat på de 5 bästa placeringarna
- Exportera resultat och cuplistor som PDF

## Originalfil

Denna applikation är migrerad från den ursprungliga single-file implementationen som finns i:
- [index.html.old](./index.html.old) (backup av originalfilen)
- Original blob path i repo: `index.html`

## Teknisk Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Backend**: Firebase (Firestore + Authentication)
- **PDF Export**: jsPDF med jspdf-autotable

## Installation och Lokal Utveckling

### Förutsättningar

- Node.js version 18 eller senare
- npm eller yarn pakethanterare
- Ett Firebase-projekt med Firestore och Authentication aktiverat

### Steg 1: Klona Repositoryt

```bash
git clone https://github.com/perhackarn/landbyscup.git
cd landbyscup
```

### Steg 2: Installera Dependencies

```bash
npm install
```

### Steg 3: Konfigurera Firebase

1. Skapa en `.env` fil i projektets rotmapp genom att kopiera `.env.example`:

```bash
cp .env.example .env
```

2. Fyll i dina Firebase-konfigurationsnycklar i `.env` filen:

```env
VITE_FIREBASE_API_KEY=din_api_nyckel
VITE_FIREBASE_AUTH_DOMAIN=ditt_projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ditt_projekt_id
VITE_FIREBASE_STORAGE_BUCKET=ditt_projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ditt_sender_id
VITE_FIREBASE_APP_ID=ditt_app_id
```

**VIKTIGT**: Lägg ALDRIG till `.env` filen i git. Den är redan exkluderad via `.gitignore`.

### Steg 4: Kör Utvecklingsservern

```bash
npm run dev
```

Appen kommer att vara tillgänglig på `http://localhost:5173`

## Build för Produktion

För att bygga applikationen för produktion:

```bash
npm run build
```

Detta skapar en optimerad produktionsbuild i `dist/` mappen.

För att förhandsgranska produktionsbuilden lokalt:

```bash
npm run preview
```

## Firestore Database Struktur

Applikationen använder följande Firestore-samlingar:

### Collections

1. **competitions**
   - `name`: string (tävlingens namn)
   - `date`: string (datum i YYYY-MM-DD format)
   - `skiljemal`: array of numbers (stationer som används för skiljemål, max 3)

2. **shooters**
   - `name`: string (skyttens namn)
   - `club`: string (ort/klubb)
   - `klass`: string (öppen, dam, veteran, ungdom, junior med stöd)
   - `startNumber`: number (automatiskt tilldelat unikt nummer)

3. **scores**
   - `competitionId`: string (referens till tävling)
   - `shooterId`: string (referens till skytt)
   - `station`: number (1-7)
   - `shots`: array of objects `[{ value: number, femetta: boolean }]`
   - `total`: number (summa poäng)
   - `femettor`: number (antal 5¹/10¹)

4. **counters**
   - Document: `shooter`
     - `currentNumber`: number (senaste använda startnummer)

## Firestore Security Rules

**VIKTIGT**: För produktionsmiljö måste du konfigurera lämpliga Firestore security rules. Den nuvarande konfigurationen kan vara öppen för testning.

Exempel på grundläggande säkerhetsregler:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to most collections
    match /{document=**} {
      allow read: if true;
    }

    // Allow anyone to add a shooter
    match /shooters/{shooterId} {
      allow create: if true;
      // Only authenticated users can update or delete
      allow update, delete: if request.auth != null;
    }

    // Allow anyone to read and write to the shooter counter for transactions
    match /counters/shooter {
      allow read, write: if true;
    }

    // Competitions and scores still require authentication for writes
    match /competitions/{competitionId} {
      allow write: if request.auth != null;
    }
    match /scores/{scoreId} {
        allow write: if request.auth != null;
    }
  }
}
```

## Funktioner

### Publika Funktioner (Ingen inloggning krävs)
- Visa skyttar och sök
- Visa resultatlistor per deltävling
- Visa cupresultat
- Exportera PDF:er

### Admin-Funktioner (Inloggning krävs)
- Lägg till/ändra/ta bort deltävlingar
- Registrera nya skyttar
- Ändra/ta bort skyttar
- Registrera och ändra poäng

## Kodstruktur

```
landbyscup/
├── public/              # Statiska filer
├── src/
│   ├── App.jsx         # Huvudkomponent med alla sub-komponenter
│   ├── main.jsx        # React entry point
│   ├── index.css       # Tailwind CSS imports
│   └── firebase.js     # Firebase konfiguration och initiering
├── index.html          # HTML template
├── package.json        # Dependencies och scripts
├── vite.config.js      # Vite konfiguration
├── tailwind.config.cjs # Tailwind CSS konfiguration
├── postcss.config.cjs  # PostCSS konfiguration
├── .env.example        # Exempel på environment variables
├── .gitignore          # Git ignore-regler
└── README.md           # Denna fil
```

## Komponenter i App.jsx

Applikationen består av följande huvudkomponenter:

- **Header**: Navigationsbar med inloggningsstatus och utloggningsknapp
- **LoginBox**: Inloggningsformulär
- **Competitions**: Hantering av deltävlingar
- **Shooters**: Registrering och hantering av skyttar
- **Scores**: Registrering av poäng
- **Results**: Visning av resultatlistor per tävling
- **CupResults**: Beräkning och visning av cupresultat

## TODO - Fortsatta Förbättringar

Följande förbättringar rekommenderas för framtida utveckling:

1. **Komponentuppdelning**: Dela upp `App.jsx` i separata filer för varje komponent i en `components/` mapp
2. **State Management**: Implementera Context API eller Redux för global state
3. **Error Handling**: Förbättrad felhantering och användarfeedback
4. **Loading States**: Lägg till laddningsindikatorer för asynkrona operationer
5. **Form Validation**: Mer robust validering av formulärdata
6. **Responsiveness**: Ytterligare optimering för mobila enheter
7. **Testing**: Lägg till enhetstester och integrationstester
8. **Accessibility**: Förbättra tillgänglighet (ARIA-labels, keyboard navigation)
9. **Performance**: Optimera rendering med React.memo och useMemo
10. **Environment-specific configs**: Separata konfigurationer för dev/staging/production

## Licens

Detta projekt är utvecklat för intern användning.

## Support

För frågor eller problem, vänligen öppna ett issue i GitHub-repositoryt.
