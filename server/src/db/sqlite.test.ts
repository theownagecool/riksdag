import sqlite = require('sqlite3');
import { Database } from './db';
import { SQLite3Database } from './sqlite';

describe('SQLite tests', () => {
    let backend: sqlite.Database | undefined;
    let db: Database | undefined;

    beforeEach(async () => {
        db?.close();
        backend = new sqlite.Database(':memory:');
        db = new SQLite3Database(backend);
        await db.execute('CREATE TABLE person (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL)', []);
    });

    it('should insert stuff', async () => {
        const result = await db!.execute('INSERT INTO person (name) VALUES (?)', ['Helmut']);
        expect(result.lastId).toBe(1);
    });

    it('should select stuff', async () => {
        await db!.execute('INSERT INTO person (name) VALUES (?)', ['Helmut']);
        const rows = await db!.select<any>('SELECT * FROM person', []);
        expect(rows.length).toBe(1);
        expect(rows[0].name).toBe('Helmut');
    });
});
