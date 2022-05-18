const db = require('./db.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

module.exports.getMe = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubes = await db.getUserCubes(userID);
	const data = await db.getUserData(userID);

	req.result = {
		user: {
			...req.user,
			data: data
		},
		cubes: cubes
	};

	next(err);
});