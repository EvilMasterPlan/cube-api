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

module.exports.getUserAuthorization = async (userID) => {
	const query = sql`SELECT * FROM CUBE_Users users WHERE users.UserID = ${userID}`;
	const results = await pool.query(query);

	let user;

	if (results == null || results.length === 0) {
		return null;
	} else {
		results.forEach(result => {
			if (user == null) {
				user = {
					UserID: result.UserID,
					Email: result.Email,
					Verified: result.Verified,
					CreatedAt: result.CreatedAt,
					Codexes: []
				};
			}
			if (result.CodexID != null) {
				user.Codexes.push({
					CodexID: result.CodexID,
					Role: result.Role,
					LastEditedAt: result.LastEditedAt
				});
			}
		});
	}

	return user;
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
	const query = sql`INSERT INTO CORE_Outbox (OutboxID, Group, Email, Type) VALUES (${outboxID}, ${group}, ${email}, ${type})`;
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
