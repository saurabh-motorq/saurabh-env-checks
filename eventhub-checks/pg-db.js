const pg = require("pg");
require('dotenv').config();
const config = require("./config");
class PgDb {
    constructor() {
        this.pool = new pg.Pool({
            user: config.pgUser,
            host: config.pgHost,
            database: config.pgDatabase,
            password: config.pgPassword,
            port: config.pgPort,
            ssl: config.sslmode,
          });
        this.pool.on('error', err => {
            // tslint:disable-next-line no-console
            console.log(err);
        });
    }
    async query(text, params) {
        return await this.pool.query(text, params);
    }
}
exports.PgDb = PgDb;
//# sourceMappingURL=pg-db.js.map