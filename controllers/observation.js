//File: controllers/observation.js
//TODO validations
var mongoose    = require('mongoose');
var Observation = mongoose.model('Observation');

cleanObservationData = function(observation) {

	observation = observation.toObject();
	observation.identifier = observation._id;
	delete observation._id;
	delete observation.__v;

	return observation;
};


//GET - Return all observation in the DB
exports.findAllObservations = function(req, res) {
	var queryFind     = {};
	var queryPopulate = {path: 'featureOfInterest'};
	var querySelect   = {};// {'_id': 1, 'sensor':1, 'observedProperty':1, 'type': 1, 'featureOfInterest': 1 };

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
		var spatialFilterOperand     = q.spatialFilter.operand;
		var spatialFilterCoordinates = q.spatialFilter.parameter.coordinates;

		queryPopulate = { path:'featureOfInterest', select: 'geometry.coordinates', match: { 'geometry.coordinates' : {
			'$geoWithin': {
				'$geometry': {
					'type': spatialFilterOperand,
					'coordinates': spatialFilterCoordinates
				}
			}
		}}};
	}
	// Process temporal filter
	if (typeof q.temporalFilter != 'undefined') {
		var temporalFilterOperand   = q.temporalFilter.operand;
		var temporalFilterAttribute = q.temporalFilter.parameter.attribute;
		var temporalFilterTime      = q.temporalFilter.parameter.time;

		var operation = {};

		if ('TimeInstant' == temporalFilterOperand) {
			if (1 != temporalFilterTime.length) return res.sendStatus(400);
			operation = { $in: temporalFilterTime };
		} else if ('TimePeriod' == temporalFilterOperand) {
			if (2 != temporalFilterTime.length) return res.sendStatus(400);
			operation = { $gte: temporalFilterTime[0], $lt: temporalFilterTime[1]};
		}

		if('phenomenonTime' == temporalFilterAttribute) {
			queryFind.phenomenonTime = operation;
		} else if ('resultTime' == temporalFilterAttribute) {
			queryFind.resultTime = operation;
		}

	}
	//Process sensor filter
	if (typeof q.sensor != 'undefined') {
		var sensorFilter = q.sensor;
		queryFind.sensor = { $in: sensorFilter };
	}
	//Process observed property filter
	if (typeof q.observedProperty != 'undefined') {
		var observedPropertyFilter = q.observedProperty;
		queryFind.observedProperty = { $in: observedPropertyFilter };
	}
	//Process feature of interest filter
	if (typeof q.featureOfInterest != 'undefined') {
		var featureOfInterestFilter = q.featureOfInterest;
		queryFind.featureOfInterest = { $in: featureOfInterestFilter };
	}


	// Get query and filter response
	Observation
	.find(queryFind)
	.populate(queryPopulate)
	.select(querySelect)
	.exec(function(err, observations) {
		if(err) return res.sendStatus(500);
		var finalObservations = [];
		var observation;
		if (typeof observations != 'undefined') {
			for (var i = 0; i < observations.length; i++) {
				if (null !==  observations[i].featureOfInterest) {
					observation = cleanObservationData(observations[i]);
					observation.featureOfInterest = observation.featureOfInterest._id;
					finalObservations.push(observation);
				}
			}
		}
		return res.status(200).jsonp(finalObservations);
	});
};

//GET - Return a observation with specified ID
exports.findObservationById = function(req, res) {
	Observation.findById(req.params.id, function(err, observation) {
		if(err)	return res.sendStatus(500);
		if(null === observation) return  res.sendStatus(404);
		return res.status(200).jsonp(cleanObservationData(observation));
	});
};

//POST - Insert a new observation in the DB
exports.addObservation = function(req, res) {
	var observation = new Observation (req.body);
	var error = observation.validateSync();
	if(error) return res.sendStatus(400, error.message);
	observation.save(function(err, observation) {
		if(err) return res.sendStatus(500, err.message);
		res.status(201).send(cleanObservationData(observation));
	});
};

//PUT - Update a observation already exists
exports.updateObservation = function(req, res) {
	observation = new Observation (req.body);
	var error = observation.validateSync();
	if(error) return res.sendStatus(400);
	observation = observation.toObject();
	delete observation._id;
	Observation.findOneAndUpdate({_id: req.params.id}, observation, { upsert: true }, function(err){
		if(err) return res.sendStatus(500);
		return res.sendStatus(204);
	});
};

//DELETE - Delete a observation with specified ID
exports.deleteObservation = function(req, res) {
	Observation.findById(req.params.id, function(err, observation) {
		if(err) return res.sendStatus(500);
		if(null === observation) return res.sendStatus(404);
		observation.remove(function(err) {
			if(err) return res.sendStatus(500);
			return res.sendStatus(204);
		});
	});
};
