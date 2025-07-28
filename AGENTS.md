# 🧠 Sokrates AI – OpenAI Assistant API Integrasjon

Dette dokumentet forklarer hvordan OpenAI Assistant API er integrert i Sokrates AI-prosjektet. Det gir veiledning for utviklere og AI-agenter som skal forstå, videreutvikle eller jobbe med systemet.

---

## 📌 Formål

OpenAI Assistant API brukes for å lede pasienten gjennom en sokratisk samtale og samle inn strukturert medisinsk anamnesedata. Samtalene mellom pasienten og assistenten genererer et JSON-objekt som kan vurderes av legen.

---

## ⚙️ Teknisk Oppsett

### 🔑 API-nøkler

Alle API-nøkler defineres i `.env` (ikke versjonskontrollér sensitive data):

```env
OPENAI_API_KEY="sk-..."
ASSISTANT_ID="asst_..."
ANAMNESIS_MODEL="gpt-4o"
JWT_SECRET="..."
```

### 🧠 Brukt API: OpenAI Assistants API

- **Modell**: GPT-4o (for anamnese-generering)
- **Assistant ID**: Definert i `.env`
- **Arbeidsflyt**: `openai.beta.threads.*` API
  1. `threads.create()` – opprett ny tråd
  2. `threads.messages.create()` – send brukermelding
  3. `threads.runs.create()` – start run med assistant
  4. `threads.runs.retrieve()` – poll fremdrift
  5. `threads.messages.list()` – hent svar

---

## 🧾 JSON-schema (Anamnese-svar)

OpenAI-assistenten genererer strukturert JSON:

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
| `src/server/trpc/procedures/sendChatMessage.ts` | Kaller OpenAI Assistant API med polling |
| `src/server/trpc/procedures/completeChatSession.ts` | Genererer strukturert anamnese fra samtale |
| `src/routes/chat/index.tsx` | Chat-UI for pasienter |
| `src/server/db.ts` | Prisma-databaseklient |
| `src/server/trpc/procedures/createChatSession.ts` | Håndterer sesjonsopprettelse |
| `src/server/trpc/procedures/submitRating.ts` | Lagrer pasientens tilbakemeldinger |
| `src/routes/doctor/dashboard/index.tsx` | Lege-dashboard |
| `src/routes/doctor/session/$sessionId/index.tsx` | Sesjonsdetaljer for leger |

---

## 🔐 Autentisering

- **Pasienter**: Anonym chat uten registrering
- **Leger**: JWT-basert autentisering med e-post/passord
- **Klinikk-isolasjon**: Leger ser kun sesjoner fra sin egen klinikk

---

## 📑 OpenAI-brukspolicy

- Alle OpenAI-kall skjer server-side slik at API-nøkkelen ikke eksponeres
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

### Send chat-melding:
```typescript
// Opprett eller bruk eksisterende thread
let threadId = session.openaiThreadId;
if (!threadId) {
  const thread = await openai.beta.threads.create();
  threadId = thread.id;
}

// Send melding
await openai.beta.threads.messages.create(threadId, {
  role: "user",
  content: message,
});

// Start assistant run
const run = await openai.beta.threads.runs.create(threadId, {
  assistant_id: env.ASSISTANT_ID,
});

// Poll for completion
let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
  thread_id: threadId
});

while (runStatus.status === "in_progress" || runStatus.status === "queued") {
  await new Promise(resolve => setTimeout(resolve, 1000));
  runStatus = await openai.beta.threads.runs.retrieve(run.id, {
    thread_id: threadId
  });
}

// Hent svar
const messages = await openai.beta.threads.messages.list(threadId);
const assistantMessage = messages.data.find(msg =>
  msg.role === "assistant" && msg.run_id === run.id
);
```

### Generer anamnese:
```typescript
const response = await openai.chat.completions.create({
  model: env.ANAMNESIS_MODEL,
  messages: [
    {
      role: "system",
      content: "Generer strukturert anamnese basert på samtalen"
    },
    {
      role: "user",
      content: conversationHistory
    }
  ],
  response_format: { type: "json_object" }
});
```

---

## 🗄️ Database-struktur

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
