const db = require('./db.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

module.exports.getMe = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubes = await db.getUserCubes(userID);
	const data = await db.getUserData(userID);

	req.result = {
		User: {
			...req.user,
			Data: data
		},
		Cubes: cubes
	};

	next(err);
});

module.exports.checkSetup = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const data = await db.getUserData(userID);

	if (data.setup && data.setup.length > 0) {
		err = new Error(`You're already set up!`);
		err.status = 404;
		return next(err);
	}

	next(err);
});

module.exports.setup = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubeNames = req.body.cubeNames;

	// Generate new cubes from the names
	let cubes = [];
	
	await db.createCubes(cubes);

	next(err);
});