import { toArray } from '@common/util';
import { Map, RouteLike } from '@common/types';

export type Request<R extends RouteLike<any, any>> = {
    body?: R['requestBody'];
    method: R['method'];
    routeParams?: R['routeParams'];
    path: R['path'];
    query?: Map<string>;
};
export type Response<B> =
    | B
    | { status: number; body: B }
    | PromiseLike<Response<B>>;

export type RouteHandler<R extends RouteLike<any, any>> = {
    (request: Request<R>): Response<R['responseBody']>;
};

type CompiledPath = {
    paramNames: ReadonlyArray<string>;
    pattern: RegExp;
};

function compilePath(path: string): CompiledPath {
    const names: Array<string> = [];
    path = path.replace(/\/+$/, '');

    // create a regexp from the path supplied to this
    // route. parameter placeholders defined as "{name}"
    // are extracted into a list of parameter names and
    // converted into regexp match groups. parameter
    // requirements are supported with the syntax
    // {name:PATTERN}, eg. {name:\\d+}.
    const pattern = path
        .replace(/{([^{}():]+)(?::([^{}()]+))?\}/g, (match, name, req) => {
            names.push(name);
            const requirement = new RegExp(req || '[^\\/]+');
            return `(${requirement.source})`;
        })
        // we cannot allow routes to start with these
        // special regexp characters so let's remove them.
        .replace(/^\^+/, '')
        .replace(/\$+$/, '');

    const regexp = new RegExp(
        // we require exact matches, eg. the route has
        // to start and end exactly as defined.
        '^' + pattern + '$'
    );
    const paramNames = names;

    return { pattern: regexp, paramNames };
}

export type Match<R extends RouteLike<any, any>> = {
    handler: RouteHandler<R>;
    params: R['routeParams'];
};

export class Route<R extends RouteLike<any, any>> {
    private readonly method: R['method'];
    private readonly path: R['path'];
    private readonly handler: RouteHandler<R>;
    private compiled: CompiledPath | undefined;

    constructor(
        method: R['method'],
        path: R['path'],
        handler: RouteHandler<R>
    ) {
        this.method = method;
        this.path = path;
        this.handler = handler;
    }

    public matches(method: string, path: string): Match<R> | undefined {
        method = String(method).toLowerCase();

        if (this.method.toLowerCase() !== method) {
            return undefined;
        }
        if (!this.compiled) {
            this.compiled = compilePath(this.path);
        }

        // remove trailing slashes
        path = path.replace(/\/+$/, '');
        const match = this.compiled.pattern.exec(path);

        if (!match) {
            return undefined;
        }

        // build a parameter object from the matched regex.
        // the first element of the array is the whole match
        // so let's remove that first.
        const params = toArray(match)
            .slice(1)
            .reduce((carry, current, index) => {
                const name = this.compiled!.paramNames[index];
                carry[name] = current;
                return carry;
            }, {} as Map<string>);

        return {
            handler: this.handler,
            params: params,
        };
    }
}
