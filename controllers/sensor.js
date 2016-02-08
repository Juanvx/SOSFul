//File: controllers/sensor.js
//TODO validations


var mongoose = require('mongoose');
var Sensor   = mongoose.model('Sensor');

cleanSensorData = function(sensor) {

	sensor = sensor.toObject();
	sensor.identifier = sensor._id;
	delete sensor._id;
	delete sensor.__v;

	return sensor;

};

//GET - Return all sensors in the DB
exports.findAllSensors = function(req, res) {
	var queryFind     = {};
	var querySelect   = {}; //{'_id': 1, 'identification':1, 'description':1};
	var queryPopulate = {path: 'featuresOfInterest'};

	//Read URI params
	var q = {};
	if (typeof req.query.q != 'undefined') {
		try {
			q = JSON.parse(req.query.q);
		}catch(err) {
			return res.sendStatus(400);
		}
	}
	// Process spatial filter
	if (typeof q.spatialFilter != 'undefined') {
		var spatialFilterOperand = q.spatialFilter.operand;
		var spatialFilterCoordinates = q.spatialFilter.parameter.coordinates;

		queryPopulate = { path:'featuresOfInterest', select: 'geometry.coordinates', match: { 'geometry.coordinates' : {
			'$geoWithin': {
				'$geometry': {
					'type': spatialFilterOperand,
					'coordinates': spatialFilterCoordinates
				}
			}
		}}};
	}

	//Process observed property filter
	if (typeof q.observedProperty != 'undefined') {
		var observedPropertyFilter = q.observedProperty;
		queryFind = {
			'$or': [
				{
					'outputs.observedProperty': {'$in': observedPropertyFilter}
				}, {
					'inputs.observedProperty': {'$in': observedPropertyFilter}
				}
		]};
	}
	//Process feature of interest filter
	if (typeof q.featureOfInterest != 'undefined') {
		var featureOfInterestFilter  = q.featureOfInterest;
		queryFind.featuresOfInterest = { $in: featureOfInterestFilter };
	}

	// Get query and filter response
	Sensor
	.find(queryFind)
	.populate(queryPopulate)
	.select(querySelect)
	.exec(function(err, sensors) {
		if(err) return res.sendStatus(500);
		var finalSensors = [];
		var sensor;
		if (typeof sensors != 'undefined') {
			for (var i = 0; i < sensors.length; i++) {
				if (0 <  sensors[i].featuresOfInterest.length) {
					for (var j = 0; j < sensors[i].featuresOfInterest.length; j++) {
						sensors[i].featuresOfInterest[j] = sensors[i].featuresOfInterest[j]._id;
					}
					finalSensors.push(cleanSensorData (sensors[i]));
				}
			}
			return res.status(200).jsonp(finalSensors);
		}
	});
};

//GET - Return a sensor with specified ID
exports.findSensorById = function(req, res) {
	Sensor.findById(req.params.id, function(err, sensor) {
		if(err) return res.sendStatus(500);
		if(null === sensor) return  res.sendStatus(404);
		return res.status(200).jsonp(cleanSensorData(sensor));
	});
};

//POST - Insert a new sensor in the DB
exports.addSensor = function(req, res) {
	var sensor = new Sensor (req.body);
	var error = sensor.validateSync();
	if(error) return res.sendStatus(400, error.message);
	sensor.save(function(err, sensor) {
		if(err) return res.sendStatus(500, err.message);
		res.status(201).send(cleanSensorData(sensor));
	});
};

//PUT - Update a sensor already exists
exports.updateSensor = function(req, res) {
	sensor = new Sensor (req.body);
	var error = sensor.validateSync();
	if(error) return res.sendStatus(400);
	sensor = sensor.toObject();
	delete sensor._id;
	Sensor.findOneAndUpdate({_id: req.params.id}, sensor, { upsert: true }, function(err){
		if(err) return res.sendStatus(500);
		return res.sendStatus(204);
	});
};

//DELETE - Delete a sensor with specified ID
exports.deleteSensor = function(req, res) {
	Sensor.findById(req.params.id, function(err, sensor) {
		if(err) return res.sendStatus(500);
		if(null === sensor) return res.sendStatus(404);
		sensor.remove(function(err) {
			if(err) return res.sendStatus(500);
			return res.sendStatus(204);
		});
	});
};
