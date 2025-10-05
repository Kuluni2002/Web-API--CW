const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: [true, 'Trip reference is required'],
        //index: true
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90 degrees'],
        max: [90, 'Latitude must be between -90 and 90 degrees']
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180 degrees'],
        max: [180, 'Longitude must be between -180 and 180 degrees']
    },
    heading: {
        type: Number,
        min: [0, 'Heading must be between 0 and 360 degrees'],
        max: [360, 'Heading must be between 0 and 360 degrees']
    },
    accuracy: {
        type: Number,
        default: 0,
        min: [0, 'Accuracy cannot be negative']
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: [true, 'Timestamp is required']
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
locationSchema.index({ trip: 1 });
locationSchema.index({ timestamp: 1 });

// Compound index for time-series queries
locationSchema.index({ trip: 1, timestamp: 1 });

// Index for geospatial queries
locationSchema.index({ latitude: 1, longitude: 1 });

// Virtual for coordinates array (useful for mapping libraries)
locationSchema.virtual('coordinates').get(function() {
    return [this.longitude, this.latitude];
});

// Virtual for GeoJSON point format
locationSchema.virtual('geoLocation').get(function() {
    return {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
    };
});

// Static method to get latest location for a trip
locationSchema.statics.getLatestLocation = function(tripId) {
    return this.findOne({ trip: tripId })
        .sort({ timestamp: -1 })
        .populate('trip');
};

// Static method to get location history for a trip
locationSchema.statics.getLocationHistory = function(tripId, limit = 100) {
    return this.find({ trip: tripId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('trip');
};

// Static method to get locations within a time range
locationSchema.statics.getLocationsByTimeRange = function(tripId, startTime, endTime) {
    return this.find({
        trip: tripId,
        timestamp: {
            $gte: startTime,
            $lte: endTime
        }
    }).sort({ timestamp: 1 });
};

// Instance method to calculate distance from another location
locationSchema.methods.distanceTo = function(otherLocation) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (otherLocation.latitude - this.latitude) * Math.PI / 180;
    const dLon = (otherLocation.longitude - this.longitude) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.latitude * Math.PI / 180) * Math.cos(otherLocation.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
};

module.exports = mongoose.model('Location', locationSchema);