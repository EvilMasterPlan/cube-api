const db = require('./db.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

module.exports.createCube = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const metricNames = req.body.metricNames;
	const cubeID = utility.generateItemID('CUB');

	//console.log("User ID: ", userID, " Metric Names: ", metricNames)

	const metrics = metricNames.map(metricName => {
		return {
			MetricID: utility.generateItemID('MET'),
			Label: metricName,
			Type: "Range",
			Data: {
				Inc: 1,
				Max: 9,
				Min: 1
			},
			CubeID: cubeID
		}
	});

	const newCube = [{
		Title: 'untitled',
		CubeID: cubeID,
		MetricOrder: metrics.map(metric => {
			return metric.MetricID;
		})
	}];

	await db.createCubes(userID, newCube);
	if (metrics.length > 0) {
		await db.setMetrics(metrics);
	}

	next(err);
})

module.exports.deleteCube = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubeIDs = req.body.cubeIDs;

	await db.deleteCubes(userID, cubeIDs);

	next(err);
})

module.exports.getMe = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubes = await db.getUserCubes(userID);
	const cubeIDs = Object.keys(cubes);
	const data = await db.getUserData(userID);
	const metrics = await db.getCubeMetrics(cubeIDs);

	req.result = {
		User: {
			...req.user,
			Data: data
		},
		Cubes: cubes,
		Metrics: metrics
	};

	next(err);
});

module.exports.checkSetup = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const data = await db.getUserData(userID);

	if (data.setup && data.setup.length > 0) {
		err = new Error(`You're already set up!`);
		err.status = 409;
		return next(err);
	}

	next(err);
});

module.exports.setUp = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubeNames = req.body.cubeNames;
	let metrics = [];

	// Generate new cubes from the names
	const cubes = cubeNames.map((cubeName) => {
		let cubeID = utility.generateItemID('CUB');
		let metricID1 = utility.generateItemID('MET');
		let metricID2 = utility.generateItemID('MET');
		let metricIDs = [metricID1, metricID2];

		metrics.push(
			{
				MetricID: metricID1,
				Label: "Urgency",
				Type: "Range",
				Data: {
					Inc: 1,
					Max: 9,
					Min: 1
				},
				CubeID: cubeID
			}
		)

		metrics.push(
			{
				MetricID: metricID2,
				Label: "Importance",
				Type: "Range",
				Data: {
					Inc: 1,
					Max: 9,
					Min: 1
				},
				CubeID: cubeID
			}
		)

		return {
			Title: cubeName,
			CubeID: cubeID,
			MetricOrder: metricIDs
		}
	})
	
	await db.createCubes(userID, cubes);
	await db.setUserData(userID, "setup", "true");
	await db.setMetrics(metrics);

	next(err);
});