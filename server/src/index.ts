import fs = require('fs');
import path = require('path');
import { Server } from './server';
import { Routes } from '@common/types';
import { NodeJSHttpClient } from './http';
import { SQLite3Database } from './db/sqlite';
import { Syncer } from './sync/syncer';
import { SyncPersons } from './sync/persons';
import { ModelBase } from './db/orm';
import { SyncPolls } from '@server/sync/polls';
import { SyncDocuments } from '@server/sync/documents';

const db = new SQLite3Database('db2.sqlite');
db.execute('PRAGMA foreign_keys = ON');
const schema = fs.readFileSync(path.resolve(__dirname, '../../schema.sql'), 'utf8');
db.transaction(async () => {
    const tables = schema
        .split(';')
        .map((table) => table.trim())
        .filter((table) => !!table);

    for (const table of tables) {
        await db.execute(table);
    }
});
ModelBase.resolveDatabase = () => db;
const httpClient = new NodeJSHttpClient();
const syncer = new Syncer(db, httpClient, [SyncPersons, SyncPersons, SyncDocuments]);
syncer.execute();

const server = new Server<Routes>('8080')
    //Don't remember how this route worked
    // .route('GET', '/person/{status}', (request) => {
    //     if (request.routeParams !== undefined) {
    //         const { status } = request.routeParams;
    //         switch (status) {
    //             case 'active':
    //                 return db.select('SELECT * FROM person WHERE status LIKE "Tjänstgörande Riksdagsledamot"');
    //             case 'nonactive':
    //                 return db.select('SELECT * FROM person WHERE status NOT LIKE "Tjänstgörande Riksdagsledamot"');
    //             case 'all':
    //                 return db.select('SELECT * FROM person');
    //         }
    //     } else {
    //         return db.select('SELECT * FROM person');
    //     }
    // })
    .route('GET', '/poll', (request) => {
        return db.select('SELECT * FROM poll');
    })
    .route('GET', '/person/votes/{personId}', (request) => {
        if (request.routeParams !== undefined) {
            const { personId } = request.routeParams;
            return db.select(`SELECT * FROM vote WHERE intressent_id like "${personId}"`);
        } else {
            return [];
        }
    });

server.listen();
