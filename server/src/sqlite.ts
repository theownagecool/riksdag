import sqlite = require('sqlite3');
import { Statement, StatementTransform, Database } from './db';

class SQLite3Statement<R> implements Statement<R> {
    protected stmt: sqlite.Statement;
    protected transform: StatementTransform<sqlite.Statement, R>;

    constructor(stmt: sqlite.Statement, transform: StatementTransform<sqlite.Statement, R>) {
        this.stmt = stmt;
        this.transform = transform;
    }

    public execute(params: ReadonlyArray<any>): PromiseLike<R> {
        this.stmt.bind(...params);
        return this.transform(this.stmt);
    }
}

type StatementCallback = (err: Error | null, result: any) => any;

function createTransform<R>(
    fn: (this: sqlite.Statement, cb: StatementCallback) => unknown
): StatementTransform<sqlite.Statement, R> {
    return (stmt) => {
        return new Promise((resolve, reject) => {
            fn.call(stmt, (err, result: R) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };
}

export class SQLite3Database implements Database<sqlite.Statement> {
    protected db: sqlite.Database;

    constructor(dsn: string) {
        this.db = new sqlite.Database(dsn);
    }

    public async execute(sql: string, params: ReadonlyArray<any> = []): Promise<void> {
        return this.prepare(sql, SQLite3Database.TRANSFORM_EXECUTE).execute(params);
    }

    public prepare<R>(sql: string, handler: StatementTransform<sqlite.Statement, R>): Statement<R> {
        const stmt = this.db.prepare(sql);
        return new SQLite3Statement(stmt, handler);
    }

    public async select<R>(sql: string, params: ReadonlyArray<any> = []): Promise<ReadonlyArray<R>> {
        return this.prepare(sql, SQLite3Database.TRANSFORM_SELECT).execute(params);
    }

    public async transaction<R>(fn: () => R | PromiseLike<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const result = fn();
                resolve(result);
            });
        });
    }

    public static TRANSFORM_EXECUTE = createTransform<void>(sqlite.Statement.prototype.run);
    public static TRANSFORM_SELECT = createTransform<any>(sqlite.Statement.prototype.all);
    public static TRANSFORM_SELECT_ONE = createTransform<any>(sqlite.Statement.prototype.get);
}
