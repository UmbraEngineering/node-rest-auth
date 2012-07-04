# node-rest-auth

A Node.js RESTful Authentication Middleware for Express

## Install

```bash
$ npm install rest-auth
```

## Usage

```javascript
var auth = require('rest-auth');

// Tell the auth module how to authenticate a user
auth.authenticateUser(function(username, password, callback) {
	User.findOne({ username: username }, function(err, user) {
		if (err) {
			return callback(err);
		}
		if (! user) {
			return callback(null, false, 'User does not exists');
		}
		if (hash(password) !== user.password) {
			return callback(null, false, 'Invalid password');
		}
		// The username and password should be given here
		callback(null, {
			username: username,
			password: user.password
		});
	});
});

// Then, in your app config...
app.configure(function() {
	app.set('view engine', 'hbs');
	app.set('views', consts.VIEW_PATH);
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	// rest-auth requires the cookie parser
	app.use(express.cookieParser());
	
	// Load the authentication middleware
	app.use(auth.authenticate({
		expires: '2 hours',
		authRoute: 'auth-token',
		authTokenHash: {
			algorithm: 'sha256',
			salt: 'saltiness'
		}
	});
	
	// This is optional; This will lookup the user's info and
	// auto-populate the req.user property. If this is not provided,
	// req.user will just be the username
	app.use(auth.populateUser(function(username, callback) {
		User.findOne({ username: username }, function(err, user) {
			if (err) {
				return callback(err);
			}
			callback(null, {
				username: username,
				someValue: user.someValue,
				another: user.another
			});
		});
	});
	
	app.use(express.logger());
	app.use(app.router);
});
```

This request:

```
POST /auth-token
{
  "username": "bob",
  "password": "somepassword"
}
```

Will result in something like this (assuming the credentials are correct):

```json
{
	"authToken": "username:1341191721405:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
}
```

Or something like this in the event of an error:

```json
{
	"error": {
		"message": "User does not exist"
	}
}
```

### More Control































