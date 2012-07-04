
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
//  Permissions checking method

var checkPermissions;
exports.checkPermissions = function(func) {
	if (typeof func === 'function') {
		checkPermissions = func;
	}
};

// ------------------------------------------------------------------
//  Optional populate user middleware

exports.populateUser = function(func) {
	if (typeof func !== 'function') {
		throw new TypeError('auth.populateUser must take a function parameter');
	}
	return function(req, res, next) {
		if (! req.user) {
			return next();
		}
		func(req.user, function(err, data) {
			if (err) {
				return next(err);
			}
			req.user = data;
			next();
		});
	};
};

// ------------------------------------------------------------------
//  Permissions middleware

exports.requiresPerms = function(perms) {
	if (perms && ! Array.isArray(perms) {
		perms = [ perms ];
	}
	return function(req, res, next) {
		// If no permissions were given, just check for a user
		if (! perms) {
			if (! req.user) {
				return res.json(json.error('Must be authenticated to make that request'), 405);
			}
			next();
		}
		// Otherwise, we need to check for the requested permissions
		else {
			checkPermissions(req.user, perms, function(err, isAuthorized) {
				if (err) {
					return next(err);
				}
				if (! isAuthorized) {
					res.json(json.error('Not authorized to make that request'), 405);
				}
				next();
			});
		}
	};
};

// ------------------------------------------------------------------
//  Main authentication middleware

exports.authenticate = function(options) {
	// Default missing options
	options = merge.recursive({
		expires: '2 hours',
		authRoute: 'auth-token',
		authParam: 'authToken',
		authCookie: 'authToken',
		secureCookie: false,
		autoRenewToken: true, // true, false, or "cookie-only"
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
		options.salt = sechash.basicHash('sha1',
			String((Math.random() + 2) * Math.random())
		);
		options.salt = options.salt.substring(0, 6);
	}
	// Get utility functions
	var hash = hasher(options.authTokenHash);
	var buildAuthToken = authTokenBuilder(hash, options.expires);
	if (options.authCookie) {
		var writeCookie = cookieWriter(options);
	}
	// The actual middleware function
	return function(req, res, next) {
		// Handle authentication token requests
		var uri = url.parse(req.url).pathname;
		if (uri === '/auth-token') {
			if (req.method === 'POST') {
				// Authenticate the user data using the method provided
				authenticateUser(req.body.username, req.body.password,
					function(err, user, authFailure) {
						if (err) {return next(err);}
						if (! user) {
							return res.json(json.error(authFailure), 401);
						}
						// Populate the user property
						req.user = req.body.username;
						// Create the authentication token
						buildAuthToken(user.username, user.password, function(err, authToken) {
							if (err) {return next(err);}
							// Set an authentication cookie if needed
							if (options.authCookie) {
								writeCookie(req, authToken);
							}
							res.json({ authToken: authToken });
						});
					}
				);
			} else {
				res.json(json.error('/auth-token only supports POST requests'), 405);
			}
		}
		// Authenticate other requests
		else {
			var authToken;
			// Check for an auth token cookie
			if (opts.authCookie && req.cookies[options.authCookie]) {
				authToken = req.cookies[options.authCookie];
			} else if (options.authParam) {
				// Check for an auth token in the query string
				if (req.query[options.authParam]) {
					authToken = req.query[options.authParam];
				}
				// Check for an auth token in the request body
				else if (req.body[options.authParam]) {
					authToken = req.body[options.authParam];
				}
			}
			// Validate the auth token
			if (! authToken) {
				req.user = null;
				return next();
			}
			authToken = parseAuthToken(authToken);
			
			
		}
	};
};

// ------------------------------------------------------------------
//  Utilities

// Parse an auth token into an object
function parseAuthToken(cookie) {
	cookie = cookie.split(':');
	return {
		username: cookie[0],
		expiration: cookie[1],
		hash: cookie[2]
	};
}

// Build an authentication token from components
function authTokenBuilder(hash, expiration) {
	return function(username, password, callback) {
		hash(username + '+' + password + '+' + expiration,
			function(err, hashResult) {
				if (err) {
					return callback(err);
				}
				callback(null, [
					username,
					expires.after(expiration),
					hashResult
				].join(':'));
			}
		);
	};
}

// Get a hashing function
function hasher(opts) {
	return function(str, callback) {
		sechash.strongHash(str, opts, callback);
	};
}

// Get a cookie writing function
function cookieWriter(opts) {
	return function(res, token) {
		res.cookie(opts.authCookie, token, {
			maxAge: opts.expires, 
			httpOnly: true,
			secure: opts.secureCookie
		});
	};
}

/* End of file index.js */
/* Location: ./lib/index.js */
