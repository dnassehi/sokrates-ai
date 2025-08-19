# 🧠 Sokrates AI – Mistral AI Agent Integrasjon

Dette dokumentet forklarer hvordan Mistral AI Agent API er integrert i Sokrates AI-prosjektet. Det gir veiledning for utviklere og AI-agenter som skal forstå, videreutvikle eller jobbe med systemet.

### 🎨 Markdown-rendering

Systemet støtter markdown-formatering i alle AI-svar og anamnese-felter:
- **Fet tekst**: `**tekst**` → **tekst**
- **Kursiv tekst**: `*tekst*` → *tekst*
- **Overskrifter**: `# Overskrift` → `<h1>`
- **Lister**: `- punkt` → `<ul><li>`
- **Kode**: `` `kode` `` → `<code>`
- **Lenker**: `[tekst](url)` → `<a>`

Markdown-rendering er implementert med `markdown-to-jsx` og `@tailwindcss/typography` for konsistent styling.

---

## 📌 Formål

Mistral AI Agent API brukes for å lede pasienten gjennom en sokratisk samtale og samle inn strukturert medisinsk anamnesedata. Samtalene mellom pasienten og assistenten genererer et JSON-objekt som kan vurderes av legen.

---

## ⚙️ Teknisk Oppsett

### 🔑 API-nøkler

Alle API-nøkler defineres i `.env` (ikke versjonskontrollér sensitive data):

```env
MISTRAL_API_KEY="your_mistral_api_key_here"
MISTRAL_MODEL="mistral-large-latest"
JWT_SECRET="..."

# Legacy OpenAI configuration (deprecated)
# OPENAI_API_KEY="sk-..."
# ASSISTANT_ID="asst_..."
# ANAMNESIS_MODEL="gpt-4o"
```

### 🧠 Brukt API: Mistral AI Chat Completions API

- **Chat-forespørsler**: `mistral.chat.stream()` med system-prompt (streaming)
- **Anamnese-generering**: `mistral.chat.complete()` med JSON-format
- **Arbeidsflyt**:
  1. Hent alle meldinger fra database
  2. Bygg meldingshistorikk
  3. Kall `mistral.chat.stream()` for chat (streaming + system-prompt)
  4. Kall `mistral.chat.complete()` med `responseFormat: { type: "json_object" }` for anamnese
  5. Lagre assistentens svar i database

### 🎨 Frontend-rendering

- **Markdown-parsing**: `markdown-to-jsx` for å konvertere markdown til React-komponenter
- **Styling**: `@tailwindcss/typography` for konsistent typografi
- **Komponenter**: Chat-meldinger og anamnese-felter rendres med markdown-støtte
- **Responsivt**: Automatisk tilpasning til ulike skjermstørrelser

### 🚀 Streaming og JSON-format

- **Chat-streaming**: Bruker `mistral.chat.stream()` med system-prompt for bedre sikkerhet
- **JSON-anamnese**: Bruker `responseFormat: { type: "json_object" }` for strukturert output
- **Ingen data-lagring**: Streaming betyr at data ikke lagres hos Mistral
- **Real-time respons**: Brukere ser svaret bygges opp gradvis
- **System-prompt**: Medisinsk sekretær-rolle med spesifikke instruksjoner

---

## 🧾 JSON-schema (Anamnese-svar)

Mistral AI-agenten genererer strukturert JSON:

```json
{
  "hovedplage": "string",
  "tidligereSykdommer": "string",
  "medisinering": "string",
  "allergier": "string",
  "familiehistorie": "string",
  "sosialLivsstil": "string",
  "ros": "string",
  "pasientMål": "string",
  "friOppsummering": "string"
}
```

---

## 📂 Relevant Filstruktur

| Fil | Formål |
|-----|--------|
| `src/server/trpc/procedures/sendChatMessage.ts` | Kaller Mistral AI Agent API |
| `src/server/trpc/procedures/completeChatSession.ts` | Genererer strukturert anamnese fra samtale via Mistral |
| `src/routes/chat/index.tsx` | Chat-UI for pasienter |
| `src/components/ChatMessage.tsx` | Chat-melding komponent med markdown-rendering |
| `src/server/db.ts` | Prisma-databaseklient |
| `src/server/trpc/procedures/createChatSession.ts` | Håndterer sesjonsopprettelse |
| `src/server/trpc/procedures/submitRating.ts` | Lagrer pasientens tilbakemeldinger |
| `src/routes/doctor/dashboard/index.tsx` | Lege-dashboard |
| `src/routes/doctor/session/$sessionId/index.tsx` | Sesjonsdetaljer for leger med markdown-rendering |

---

## 🔐 Autentisering

- **Pasienter**: Anonym chat uten registrering
- **Leger**: JWT-basert autentisering med e-post/passord
- **Klinikk-isolasjon**: Leger ser kun sesjoner fra sin egen klinikk

---

## 📑 Mistral AI-brukspolicy

- Alle Mistral AI-kall skjer server-side slik at API-nøkkelen ikke eksponeres
- Nøklene lagres kun i miljøvariabler og skrives ikke til databasen
- Forespørsler inkluderer anonym sesjons-ID for tracking
- Se https://openai.com/policies/usage-policies for mer informasjon

---

## 🔁 Chat-flyt

### Pasient-flyt:
1. **Opprett sesjon**: `createChatSession()` → returnerer `sessionId`
2. **Send melding**: `sendChatMessage(sessionId, message)` → AI-respons
3. **Fullfør sesjon**: `completeChatSession(sessionId)` → generer anamnese
4. **Gi vurdering**: `submitRating(sessionId, rating)` (valgfritt)

### Lege-flyt:
1. **Logg inn**: `doctorLogin(email, password)`
2. **Se oversikt**: `getDoctorSessions()` → liste over sesjoner
3. **Se detaljer**: `getSessionDetails(sessionId)` → komplett samtale + anamnese

---

## 🧪 Testing

### Demo-data:
- **Demo-lege**: `demo@sokrates.no` / `demo123`
- **Klinikkode**: `DEMO_CLINIC`
- **Eksempel-sesjon**: Inkluderer komplett samtale og anamnese

### API-testing:
```bash
# Test chat-funksjonalitet
curl -X POST http://localhost:8000/api/trpc/sendChatMessage \
  -H "Content-Type: application/json" \
  -d '{"sessionId": 1, "message": "Jeg har hodepine"}'
```

---

## 💡 Videre arbeid

- [ ] Flere språkstøtter i systemprompt
- [ ] Frontend-validering av output
- [ ] Finjustering av prompt for medisinsk nøyaktighet
- [ ] Logging av prompts/respons (GDPR-kompatibelt)
- [ ] Real-time chat med WebSocket
- [ ] Fil-opplasting for bilder/dokumenter

---

## 🧩 Eksempel på API-kall

### Send chat-melding (streaming):
```typescript
// Bygg meldingshistorikk
const messageList = allMessages.map(msg => ({
  role: msg.role as "user" | "assistant",
  content: msg.content,
}));

// Send melding med streaming og system-prompt
const stream = await mistral.chat.stream({
  model: env.MISTRAL_MODEL,
  messages: [
    {
      role: "system",
      content: "Du er en profesjonell medisinsk sekretær..."
    },
    ...messageList
  ],
  maxTokens: 400,
  temperature: 0.7,
});

// Hent streaming-respons
let assistantResponse = '';
for await (const event of stream) {
  if (event.data.choices?.[0]?.delta?.content) {
    assistantResponse += event.data.choices[0].delta.content;
  }
}
```

### Generer anamnese (JSON-format):
```typescript
const response = await mistral.chat.complete({
  model: env.MISTRAL_MODEL,
  messages: [
    {
      role: "user",
      content: `Basert på følgende samtale, ekstrahér medisinsk informasjon...\n\nSamtale:\n${conversationText}`
    }
  ],
  maxTokens: 600,
  responseFormat: { type: "json_object" },
  temperature: 0.3,
});

const anamnesis = JSON.parse(response.choices[0].message.content);
```

---

## 🗄️ Database-struktur

### Database-konfigurasjon

#### Prisma Schema (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  // For Docker/local development:
  // url      = "postgresql://postgres:postgres@postgres/app"
  // For DigitalOcean/production:
  url      = env("DATABASE_URL")
}
```

#### Docker/Local Development
- **Host**: `postgres` (Docker service name)
- **Port**: `5432`
- **Database**: `app`
- **Username**: `postgres`
- **Password**: `postgres`

For å bytte til Docker-modus, uncomment Docker URL og comment ut env-versjonen:
```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://postgres:postgres@postgres/app" // Docker mode
  // url      = env("DATABASE_URL") // Production mode
}
```

#### DigitalOcean Production
- Bruker managed PostgreSQL database
- Connection string leveres via `DATABASE_URL` environment variable
- Private connection for sikkerhet

### Hovedmodeller:
- **Doctor**: Lege-kontoer med e-post, passord, klinikkode
- **Session**: Pasientsesjoner med status, OpenAI thread ID
- **Message**: Individuelle meldinger (user/assistant)
- **Anamnesis**: Strukturert medisinsk anamnese
- **Rating**: Pasientvurderinger (1-5 stjerner)

### Relasjoner:
- `Doctor` → `Session` (one-to-many)
- `Session` → `Message` (one-to-many)
- `Session` → `Anamnesis` (one-to-one)
- `Session` → `Rating` (one-to-one)

---

## 🚀 Deployment

### Docker Compose:
```bash
cd docker
docker-compose up --build -d
```

### Miljøvariabler:
- `NODE_ENV=production`
- `BASE_URL=http://localhost:3000`
- `OPENAI_API_KEY=sk-...`
- `ASSISTANT_ID=asst_...`
- `ANAMNESIS_MODEL=gpt-4o`
- `JWT_SECRET=...`

---

## 🔧 Utvikling

### Lokal utvikling:
```bash
pnpm install
pnpm run dev
```

### Database-tilgang:
```bash
# Prisma Studio
npx prisma studio --schema=prisma/schema.local.prisma

# Adminer
# http://localhost:8080 (postgres/postgres/app)
```

---

## 👤 Ansvarlig utvikler

- **Hovedkontakt**: @damoun.nassehi
- **OpenAI Assistant**: Konfigurert og finjustert
- **Sist oppdatert**: Januar 2025
