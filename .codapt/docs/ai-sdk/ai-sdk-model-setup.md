To use many AI SDK functions you need to configure a model. You can import model providers from `@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.

For example:

```
import { openai } from '@ai-sdk/openai';

// ...

const model = openai('gpt-4o'); // we pass the model name into the function

// ...
```

You don't need to pass any API key because it will be automatically pulled from an environment variable. For example, an openai model will automatically grab the OPENAI_API_KEY env var.

If you don't know what model to use, start with gpt-4o from openai.

Here are some examples of models:

```
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";

// OpenAI models
const gpt4o = openai("gpt-4o");
const gpt41 = openai("gpt-4.1");
const o3Mini = openai("o3-mini");
const o3 = openai("o3");

// Anthropic models
const claudeSonnetLatest = anthropic("claude-3-7-sonnet-latest");
const claudeHaikuLatest = anthropic("claude-3-5-haiku-latest");

// Google models
const gemini25Pro = google("gemini-2.5-pro-preview-05-06");
const gemini25Flash = google("gemini-2.5-flash-preview-04-17");

// Deepseek models
const deepseekReasoner = deepseek("deepseek-reasoner");
const deepseekChat = deepseek("deepseek-chat");
```
