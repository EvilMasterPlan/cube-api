let config = require('./base.js');

config.cookie = {
	options: {
		httpOnly: true,
		sameSite: 'Strict',
		maxAge: 5184000000,
		secure: true
	},
	readOnlyOptions: {
		sameSite: 'Strict',
		maxAge: 5184000000,
		secure: true
	}
};

module.exports = config;