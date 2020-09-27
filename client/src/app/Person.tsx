import { Person } from '@common/types';
import * as React from 'react';

type PersonProps = {
    person: Person;
};

export function PersonComponent(props: PersonProps) {
    const person = props.person;

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div>{person.given_name}</div>
            <div>{person.year_of_birth}</div>
            <div>{person.party}</div>
            <div>{person.gender}</div>
        </div>
    );
}
