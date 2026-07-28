import "./envSetup.js";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { getPgPoolConfig } from "./dbConfig";

const { Pool } = pg;

export const pool = new Pool(getPgPoolConfig());
export const db = drizzle({ client: pool, schema });
