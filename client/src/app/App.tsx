import * as React from 'react';
import { personRepository } from '@client/http/personRepository';
import { Person } from '@common/types';
import { PersonComponent } from '@client/app/Person';
import { useEffect, useState } from 'react';

export function App() {
    const [persons, setPersons] = useState<Person[]>([]);

    useEffect(() => {
        const personsPromise = personRepository.getPersons();
        personsPromise.then((persons) => setPersons(persons));
    }, [persons]);

    return (
        <div>
            {persons.map((person) => (
                <PersonComponent person={person}></PersonComponent>
            ))}
        </div>
    );
}
