//File: models/sensor.js
var mongoose = require('mongoose'),
Schema       = mongoose.Schema;

var termSchema = new Schema({
  label:	{ type: String, required: true },
  value: 	{ type: String, required: true },
}, {_id: false});

var contactSchema = new Schema({
  individualName:	{ type: String },
  organisationName: { type: String },
  positionName:	{ type: String },
  contactInfo:	{ type: {
    address: 	{ type: {
      deliveryPoint:	{ type: String },
      postalCode: 	{ type: String },
      city: 		{ type: String },
      country: 	{ type: String, required: true },
      electronicMailAddress:{ type: String }
    }, required: true },
    linkage:	{ type: String }
  }, required: true }
}, {_id: false});

var quantitySchema = new Schema({
  name:		{ type: String, required: true },
  uom_code: 	{ type: String, required: true },
  observedProperty:{ type: String, required: true },
  observationType: { type: String, enum: ['String', 'Number', 'Boolean', 'Date', 'Buffer'], required: true }
}, {_id: false});

var sensorSchema = new Schema({
  description: 	{ type: String, required: true },
  keywords:	{ type: [String], required: true },
  identification:	{ type: [termSchema], required: true },
  classification:	{ type: [termSchema], required: true },
  contacts:	{ type: [contactSchema], required: true },
  featuresOfInterest: [{type: Schema.Types.ObjectId, ref: 'Feature', min:1, required: true}],
  outputs:	{ type: [quantitySchema], required: true },
  inputs:		{ type: [quantitySchema] }
});

module.exports = mongoose.model('Sensor', sensorSchema);
