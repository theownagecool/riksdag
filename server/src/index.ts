import sqlite = require('sqlite3')
import fs = require('fs')
import path = require('path')
import { Server } from './server'
import { Routes } from '@common/types'

const db = new sqlite.Database(':memory:')
db.run('PRAGMA foreign_keys = ON')
const schema = fs.readFileSync(
    path.resolve(__dirname, '../../schema.sql'), 'utf8'
)

db.serialize(() => {
    const tables = schema.split(';')

    function next(index: number) {
        const table = tables?.[index]
        if (typeof table === 'undefined') {
            return
        }
        db.run(table, (err) => {
            if (!err) {
                next(index + 1)
            }
        })
    }

    next(0)
})

const server = (new Server<Routes>('8080'))
    .route('GET', '/person', request => {
        return new Promise((resolve) => {
            db.all('SELECT * FROM person', (err, rows) => {
                resolve(rows)
            })
        })
    })

server.listen()
