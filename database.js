import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// create database
const database = require('better-sqlite3')

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get()
if (row === undefined) {
    console.log('Log database appears to be empty. Creating log database...')

    const sqlInit = `
        CREATE TABLE accesslog ( 
            remote_addr VARCHAR, 
            remote_user VARCHAR, 
            time VARCHAR, 
            method VARCHAR, 
            url VARCHAR, 
            protocol VARCHAR,
            http_version NUMERIC, 
            status INTEGER, 
            referrer VARCHAR,
            user_agent VARCHAR
        );

    `
    logdb.exec(sqlInit)
} else {
    console.log('Log database exists.')
}

export {logdb}