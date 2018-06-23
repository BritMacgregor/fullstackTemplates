'use strict';

const mongoose = require("mongoose");

const Schema = mongoose.Schema;
//A compare function is needed to use the javascript Array's sort method on an array of objects.
//sorts the answers array before calling next by comparing 2 unsorted answer objects and say which order they should go in.
//the array sort method will then take that information and sort the array for us
//replaces the default js sort array method down in our questionSchema pre save function
const sortAnswers = function(a, b) {
	//- negative a before b
	//0 no change
	//+ positive a after b

  //answers with the most votes will appear at the top of the list
	if(a.votes === b.votes){
    //this orders the later dates first by subtracting them to give you the difference in milliseconds
		return b.updatedAt - a.updatedAt;
	}
  //orders the votes from greatest to least
	return b.votes - a.votes;
  //if the votes match order them by the last time they were updated,
}

//Now that we have created a schema, we need 2 schemas for our questions and one for our answeres.

  //declares the AnswerSchema as a variable so that it will be defined by the time QuestionSchema sees it.
const AnswerSchema = new Schema({
  //we need a text property to hold the text of the answer
	text: String,
  //as well as a time for creation
  //We want to set this to the current date and time when every answer is created.
  //Mongoose can take care of that using an object to specify the default value.
	createdAt: {type: Date, default: Date.now}, //Now the current date and time will be supplied for this field when a answer is created.
  //This updatedat will initially match createdAt
	updatedAt: {type: Date, default: Date.now},
  //provide votes which is a number with a default value of 0
	votes: {type: Number, default:0}
});

//When the answer is updated, we want to apply the updates to unanswered document.
//We also want the answeres updated property to be the current time.
//we will use an instance method so we ccan call it directly on the answer when we want to update it.
//we want the update method to accept two parameters. An update subject and a callback for when the operation is completed.
//**make sure you create this method above the question schema declaration, where the answer becomes a sub document or you'll get an error!**
AnswerSchema.method("update", function(updates, callback) {
  //merges the first thing we'll want to do is merge the updates into the answer document.
  //we'll pass in the document first referenced by this, then the updates
  //then we'll want to set a fresh date on the updatedAt
  //We can pass that in as a third parameter, and objects assigned will match that too.
	Object.assign(this, updates, {updatedAt: new Date()});
  //we'll need to save the parent document.In other words the question associated with the answer.
  //to access the question we can use the answers parent method.
	this.parent().save(callback); //since this is the last thing we want to do in this function, we can pass in the callback as a parameter.
});

//We need a vote instance method on the answerSchema to help with transating strings from the url into math that moves the counts up or down.
//Let's start with the function signature which is almost identical to the last inistance method.
//since we've already validated the string that is passed into the vote parameter, there are only 2 possiblities.
AnswerSchema.method("vote", function(vote, callback) {
  //if the vote is equal to up... we want to add one to the votes
	if(vote === "up") {
		this.votes += 1;
	} else {
    //if the vote is equal to down ... we want to subtract one from the votes
		this.votes -= 1;
	}
  //we'll need to pass in the parent node.
	this.parent().save(callback); //since this is the last thing we want to do in this function, we can pass in the callback as a parameter.
});

//declares the QuestionSchema
const QuestionSchema = new Schema({
  //we need a text property to hold the text of the question
	text: String,
  //as well as a time for creation
    //We want to set this to the current date and time when every question is created.
    //Mongoose can take care of that using an object to specify the default value.
	createdAt: {type: Date, default: Date.now}, //Now the current date and time will be supplied for this field when a question is created.
  // and an array to store the answeres in
  //to let mongoose know about the relationship between answers and questions, we need to place the answer schema as the only element of an array on the question schema.
  //this is a signal to mongoose that we want answer documents to be nested inside question documents
  //We'll call our schema AnswerSchema
	answers: [AnswerSchema]
});

//Pre Save Callback and inside we'll sort the answers array before calling next
QuestionSchema.pre("save", function(next){
  //have to pass in a sorting method into the sorting function because js default sort method will print out 2 objects
	this.answers.sort(sortAnswers);//our sortAnswers argument is the sortAnswers function we created at the top
  //it will make mongoose sort the answers right everytime it is saved now, instead of relying on the default sort method.
  //keeping the state of the database up to date.
	next();
});

//Create an export question model using mongoose model method
const Question = mongoose.model("Question", QuestionSchema);

//Will allow us to import the question into our routes file to make use of it there
module.exports.Question = Question;
