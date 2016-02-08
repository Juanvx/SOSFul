//File: models/sensor.js
var mongoose = require('mongoose'),
Schema       = mongoose.Schema;

var observationSchema = new Schema({
  type: 		{ type: String, enum: ['String', 'Number', 'Boolean', 'Date', 'Buffer'], required: true },
  sensor:		{ type: Schema.Types.ObjectId, required: true, ref: 'Sensor' },
  observedProperty:{ type: String, required: true },
  featureOfInterest: { type: Schema.Types.ObjectId, required: true, ref: 'Feature' },
  phenomenonTime:	{ type: Date, required: true },
  resultTime:	{ type: Date, required: true },
  result:		{ type: {
    uom_code: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true }
  }, required: true }
});

module.exports = mongoose.model('Observation', observationSchema);
