import { SyncAction } from './syncer';
import { RemotePersonResponse, Gender, Map } from '@common/types';
import { SQLite3Database } from '@server/sqlite';

const GENDER_MAP: Map<Gender | undefined> = {
    man: Gender.Male,
    kvinna: Gender.Female,
};

export const SyncPersons: SyncAction<unknown> = async (db, http) => {
    const response = await http.send({
        method: 'GET',
        query: {
            utformat: 'json',
        },
        url: 'https://data.riksdagen.se/personlista/',
    });

    const parsed: RemotePersonResponse = JSON.parse(response.body);
    const sql = `
    INSERT INTO person (person_id, given_name, family_name, year_of_birth, gender, party, status, source_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = db.prepare(sql, SQLite3Database.TRANSFORM_EXECUTE);

    for (const person of parsed.personlista.person) {
        await stmt.execute([
            parseInt(person.intressent_id),
            person.tilltalsnamn,
            person.efternamn,
            person.fodd_ar,
            GENDER_MAP[person.kon] ?? Gender.Other,
            person.parti,
            person.status,
            person.sourceid,
        ]);
    }
};
