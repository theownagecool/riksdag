import { Database } from '../db';
import { SQLite3Database } from '../sqlite';
import { createModel, Field, ModelBase } from './orm';

describe('ORM tests', () => {
    let db: Database | undefined;

    const PersonModel = createModel('person', 'id', {
        age: Field.number().default(123),
        name: Field.string(),
    });

    beforeEach(async () => {
        await db?.close();
        db = new SQLite3Database(':memory:');
        await db.execute(
            'CREATE TABLE person (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, age INTEGER NOT NULL)',
            []
        );
        ModelBase.resolveDatabase = () => db;
    });

    it('should insert the model', async () => {
        const p = new PersonModel({
            name: 'Helmut',
        });
        await p.save();
        const stuff = await db!.select('SELECT * FROM person', []);
        expect(stuff.length).toBe(1);
    });

    it('should use default values when not provided', async () => {
        const p = new PersonModel({
            name: 'Helmut',
        });
        expect(p.age).toBe(123);
    });

    it('should assign an ID to the model', async () => {
        const p = new PersonModel({
            name: 'Helmut',
        });
        await p.save();
        expect(p.id).toBe(1);
    });
});
