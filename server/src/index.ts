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

const db = new SQLite3Database(':memory:');
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
const syncer = new Syncer(db, httpClient, [SyncPersons, SyncPolls]);
syncer.execute();

const server = new Server<Routes>('8080')
    .route('GET', '/person', (request) => {
        return db.select('SELECT * FROM person');
    })
    .route('GET', '/poll', (request) => {
        return db.select('SELECT * FROM poll');
    });

server.listen();
