import sqlite = require('sqlite3');
import { Statement, Database, QueryResult } from './db';

type SQLiteResult<T extends any[]> = {
    result: sqlite.RunResult;
    args: T;
};
type SQLite3Callback<T extends any[]> = {
    (this: sqlite.RunResult, err: Error | null, ...args: T): unknown;
};
type SQLite3StatementFn<T extends any[]> = {
    (this: sqlite.Statement, params: any, callback: SQLite3Callback<T>): void;
};

class SQLite3Statement<T extends any[]> implements Statement<SQLiteResult<T>> {
    protected stmt: sqlite.Statement;
    protected fn: SQLite3StatementFn<T>;

    constructor(stmt: sqlite.Statement, fn: SQLite3StatementFn<T>) {
        this.stmt = stmt;
        this.fn = fn;
    }

    public execute(params: any): Promise<SQLiteResult<T>> {
        return new Promise((resolve, reject) => {
            this.fn.call(this.stmt, params, function (err, ...args) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ result: this, args });
                }
            });
        });
    }

    public close(): Promise<unknown> {
        return new Promise((resolve, reject) => {
            this.stmt.finalize((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export class SQLite3Database implements Database {
    protected db: sqlite.Database;

    constructor(db: sqlite.Database | string) {
        if (typeof db === 'string') {
            db = new sqlite.Database(db);
        }
        this.db = db;
    }

    public async close() {
        return this.db.close();
    }

    public async execute(sql: string, params: ReadonlyArray<any> = []): Promise<QueryResult> {
        const stmt = await this.prepare(sql, sqlite.Statement.prototype.run);
        const result = await stmt.execute(params);
        await stmt.close();

        // lastId will probably only be defined when we insert
        // something. updates should (?) probably not set this.
        return { lastId: result.result.lastID };
    }

    public async select<R>(sql: string, params: ReadonlyArray<any> = []): Promise<ReadonlyArray<R>> {
        const stmt = await this.prepare(sql, sqlite.Statement.prototype.all);
        const result = await stmt.execute(params);
        await stmt.close();

        // args[0] is the first callback argument after "error".
        // the signature of the callback looks something like this:
        //
        //   (err: Error | null, rows: any[]) => unknown
        //
        return result.args[0];
    }

    public async transaction<R>(fn: () => R | Promise<R>): Promise<R> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const result = fn();
                resolve(result);
            });
        });
    }

    protected prepare<T extends any[]>(sql: string, fn: SQLite3StatementFn<T>): Promise<SQLite3Statement<T>> {
        return new Promise((resolve, reject) => {
            this.db.prepare(sql, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(new SQLite3Statement(this, fn));
                }
            });
        });
    }
}
