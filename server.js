import { createRequire } from 'module';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';

// require express module
const require = createRequire(import.meta.url);
const express = require('express');
const app = express();

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
`)

// if --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

// start an app server
const port = args.port||process.env.PORT||3000;
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port));
});

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