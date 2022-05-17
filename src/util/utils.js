module.exports.randomString = (length=8, prefix=null) => {
	const randomID = require('crypto').randomBytes(length).toString('hex').substring(0, length).toUpperCase();
	return (prefix) ? `${prefix}_${randomID}` : randomID;
}