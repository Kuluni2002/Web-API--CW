const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    runningNumber: {
        type: String,
        required: [true, 'Running number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{2,4}\d{1,3}$/, 'Running number must be in format like CKN1, CGE2, MTP1']
    },
    bus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: [true, 'Bus is required']
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: [true, 'Route is required']
    },
    
    scheduledDeparture: {
        type: Date,
        required: [true, 'Scheduled departure time is required']
    },
    scheduledArrival: {
        type: Date,
        required: [true, 'Scheduled arrival time is required'],
        validate: {
            validator: function(value) {
                return value > this.scheduledDeparture;
            },
            message: 'Scheduled arrival must be after scheduled departure'
        }
    },
    actualDeparture: {
        type: Date,
        default: null
    },
    actualArrival: {
        type: Date,
        default: null,
        validate: {
            validator: function(value) {
                if (value && this.actualDeparture) {
                    return value > this.actualDeparture;
                }
                return true;
            },
            message: 'Actual arrival must be after actual departure'
        }
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
tripSchema.index({ bus: 1 });
tripSchema.index({ route: 1 });
tripSchema.index({ operator: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledDeparture: 1 });
tripSchema.index({ serviceType: 1 });

// Compound indexes for common queries
tripSchema.index({ route: 1, status: 1 });
tripSchema.index({ operator: 1, status: 1 });
tripSchema.index({ scheduledDeparture: 1, status: 1 });

// Virtual for trip duration (scheduled)
tripSchema.virtual('scheduledDuration').get(function() {
    if (this.scheduledDeparture && this.scheduledArrival) {
        return Math.round((this.scheduledArrival - this.scheduledDeparture) / (1000 * 60)); // in minutes
    }
    return null;
});

// Virtual for actual duration
tripSchema.virtual('actualDuration').get(function() {
    if (this.actualDeparture && this.actualArrival) {
        return Math.round((this.actualArrival - this.actualDeparture) / (1000 * 60)); // in minutes
    }
    return null;
});

// Instance method to start trip
tripSchema.methods.startTrip = function() {
    this.status = 'in-progress';
    this.actualDeparture = new Date();
    return this.save();
};

// Instance method to complete trip
tripSchema.methods.completeTrip = function() {
    this.status = 'completed';
    this.actualArrival = new Date();
    return this.save();
};

// Instance method to cancel trip
tripSchema.methods.cancelTrip = function() {
    this.status = 'cancelled';
    return this.save();
};

// Static method to find active trips
tripSchema.statics.findActiveTrips = function() {
    return this.find({ 
        status: { $in: ['scheduled', 'in-progress'] } 
    }).populate('bus route operator');
};

// Static method to find trips by route and date
tripSchema.statics.findTripsByRouteAndDate = function(routeId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.find({
        route: routeId,
        scheduledDeparture: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).populate('bus route operator');
};

// Static method to find trips by running number
tripSchema.statics.findByRunningNumber = function(runningNumber) {
    return this.findOne({ runningNumber: runningNumber.toUpperCase() })
        .populate('bus route operator');
};

module.exports = mongoose.model('Trip', tripSchema);