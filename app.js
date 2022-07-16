const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const apiRouter = require('./src/route/api');
const baseRouter = express.Router();

const app = express();

app.use(express.json({
	verify: (req, res, buf) => { req.rawBody = buf }
}));
app.use(cookieParser());
app.use(cors({
	credentials: true
}));

app.get('/healthcheck', (req, res, next) => {
	res.json({status: 'ok'});
});

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	err.url = req.url;
	let message = err.message || 'error';
	res.json({error:message});
	next();
});

const port = 2020;
app.set('port', port);

http.createServer(app).listen(port, () => {
	console.log(`Cube API listening on port ${port}`);
});

module.exports = app;
