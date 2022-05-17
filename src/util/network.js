const bent = require('bent');

class Network {
	constructor(baseURL) {
		this.baseURL = baseURL;
		this.getRequest = bent(baseURL, 'GET', 'json', 200);
		this.postRequest = bent(baseURL, 'POST', 'json', 200);
		this.deleteRequest = bent(baseURL, 'DELETE', 'json', 200);
	}

	async get(path) {
		return this.getRequest(path).then(response => {
			return {
				success: true,
				statusCode: 200,
				responseBody: response
			};
		})
		.catch(e => {
			return {
				success: false,
				statusCode: e.statusCode,
				responseBody: e.responseBody
			};
		});
	}

	async post(path, body) {
		return this.postRequest(path, body).then(response => {
			return {
				success: true,
				statusCode: 200,
				responseBody: response
			};
		})
		.catch(e => {
			return {
				success: false,
				statusCode: e.statusCode,
				responseBody: e.responseBody
			};
		});
	}

	async delete(path) {
		return this.deleteRequest(path).then(response => {
			return {
				success: true,
				statusCode: 200,
				responseBody: response
			};
		})
		.catch(e => {
			return {
				success:false,
				statusCode: e.statusCode,
				responseBody: e.responseBody
			};
		});
	}
};

module.exports = Network;