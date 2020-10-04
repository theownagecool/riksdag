export type QueryResult = {
    lastId?: number;
    rows?: ReadonlyArray<any>;
};
export type Statement<R> = {
    close: () => Promise<unknown>;
    execute: (params: ReadonlyArray<any>) => Promise<R>;
};
export type ResultTransform<R> = (result: QueryResult) => R;
export type Database = {
    close: () => Promise<unknown>;
    execute: (sql: string, params: ReadonlyArray<any>) => Promise<QueryResult>;
    select: <R>(sql: string, params: ReadonlyArray<any>) => Promise<ReadonlyArray<R>>;
    transaction: <R>(fn: () => R | Promise<R>) => Promise<R>;
};
