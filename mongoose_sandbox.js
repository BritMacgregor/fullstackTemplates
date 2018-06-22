'use strict';

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/sandbox");

const db = mongoose.connection;

db.on("error", function(err){
	console.error("connection error:", err);
});

db.once("open", function(){
	console.log("db connection successful");
	// All database communication goes here

	const Schema = mongoose.Schema;
	const AnimalSchema = new Schema({
    //gives default values to objects whose values are not specified
		type:  {type: String, default: "goldfish"},
		size:  String,
		color: {type: String, default: "golden"},
		mass:  {type: Number, default: 0.007},
		name:  {type: String, default: "Angela"}
	});

//prehook middleware on AnimalSchema
	AnimalSchema.pre("save", function(next){
    //the handler passed in as the second parameter will execute before mongoose saves the document to the database.
    //it takes a next parameter that will be used in the same way as in express.

      //the this object will point to the document or model to be saved.
		if(this.mass >= 100) {
      // the this handler on this if statement examines the mass of an animal
      //we can assign the size property to the mass. If the size property is greater than or equal to 100...
     //the size will be big
			this.size = "big";

		} else if (this.mass >= 5 && this.mass < 100) {
      // If the size property is greater than 5 and less than 100...
     //the size will be medium
			this.size = "medium";

      // If the size property is less anything else (than 5)
     //the size will be small
		} else {
			this.size = "small";
		}
		next();
    //After we are finished with our code, we call next to tell mongoose were done.
	});


//function named findsize works for any size specified //uses the size argument as the first parameter
	AnimalSchema.statics.findSize = function(size, callback){
		//this == Animal
    //query object to inlcude the size
		return this.find({size: size}, callback);
	}

//Instance Method //Instant "this" value points to the instances of the document itself.
//place a function called findsamecolor on AnimalSchema method property.
	AnimalSchema.methods.findSameColor = function(callback) {
		//this == document
    //To get a reference to the model, call the document's mopdel method and pass in the name of the mod3el we want to access as a string.
    //In this case it's animal. //from there we query the usual way: passing in the documents color with this.color
		return this.model("Animal").find({color: this.color}, callback);
	}

	const Animal = mongoose.model("Animal", AnimalSchema);

	const elephant = new Animal({
		type: "elephant",
		color: "gray",
		mass: 6000,
		name: "Lawrence"
	});

	const animal = new Animal({}); //Goldfish

	const whale = new Animal({
		type: "whale",
		mass: 190500,
		name: "Fig"
	});

	const animalData = [
		{
			type: "mouse",
			color: "gray",
			mass: 0.035,
			name: "Marvin"
		},
		{
			type: "nutria",
			color: "brown",
			mass: 6.35,
			name: "Gretchen"
		},
		{
			type: "wolf",
			color: "gray",
			mass: 45,
			name: "Iris"
		},
		elephant,
		animal,
		whale
	];



	Animal.remove({}, function(err) {
		if (err) console.error(err);
		Animal.create(animalData, function(err, animals){
			if (err) console.error(err);

      //uses the Animal model's findOne method to retrieve an elephant
      //this method will search the database for batches and whichever is first to match is the one returned.
      //That's good if you only want one matching document in the database.
			Animal.findOne({type: "elephant"}, function(err, elephant) {
        //We can use the resulting document to call the instance method and print out the results to the console.
				elephant.findSameColor(function(err, animals){
					if (err) console.error(err);
					animals.forEach(function(animal){
						console.log(animal.name + " the " + animal.color +
							" " + animal.type + " is a " + animal.size + "-sized animal.");
					});
					db.close(function(){
						console.log("db connection closed");
					});
				});
			});
		});
	});
});
