var sfy = JSON.stringify;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

import logger from './utils/Logger';
import shortid from 'shortid';

var UserSchema =  new Schema ({
	user_name: {
		type: String,
		unique: true,
		required: true
	},
	_id: {
		type: String, 
		required: true, 
		index: true, 
		unique: true, 
		default: shortid.generate
	}
});

var UserModel = mongoose.model('User', UserSchema, 'fitness_user');

UserModel.findByUserName  = async function(userName){

	let toReturn = undefined;
	try{
		toReturn = await UserModel.findOne({user_name: userName}).select('user_name user_id -_id');
		logger.info("found: " + toReturn);
	}catch(err){
		logger.error('failed to find short url for ' + url + " due to " + err);
	}
	logger.info("findShortUrl returning " + toReturn);
	return  toReturn
}

UserModel.add = async function(userName){
	let toReturn = undefined;
	let userId = userName.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0); 
	let user = {user_name: userName};
	try{
		
		logger.verbose("Creating a new user with " + JSON.stringify(user));
		user = new UserModel(user);

		user = await user.save();

		logger.verbose("result is " + JSON.stringify(user));


		return user;
	}catch(err){
		if(err.code==11000){
			logger.error(`Tried to create duplicate user ${userName}`);
			return {error: `Tried to create duplicate user ${userName}`, code: 11000}
		}
		else{
			logger.error(`Could not create user ${user} becasue of ${sfy(err)}`);
			return {error: err};
		}
	}
}


export default UserModel