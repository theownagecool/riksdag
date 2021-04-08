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
        url: `http://data.riksdagen.se/dokumentstatus/${docId}/json`,
    };
}

type DocIdsQueryResponse = {
    document_id: string;
    source_id: string;
};

type DocumentStatusData = {
    dokument: {
        dok_id: string;
        dokumentnamn: string;
        titel: string;
    };
    dokutskottsforslag: {
        utskottsforslag: {
            forslag: string;
        };
    };
    dokuppgift: {
        uppgift: {
            namn: string;
            text: string;
        }[];
    };
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
    const addedVotes = await db.select<DocIdsQueryResponse>('SELECT document_id, source_id from poll');
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
            //Content of doc is stored as garbage html, just parse out the actual text
            const htmlString = node.children.find((child) => child.name === 'html')?.value ?? '';
            const onlyText = parseDocumentHtml(htmlString);
            ctx.text = onlyText;
        },
        dokutskottsforslag: (node, ctx) => {},
    });

    const syncedDocumentIds = await (await db.select<{document_id: string}>('SELECT document_id FROM document')).map(obj => obj.document_id);

    const votesToSync = addedVotes.filter((vote) => syncedDocumentIds.indexOf(vote.document_id) === -1);

    let i = 0;
    for (const { document_id, source_id } of votesToSync) {
        console.log(`SyncDocument: syncing ${i} of ${votesToSync.length}`);
        i++;
        const docRequest = createDocRequest(document_id);
        console.log(`SyncDocument: fetching document ${document_id} for poll ${source_id}`);
        const docResponse = await http.send(docRequest);
        console.log(`SyncDocument: parsing document ${document_id}`);
        let json = undefined;
        try{
            json = JSON.parse(docResponse.body ?? '');
        }catch(e){
            console.log(`Failed to parse document ${document_id}`);
            continue;
        }

        //Nicer way to type this?
        const root = (json.dokumentstatus as any) as DocumentStatusData;

        const title = root.dokument.titel;
        const docType = root.dokument.dokumentnamn;
        //yolo
        const summary =
            root.dokuppgift.uppgift.filter((uppgift) => uppgift.namn === 'Beslut i korthet').shift()?.text ?? '';

        console.log(`SyncDocument: saving document ${document_id} to database`);
        const model = new DocumentModel({
            document_id: document_id,
            title: title,
            decision_summary: summary,
            type: docType,
            poll_id: source_id,
        });

        await model.save();
        console.log(`SyncDocument: saved document ${document_id} to database`);
    }
};
