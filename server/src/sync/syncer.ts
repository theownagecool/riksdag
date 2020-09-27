import { Database } from '@server/db';
import { HttpClient } from '@server/http';

export type SyncAction<T> = {
    (db: Database<any>, http: HttpClient): Promise<T>;
};

type ResultsOf<T extends Array<SyncAction<any>>> = {
    [K in keyof T]: T[K] extends SyncAction<infer R> ? R : never;
};

export class Syncer<T extends Array<SyncAction<any>>> {
    protected db: Database<any>;
    protected http: HttpClient;
    protected actions: T;

    constructor(db: Database<any>, http: HttpClient, actions: T) {
        this.db = db;
        this.http = http;
        this.actions = actions;
    }

    public async execute(): Promise<ResultsOf<T>> {
        const out: Array<any> = [];
        const promises: Array<PromiseLike<any>> = [];

        for (let i = 0; i < this.actions.length; ++i) {
            const action = this.actions[i];
            const promise = action(this.db, this.http);
            promises.push(promise);
            promise.then((res) => {
                out[i] = res;
            });
        }

        return Promise.all(promises).then(() => out as ResultsOf<T>);
    }
}
