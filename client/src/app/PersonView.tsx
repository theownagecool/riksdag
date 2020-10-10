import { Gender, Person } from '@common/types';
import * as React from 'react';

type PersonProps = {
    person: Person;
};

export function PersonView(props: PersonProps) {
    const person = props.person;

    const fullName = person.given_name + ' ' + person.family_name;
    return (
        <div className="person">
            <div className="person_header">{fullName}</div>

            <div className="person-info">
                <div className="person-info_row">
                    <div className="person-info_title">Gender</div>
                    <div className="person-info_value">{Gender[person.gender]}</div>
                </div>
                <div className="person-info_row">
                    <div className="person-info_title">Party</div>
                    <div className="person-info_value">{person.party}</div>
                </div>
                <div className="person-info_row">
                    <div className="person-info_title">Status</div>
                    <div className="person-info_value">{person.status}</div>
                </div>
            </div>
        </div>
    );
}
