import { SyncAction } from './syncer';
import { RemotePersonResponse, Gender, Map, Person } from '@common/types';
import { PersonModel } from '@server/model';

const GENDER_MAP: Map<Gender | undefined> = {
    man: Gender.Male,
    kvinna: Gender.Female,
};

export const SyncPersons: SyncAction<unknown> = async (db, http) => {
    const response = await http.send({
        method: 'GET',
        query: {
            utformat: 'json',
            rdlstatus: 'samtliga',
        },
        url: 'https://data.riksdagen.se/personlista/',
    });

    const parsed: RemotePersonResponse = JSON.parse(response.body);

    const currentPersons = await db.select<Person>('SELECT * from person');
    const intressentIds = currentPersons.reduce((acc, person) => {
        acc[person.intressent_id] = true;
        return acc;
    }, {} as Map<boolean>);

    for (const person of parsed.personlista.person) {
        if (!person.intressent_id) {
            continue;
        }

        //Only add new persons
        if (intressentIds[person.intressent_id]) {
            console.log(`SyncPersons: Person ${person.intressent_id} already added`);
            continue;
        }
        console.log(`SyncPersons: Adding Person ${person.intressent_id}`);

        const p = new PersonModel({
            given_name: person.tilltalsnamn,
            family_name: person.efternamn,
            year_of_birth: parseInt(person.fodd_ar),
            gender: GENDER_MAP[person.kon] ?? Gender.Other,
            party: person.parti,
            status: person.status,
            source_id: person.sourceid,
            intressent_id: person.intressent_id,
        });

        await p.save();
    }

    console.log('SyncPolls: done');
};
