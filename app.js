'use strict';

const express = require("express");
const app = express();
const routes = require("./routes");

const jsonParser = require("body-parser").json;
const logger = require("morgan");

app.use(logger("dev"));
app.use(jsonParser());

//mongoose stuff
const mongoose = require("mongoose");
//qa is the name of our route (stands for question and answer)
mongoose.connect("mongodb://localhost:27017/qa");

const db = mongoose.connection;

db.on("error", function(err){
	console.error("connection error:", err);
});

//once method is a callback that holds of all the database interaction code to ensure the code would only run after the database conncetion was open.
//in this express app... we don't ned to worry about the db. All we want to do is log out once the open event occurs.
//Now that the database is set up, let's set up the schemas in a seperate file called models.js
db.once("open", function(){
	console.log("db connection successful");
	//all database stuff goes here
});

//Grants access to the resources from any domain
//You only have to set these headers up once when you set up your API to be used by a web browser.
app.use(function(req, res, next) {
	//this will modify the header response so the browser knows what it can and cannot do.
	//to set the headers, we need to use the responses header method.
	//it takes a header feel name as the first parameter, and then the value.

	//used to restrict the domains in which the api can respond to. An * means it's okay to make request to this API from any domain.
	res.header("Access-Control-Allow-Origin", "*");
	//tells the client which headers are permitted in their request. A standard set of headers are origin, x-requested-with, content-type, and accept.
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	//A little piece of logic to grant pre-flight request's permission.
	//pre-flight requests come in with the http method called options.
	if(req.method === "OPTIONS") {//options isn't handled by any of our routes.
	//we'll intercept any request with the method of options here.
	//returns a response to grant their browser permission to use the HTTP methods PUT, POST, and DELETE to continue with it's actual request.
		res.header("Access-Control-Allow-Methods", "PUT, POST, DELETE");
			return res.status(200).json({});
		}
	//remember to call next();
	next();
});

app.use("/questions", routes);

// catch 404 and forward to error handler
app.use(function(req, res, next){
	const err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// Error Handler
app.use(function(err, req, res, next){
	res.status(err.status || 500);
	res.json({
		error: {
			message: err.message
		}
	});
});

const port = process.env.PORT || 3000;

app.listen(port, function(){
	console.log("Express server is listening on port", port);
});
