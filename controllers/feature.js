//File: controllers/feature.js
//TODO validations
var mongoose = require('mongoose');
var Feature  = mongoose.model('Feature');

cleanFeatureData = function(feature) {

  feature = feature.toObject();
  feature.identifier = feature._id;
  delete feature._id;
  delete feature.__v;

  return feature;
};

//GET - Return all features in the DB
exports.findAllFeatures = function(req, res) {
  var queryFind   = {};
  var querySelect = {}; //{'_id': 1, 'geometry': 1};

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

    queryFind = {
      'geometry.coordinates' : {
        '$geoWithin': {
          '$geometry': {
            'type': spatialFilterOperand,
            'coordinates': spatialFilterCoordinates
          }
        }
      }
    };
  }

  //Process type filter
	if (typeof q.type != 'undefined') {
		var sensorFilter = q.type;
		queryFind.type = { $in: sensorFilter };
	}

  Feature
  .find(queryFind)
  .select(querySelect)
  .exec(function(err, features) {
    if(err) return res.sendStatus(500);
    var finalFeatures = [];
    if (typeof features != 'undefined') {
      for (var i = 0; i < features.length; i++) {
        finalFeatures[i] = cleanFeatureData(features[i]);
      }
    }
    return res.status(200).jsonp(finalFeatures);
  });
};

//GET - Return a feature with specified ID
exports.findFeatureById = function(req, res) {
  Feature.findById(req.params.id, function(err, feature) {
    if(err) return res.sendStatus(500);
    if(null === feature) return  res.sendStatus(404);
    return res.status(200).jsonp(cleanFeatureData(feature));
  });
};

//POST - Insert a new feature in the DB
exports.addFeature = function(req, res) {
  var feature = new Feature (req.body);
  var error = feature.validateSync();
  if(error) return res.sendStatus(400, error.message);
  feature.save(function(err, feature) {
    if(err) return res.sendStatus(500, err.message);
    return res.status(201).send(cleanFeatureData(feature));
  });
};

//PUT - Update a feature already exists
exports.updateFeature = function(req, res) {
  feature = new Feature (req.body);
  var error = feature.validateSync();
  if(error) return res.sendStatus(400);
  feature = feature.toObject();
  delete feature._id;
  Feature.findOneAndUpdate({_id: req.params.id}, feature, { upsert: true }, function(err){
    if(err) return res.sendStatus(500);
    return res.sendStatus(204);
  });
};

//DELETE - Delete a feature with specified ID
exports.deleteFeature = function(req, res) {
  Feature.findById(req.params.id, function(err, feature) {
    if(err) return res.sendStatus(500);
    if(null === feature) return res.sendStatus(404);
    feature.remove(function(err) {
      if(err) return res.sendStatus(500);
      return res.sendStatus(204);
    });
  });
};
