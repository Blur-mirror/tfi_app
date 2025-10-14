import pgPromise from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

const pgp = pgPromise(); // this creates a pg-promise instance
const db = pgp(process.env.DATABASE_URL!);

export { db, pgp }; // export both
