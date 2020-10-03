import http = require('http');
import { RouteHandler, Match, Request, Route } from './route';
import { HttpMethod, RouteLike, Map } from '@common/types';
import { hasOwnProperty } from '@common/util';

type FindMethods<T extends RouteLike<any, any>> = T['method'];
type FindRouteByMethod<T extends RouteLike<any, any>, M extends HttpMethod> = T extends { method: M } ? T : never;
type FindRoute<T extends RouteLike<any, any>, M extends HttpMethod, P extends string> = T extends { method: M; path: P }
    ? T
    : never;

function tryParseJson<T extends string, D = undefined>(value: T, def?: D): object | D {
    try {
        return JSON.parse(value);
    } catch (e) {
        return def!;
    }
}

export class Server<T extends RouteLike<any, any>> {
    protected readonly port: string;
    protected readonly host: string;
    protected readonly routes: Array<Route<any>>;

    constructor(port: string, host?: string) {
        this.port = port;
        this.host = host || '127.0.0.1';
        this.routes = [];
    }

    public route<M extends FindMethods<T>, P extends FindRouteByMethod<T, M>['path']>(
        method: M,
        path: P,
        handler: RouteHandler<FindRoute<T, M, P>>
    ): Server<T> {
        this.routes.push(new Route(method, path, handler));
        return this;
    }

    public listen(): void {
        const server = http.createServer((httpRequest, httpResponse) => {
            // "utf8" tells node to give us the request body
            // as a string. otherwise we would receive Buffer-objects.
            httpRequest.setEncoding('utf8');

            // Set CORS headers
            httpResponse.setHeader('Access-Control-Allow-Origin', '*');
            httpResponse.setHeader('Access-Control-Request-Method', '*');
            httpResponse.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
            httpResponse.setHeader('Access-Control-Allow-Headers', '*');

            if (httpRequest.method === 'OPTIONS') {
                httpResponse.writeHead(200);
                httpResponse.end();
                return;
            }

            const method = httpRequest.method ?? 'GET';
            const url = httpRequest.url ?? '/';
            let match: Match<any> | undefined;

            for (const route of this.routes) {
                const m = route.matches(method, url);
                if (m) {
                    match = m;
                    break;
                }
            }

            if (!match) {
                httpResponse.writeHead(404);
                httpResponse.end();
                return;
            }

            let body = '';
            httpRequest.on('data', (chunk) => {
                body += chunk;
            });
            httpRequest.on('end', async () => {
                const request: Request<any> = {
                    body: tryParseJson(body, {}),
                    method,
                    path: httpRequest.url,
                    routeParams: match?.params,
                };

                const response = await Promise.resolve(match!.handler(request));

                let responseStatus = 200;
                let responseBody = '';
                let responseHeaders: Map<string> = {};

                if (hasOwnProperty(response, 'body', 'status')) {
                    responseStatus = response.status;
                    responseBody = response.body;
                } else if (typeof response === 'object') {
                    responseBody = JSON.stringify(response);
                    responseHeaders['Content-Type'] = 'application/json';
                } else {
                    responseBody = String(response);
                }

                httpResponse.writeHead(responseStatus, responseHeaders);
                httpResponse.end(responseBody);
            });
        });

        const HTTP_HOST: string = process.env['HTTP_HOST'] || '127.0.0.1';
        const HTTP_PORT: string = process.env['HTTP_PORT'] || '8080';

        console.debug(`Listening on ${HTTP_HOST}:${HTTP_PORT}`);

        server.listen(parseInt(HTTP_PORT), HTTP_HOST);
    }
}
