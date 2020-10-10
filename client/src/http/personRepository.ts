import { Person } from '@client/app/viz/personOverviewChart';
import { WebHttpClient } from '@client/http/httpClient';

class PersonRepository {
    private httpClient = new WebHttpClient();
    private cachedPersons: Person[] = [];

    async getPersons(): Promise<Person[]> {
        const json = await this.httpClient.send({
            url: 'http://localhost:8080/person',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const persons = json as Person[];
        if (this.cachedPersons.length !== persons.length) {
            persons.forEach((p) => {
                p.gender = p.gender == '0' ? 'Male' : 'Female';
            });
            this.cachedPersons = persons;
        }
        return this.cachedPersons;
    }
}

const personRepository = new PersonRepository();

export { personRepository };
