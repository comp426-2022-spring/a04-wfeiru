import { createRequire } from 'module';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';
import { logdb } from './database.js';

const require = createRequire(import.meta.url);
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

// require minimist module
const args = require('minimist')(process.argv.slice(2));

// see what is stored in the object produced by minimist
// console.log(args)

// store help text 
const help = (`
    server.js [options]

    --port	Set the port number for the server to listen on. Must be an integer
                between 1 and 65535.

    --debug	If set to true, creates endlpoints /app/log/access/ which returns
                a JSON access log from the database and /app/error which throws 
                an error with the message "Error test successful." Defaults to 
                false.

    --log		If set to false, no log files are written. Defaults to true.
                Logs are always written to database.

    --help	Return this message and exit.
`);

// if --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// start an app server
const app = express();
const port = args.port||process.env.PORT||5555;
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port));
});

// create an access log file
if (!args.log) {
    // use morgan for logging to files
    // create a write stream to append (flags: 'a') to a file
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    // set up the access logging middleware
    app.use(morgan('combined', { stream: accessLog }))
}

// available only if --debug=true
if (args.debug == 'true') {
    // endpoint /app/log/access
    app.get('/app/log/access', (req, res) => {
        const stmt = logdb.prepare('SELECT * FROM accesslog').all()
        res.json(stmt)
    });

    // endpoint /app/log/error
    app.get('/app/log/error', (req, res) => {
        throw new Error('Error test successful.')
    });
}

// middleware to insert a new record in database
app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = logdb.prepare('INSERT INTO accesslog ' +
        '(remote_addr, remote_user, time, method, url, protocol, http_version, status, referrer, user_agent) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, 
        logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent);
    next();
})

// endpoint /app/flip/
app.get('/app/flip/', (req, res) => {
    const flip = {"flip": coinFlip()};
    res.json(flip);
});

// endpoint /app/flips/:number
app.get('/app/flips/:number', (req, res) => {
    let flips = coinFlips(req.params.number);
    let count = countFlips(flips);
    res.json({"raw": flips, "summary": count});
});

// endpoint /app/flip/call/heads
app.get('/app/flip/call/heads', (req, res) => {
    const record = flipACoin('heads');
    res.json(record);
});

// endpoint /app/flip/call/tails
app.get('/app/flip/call/tails', (req, res) => {
    const record = flipACoin('tails');
    res.json(record);
});

// check endpoint
app.get('/app/', (req, res) => {
    res.statusCode = 200;
    res.statusMessage = 'OK';
    res.writeHead(res.statusCode, { 'Content-Type' : 'text/plain' });
    res.end(res.statusCode+ ' ' +res.statusMessage);
});

// default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND');
});