import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { config } from "./src/config/env";

const connectionString =
  process.env.DB_URL ??
  `postgresql://${config.DB.USER}:${config.DB.PASSWORD}@${config.DB.HOST}:${config.PORT}/${config.DB.NAME}`;

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: connectionString,
    },
  }),
});
