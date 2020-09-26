export type Map<T> = { [key: string]: T }
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type RouteLike<M extends Method, Path extends string, RequestBody = unknown, ResponseBody = unknown, Params = unknown> = {
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
    given_name: string
    family_name: string
    gender: Gender
    party: string
    status: string
}

export type Routes =
    | RouteLike<'GET', '/person/{id}', unknown, Person, { id: number }>
    | RouteLike<'GET', '/person', unknown, ReadonlyArray<Person>>
