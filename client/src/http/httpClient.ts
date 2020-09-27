import { HttpMethod, Map } from '@common/types';

type HttpRequest<Body = string> = {
    body?: Body;
    method: HttpMethod;
    url: string;
    headers: Map<string | string[]>;
};

class WebHttpClient {
    constructor() {}

    public async send<T>(request: HttpRequest): Promise<object> {
        const headers = new Headers();
        const headerKeys = Object.keys(request.headers);
        for (const headerKey of headerKeys) {
            const sourceHeaderValue = request.headers[headerKey];
            let headerValue: string = '';
            if (Array.isArray(sourceHeaderValue)) {
                headerValue = sourceHeaderValue.join(',');
            } else {
                headerValue = sourceHeaderValue;
            }
            headers.set(headerKey, headerValue);
        }

        const response = await fetch(request.url, {
            method: request.method,
            headers: headers
        });
        return response.json();
    }
}

export { WebHttpClient };
