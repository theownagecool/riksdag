import sqlite = require('sqlite3')

type Statement<R> = {
    execute: (params: ReadonlyArray<any>) => PromiseLike<R>
}
type StatementTransform<S, R> = {
    (stmt: S): PromiseLike<R>
}

type Database<S> = {
    execute: (sql: string, params: ReadonlyArray<any>) => PromiseLike<void>
    prepare: <R>(sql: string, transform: StatementTransform<S, R>) => Statement<R>
    select: <R>(sql: string, params: ReadonlyArray<any>) => PromiseLike<ReadonlyArray<R>>
    transaction: <R>(fn: () => R | PromiseLike<R>) => PromiseLike<R>
}

class SQLite3Statement<R> implements Statement<R> {
    protected stmt: sqlite.Statement
    protected transform: StatementTransform<sqlite.Statement, R>

    constructor(stmt: sqlite.Statement, transform: StatementTransform<sqlite.Statement, R>) {
        this.stmt = stmt
        this.transform = transform
    }

    public execute(params: ReadonlyArray<any>): PromiseLike<R> {
        this.stmt.bind(...params)
        return this.transform(this.stmt)
    }
}

export class SQLite3Database implements Database<sqlite.Statement> {
    protected db: sqlite.Database

    constructor(db: sqlite.Database) {
        this.db = db
    }

    public execute(sql: string, params: ReadonlyArray<any> = []): PromiseLike<void> {
        return this.prepare(sql, SQLite3Database.TRANSFORM_EXECUTE).execute(params)
    }

    public prepare<R>(sql: string, handler: StatementTransform<sqlite.Statement, R>): Statement<R> {
        const stmt = this.db.prepare(sql)
        return new SQLite3Statement(stmt, handler)
    }

    public select<R>(sql: string, params: ReadonlyArray<any> = []): PromiseLike<ReadonlyArray<R>> {
        return this.prepare(sql, SQLite3Database.TRANSFORM_SELECT).execute(params)
    }

    public transaction<R>(fn: () => R | PromiseLike<R>): PromiseLike<R> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const result = fn()
                resolve(result)
            })
        })
    }

    public static TRANSFORM_EXECUTE: StatementTransform<sqlite.Statement, void> = stmt => {
        return new Promise((resolve, reject) => {
            stmt.run(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    public static TRANSFORM_SELECT: StatementTransform<sqlite.Statement, ReadonlyArray<any>> = stmt => {
        return new Promise((resolve, reject) => {
            stmt.all((err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }
}
