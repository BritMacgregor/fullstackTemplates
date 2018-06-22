'use strict'
const express = require("express");
const router = express.Router();
//imports our question model. We require it at the top, then assign it to question.
const Question = require("./models").Question;
//now we can use Question to create documents and query the database.

//we can preload the question document in the handler so it will be present on any matching route. To do this, on the router object, call the param method.
//the param method takes to parameters, the name of the route parameter as a string, and the callback function.
//this call back will get executed when qID is present.
router.param("qID", function(req,res,next,id){ //the callback takes the sasme parameters as other middleware, except for the last one, which takes a value from the route parameter
  //So first we can load the question document and if theres an error, it will pass it forward to the error handler.
  Question.findById(id, function(err, doc){ //pass in the callback with an error and the document.
    //handle the error like we did before
    if(err) return next(err);
      //if the document can't be Found, we want to return a 404 error to the client
      if(!doc) {
        err = new Error("Not Found");
          //remember to set the status property on the error object, since the error handler will look for that and use it if it's there.
          err.status = 404;
      return next(err);
      }
      //Finally, if it exists, lets set it on the request object so it can be used in other middleware and route handlers that recieve this request.
     req.question = doc;
    //Lastly, we'll call next to trigger the next middleware.
    return next();
  });
});

//under the parameter handler for qID, we can create a similiar ahndler for answers using the aID parameter.
router.param("aID", function(req,res,next,id){ //the callback takes the sasme parameters as other middleware, except for the last one, which takes a value from the route parameter
   //mongoose has a special handler on sub documents array called ID.
   //the id method takes n ID of a sub-document, and returns the subdcoument with that matching ID.
   req.answer = req.question.answers.id(id);
      //If the answer can't be found, we want to send a 404 error.
      if(!req.answer) {
        err = new Error("Not Found");
       //remember to set the status property on the error object, since the error handler will look for that and use it if it's there.
     err.status = 404;
    return next(err);
   }
  //Otherwise, we'll call next to pass control back to the router.
  next();
});

//We can start with the root routes get request handler
//We want the API to return all question documents.
//On the question model, we can call the find method, and pass in an empty object literal followed by a callback function.

//To make sure the question objects are sorted so that the most recent ones come first, we need to add additional parameters to find the method before the callback.
//If the second parameter is not a fucntion, in other words our callback funciton, the find method expects it to be what mongo calls a projection to limit the fields returned by the query.
//A projection is a way to return excerpts of a document. Since we don't want partial documents, we'll pass in null as the second parameter.

// GET /questions
// Route for questions collection
router.get("/", function(req, res, next){
  //then we can specify how we'd like our ordered results as the third parameter. Passing in an object literal.
  //by entering the property of sort, we can specify another object litereal with the key we want it to be sorted by.
  //entering -1, means we want the documents sorted in decending order. The most recent data will be at the beginning of our results array.
  //Without this null placeholder, mongoose would try to the {sort:{createdAt: -1}} object as a projection. Null tells mongoose how to sort our results.
  Question.find({}, null, {sort: {createdAt: -1}}, function(err, questions) {
    //in the body of our callback function we first want to handle any errors that may result from executing this query. So we'll need to access the next function and it off to express's error handler.
    if(err) return next(err);
      //if there are no errors, we can send the results to the client's request
      res.json(questions);
  });
});

// POST /questions
// Route for creating questions
router.post("/", function(req, res, next){ //don't forget to add in next as this will help with errors
  //To create a new question document from the incoming JSON on the request body, we can pass it in directly to the model constructor.
  const question = new Question(req.body);
    //then we can call save on interval and pass in the callback funciton
    question.save(function(err, question){
       if(err) return next(err);//don't forget to add in next
       //we can use an http status of 201 to indicate to the client that the document was saved succesfully.
     res.status(201);
     //Finally, the document can be returned as JSON to the client
    res.json(question);
   });
});

// GET /questions/:id
// Route for specific single questions
//We can use the findById() query method on the model, passing in the questions ID from the URL. **Note we did this in the router param handler at the top..
router.get("/:qID", function(req, res, next){
  //since we allready did all the main work in the route param handler at the top, all we need to do now is just send out the data to the client.
   //returns the question document to the client as Json.
    res.json(req.question);
  });

// POST /questions/:id/answers
// Route for creating an answer / answers collection route
//We will create another parameter handler to preload the answer document at the top.
router.post("/:qID/answers", function(req, res, next){
  //since were already having the question loaded by the param method, we can start to see here how it's releiving us from typing a query for each route.
  //it's just there in the request. After getting the reference to the preloaded question and accessing the collection of answers...
  //we can simply push the object literal veresion of the document we want to add.
  req.question.answers.push(req.body);
    //mongoose will create the document for us, but to save it we need to call save on the question document.
    req.question.save(function(err, question){   //and in the callback, we can set the http status to 201, which tells the client that their resource was successfully createdand sends the response back tothe client.
      if(err) return next(err);//don't forget to add in next
      //we can use an http status of 201 to indicate to the client that the document was saved succesfully.
    res.status(201);
    //Finally, the document can be returned as JSON to the client
  res.json(question);
 });
});

//Now that our answer is loaded via our param handler, we'll use it in our put route.
// PUT /questions/:qID/answers/:aID
// Edit a specific answer
router.put("/:qID/answers/:aID", function(req, res){
  //we can use the update instance method.
  //remember, we'll pass in an updates object which will contain the properties and values we want to modify on our existing document.
  req.answer.update(req.body, function(err, result){ //in this case, it's the request body. Then a callback to fire, after saving the updates to the database.
    if(err) return next(err);
    //we'll just send the results in question document back to the client
    res.json(result);
  });
});

//this route deletes answers
// DELETE /questions/:qID/answers/:aID
// Delete a specific answer
router.delete("/:qID/answers/:aID", function(req, res){
  //mongoose documents have a remove method. we can use the remove method on our answer.
  req.answer.remove(function(err) {
    //Then in the callback, we'll saver the parent question.
    req.question.save(function(err, question){ //this will take another callback where we can send the resulting question back to the client
        if(err) return next(err);
          res.json(question);
        });
      });
    });

//The vote route
// POST /questions/:qID/answers/:aID/vote-up
// POST /questions/:qID/answers/:aID/vote-down
// Vote on a specific answer
router.post("/:qID/answers/:aID/vote-:dir", function(req, res, next){
		if(req.params.dir.search(/^(up|down)$/) === -1) {
        //checks to see if url contents is up or down
			  const err = new Error("Not Found");
          //will reject any value that is not up or down and throw an error
			    err.status = 404;
			       next(err);
		          } else {
                //add a line to the validator to make everything a little more coherent and readable.
                  req.vote = req.params.dir; //we are putting the vote string directly on the object, it allows the reader to quickly understand what...
                //...the value of the variable is about when they read it in the next callback function here.
			          next();
		          }
	        }, function(req, res, next){ //don't forget to include the next in your handler
      //now let's call our instance method vote on the answer, passing in the vote string and then a callback with a response back to the client.
      req.answer.vote(req.vote, function(err, question) { //the instance method makes it easier to apply the vote to the answer.
    if(err) return next(err);
    res.json(question);
  });
});


module.exports = router;
