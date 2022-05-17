let config = require('./base.js');

config.cookie = {
	options: {
		httpOnly: true,
		sameSite: 'Strict',
		maxAge: 5184000000
	},
	readOnlyOptions: {
		sameSite: 'Strict',
		maxAge: 5184000000
	}
};

module.exports = config;