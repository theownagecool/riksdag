import { Server } from './server'

const server = (new Server('8080'))
    .route('GET', '/yee/{id:\\d+}', request => {
        return request.routeParams!
    })
    .route('GET', '/yee', request => {
        return '😎'
    });

server.listen()
