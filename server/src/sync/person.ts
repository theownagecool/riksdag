import { SyncAction } from './syncer';
import { RemotePersonResponse, Gender } from '@common/types';
import { SQLite3Database } from '@server/sqlite';

export const SyncPersons: SyncAction<unknown> = async (db, http) => {
    const response = await http.send({
        method: 'GET',
        url: 'https://data.riksdagen.se/personlista/?utformat=json',
    });

    const parsed: RemotePersonResponse = JSON.parse(response.body);
    const sql = `
    INSERT INTO person (given_name, family_name, year_of_birth, gender, party, status, source_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = db.prepare(sql, SQLite3Database.TRANSFORM_EXECUTE);

    for (const person of parsed.personlista.person) {
        await stmt.execute([
            person.tilltalsnamn,
            person.efternamn,
            person.fodd_ar,
            person.kon === 'man' ? Gender.Male : Gender.Female,
            person.parti,
            person.status,
            person.sourceid,
        ]);
    }
};
