export type Map<T> = { [key: string]: T }
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type RouteLike<M extends HttpMethod, Path extends string, RequestBody = unknown, ResponseBody = unknown, Params = unknown> = {
    method: M
    path: Path
    requestBody: RequestBody
    responseBody: ResponseBody
    routeParams: Params
}

export enum Gender {
    Male = 0,
    Female = 1,
    Other = 2,
}

export type Person = {
    id?: number
    family_name: string
    gender: Gender
    given_name: string
    party: string
    source_id: string
    status: string
    year_of_birth: number
}

export type RemotePersonResponse = {
    personlista: {
        person: ReadonlyArray<{
            efternamn: string
            fodd_ar: string
            kon: string
            parti: string
            sourceid: string
            status: string
            tilltalsnamn: string
        }>
    }
}

export type Routes =
    | RouteLike<'GET', '/person/{id}', unknown, Person, { id: number }>
    | RouteLike<'GET', '/person', unknown, ReadonlyArray<Person>>
