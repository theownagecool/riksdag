import fs = require('fs')
import path = require('path')
import { Server } from './server'
import { Gender, RemotePersonResponse, Routes } from '@common/types'
import { NodeJSHttpClient } from './http'
import { SQLite3Database } from './sqlite'

const db = new SQLite3Database(':memory:')
db.execute('PRAGMA foreign_keys = ON')
const schema = fs.readFileSync(
    path.resolve(__dirname, '../../schema.sql'), 'utf8'
)
db.transaction(() => {
    const tables = schema.split(';')

    function next(index: number) {
        const table = tables?.[index].trim()
        if (!table) {
            return
        }
        db.execute(table).then(res => {
            next(index + 1)
        })
    }

    next(0)
})

const httpClient = new NodeJSHttpClient()

console.log('Syncing...')

httpClient.send({
    method: 'GET',
    url: 'https://data.riksdagen.se/personlista/?utformat=json'
}).then(res => {
    const parsed: RemotePersonResponse = JSON.parse(res.body)
    const sql = `
INSERT INTO person (given_name, family_name, year_of_birth, gender, party, status, source_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
`
    const stmt = db.prepare(sql, SQLite3Database.TRANSFORM_EXECUTE)

    for (const person of parsed.personlista.person) {
        stmt.execute([
            person.tilltalsnamn,
            person.efternamn,
            person.fodd_ar,
            person.kon === 'man' ? Gender.Male : Gender.Female,
            person.parti,
            person.status,
            person.sourceid,
        ])
    }

    console.log('OK')
})

const server = (new Server<Routes>('8080'))
    .route('GET', '/person', request => {
        return db.select('SELECT * FROM person')
    })

server.listen()
