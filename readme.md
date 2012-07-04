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
    app.use(express.logger());
    app.use(app.router);
});
```

### Requesting an auth token

This request:

```
POST /auth-token

Content-Type: application/json

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

### Making an Authenticated Request

Once the user has an auth token, they can send that token back to make an authenticated request. This can be done in the query string, the request body, or by using a cookie depending on how you intend your API to be used.

##### As a query string

```
GET /something/23?authToken=username:1341191721405:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae
```

##### As a request parameter

```
POST /something

Content-Type: application/json

{
    "param1": "foo",
    "param2": "bar",
    "authToken": "username:1341191721405:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
}

```

### Configuration

There are a lot of ways to control how rest-auth functions. The first place to start is the configuration for the `auth.authenticate()` method.

#### expires

The amount of time that an authentication token remains valid before it must be renewed. This can be a number (milliseconds) or a string value with a unit (available unit formats by [node-expires](https://github.com/UmbraEngineering/node-expires)). Also, if using cookies, this will be used to determine the expiration for the cookie. _Default: "2 hours"_

#### authRoute

The route by which authentication tokens are requested. _Default: "auth-token"_

#### authParam

When using query strings or request bodies to send authentication tokens back to the server, this is the parameter to check in. _Default: "authToken"_

#### authCookie

When using cookies to send authentication tokens back to the server, this is the cookie name. _Default: "authToken"_

#### secureCookie

When using cookies, determines whether to set the `secure` flag. _Default: false_

#### autoRenewToken

Determines if authentication tokens be automatically updated with every request. If set to `"cookie-only"`, auto-renew will only update tokens in cookies. If set to `true`, non-cookie refreshed tokens will be stored in `res.authToken` after the `authenticate` middleware runs and can be sent back to the client in a way of your choosing. _Default: true_

#### authTokenHash.algorithm

The hashing algorithm to use. _Default: "sha256"_

#### authTokenHash.salt

A string of salt data to use when hashing. If no salt is given, a random salt will be created when the application starts. _Default: null_

#### authTokenHash.iterations

How many times should hashing be iterated over. Higher values are more secure, but will add more latency to your server.

### Auto-population

By adding another middleware function after `auth.authenticate()` you can make your user's data fill in the `req.user` property automatically on authenticated requests (probably much more comfortable for people used to sessions).

```javascript
app.configure(function() {
    ...
   
    app.use(auth.authenticate({ ... }));
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
   
    ...
});

app.get('/foo', function(req, res) {
    if (req.user) {
        console.log(req.user.someValue);
    }
    ...
});
```

### Permissions
























