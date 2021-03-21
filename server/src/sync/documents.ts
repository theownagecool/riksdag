import { HttpRequest } from '@server/http';
import { DocumentModel } from '@server/model';
import { SyncAction } from '@server/sync/syncer';
import { XMLCallbackReader } from '@server/xml';
import { JSDOM } from 'jsdom';

function createDocRequest(docId: string): HttpRequest {
    /**
     * dokumentstatus contains the entire documents for some vote
     * don't know if we can get it other formats than xml :(
     */
    return {
        method: 'GET',
        url: `http://data.riksdagen.se/dokumentstatus/${docId}`,
    };
}

type DocIdsQueryResponse = {
    document_id: string;
    source_id: string;
};

function parseDocumentHtml(doc: string): string {
    const dom = new JSDOM(doc);
    const window = dom.window;

    //textContent contains all for node including child nodes
    let text = window.document.body.textContent ?? '';
    text = text.replace(/(\r\n|\n|\r|\t)/gm, '');

    return text;
}

export const SyncDocuments: SyncAction<unknown> = async (db, http) => {
    console.log(`SyncDocuments: fetching polls to sync documents from`);
    //document ids are stored in the data for a single poll
    const addedVotes = await db.select<DocIdsQueryResponse>('SELECT document_id, source_id from poll LIMIT 5');
    console.log(`SyncDocuments: fetched ${addedVotes.length} polls`);

    type ParseContext = {
        document_id: string;
        title: string;
        date: string;
        source: string;
        source_id: string;
        text: string;
    };

    const docParse = new XMLCallbackReader<ParseContext>({
        dokument: (node, ctx) => {
            ctx.document_id = node.children.find((child) => child.name === 'dok_id')?.value ?? '';
            ctx.title = node.children.find((child) => child.name === 'titel')?.value ?? '';
            ctx.source = node.children.find((child) => child.name === 'source')?.value ?? '';
            ctx.source_id = node.children.find((child) => child.name === 'source_id')?.value ?? '';
            //Content of doc is stored as garbage html, just parse out the actual text
            const htmlString = node.children.find((child) => child.name === 'html')?.value ?? '';
            const onlyText = parseDocumentHtml(htmlString);
            ctx.text = onlyText;
        },
    });

    for (const { document_id, source_id } of addedVotes) {
        const docRequest = createDocRequest(document_id);
        console.log(`SyncDocument: fetching document ${document_id} for poll ${source_id}`);
        const docResponse = await http.send(docRequest);
        console.log(`SyncDocument: parsing document ${document_id}`);
        const result = docParse.parse(docResponse.body, {
            document_id: '', //I like duplicating things :^)
            title: '',
            date: '',
            source: '',
            source_id: '',
            text: '',
        });

        console.log(result);

        console.log(`SyncDocument: saving document ${document_id} to database`);
        const model = new DocumentModel({
            document_id: result.document_id,
            title: result.title,
            date: result.date,
            source: result.date,
            source_id: result.source_id,
            text: result.text,
            poll_id: source_id,
        });

        await model.save();
        console.log(`SyncDocument: saved document ${document_id} to database`);
    }
};
