//File                             : controllers/capability.js
var fs       = require("fs");
var mongoose = require('mongoose');
async        = require("async");

var sosDescripcionContent = fs.readFileSync("./SOS_description.json");
var Sensor                = mongoose.model('Sensor');
var Observation           = mongoose.model('Observation');

var contentData = [];
var contents    = [];

resultTimeComparator = function (a, b) {
  return a.resultTime - b.resultTime;
};

processObservationData = function(callback){
  var content = contentData.pop();

  Observation
  .find({sensor: content.identifier})
  .select({'_id': 1, 'phenomenonTime': 1, 'resultTime': 1})
  .sort('phenomenonTime')
  .exec(function(err, observations) {
    var phenomenonTimes = [];
    var resultTimes     = [];

    if(err) return res.sendStatus(500);

    if (null !== observations && 0 !== observations.length) {
      phenomenonTimes.push(observations[0].phenomenonTime);
      phenomenonTimes.push(observations[observations.length - 1].phenomenonTime);
      observations.sort(resultTimeComparator);
      resultTimes.push(observations[0].resultTime);
      resultTimes.push(observations[observations.length - 1].resultTime);

      content.phenomenonTime = phenomenonTimes;
      content.resultTime     = resultTimes;
    }
    contents.push(content);
    callback();
  });
};

//GET - Return the description of the SOS service
exports.getDescription = function(req, res) {
  var sosDescripcion = JSON.parse(sosDescripcionContent);

  //Read URI params
  var q = {};
  if (typeof req.query.q != 'undefined') {
    try {
      q = JSON.parse(req.query.q);
    }catch(err) {
      return res.sendStatus(400, err.message);
    }
  }

  var sections = q.section;
  if (typeof sections == 'undefined' || null === sections || sections.length === 0) {
    sections = [ 'serviceIdentification', 'serviceProvider', 'filterCapabilities', 'contents' ];
  }

  if( -1 == sections.indexOf('serviceIdentification')) {
    delete sosDescripcion.serviceIdentification;
  }
  if( -1 == sections.indexOf('serviceProvider')) {
    delete sosDescripcion.serviceProvider;
  }
  if( -1 == sections.indexOf('filterCapabilities')) {
    delete sosDescripcion.filterCapabilities;
  }

  if( -1 != sections.indexOf('contents')) {
    contents = [];
    Sensor
    .find({})
    .select({'_id': 1, 'outputs.observedProperty': 1, 'inputs.observedProperty': 1, 'outputs.observationType': 1, 'inputs.observationType': 1})
    .exec(
      function(err, sensors) {
        if(err) return res.sendStatus(500);

        var asyncTasks = [];

        for ( var i = 0; i < sensors.length; i++ ) {
          var observedProperties = [];
          var observationTypes   = [];

          for ( var j = 0; j < sensors[i].outputs.length; j++) {
            if (-1 == observedProperties.indexOf(sensors[i].outputs[j].observedProperty)) {
              observedProperties.push(sensors[i].outputs[j].observedProperty);
            }
            if (-1 == observationTypes.indexOf(sensors[i].outputs[j].observationType)) {
              observationTypes.push(sensors[i].outputs[j].observationType);
            }

          }
          for ( var k = 0; k < sensors[i].inputs.length; k++) {
            if (-1 == observedProperties.indexOf(sensors[i].inputs[k].observedProperty)) {
              observedProperties.push(sensors[i].inputs[k].observedProperty);
            }
            if (-1 == observationTypes.indexOf(sensors[i].inputs[k].observationType)) {
              observationTypes.push(sensors[i].inputs[k].observationType);
            }
          }

          contentData.push({
            identifier           : sensors[i]._id,
            observableProperty   : observedProperties,
            observationType      :	observationTypes,
            responseFormat       :[ 'application/json' ],
            featureOfInterestType:[ 'SamplingPoint' ]
          });

          asyncTasks.push(function(callback){
            processObservationData(callback);
          });
        }

        async.parallel(asyncTasks, function() {
          sosDescripcion.contents = contents;
          res.status(200).jsonp(sosDescripcion);
        });

      }
    );
  } else {
    return res.status(200).jsonp(sosDescripcion);
  }
};
