import http = require('http')
import { Method, RouteHandler, Route, Match, Request } from './route'
import { hasOwnProperty, Map } from '@common/util'

type RouteCollection<T extends Array<Route<any, any>>> = T

export class Server<T extends Array<Route<any, any>>> {
    protected readonly port: string
    protected readonly host: string
    protected readonly routes: RouteCollection<T>

    constructor(port: string, host?: string) {
        this.port = port
        this.host = host || '127.0.0.1'
        this.routes = [] as any
    }

    public route<M extends Method, U extends string>(method: M, url: U, handler: RouteHandler<M, U>): Server<[...T, Route<M, U>]> {
        this.routes.push(new Route(method, url, handler))
        return this as any
    }

    public listen(): void {
        const server = http.createServer((httpRequest, httpResponse) => {
            httpRequest.setEncoding('utf8')


            const method = httpRequest.method ?? 'GET'
            const url = httpRequest.url ?? '/'
            let match: Match | undefined

            for (const route of this.routes) {
                const m = route.matches(method, url)
                if (m) {
                    match = m
                    break
                }
            }

            if (!match) {
                httpResponse.writeHead(404)
                httpResponse.end()
                return
            }

            let body = ''
            httpRequest.on('data', chunk => {
                body += chunk
            })
            httpRequest.on('end', () => {
                const request: Request<any, any> = {
                    body,
                    method,
                    path: httpRequest.url,
                    routeParams: match?.params,
                }
                const response = match!.handler(request)
                let responseStatus = 200
                let responseBody = ''
                let responseHeaders: Map<string> = {}

                if (hasOwnProperty(response, 'body', 'status')) {
                    responseStatus = response.status
                    responseBody = response.body
                } else if (typeof response === 'object') {
                    responseBody = JSON.stringify(response)
                    responseHeaders['Content-Type'] = 'application/json'
                } else {
                    responseBody = String(response)
                }

                httpResponse.writeHead(responseStatus, responseHeaders)
                httpResponse.end(responseBody)
            })
        })

        const HTTP_HOST: string = process.env['HTTP_HOST'] || '127.0.0.1'
        const HTTP_PORT: string = process.env['HTTP_PORT'] || '8080'

        console.debug(`Listening on ${HTTP_HOST}:${HTTP_PORT}`)

        server.listen(parseInt(HTTP_PORT), HTTP_HOST)
    }
}
