import Fastify from "fastify";
import { z } from "zod";

const host = process.env.WORKER_HOST ?? "0.0.0.0";
const port = z.coerce.number().default(4100).parse(process.env.WORKER_PORT ?? "4100");

const app = Fastify({
  logger: true,
});

app.get("/health", async () => ({
  service: "tokenfc-worker",
  ok: true,
}));

app.get("/v1/ping", async () => ({
  now: new Date().toISOString(),
  service: "tokenfc-worker",
  status: "ready-for-bootstrap",
}));

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
