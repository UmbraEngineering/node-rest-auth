
var url      = require('url');
var sechash  = require('sechash');
var expires  = require('expires');
var merge    = require('merge-recursive');
var json     = require('json-output');

// ------------------------------------------------------------------
//  User authentication method

var authenticateUser = function() {
	throw new Error('authenticateUser must defined using auth.authenticateUser(...)');
};
exports.authenticateUser = function(func) {
	if (typeof func === 'function') {
		authenticateUser = func;
	}
};

// ------------------------------------------------------------------
//  Optional populate user middleware

var populateUser = function(username, callback) {
	callback(null, {username: username});
};
exports.populateUser = function(func) {
	if (typeof func !== 'function') {
		throw new TypeError('auth.populateUser must take a function parameter');
	}
	populateUser = func;
};

// ------------------------------------------------------------------
//  Main middleware function

exports.authenticate = function(options) {
	// Default missing options
	options = merge.recursive({
		expires: '2 hours',
		authRoute: 'auth-token',
		authCookie: 'auth',
		secureCookie: false,
		authTokenHash: {
			algorithm: 'sha256',
			salt: null,
			iterations: 50,
			includeMeta: false
		}
	}, options);
	// Pre-parse the expires value as we will be using it frequently
	options.expires = expires.parse(options.expires);
	// Generate salt if needed
	if (! options.salt) {
		options.salt = sechash.basicHash('sha256',
			String((Math.random() + 2) * Math.random())
		);
		options.salt = options.salt.substring(0, 6);
	}
	// Get a hashing function
	var hash = hasher(options.authTokenHash);
	// The actual middleware function
	return function(req, res, next) {
		// Handle authentication token requests
		var uri = url.parse(req.url).pathname;
		if (uri === '/auth-token') {
			if (req.method === 'POST') {
				authenticateUser(req.body.username, req.body.password,
					function(err, user, authFailure) {
						if (err) {return next(err);}
						if (! user) {
							return res.json(json.error(authFailure), 401);
						}
						req.user = req.body.username;
						res.cookie(options.authCookie,
							createCookie(user.username, user.password, options.expires)
							{ maxAge: options.expires, httpOnly: true, secure: options.secureCookie }
						);
						populate(req, res, next);
					}
				);
			} else {
				res.json(json.error('/auth-token only supports POST requests'), 405);
			}
		}
		// Authenticate other requests
		else {
			var cookie = req.cookies[options.authCookie];
			if (! cookie) {
				return (req.user = null);
			}
			
			
			
			populate(req, res, next);
		}
	};
	// Populate the req.user property
	function populate(req, res, next) {
		
	}
	// Write an authentication cookie
};

// ------------------------------------------------------------------
//  Cookie parser

function parseCookie(cookie) {
	cookie = cookie.split(':');
	return {
		username: cookie[0],
		expiration: cookie[1],
		hash: cookie[2]
	};
}

function cookieBuilder(hash, expiration) {
	return function(username, password) {
		return [
			username,
			expires.after(expiration),
			hash(username + '+' + password + '+' + expiration)
		].join(':');
	};
}

function hasher(opts) {
	return function(str, callback) {
		sechash.strongHash(str, opts, callback);
	};
}


















