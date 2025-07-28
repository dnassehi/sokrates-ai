AGENTS.md

🧠 Sokrates AI – OpenAI Agent-integrasjon

Dette dokumentet forklarer hvordan OpenAI Assistant API er integrert i Sokrates AI-prosjektet. Det gir veiledning for utviklere og AI-agenter som skal forstå, videreutvikle eller jobbe med systemet.

⸻

📌 Formål

OpenAI-agenten brukes for å lede pasienten gjennom en sokratisk samtale og samle inn strukturert medisinsk anamnesedata. Samtalene mellom pasienten og agenten genererer et JSON-objekt som kan vurderes av legen.

⸻

⚙️ Teknisk Oppsett

🔑 API-nøkler

Alle API-nøkler defineres i .env.local (ikke versjonskontrollér sensitive data):

OPENAI_API_KEY="sk-..."
ASSISTANT_ID="asst_..."
JWT_SECRET="..."


⸻

🧠 Brukt API: OpenAI Assistants API
	•	Modell: GPT-4o
	•	Assistant ID: Definert i .env.local
        •       Arbeidsflyt: openai.beta.threads.* API
                1. threads.create() – opprett ny tråd
                2. threads.messages.create() – send brukermelding
                3. threads.runs.create() – start run med assistant
                4. threads.runs.retrieve() – poll fremdrift
                5. threads.messages.list() – hent svar
	•	Svarformat:

response_format = {
  "type": "json",
  "schema": { ... }
}


⸻

🧾 JSON-schema (Anamnese-svar)

OpenAI-agenten genererer strukturert JSON:

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

Schemaet sendes inn som del av response_format.schema for å validere strukturen.

⸻

📂 Relevant Filstruktur

Fil	Formål
src/server/api/routers/chat.ts	Kaller OpenAI Assistant API med streaming-respons.
src/components/ChatWindow.tsx	UI-komponent for chat og brukerinput.
src/lib/firebase.ts	Firebase-klient initialisering.
src/pages/chat.tsx	Starter ny sesjon med anonym innlogging.
src/server/api/routers/session.ts	Håndterer sesjonshåndtering og databaseintegrasjon.
src/server/api/routers/rating.ts	Lagrer pasientens tilbakemeldinger.


⸻

🔐 Autentisering
	•	Pasienter logger inn anonymt via JWT.
	•	Hver forespørsel til API inkluderer JWT Bearer-token.
	•	Token valideres på alle beskyttede endepunkter.

⸻

🔁 Prompt-logikk

const systemPrompt = isEdit
  ? { role: 'system', content: 'Oppdater JSON basert på brukerens redigering.' }
  : { role: 'system', content: 'Still sokratiske spørsmål for å fylle ut JSON-schemaet.' };

Promptene styrer samtaletonen med pasienten.

⸻

🧪 Testing
	•	Simuler API-kall med forhåndsdefinerte meldinger til /api/chat.
	•	Verifiser at resultatet matcher forventet JSON-struktur.
	•	Bruk Postman eller curl med JWT-token i header for testing.

⸻

💡 Videre arbeid
	•	Flere språkstøtter i systemprompt.
	•	Frontend-validering av output.
	•	Finjustering av prompt for medisinsk nøyaktighet.
	•	Logging av prompts/respons (GDPR-kompatibelt).

⸻


🧩 Eksempel på API-kall

const thread = await openai.beta.threads.create();

await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: brukerMelding,
});

const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: process.env.ASSISTANT_ID!,
});

const result = await openai.beta.threads.runs.retrieve(thread.id, run.id);
const messages = await openai.beta.threads.messages.list(thread.id);


⸻

👤 Ansvarlig utvikler
	•	Hovedkontakt: @damoun.nassehi
	•	OpenAI-agent konfigurert og finjustert i mai/juni 2025
