import { SQLite3Database } from '@server/sqlite';
import { HttpRequest } from '@server/http';
import { SyncAction } from '@server/sync/syncer';

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

function findValueOfElement(body: string, name: string): ReadonlyArray<string> {
    const pattern = new RegExp(`<${name}>([^<]+)`, 'g');
    const out: Array<string> = [];
    let match: RegExpMatchArray | null;

    while ((match = pattern.exec(body))) {
        out.push(match[1]);
    }
    return out;
}

export const SyncPolls: SyncAction<unknown> = async (db, http) => {
    const idResponse = await http.send(createPollIdsRequest(2019));
    const stmt = db.prepare(
        `
INSERT INTO poll (date, title, source_id)
          VALUES (?, ?, ?)
    `,
        SQLite3Database.TRANSFORM_EXECUTE
    );

    const ids = idResponse.body.split(',');

    for (const id of ids) {
        const pollResponse = await http.send(createPollRequest(id));
        const title =
            findValueOfElement(pollResponse.body, 'titel')?.[0] || 'N/A';

        await stmt.execute(['2000-01-01 00:00:00', title, id]);
    }
};
