import dotenv from "dotenv";

import { defineConfig, env } from "prisma/config";

dotenv.config();

export default defineConfig({
  schema: "src/database/schema.prisma",
  migrations: {
    path: "src/database/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
