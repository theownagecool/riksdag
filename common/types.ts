export type Map<T> = { [key: string]: T }
export type StringLike = {
    toString: () => string
}

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
    family_name: string
    gender: Gender
    given_name: string
    party: string
    person_id?: number
    source_id: string
    status: string
    year_of_birth: number
}

export type Poll = {
    date: string
    poll_id?: number
    title: string
    votes: ReadonlyArray<Vote>
}

export enum VoteAnswer {
    No = 0,
    Yes = 1,
    Abstain = 2,
    Absent = 3,
}

export type Vote = {
    answer: VoteAnswer
    person_id: number
}

export type RemotePersonResponse = {
    personlista: {
        person: ReadonlyArray<{
            efternamn: string
            fodd_ar: string
            intressent_id: string
            kon: string
            parti: string
            sourceid: string
            status: string
            tilltalsnamn: string
        }>
    }
}

export type Routes =
    | RouteLike<'GET', '/person', unknown, ReadonlyArray<Person>>
    | RouteLike<'GET', '/poll', unknown, ReadonlyArray<Poll>>
