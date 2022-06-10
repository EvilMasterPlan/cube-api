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
	const cubeData = await db.getMyCubes(userID);

	req.result = {
		User: {
			...req.user,
			Data: data
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

	const oldItemIDs = oldCube.ItemOrder.filter(itemID => itemID in oldItems);
	const newItemIDs = newCube.ItemOrder.filter(itemID => itemID in newItems);

	const itemSet = trifurcate(oldItemIDs, newItemIDs);
	const itemIDsToAdd = itemSet.added;
	const itemIDsToRemove = itemSet.removed;
	const itemIDsToCheck = itemSet.updated;

	const itemsToAdd = itemIDsToAdd.map(itemID => newItems[itemID]).filter(e => e);

	let itemsToUpdate = itemIDsToCheck.map(itemID => newItems[itemID]).filter(newItem => {
		const itemID = newItem.ItemID;
		const oldItem = oldItems[itemID];
		return newItem.Status !== oldItem.Status || newItem.Text !== oldItem.Text;
	});

	if (itemsToAdd.length > 0) {
		let generatedItemsToAdd = itemsToAdd.map(proposedItem => {
			const generatedItemID = utility.generateItemID('ITM');
			aliases.Items[proposedItem.ItemID] = generatedItemID;

			return {
				...proposedItem,
				ItemID: generatedItemID,
				CubeID: newCubeID
			}
		});

		await db.updateItems(userID, generatedItemsToAdd);
	}

	if (itemIDsToRemove.length > 0) {
		await db.deleteItems(itemIDsToRemove);
	}

	//console.log("Items to update: ", itemsToUpdate);
	if (itemsToUpdate.length > 0) {
		await db.updateItems(userID, itemsToUpdate);
	}

	let updatedCube = {
		...newCube
	};

	if (itemsToAdd.length > 0 || itemIDsToRemove.length > 0 || itemsToUpdate.length > 0) {
		const newItemOrder = newItemIDs.map(itemID => aliases.Items[itemID] || itemID);

		updatedCube = {
			...newCube,
			ItemOrder: newItemOrder
		};
	}

	await db.updateCube(updatedCube);

	req.result = {
		Cube: {...newCube},
		Aliases: aliases
	};

	next(err);
});