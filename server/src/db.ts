export type Statement<R> = {
    execute: (params: ReadonlyArray<any>) => PromiseLike<R>;
};
export type StatementTransform<S, R> = {
    (stmt: S): PromiseLike<R>;
};
export type Database<S> = {
    execute: (sql: string, params: ReadonlyArray<any>) => PromiseLike<void>;
    prepare: <R>(sql: string, transform: StatementTransform<S, R>) => Statement<R>;
    select: <R>(sql: string, params: ReadonlyArray<any>) => PromiseLike<ReadonlyArray<R>>;
    transaction: <R>(fn: () => R | PromiseLike<R>) => PromiseLike<R>;
};
