const mongoose = require('mongoose');

const busLocationSchema = new mongoose.Schema({
    busRegistrationNumber: {
        type: String,
        required: [true, 'Bus registration number is required'],
        trim: true,
        uppercase: true,
        validate: {
            validator: async function(value) {
                const Bus = mongoose.model('Bus');
                const bus = await Bus.findOne({ registrationNumber: value, status: 'active' });
                return !!bus;
            },
            message: 'Bus registration number must exist and be active'
        }
    },
    coordinates: {
        latitude: {
            type: Number,
            required: [true, 'Latitude is required'],
            min: [5.9, 'Latitude must be within Sri Lanka bounds'],
            max: [9.9, 'Latitude must be within Sri Lanka bounds']
        },
        longitude: {
            type: Number,
            required: [true, 'Longitude is required'],
            min: [79.6, 'Longitude must be within Sri Lanka bounds'],
            max: [81.9, 'Longitude must be within Sri Lanka bounds']
        }
    },
    speed: {
        type: Number,
        required: [true, 'Speed is required'],
        min: [0, 'Speed cannot be negative'],
        max: [120, 'Speed cannot exceed 120 km/h for buses'],
        default: 0
    },
    heading: {
        type: Number,
        required: [true, 'Heading direction is required'],
        min: [0, 'Heading must be between 0 and 360 degrees'],
        max: [360, 'Heading must be between 0 and 360 degrees'],
        default: 0
    },
    timestamp: {
        type: Date,
        required: [true, 'Timestamp is required'],
        default: Date.now,
        validate: {
            validator: function(value) {
                return value <= new Date();
            },
            message: 'Timestamp cannot be in the future'
        }
    }
   
}, {
    timestamps: true
});

// Indexes for efficient queries
busLocationSchema.index({ busRegistrationNumber: 1, timestamp: -1 });
busLocationSchema.index({ "coordinates": "2dsphere" });
busLocationSchema.index({ timestamp: -1 });
//busLocationSchema.index({ isOnline: 1 });

// Static method to get latest location for a bus
busLocationSchema.statics.getLatestLocation = function(busRegistrationNumber) {
    return this.findOne({ 
        busRegistrationNumber: busRegistrationNumber.toUpperCase(),
        timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
    }).sort({ timestamp: -1 });
};

// Static method to get all active bus locations
busLocationSchema.statics.getAllActiveBuses = function() {
    return this.aggregate([
        { 
            $match: { 
                isOnline: true,
                timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
            } 
        },
        { $sort: { busRegistrationNumber: 1, timestamp: -1 } },
        { 
            $group: {
                _id: "$busRegistrationNumber",
                latestLocation: { $first: "$$ROOT" }
            }
        },
        { $replaceRoot: { newRoot: "$latestLocation" } },
        { $sort: { timestamp: -1 } }
    ]);
};

module.exports = mongoose.model('BusLocation', busLocationSchema);