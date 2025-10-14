const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    runningNumber: {
        type: String,
        required: [true, 'Running number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{2,10}\d{1,3}$/, 'Running number must be in format like CKN1, CGE2, MTP1']
    },
    busRegistrationNumber: {
        type: String,
        required: [true, 'Bus registration number is required'],
        trim: true,
        uppercase: true
    },
    routeNumber: {
        type: String,
        required: [true, 'Route number is required'],
        trim: true,
        uppercase: true
    },
    scheduledDeparture: {
        type: String,
        required: [true, 'Scheduled departure time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Scheduled departure must be in HH:MM format']
    },
    scheduledArrival: {
        type: String,
        required: [true, 'Scheduled arrival time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Scheduled arrival must be in HH:MM format']
    },
    stops: [{
        locationName: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true,
            maxlength: [100, 'Location name cannot exceed 100 characters']
        },
        estimatedArrivalTime: {
            type: String,
            required: [true, 'Estimated arrival time is required'],
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Estimated arrival must be in HH:MM format']
        }
    }],
    actualDeparture: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual departure must be in HH:MM format']
    },
    actualArrival: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual arrival must be in HH:MM format']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
            values: ['scheduled', 'in-progress', 'completed', 'cancelled'],
            message: 'Status must be either scheduled, in-progress, completed, or cancelled'
        },
        default: 'scheduled'
    },
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        enum: {
            values: ['luxury', 'normal', 'semi-luxury'],
            message: 'Service type must be either luxury, normal, or semi-luxury'
        },
        default: 'normal'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
tripSchema.index({ runningNumber: 1 }, { unique: true });
tripSchema.index({ busRegistrationNumber: 1 });
tripSchema.index({ routeNumber: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledDeparture: 1 });

// Compound indexes for common queries
tripSchema.index({ routeNumber: 1, status: 1 });
tripSchema.index({ busRegistrationNumber: 1, status: 1 });

// Instance methods
tripSchema.methods.startTrip = function() {
    this.status = 'in-progress';
    this.actualDeparture = new Date().toTimeString().slice(0, 5);
    return this.save();
};

tripSchema.methods.completeTrip = function() {
    this.status = 'completed';
    this.actualArrival = new Date().toTimeString().slice(0, 5);
    return this.save();
};

tripSchema.methods.cancelTrip = function() {
    this.status = 'cancelled';
    return this.save();
};

// Static methods
tripSchema.statics.findActiveTrips = function() {
    return this.find({ 
        status: { $in: ['scheduled', 'in-progress'] } 
    });
};

tripSchema.statics.findByRunningNumber = function(runningNumber) {
    return this.findOne({ runningNumber: runningNumber.toUpperCase() });
};

module.exports = mongoose.model('Trip', tripSchema);