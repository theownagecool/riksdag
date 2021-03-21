import { HttpRequest } from '@server/http';
import { SyncAction } from '@server/sync/syncer';
import { XMLCallbackReader } from '@server/xml';
import { Map, Vote, VoteAnswer } from '@common/types';
import { PollModel, VoteModel } from '@server/model';

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
    document_id: string;
};

function parseVote(answer: string) {
    switch (answer) {
        case 'Frånvarande':
            return VoteAnswer.Absent;
        case 'Ja':
            return VoteAnswer.Yes;
        case 'Nej':
            return VoteAnswer.No;
        case 'Avstår':
            return VoteAnswer.Abstain;
        default:
            return null;
    }
}

export const SyncPolls: SyncAction<unknown> = async (db, http) => {
    const idResponse = await http.send(createPollIdsRequest(2019));

    const ids = idResponse.body.split(',');
    const parser = new XMLCallbackReader<ParseContext>({
        dokument: (node, ctx) => {
            //Title of the vote
            ctx.title = node.children.find((child) => child.name === 'titel')?.value ?? '';
            //Date the vote took place
            ctx.date = node.children.find((child) => child.name === 'datum')?.value ?? '';
            //Associate document, actual document stored elsewhere
            ctx.document_id = node.children.find(child => child.name === 'dok_id')?.value ?? '';
        },
        votering: (node, ctx) => {
            //Id of person who votes
            const intressentId = node.children.find((child) => child.name === 'intressent_id')?.value ?? '-1';
            //Valence of vote
            const vote = node.children.find((child) => child.name === 'rost')?.value ?? '-1';

            const parsedVote = parseVote(vote);
            if (parsedVote !== null) {
                ctx.votes.push({
                    answer: parsedVote,
                    intressent_id: intressentId,
                });
            }
        },
    });

    const addedPollVotes = await db.select<{ poll_id: string }>('SELECT distinct poll_id FROM vote');
    const pollIds = addedPollVotes.reduce((acc, obj) => {
        acc[obj.poll_id] = true;
        return acc;
    }, {} as Map<boolean>);

    for (const id of ids) {
        //Only sync new polls
        if (pollIds[id]) {
            console.log(`SyncPolls: Votes for poll ${id} already added`);
            continue;
        }
        console.log(`SyncPolls: Adding votes for poll ${id}`);

        const pollResponse = await http.send(createPollRequest(id));
        const result = parser.parse(pollResponse.body, {
            date: '',
            title: '',
            votes: [],
            document_id: ''
        });

        const poll = new PollModel({
            date: result?.date,
            title: result?.title,
            source_id: id,
            document_id: result?.document_id
        });

        await poll.save();

        for (const vote of result.votes) {
            const voteModel = new VoteModel({
                intressent_id: vote.intressent_id,
                poll_id: id,
                answer: vote.answer,
            });
            await voteModel.save();
        }

        console.log(poll);
    }

    console.log('SyncPolls: done');
};
