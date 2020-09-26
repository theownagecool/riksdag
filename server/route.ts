import { Map, toArray } from '../common/util'

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type Request<M extends Method, P extends string> = {
    body?: string
    method: M
    routeParams?: Map<string>
    path: P
    query?: Map<string>
}
export type Response =
    | string
    | object
    | { status: number, body: string, headers?: Map<string> }
export type RouteHandler<M extends Method, U extends string> = {
    (request: Request<M, U>): Response
}

type CompiledPath = {
    paramNames: ReadonlyArray<string>
    pattern: RegExp
}

function compilePath(path: string): CompiledPath {
    const names: Array<string> = []
    path = path.replace(/\/+$/, '')

    // create a regexp from the path supplied to this
    // route. parameter placeholders defined as "{name}"
    // are extracted into a list of parameter names and
    // converted into regexp match groups. parameter
    // requirements are supported with the syntax
    // {name:PATTERN}, eg. {name:\\d+}.
    const pattern = path
        .replace(/{([^{}():]+)(?::([^{}()]+))?\}/g, (match, name, req) => {
            names.push(name)
            const requirement = new RegExp(req || '[^\\/]+')
            return `(${requirement.source})`
        })
        // we cannot allow routes to start with these
        // special regexp characters so let's remove them.
        .replace(/^\^+/, '')
        .replace(/\$+$/, '')

    const regexp = new RegExp(
        // we require exact matches, eg. the route has
        // to start and end exactly as defined.
        '^' + pattern + '$'
    )
    const paramNames = names

    return { pattern: regexp, paramNames }
}

export type Match = {
    handler: RouteHandler<any, any>
    params: Map<string>
}

export class Route<M extends Method, U extends string> {
    private readonly method: M
    private readonly path: U
    private readonly handler: RouteHandler<M, U>
    private compiled: CompiledPath | undefined

    constructor(method: M, path: U, handler: RouteHandler<M, U>) {
        this.method = method
        this.path = path
        this.handler = handler
    }

    public matches(method: string, path: string): Match | undefined {
        method = String(method).toLowerCase()

        if (this.method.toLowerCase() !== method) {
            return undefined
        }
        if (!this.compiled) {
            this.compiled = compilePath(this.path)
        }

        // remove trailing slashes
        path = path.replace(/\/+$/, '')
        const match = this.compiled.pattern.exec(path)

        if (!match) {
            return undefined
        }

        // build a parameter object from the matched regex.
        // the first element of the array is the whole match
        // so let's remove that first.
        const params = toArray(match)
            .slice(1)
            .reduce((carry, current, index) => {
                const name = this.compiled!.paramNames[index]
                carry[name] = current
                return carry
            }, {} as Map<string>)

        return {
            handler: this.handler,
            params: params,
        }
    }
}
