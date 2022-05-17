const credentials = { 
    "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
    "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
    "region": "us-east-1"
}

console.log(credentials);

var AWS = require('aws-sdk');
AWS.config.update(credentials);
const SES = new AWS.SES({apiVersion: '2010-12-01'});

module.exports.sendEmail = async (to, from, fromName, subject, message, html) => {
	let body = {
		Text: {
			Charset: "UTF-8",
			Data: message
		}
	};

	if (html) {
		body.Html = {
			Data: html
		};
	}

	const params = {
		Destination: {
			ToAddresses: [to]
		},
		Message: {
			Body: body,
			Subject: {
				Charset: "UTF-8",
				Data: subject
			}
		},
		ReturnPath: 'errors@prioritycube.com',
		Source: `"${fromName}" <${from}>`
	};

	return SES.sendEmail(params).promise();
};