import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";

interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  stacks?: string[];
  extra?: any;
}

interface ClientLogRequest {
  logs: LogEntry[];
}

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);
  if (!request || request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await request.json()) as ClientLogRequest;

    if (!body.logs || !Array.isArray(body.logs)) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Forward each log to the server console
    body.logs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const location = log.url ? ` (${log.url})` : "";
      const prefix = `[browser] [${timestamp}]`;

      let message = `${prefix} [${log.level}] ${log.message}${location}`;

      // Add stack traces if available
      if (log.stacks && log.stacks.length > 0) {
        message +=
          "\n" +
          log.stacks
            .map((stack) =>
              stack
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n"),
            )
            .join("\n");
      }

      // Add extra data if available
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (log.extra && log.extra.length > 0) {
        message +=
          "\n    Extra data: " +
          JSON.stringify(log.extra, null, 2)
            .split("\n")
            .map((line, i) => (i === 0 ? line : `    ${line}`))
            .join("\n");
      }

      // Log to server console based on level
      switch (log.level) {
        case "error":
          console.error(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "info":
          console.info(message);
          break;
        case "debug":
          console.log(message);
          break;
        default:
          console.log(message);
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing client logs:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
