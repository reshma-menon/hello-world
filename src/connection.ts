import * as pg_promise from 'pg-promise';
import { TConnectionParameters } from 'pg-promise/typescript/pg-subset';

const pgp = pg_promise();
pgp.pg.types.setTypeParser(1114, s => s); // Prevent pg date to js date conversion
pgp.pg.types.setTypeParser(1184, s => s); // Prevent pg date to js date conversion
pgp.pg.types.setTypeParser(1082, s => s); // Prevent pg date to js date conversion

pgp.pg.defaults.ssl = process.env.DATABASE_SSL == 'true';

export const db = pgp(<TConnectionParameters>{
    connectionString: process.env.DATABASE_URL,
});

export const pgPromise = pgp;
