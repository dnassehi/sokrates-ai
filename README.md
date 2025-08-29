# Sokrates AI - Medisinsk Anamnese Assistent

Sokrates AI er en intelligent samtaleassistent som hjelper pasienter med å fylle ut medisinsk anamnese gjennom sokratisk dialog, og gir leger et strukturert grunnlag for videre behandling.

## 🌟 Funksjoner

### For Pasienter
- **Anonym chat**: Start en samtale uten å oppgi personlige opplysninger
- **Sokratisk dialog**: AI-assistenten stiller gjennomtenkte spørsmål for å samle medisinsk informasjon
- **Naturlig samtale**: Fylle ut anamnese gjennom en naturlig dialog i stedet for et tradisjonelt skjema
- **Vurderingssystem**: Mulighet til å gi tilbakemelding på opplevelsen
- **Markdown-formatering**: AI-svar vises med riktig formatering (fet, kursiv, lister, etc.)

### For Leger
- **Dashboard**: Oversikt over alle pasientsesjoner fra din klinikk
- **Strukturert anamnese**: Automatisk generert JSON-strukturert anamnese fra samtalen
- **Komplett samtalehistorikk**: Se hele samtalen mellom pasient og AI
- **Pasientvurderinger**: Se tilbakemeldinger fra pasienter
- **Filtering og søk**: Filtrer sesjoner etter status og andre kriterier
- **Formatert visning**: Anamnese og kommentarer vises med markdown-formatering

## 🏗️ Teknologi-stack

- **Frontend**: React med TanStack Router
- **Backend**: tRPC for type-safe API
- **Database**: PostgreSQL med Prisma ORM
- **AI**: Mistral AI med streaming og JSON-format støtte
- **Autentisering**: JWT tokens med bcrypt for passordhashing
- **Styling**: Tailwind CSS med Typography plugin
- **Markdown-rendering**: markdown-to-jsx for AI-svar og anamnese
- **State Management**: Zustand med persistence
- **Forms**: React Hook Form med Zod validation

## 🚀 Kom i gang

### Forutsetninger
- Node.js (v22 eller nyere)
- Docker og Docker Compose
- Mistral AI API-nøkkel

### Installasjon

1. **Klon repositoryet**
   ```bash
   git clone <repository-url>
   cd sokrates-ai
   ```

2. **Installer avhengigheter**
   ```bash
   pnpm install
   ```

3. **Sett opp miljøvariabler**
   Kopier `.env.example` til `.env` og fyll ut de nødvendige verdiene:
   ```bash
   cp .env.example .env
   ```

   Rediger `.env` og legg til:
   - `MISTRAL_API_KEY`: Din Mistral AI API-nøkkel
   - `MISTRAL_MODEL`: Mistral AI modell (f.eks. "mistral-large-latest")
   - `JWT_SECRET`: En lang, tilfeldig streng for JWT-signering (minst 32 tegn)
   og endre `NODE_ENV` fra `development` til `production`

   Legg en kopi av den nye `.env` i `docker`-mappen.
   ```bash
   cp .env /docker/.env
   ```

5. **Start applikasjonen**
   ```bash
   cd docker
   docker-compose up --build -d
   ```

6. **Åpne nettleseren**
   Gå til `http://localhost:8000` for å se applikasjonen

### Tilgang til databasen

#### Prisma Studio (Anbefalt)
```bash
npx prisma studio --schema=prisma/schema.local.prisma
```
Åpne http://localhost:5555 i nettleseren

#### Adminer (Web-basert)
- URL: http://localhost:8080
- Server: `postgres`
- Brukernavn: `postgres`
- Passord: `postgres`
- Database: `app`

#### Direkte PostgreSQL-tilkobling
```bash
psql -h localhost -p 5432 -U postgres -d app
```
Passord: `postgres`

### Demo-konto

Applikasjonen oppretter automatisk en demo-lege-konto:
- **E-post**: `demo@sokrates.no`
- **Passord**: `demo123`
- **Klinikkode**: `DEMO_CLINIC`

## 📋 Bruksanvisning

### For Pasienter

1. **Start samtale**: Klikk på "Start samtale" på forsiden
2. **Chat med Sokrates**: Svar på spørsmålene fra AI-assistenten
3. **Fullfør samtalen**: Klikk "Fullfør samtale" når du er ferdig
4. **Gi vurdering**: Vurder opplevelsen din (valgfritt)

### For Leger

1. **Logg inn**: Bruk lege-innlogging på forsiden
2. **Dashboard**: Se oversikt over alle sesjoner fra din klinikk
3. **Se detaljer**: Klikk på en sesjon for å se komplett samtale og anamnese
4. **Filtrer**: Bruk filtrene for å finne spesifikke sesjoner

## 🎨 Markdown-rendering

Systemet støtter markdown-formatering i alle AI-svar og anamnese-felter for bedre lesbarhet:

### Støttet formatering
- **Fet tekst**: `**tekst**` → **tekst**
- **Kursiv tekst**: `*tekst*` → *tekst*
- **Overskrifter**: `# Overskrift` → `<h1>`
- **Lister**: `- punkt` → `<ul><li>`
- **Kode**: `` `kode` `` → `<code>`
- **Lenker**: `[tekst](url)` → `<a>`

### Implementasjon
- **Frontend**: `markdown-to-jsx` for å konvertere markdown til React-komponenter
- **Styling**: `@tailwindcss/typography` for konsistent typografi
- **Komponenter**: Chat-meldinger og anamnese-felter rendres automatisk med markdown-støtte

### Streaming og JSON-format
- **Chat-streaming**: Bruker Mistral AI streaming API for bedre ytelse
- **JSON-anamnese**: Automatisk strukturert output med JSON-formatering
- **Sikkerhet**: Ingen data lagres hos Mistral AI
- **Real-time**: Brukere ser svaret bygges opp gradvis

### AI-assistent system-prompt
Systemet bruker en spesifikk prompt for å fungere som en profesjonell medisinsk sekretær [eksempel]:

```
Du er en profesjonell medisinsk sekretær som jobber for en allmennlege. Din rolle er å være en digital assistent som samler inn nødvendig informasjon fra pasienten før konsultasjonen starter.

**Ditt oppdrag:**
- Forklar at du vil stille noen oppfølgningsspørsmål og be pasienten svare på de så godt vedkommende klarer.
- Be om informert samtykke. Forklar pasienten at interaksjonen blir lagret anonymt.
- Still maks 1–2 spørsmål om gangen, og vent på svar før du går videre.
- Bruk en varm og profesjonell tone.
- Still relevante spørsmål om:
  - Symptomer
  - Når symptomene startet
  - Alvorlighetsgrad
  - Tidligere behandling
  - Nåværende medisiner
- Bruk gjerne oppfølgingsspørsmål for å få fram detaljer.
- Når du er ferdig, spør alltid: «Er det noe mer du ønsker å dele om din helse?»
- Hvis pasienten sier nei eller ikke svarer, lag et kort og konsist notat til legen som oppsummerer situasjonen.
- Minn pasienten på å trykke på den grønne «fullfør»-knappen øverst til høyre når samtalen er ferdig.
- Det er meget viktig at du ikke forsøker å stille diagnoser men overlater refleksjoner rundt dette til legen.

**Eksempelstart:**
"Jeg stiller deg noen flere spørsmål slik at vi kan sikre at all informasjon blir tatt opp. Husk å trykke på den grønne «fullfør»-knappen øverst til høyre."

**Stil og format:**
- Svarene skal være i dialogformat.
- Bruk fortrinnsvis norsk språk.
- Oppsummering til legen skal være objektiv og kortfattet.
```

Prompten finnes i `src/server/trpc/procedures/sendChatMessage.ts`.

## 🗄️ Database-struktur

### Hovedmodeller

- **Doctor**: Lege-kontoer med e-post, passord og klinikkode
- **Session**: Pasientsesjoner med status og tidsstempler
- **Message**: Individuelle meldinger i samtalen
- **Anamnesis**: Strukturert medisinsk anamnese generert fra samtalen
- **Rating**: Pasientvurderinger av opplevelsen

### Anamnese-struktur

Hver fullførte samtale genererer en strukturert anamnese med følgende felter:
- Hovedplage
- Tidligere sykdommer
- Medisinering
- Allergier
- Familiehistorie
- Sosial livsstil
- ROS (Review of Systems)
- Pasientmål
- Fri oppsummering

## 🔒 Sikkerhet

- **Anonym pasientchat**: Pasienter trenger ikke oppgi personlige opplysninger
- **JWT-autentisering**: Sikker autentisering for leger
- **Passordhashing**: Bcrypt brukes for sikker lagring av passord
- **Klinikk-isolasjon**: Leger ser kun sesjoner fra sin egen klinikk
- **Token-validering**: Alle API-kall valideres med JWT-tokens

## 📑 Mistral AI-brukspolicy

- Alle kall til Mistral AI skjer server-side og API-nøklene eksponeres aldri i
  klienten.
- Nøklene lagres kun i miljøvariabler og blir ikke lagret i databasen.
- Forespørsler inkluderer anonym sesjons-ID i henhold til
  retningslinjene.
- Les mer i [Mistral AI Terms](https://mistral.ai/terms) og [Data Processing Addendum](https://mistral.ai/terms#data-processing-addendum).

## 🧪 Testing

Applikasjonen inkluderer demo-data for testing:
- Demo-lege-konto opprettet automatisk
- Eksempel-sesjon med komplett samtale og anamnese
- Pasientvurdering inkludert

## 📝 API-endepunkter

### Pasient-endepunkter
- `createChatSession`: Opprett ny chat-sesjon
- `sendChatMessage`: Send melding og få AI-respons (streaming)
- `completeChatSession`: Fullfør sesjon og generer anamnese
- `submitRating`: Send pasientvurdering

### Lege-endepunkter
- `doctorLogin`: Lege-innlogging
- `doctorRegister`: Registrer ny lege
- `getDoctorSessions`: Hent sesjoner for lege (med paginering)
- `getSessionDetails`: Hent komplett sesjondetaljer

## 🔄 Utvikling

### Kjøre i utviklingsmodus
```bash
pnpm run dev
```

### Bygge for produksjon
```bash
pnpm run build
```

### Database-migrering
Databasen oppdateres automatisk ved oppstart. Ingen manuelle migreringer nødvendig.

## 🚀 Deployment

### Docker Compose (Lokal/Development)
```bash
cd docker
docker-compose up --build -d
```

### DigitalOcean App Platform (Production)

#### Konfigurasjon
- **app.yaml**: Hovedkonfigurasjon for DigitalOcean med managed database
- **app.docker.yaml**: Alternativ konfigurasjon for Docker-basert deployment

#### Database-konfigurasjon
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  // For Docker/local development:
  // url      = "postgresql://postgres:postgres@postgres/app"
  // For DigitalOcean/production:
  url      = env("DATABASE_URL")
}
```

#### Bytte mellom Docker og Production
1. **Docker-modus**: Uncomment Docker URL og comment ut env-versjonen
2. **Production-modus**: Uncomment env-versjonen og comment ut Docker URL

#### Environment Variables for DigitalOcean
```
NODE_ENV=production
BASE_URL=https://sokrates.chat
BASE_URL_OTHER_PORT=https://sokrates.chat
ADMIN_PASSWORD=din-admin-passord
MISTRAL_API_KEY=din-mistral-api-nøkkel
MISTRAL_MODEL=mistral-large-latest
JWT_SECRET=din-jwt-secret
DATABASE_URL=${db.DATABASE_URL}
```

#### Deploy til DigitalOcean
```bash
# Via CLI
doctl apps create --spec app.yaml

# Eller via dashboard
# 1. Gå til DigitalOcean App Platform
# 2. Velg "Create App"
# 3. Velg "App Spec"
# 4. Lim inn innholdet fra app.yaml
```

## 🤝 Bidrag

1. Fork repositoryet
2. Opprett en feature-branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringene dine (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er lisensiert under MIT-lisensen.

## 🆘 Support

For spørsmål eller problemer, vennligst opprett en issue i GitHub-repositoryet.
