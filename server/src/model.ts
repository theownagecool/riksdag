import { createModel, Field } from './db/orm';

export const PersonModel = createModel('person', 'person_id', {
    given_name: Field.string(),
    family_name: Field.string(),
    year_of_birth: Field.number(),
    gender: Field.number(),
    party: Field.string(),
    status: Field.string(),
    source_id: Field.string(),
    intressent_id: Field.string(),
});

export const PollModel = createModel('poll', 'poll_id', {
    date: Field.string(),
    title: Field.string(),
    source_id: Field.string(),
    document_id: Field.string(),
});

export const VoteModel = createModel('vote', 'vote_id', {
    intressent_id: Field.string(),
    poll_id: Field.string(),
    answer: Field.number(),
});

export const DocumentModel = createModel('document', 'document_id', {
    document_id: Field.string(),
    poll_id: Field.string(),
    source: Field.string(),
    source_id: Field.string(),
    text: Field.string(),
    title: Field.string(),
    date: Field.string(),
});
