//File: models/feature.js
var mongoose = require('mongoose'),
Schema       = mongoose.Schema;

var crsSchema = new Schema({
	type:		{ type: String, required: true },
	properties:	{ type: {
				name: { type: String, required: true }
			}, required: true }
}, {_id: false});

var geometrySchema = new Schema({
	type: 	{ type: String, enum: ['Point'], required: true, default: 'Point' },
	coordinates: { type: [Number], required: true,  index: '2d' },
	crs: 	{ type: crsSchema, required: true }
}, {_id: false});

var featureSchema = new Schema({
	type: { type: String, required: true },
	sampledFeature: { type: Boolean, required: true },
	geometry:	{ type: geometrySchema, required: true }
});

module.exports = mongoose.model('Feature', featureSchema);
