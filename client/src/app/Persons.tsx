import { PersonOverview } from '@client/app/viz/PersonOverview';
import { Person } from '@client/app/viz/personOverviewChart';
import { personRepository } from '@client/http/personRepository';
import * as React from 'react';
import { useEffect, useState } from 'react';

export function Persons() {
    const [persons, setPersons] = useState<Person[]>([]);

    useEffect(() => {
        const personsPromise = personRepository.getPersons();
        personsPromise.then((persons) => setPersons(persons));
    }, [persons]);

    return (
        <div className="persons">
            <PersonOverview persons={persons} />
        </div>
    );
}
