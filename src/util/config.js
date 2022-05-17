let config;

const get = require('lodash/get');

switch (process.env.NODE_ENV) {
	case 'production': {
		config = require('../config/prod.js');
		break;
	}
	case 'development': {
		config = require('../config/dev.js');
		break;
	}
	default: {
		config = require('../config/base.js');
		break;
	}
}

module.exports = {
	get: (path) => {
		return get(config, path, null);
	}
};