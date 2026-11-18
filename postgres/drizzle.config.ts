import { defineConfig } from "drizzle-kit";

function databaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DB ?? "atempo";

  if (user && password) {
    return `postgres://${user}:${password}@${host}:${port}/${database}`;
  }

  return `postgres://${host}:${port}/${database}`;
}

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl(),
  },
});
