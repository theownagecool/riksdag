import { Database } from '@server/db/db';
import { HttpClient } from '@server/http';

export type SyncAction<T> = {
    (db: Database, http: HttpClient): Promise<T>;
};

type ResultsOf<T extends Array<SyncAction<any>>> = {
    [K in keyof T]: T[K] extends SyncAction<infer R> ? R : never;
};

export class Syncer<T extends Array<SyncAction<any>>> {
    protected db: Database;
    protected http: HttpClient;
    protected actions: T;

    constructor(db: Database, http: HttpClient, actions: T) {
        this.db = db;
        this.http = http;
        this.actions = actions;
    }

    public async execute(): Promise<ResultsOf<T>> {
        const out: Array<any> = [];

        for (let i = 0; i < this.actions.length; ++i) {
            const action = this.actions[i];
            const res = await action(this.db, this.http);
            out[i] = res;
        }

        return out as ResultsOf<T>;
    }
}
