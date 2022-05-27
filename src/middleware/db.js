// ==================================================
const mysql = require('mysql');
const sql = require('sql-template-strings');
const prodDBConfig = {
	host: 'core-db.cluster-ro-cpv2dibs7dqy.us-east-1.rds.amazonaws.com',
	database: 'Foundation',
	user: 'core_db_dev',
	password: process.env.DB_PASSWORD,
	timezone: 'Z',
	charset: 'utf8mb4_unicode_ci'
};
const localDBConfig = {
	host: '127.0.0.1',
	database: 'Foundation',
	user: 'root',
	password: 'potato',
	port: '3306',
	timezone: 'Z',
	charset: 'utf8mb4_unicode_ci'
};
const environment = process.env.NODE_ENV;
const environmentConfig = (environment === 'production') ? prodDBConfig : localDBConfig; 
const pool = mysql.createPool(environmentConfig);
const util = require('util');
const utility = require('./utility.js');
pool.query = util.promisify(pool.query);

// ==================================================

// Expects exactly 0 or 1 rows returned
const expectResult = (rows) => {
	let result;

	if (rows.length > 0) {
		result = rows[0];
	}

	return result;
}

const expectResults = (rows) => {
	let results = [];

	if (rows && rows.length > 0) {
		results = rows;
	}

	return results;
}

const indexObjects = (rows, key) => {
	let data = {};
	rows.map(row => {
		data[row[key]] = row;
	});
	return data;
}

// ===========================================================================
// 
// 
// 			~Account Management
// 
// 
// ===========================================================================

module.exports.getUserByEmail = async (email) => {
	const query = sql`SELECT u.* from CUBE_Users u WHERE u.Email = ${email}`;
	const result = await pool.query(query);

	return expectResult(result);
};

module.exports.getAccountToken = async (email, type) => {
	const query = sql`SELECT * FROM CUBE_AccountTokens WHERE Email = ${email} AND Type = ${type}`;
	const result = await pool.query(query);

	return expectResult(result);
};

module.exports.verifyAccount = async (userID) => {
	const query = sql`UPDATE CUBE_Users SET Verified = 1 WHERE UserID = ${userID}`;
	const result = await pool.query(query);

	return expectResult(result);
};

module.exports.clearAccountToken = async (email, type) => {
	const query = sql`DELETE FROM CUBE_AccountTokens WHERE Email = ${email} AND Type = ${type}`;
	const result = await pool.query(query);

	return expectResult(result);
};

module.exports.createAccount = async (userID, email) => {
	const query = sql`INSERT INTO CUBE_Users (UserID, Email) VALUES (${userID}, ${email})`;
	const result = await pool.query(query);

	return result;
};

module.exports.updateAccountAuthentication = async (userID, salt, masterKey) => {
	const query = sql`INSERT INTO CUBE_UserAuthentication (UserID, Signature, Salt) VALUES (${userID}, ${masterKey}, ${salt}) ON DUPLICATE KEY UPDATE Signature=VALUES(Signature), Salt=VALUES(Salt)`;
	const result = await pool.query(query);

	return result;
};

module.exports.updateAccountToken = async (email, token, type) => {
	const query = sql`INSERT INTO CUBE_AccountTokens (Email, Token, Type) VALUES (${email}, ${token}, ${type}) ON DUPLICATE KEY UPDATE Token=VALUES(Token)`;
	const result = await pool.query(query);

	return result;
};

// ===========================================================================
// 
// 
// 			~Cubes
// 
// 
// ===========================================================================

module.exports.getUserCubes = async (userID) => {
	const query = sql`SELECT * FROM CUBE_Cubes WHERE UserID = ${userID}`;
	const results = await pool.query(query);
	const rows = expectResults(results).map(result => {
		return {
			...result,
			ItemOrder: JSON.parse(result.ItemOrder),
			MetricOrder: JSON.parse(result.MetricOrder)
		}
	});

	return indexObjects(rows, 'CubeID');
}

module.exports.getUserData = async (userID) => {
	const query = sql`SELECT * FROM CUBE_UserData WHERE UserID = ${userID}`;
	const results = await pool.query(query);
	const rows = expectResults(results);
	
	return indexObjects(rows, 'Key');
}

module.exports.setUserData = async (userID, key, value) => {
	const query = sql`INSERT INTO CUBE_UserData (UserID, \`Key\`, \`Value\`) VALUES (${userID}, ${key}, ${value})`;
	const result = await pool.query(query);
	return result;
}

module.exports.createCubes = async (userID, cubes) => {
	const query = sql`INSERT INTO CUBE_Cubes (CubeID, UserID, Title, Color, ItemOrder, MetricOrder) VALUES `;
	cubes.forEach((cube, index) => {
		if (index < cubes.length - 1) {
			query.append(sql`(${cube.CubeID}, ${userID}, ${cube.Title}, NULL, '[]', ${JSON.stringify(cube.MetricOrder)}),`);
		} else {
			query.append(sql`(${cube.CubeID}, ${userID}, ${cube.Title}, NULL, '[]', ${JSON.stringify(cube.MetricOrder)});`);
		}
	});
	const result = await pool.query(query);

	return result;
}

module.exports.setMetrics = async (metrics) => {
	const query = sql`INSERT INTO CUBE_Metrics (MetricID, CubeID, Label, Type, Data) VALUES `;
	metrics.forEach((metric, index) => {
		if (index < metrics.length - 1) {
			query.append(sql`(${metric.MetricID}, ${metric.CubeID}, ${metric.Label}, ${metric.Type}, ${JSON.stringify(metric.Data)}),`);
		} else {
			query.append(sql`(${metric.MetricID}, ${metric.CubeID}, ${metric.Label}, ${metric.Type}, ${JSON.stringify(metric.Data)});`);
		}
	});
	const result = await pool.query(query);

	return result;
}

module.exports.getCubeMetrics = async (cubeIDs) => {
	let data = {};

	if (cubeIDs.length > 0) {
		const query = sql`SELECT * FROM CUBE_Metrics WHERE CubeID in (${cubeIDs})`;
		const entries = await pool.query(query);

		entries.map(entry => {
			data[entry.MetricID] = entry;
		});
	}

	return data;
}

// ===========================================================================
// 
// 
// 			~Authentication
// 
// 
// ===========================================================================

module.exports.getAuthenticationInfo = async (email) => {
	const query = sql`SELECT authn.* FROM CUBE_Users users LEFT JOIN CUBE_UserAuthentication authn ON users.UserID = authn.UserID WHERE users.Email = ${email}`;
	const result = await pool.query(query);
	
	return expectResult(result);
};

module.exports.getSession = async (sessionID) => {
	const query = sql`SELECT sessions.* FROM CUBE_UserSessions sessions WHERE sessions.SessionID = ${sessionID}`;
	const result = await pool.query(query);

	return expectResult(result);
};

module.exports.getUserByID = async (userID) => {
	const query = sql`SELECT users.* FROM CUBE_Users users WHERE users.UserID = ${userID}`;
	const result = await pool.query(query);
	return expectResult(result);
};

module.exports.createSession = async (userID, sessionID, expiration) => {
	const query = sql`INSERT INTO CUBE_UserSessions (SessionID, UserID, Expiration) VALUES (${sessionID}, ${userID}, ${expiration})`;
	const result = await pool.query(query);

	return result;
};

module.exports.destroySession = async (sessionID) => {
	const query = sql`DELETE FROM CUBE_UserSessions WHERE SessionID = ${sessionID}`;
	const result = await pool.query(query);

	return result;
};

// ===========================================================================
// 
// 
// 			~Marketing
// 
// 
// ===========================================================================

module.exports.subscribeEmail = async (email) => {
	const query = sql`INSERT INTO MarketingSignups (Email) VALUES (${email}) ON DUPLICATE KEY UPDATE Email=VALUES(Email)`;
	const result = await pool.query(query);

	return result;
}

module.exports.markEmailAsSent = async(outboxID, group, email, type) => {
	const query = sql`INSERT INTO CORE_Outbox (OutboxID, \`Group\`, Email, Type) VALUES (${outboxID}, ${group}, ${email}, ${type})`;
	const result = await pool.query(query);

	return result;
}

// ===========================================================================
// 
// 				~ANALYTICS
// 
// ===========================================================================

module.exports.logPageView = async(hitID, site, page, ip, user, browser, device, os) => {
	const query = sql`INSERT INTO PageViews (HitID, Site, Page, IP, UserID, Browser, Device, OS) VALUES (${hitID}, ${site}, ${page}, ${ip}, ${user}, ${browser}, ${device}, ${os})`;
	const result = await pool.query(query);

	return result;
}
