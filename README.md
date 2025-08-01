# Sokrates AI - Medisinsk Anamnese Assistent

Sokrates AI er en intelligent samtaleassistent som hjelper pasienter med å fylle ut medisinsk anamnese gjennom sokratisk dialog, og gir leger et strukturert grunnlag for videre behandling.

## 🌟 Funksjoner

### For Pasienter
- **Anonym chat**: Start en samtale uten å oppgi personlige opplysninger
- **Sokratisk dialog**: AI-assistenten stiller gjennomtenkte spørsmål for å samle medisinsk informasjon
- **Naturlig samtale**: Fylle ut anamnese gjennom en naturlig dialog i stedet for et tradisjonelt skjema
- **Vurderingssystem**: Mulighet til å gi tilbakemelding på opplevelsen

### For Leger
- **Dashboard**: Oversikt over alle pasientsesjoner fra din klinikk
- **Strukturert anamnese**: Automatisk generert JSON-strukturert anamnese fra samtalen
- **Komplett samtalehistorikk**: Se hele samtalen mellom pasient og AI
- **Pasientvurderinger**: Se tilbakemeldinger fra pasienter
- **Filtering og søk**: Filtrer sesjoner etter status og andre kriterier

## 🏗️ Teknologi-stack

- **Frontend**: React med TanStack Router
- **Backend**: tRPC for type-safe API
- **Database**: PostgreSQL med Prisma ORM
- **AI**: OpenAI GPT-4o via Vercel AI SDK
- **Autentisering**: JWT tokens med bcrypt for passordhashing
- **Styling**: Tailwind CSS
- **State Management**: Zustand med persistence
- **Forms**: React Hook Form med Zod validation

## 🚀 Kom i gang

### Forutsetninger
- Node.js (v22 eller nyere)
- Docker og Docker Compose
- OpenAI API-nøkkel

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
   - `OPENAI_API_KEY`: Din OpenAI API-nøkkel
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

## 📑 OpenAI-brukspolicy

- Alle kall til OpenAI skjer server-side og API-nøklene eksponeres aldri i
  klienten.
- Nøklene lagres kun i miljøvariabler og blir ikke lagret i databasen.
- Forespørsler inkluderer `user`-feltet med anonym sesjons-ID i henhold til
  retningslinjene.
- Les mer i <https://openai.com/policies/usage-policies>.

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
OPENAI_API_KEY=sk-proj-...
ASSISTANT_ID=asst_IlsGgy58NV1mFIPpqkueAnRx
ANAMNESIS_MODEL=gpt-4o
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
