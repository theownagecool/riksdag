import { HttpRequest } from '@server/http';
import { SyncAction } from '@server/sync/syncer';
import { XMLCallbackReader } from '@server/xml';
import { Vote, VoteAnswer } from '@common/types';
import { PollModel } from '@server/model';

function createPollIdsRequest(year: number): HttpRequest {
    // 2019 -> "2019/20"
    const yearAsString = `${year}/` + (year + 1).toString().substr(2);
    return {
        method: 'GET',
        query: {
            gruppering: 'votering_id',
            rm: yearAsString,
            sz: 5,
            utformat: 'iddump',
        },
        url: 'https://data.riksdagen.se/voteringlista/',
    };
}

function createPollRequest(id: string): HttpRequest {
    return {
        method: 'GET',
        url: `https://data.riksdagen.se/votering/${id}/xml`,
    };
}

type ParseContext = {
    date: string;
    title: string;
    votes: Array<Vote>;
};

export const SyncPolls: SyncAction<unknown> = async (db, http) => {
    const idResponse = await http.send(createPollIdsRequest(2019));

    const ids = idResponse.body.split(',');
    const parser = new XMLCallbackReader<ParseContext>({
        dokument: (node, ctx) => {
            ctx.title = node.children.find((child) => child.name === 'titel')?.value ?? '';
            ctx.date = node.children.find((child) => child.name === 'datum')?.value ?? '';
        },
        votering: (node, ctx) => {
            const personId = node.children.find((child) => child.name === 'intressent_id')?.value ?? '0';
            ctx.votes.push({
                answer: VoteAnswer.No,
                person_id: parseInt(personId),
            });
        },
    });

    for (const id of ids) {
        const pollResponse = await http.send(createPollRequest(id));
        const result = parser.parse(pollResponse.body, {
            date: '',
            title: '',
            votes: [],
        });
        const poll = new PollModel({
            date: result?.date,
            title: result?.title,
            source_id: id,
        });

        await poll.save();

        console.log(poll);
    }
};
