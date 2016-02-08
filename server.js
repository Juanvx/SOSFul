//File: server.js

var express     = require("express"),
bodyParser      = require("body-parser"),
methodOverride  = require("method-override");
mongoose        = require('mongoose');

var app = express();

//Read Docker params
var mongoURI = 'mongodb://localhost/sosful';
var nodePort = 3000;

var DOCKER_MONGO_URI = process.env.MONGO_PORT;
if ( DOCKER_MONGO_URI ) {
  mongoURI = DOCKER_MONGO_URI.replace( 'tcp', 'mongodb' ) + '/sosful';
}

var DOCKER_NODE_PORT = process.env.PORT;
if (DOCKER_NODE_PORT) {
  nodePort = DOCKER_NODE_PORT;
}

// Connection to DB
mongoose.connect(mongoURI, function(err, res) {
  if(err) throw err;
  console.log('Connected to Database');
});

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

// Import Models and controllers
var SensorModel      = require('./models/sensor')(app, mongoose);
var ObservationModel = require('./models/observation')(app, mongoose);
var FeatureModel     = require('./models/feature')(app, mongoose);

var CapabilityController  = require('./controllers/capability');
var SensorController      = require('./controllers/sensor');
var ObservationController = require('./controllers/observation');
var FeatureController     = require('./controllers/feature');

// Sensor router
var sensors = express.Router();

sensors.route('/sensor')
.get(SensorController.findAllSensors)
.post(SensorController.addSensor);

sensors.route('/sensor/:id')
.get(SensorController.findSensorById)
.put(SensorController.updateSensor)
.delete(SensorController.deleteSensor);

app.use(sensors);

// Observation router
var observations = express.Router();

observations.route('/observation')
.get(ObservationController.findAllObservations)
.post(ObservationController.addObservation);

observations.route('/observation/:id')
.get(ObservationController.findObservationById)
.put(ObservationController.updateObservation)
.delete(ObservationController.deleteObservation);

app.use(observations);

// Feature router
var features = express.Router();

features.route('/feature')
.get(FeatureController.findAllFeatures)
.post(FeatureController.addFeature);

features.route('/feature/:id')
.get(FeatureController.findFeatureById)
.put(FeatureController.updateFeature)
.delete(FeatureController.deleteFeature);

app.use(features);

// Capabilities router
var capabilities = express.Router();

capabilities.route('/')
.get(CapabilityController.getDescription);

app.use(capabilities);

app.use(function(err, req, res, next) {
  if (err) return res.sendStatus(400, err.message);
});

app.listen(nodePort, function() {
  console.log('SOSful running on http://localhost:' +  nodePort);
});
