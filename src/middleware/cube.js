const db = require('./db.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

const trifurcate = (oldIDs, newIDs) => {
	return {
		added: newIDs.filter(id => !oldIDs.includes(id)),
		removed: oldIDs.filter(id => !newIDs.includes(id)),
		updated: newIDs.filter(id => oldIDs.includes(id))
	}
};

module.exports.createCube = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const metricNames = req.body.metricNames;
	const cubeID = utility.generateItemID('CUB');

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
		Title: '',
		CubeID: cubeID,
		MetricOrder: metrics.map(metric => {
			return metric.MetricID;
		})
	}];

	await db.createCubes(userID, newCube);
	if (metrics.length > 0) {
		await db.setMetrics(metrics);
	}

	req.result = {
		UserID: userID,
		CubeID: cubeID
	};

	next(err);
})

module.exports.editCubeTitle = asyncHandler(async(req, res, next) => {
	let err;

	// (['cubeID', 'newTitle']),
	const cubeID = req.body.cubeID;
	const newTitle = req.body.newTitle;

	await db.editCubeTitle(cubeID, newTitle);

	next(err);
})

module.exports.deleteCube = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubeIDs = req.body.cubeIDs;

	await db.deleteCubeMetrics(userID, cubeIDs);
	await db.deleteCubes(userID, cubeIDs);

	next(err);
})

module.exports.getMe = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const data = await db.getUserData(userID);
	const purchases = await db.getUserPurchases(userID);
	const cubeData = await db.getMyCubes(userID);

	req.result = {
		User: {
			...req.user,
			Data: data,
			Purchases: purchases
		},
		Cubes: cubeData.Cubes,
		Metrics: cubeData.Metrics,
		Items: cubeData.Items
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

	if (cubeNames.length > 0) {
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
		await db.setMetrics(metrics);
	}

	await db.setUserData(userID, "setup", "true");

	next(err);
});

module.exports.getFullCube = asyncHandler(async(req, res, next) => {
	let err;

	const cube = await db.getFullCube(cubeID);

	next(err);
});

// ============================================================
// YEET CUBE
// ============================================================

module.exports.persistCube = asyncHandler(async(req, res, next) => {
	let err;

	const userID = req.user.UserID;
	const cubeID = req.body.cube.CubeID;

	let aliases = {
		Cubes: {},
		Metrics: {},
		Items: {}
	};

	const newCube = req.body.cube || {};
	const newItems = req.body.items || [];
	const newMetrics = req.body.metrics || [];
	const newCubeID = newCube.CubeID;
	
	const oldCubeData = await db.getFullCube(newCubeID);

	const oldCube = oldCubeData.Cube;
	const oldItems = oldCubeData.Items;
	const oldMetrics = oldCubeData.Metrics;

	// ============================================================
	// UPDATE METRICS
	// ============================================================

	const oldMetricIDs = oldCube.MetricOrder.filter(metricID => metricID in oldMetrics);
	const newMetricIDs = newCube.MetricOrder.filter(metricID => metricID in newMetrics);
	newCube.MetricOrder = newMetricIDs;

	let metricSet = trifurcate(oldMetricIDs, newMetricIDs);
	const metricIDsToAdd = metricSet.added;
	const metricIDsToRemove = metricSet.removed;
	const metricIDsToCheck = metricSet.updated;

	const metricsToAdd = metricIDsToAdd.map(metricID => newMetrics[metricID]).filter(e => e);

	let metricsToUpdate = metricIDsToCheck.map(metricID => newMetrics[metricID]).filter(newMetric => {
		const metricID = newMetric.MetricID;
		const oldMetric = oldMetrics[metricID];
		return newMetric.Label !== oldMetric.Label;
	});

	if (metricsToAdd.length > 0) {
		await db.updateMetrics(userID, metricsToAdd);
	}

	if (metricIDsToRemove.length > 0) {
		await db.deleteMetrics(metricIDsToRemove);
	}

	if (metricsToUpdate.length > 0) {
		await db.updateMetrics(userID, metricsToUpdate);
	}

	// ============================================================
	// UPDATE ITEMS
	// ============================================================

	const oldItemIDs = oldCube.ItemOrder.filter(itemID => itemID in oldItems);
	const newItemIDs = newCube.ItemOrder.filter(itemID => itemID in newItems);
	newCube.ItemOrder = newItemIDs;

	const itemSet = trifurcate(oldItemIDs, newItemIDs);
	const itemIDsToAdd = itemSet.added;
	const itemIDsToRemove = itemSet.removed;
	const itemIDsToCheck = itemSet.updated;

	const itemsToAdd = itemIDsToAdd.map(itemID => newItems[itemID]).filter(e => e);

	let itemsToUpdate = itemIDsToCheck.map(itemID => newItems[itemID]).filter(newItem => {
		const itemID = newItem.ItemID;
		const oldItem = oldItems[itemID];

		return newItem.Status !== oldItem.Status || newItem.Text !== oldItem.Text || JSON.stringify(oldItem.Metrics) !== JSON.stringify(newItem.Metrics);
	});

	if (itemsToAdd.length > 0) {
		await db.updateItems(userID, itemsToAdd);
	}

	if (itemIDsToRemove.length > 0) {
		await db.deleteItems(itemIDsToRemove);
	}

	if (itemsToUpdate.length > 0) {
		await db.updateItems(userID, itemsToUpdate);
	}

	// ============================================================
	// UPDATE CUBE
	// ============================================================

	await db.updateCube(newCube);

	req.result = {
		Cube: newCube,
	};

	next(err);
});