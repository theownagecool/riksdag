import { SyncAction } from './syncer';
import { RemotePersonResponse, Gender, Map } from '@common/types';
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
        },
        url: 'https://data.riksdagen.se/personlista/',
    });

    const parsed: RemotePersonResponse = JSON.parse(response.body);

    for (const person of parsed.personlista.person) {
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
};
