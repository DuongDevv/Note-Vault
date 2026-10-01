import dotenv from "dotenv";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json";
import { config } from "../config/env";

dotenv.config();

const connectionString =
  process.env["DATABASE_URL"] ||
  process.env["DB_URL"] ||
  config.DB.URL ||
  `postgresql://${config.DB.USER}:${config.DB.PASSWORD}@${config.DB.HOST}:${config.DB.PORT}/${config.DB.NAME}`;

export const db = postgres<Contract>({
  contractJson,
  url: connectionString,
});
