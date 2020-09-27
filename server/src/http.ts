import { HttpMethod, Map } from '@common/types';
import { ClientRequestArgs } from 'http';
// import http = require('http')
import https = require('https');

type HttpRequest<Body = string> = {
    body?: Body;
    method: HttpMethod;
    url: string;
};

type HttpResponse<Body = string> = {
    body: Body;
    headers: Map<string | string[] | undefined>;
    status: number;
};

export type HttpClient = {
    send: (request: HttpRequest) => PromiseLike<HttpResponse>;
};

export class NodeJSHttpClient implements HttpClient {
    public async send(request: HttpRequest): Promise<HttpResponse> {
        return new Promise((resolve, reject) => {
            const url = new URL(request.url);
            const options: ClientRequestArgs = {
                host: url.host,
                method: request.method,
                path: url.pathname + url.search,
            };

            const req = https.request(options, (res) => {
                res.setEncoding('utf8');

                const out: HttpResponse = {
                    body: '',
                    headers: res.headers,
                    status: res.statusCode ?? 200,
                };

                res.on('data', (chunk) => {
                    out.body += chunk;
                });

                res.on('end', () => {
                    resolve(out);
                });

                res.on('error', (e) => {
                    reject(e);
                });
            });

            if (request.body) {
                req.write(request.body);
            }

            req.end();
        });
    }
}
