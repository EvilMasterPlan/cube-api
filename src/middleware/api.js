const uuid = require('uuid');
const sandboxDB = require('./db.js');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

module.exports.getTestData = (req, res, next) => {
	req.result = {
		status: 'authentication working 123'
	};
	next();
};

module.exports.return = (req, res, next) => {
	if (req.result != null) {
		res.json(req.result);
	} else {
		res.json({
			status: 'ok'
		});
	}
};