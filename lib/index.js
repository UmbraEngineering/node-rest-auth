
var merge    = require('merge');
var sechash  = require('sechash');

exports.authenticate = function(options) {
	// Default missing options
	options = merge({
		authRoute: 'auth-token'
	}, options);
	
	
};






