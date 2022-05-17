const asyncHandler = require('express-async-handler');

// requires req.user to be set (usually via verifyAuthentication)
module.exports.authenticateUserCodex = asyncHandler(async(req, res, next) => {
	let err;

	const codexID = req.body.codexID;
	const accessibleCodexIDs = req.user.Codexes.map(codex => codex.CodexID);
	if (!accessibleCodexIDs.includes(codexID)) {
		err = new Error(`Your account doesn't have access to that codex`);
		err.status = 403;
	}

	next(err);
});