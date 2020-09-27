import { Person } from '@common/types';
import { WebHttpClient } from '@client/http/httpClient';

class PersonRepository {
    private httpClient = new WebHttpClient();

    async getPersons(): Promise<Person[]> {
        const json = await this.httpClient.send({
            url: 'http://localhost:8080/person',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return json as Person[];
    }
}

const personRepository = new PersonRepository();

export { personRepository };
