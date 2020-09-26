import http = require('http')

const server = http.createServer((request, response) => {
    request.setEncoding('utf8')
    let body = ''
    request.on('data', chunk => {
        body += chunk
    })
    request.on('end', () => {
        response.writeHead(200, 'OK')
        response.end(body)
    })
})

const HTTP_HOST: string = process.env['HTTP_HOST'] || '127.0.0.1'
const HTTP_PORT: string = process.env['HTTP_PORT'] || '8080'

console.debug(`Listening on ${HTTP_HOST}:${HTTP_PORT}`)

server.listen(parseInt(HTTP_PORT), HTTP_HOST)
