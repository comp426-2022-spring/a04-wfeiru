import { createRequire } from 'module';
import { coinFlip, coinFlips, countFlips, flipACoin } from './modules/coin.mjs';

// require Express.js
const require = createRequire(import.meta.url);
const express = require('express');
const app = express();

// start an app server
const args = require('minimist')(process.argv.slice(2));
args['port'];
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