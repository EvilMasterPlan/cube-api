module.exports.body = (fields) => {

	let fieldDefinitions = [];
	if (typeof fields === 'string') {
		fieldDefinitions.push({name: fields});
	} else if (Object.prototype.toString.call(fields) === '[object Object]') {
		if ('name' in fields) {
			fieldDefinitions.push(fields);
		}
	} else if (fields instanceof Array) {
		fields.forEach(fieldDef => {
			if (typeof fieldDef === 'string') {
				fieldDefinitions.push({name: fieldDef});
			} else if (Object.prototype.toString.call(fieldDef) === '[object Object]') {
				if ('name' in fieldDef) {
					fieldDefinitions.push(fieldDef);
				}
			}
		});
	}

	const validator = (req, res, next) => {
		let error;

		if (fieldDefinitions != null && fieldDefinitions.length > 0) {
			let missingFields = [];
			let badFields = new Set();

			fieldDefinitions.forEach(definition => {
				const name = definition.name;
				const required = (definition.optional == null || definition.optional === false) ? true : false;

				if (!Object.keys(req.body).includes(name)) {

					if (required) {
						missingFields.push(definition.name);
					}

				} else if (req.body[name] != null) {

					const value = req.body[name];

					if ('length' in definition && value.length !== definition.length) {
						badFields.add(name);
					}

					if ('maxLength' in definition && value.length > definition.maxLength) {
						badFields.add(name);
					}

					if ('minLength' in definition && value.length < definition.minLength) {
						badFields.add(name);
					}

					if ('maxValue' in definition && value > definition.maxValue) {
						badFields.add(name);
					}

					if ('minValue' in definition && value < definition.minValue) {
						badFields.add(name);
					}

					if ('among' in definition && !definition.among.includes(value)) {
						badFields.add(name);
					}
				}
			});

			if (missingFields.length > 0) {
				error = new Error(`Missing body fields: ${missingFields.join(', ')}`);
				error.status = 400;
			} else if (badFields.size > 0) {
				error = new Error(`Invalid body fields: ${Array.from(badFields).join(', ')}`);
				error.status = 400;
			}
		}

		next(error);
	};

	return validator;
};

module.exports.localOnly = (req, res, next) => {
	let error;

	let local = process.env.NODE_ENV === 'development';
	if (!local) {
		error = new Error(`This endpoint is not available on this host`);
		error.status = 401;
	}

	return next(error);
}