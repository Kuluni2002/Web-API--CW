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
    routeNumber: {
        type: String,
        required: [true, 'Route number is required'],
        trim: true,
        validate: {
            validator: async function(value) {
                const Route = mongoose.model('Route');
                const route = await Route.findOne({ routeNumber: value });
                return !!route;
            },
            message: 'Route number must exist in routes collection'
        }
    },
    
   scheduledDeparture: {
        type: String,
        required: [true, 'Scheduled departure time is required'],
        trim: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Scheduled departure must be in HH:MM format (e.g., 08:30, 14:15)']
    },
    scheduledArrival: {
        type: String,
        required: [true, 'Scheduled arrival time is required'],
        trim: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Scheduled arrival must be in HH:MM format (e.g., 10:30, 16:45)'],
        validate: {
            validator: function(value) {
                // Convert time strings to minutes for comparison
                const depMinutes = this.timeToMinutes(this.scheduledDeparture);
                const arrMinutes = this.timeToMinutes(value);
                return arrMinutes > depMinutes;
            },
            message: 'Scheduled arrival must be after scheduled departure'
        }
    },
    actualDeparture: {
        type: String,
        default: null,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual departure must be in HH:MM format']
    },
    actualArrival: {
        type: String,
        default: null,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual arrival must be in HH:MM format'],
        validate: {
            validator: function(value) {
                if (value && this.actualDeparture) {
                    const depMinutes = this.timeToMinutes(this.actualDeparture);
                    const arrMinutes = this.timeToMinutes(value);
                    return arrMinutes > depMinutes;
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

tripSchema.methods.timeToMinutes = function(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper method to get current time in HH:MM format
tripSchema.methods.getCurrentTime = function() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Indexes for efficient queries
//tripSchema.index({ runningNumber: 1 }, { unique: true });
tripSchema.index({ runningNumber: 1 }, { unique: true });
tripSchema.index({ busRegistrationNumber: 1 });
tripSchema.index({ routeNumber: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledDeparture: 1 });
tripSchema.index({ serviceType: 1 });

// Compound indexes for common queries
tripSchema.index({ routeNumber: 1, status: 1 });
tripSchema.index({ busRegistrationNumber: 1, status: 1 });
tripSchema.index({ scheduledDeparture: 1, status: 1 });
tripSchema.index({ busRegistrationNumber: 1, scheduledDeparture: 1 });

// Virtual for trip duration (scheduled) - Fixed for time strings
tripSchema.virtual('scheduledDuration').get(function() {
    if (this.scheduledDeparture && this.scheduledArrival) {
        const depMinutes = this.timeToMinutes(this.scheduledDeparture);
        const arrMinutes = this.timeToMinutes(this.scheduledArrival);
        return arrMinutes - depMinutes; // in minutes
    }
    return null;
});

// Virtual for actual duration - Fixed for time strings
tripSchema.virtual('actualDuration').get(function() {
    if (this.actualDeparture && this.actualArrival) {
        const depMinutes = this.timeToMinutes(this.actualDeparture);
        const arrMinutes = this.timeToMinutes(this.actualArrival);
        return arrMinutes - depMinutes; // in minutes
    }
    return null;
});

// Virtual for delay in minutes
tripSchema.virtual('delayMinutes').get(function() {
    if (this.actualDeparture && this.scheduledDeparture) {
        const schedMinutes = this.timeToMinutes(this.scheduledDeparture);
        const actualMinutes = this.timeToMinutes(this.actualDeparture);
        return actualMinutes - schedMinutes;
    }
    return null;
});

// Virtual to get bus details
tripSchema.virtual('busDetails', {
    ref: 'Bus',
    localField: 'busRegistrationNumber',
    foreignField: 'registrationNumber',
    justOne: true
});

// Virtual to get route details
tripSchema.virtual('routeDetails', {
    ref: 'Route',
    localField: 'routeNumber',
    foreignField: 'routeNumber',
    justOne: true
});

// Pre-save middleware for conflict checking
tripSchema.pre('save', async function(next) {
    if (this.isModified('busRegistrationNumber') || this.isModified('scheduledDeparture') || this.isModified('scheduledArrival')) {
        
        // Convert current trip times to minutes for comparison
        const currentDepMinutes = this.timeToMinutes(this.scheduledDeparture);
        const currentArrMinutes = this.timeToMinutes(this.scheduledArrival);
        
        // Find conflicts by checking if any existing trip overlaps
        const existingTrips = await this.constructor.find({
            _id: { $ne: this._id },
            busRegistrationNumber: this.busRegistrationNumber,
            status: { $in: ['scheduled', 'in-progress'] }
        });

        for (const trip of existingTrips) {
            const existingDepMinutes = this.timeToMinutes(trip.scheduledDeparture);
            const existingArrMinutes = this.timeToMinutes(trip.scheduledArrival);
            
            // Check for time overlap
            if (currentDepMinutes < existingArrMinutes && currentArrMinutes > existingDepMinutes) {
                const error = new Error(`Bus ${this.busRegistrationNumber} is already scheduled for another trip (${trip.runningNumber}) during this time period (${trip.scheduledDeparture} - ${trip.scheduledArrival})`);
                return next(error);
            }
        }
    }
    next();
});

// Instance method to start trip
tripSchema.methods.startTrip = function() {
    this.status = 'in-progress';
    this.actualDeparture = this.getCurrentTime();
    return this.save();
};

// Instance method to complete trip
tripSchema.methods.completeTrip = function() {
    this.status = 'completed';
    this.actualArrival = this.getCurrentTime();
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
    }).populate('busDetails routeDetails');
};

// Static method to find trips by route and date
tripSchema.statics.findTripsByRouteAndTime = function(routeNumber, startTime, endTime) {
    const filter = { routeNumber: routeNumber };
    
    if (startTime && endTime) {
        // For time-only comparison, we need to compare time strings
        filter.scheduledDeparture = { $gte: startTime, $lte: endTime };
    }
    
    return this.find(filter).populate('busDetails routeDetails');
};
// Static method to find trips by running number
tripSchema.statics.findByRunningNumber = function(runningNumber) {
    return this.findOne({ runningNumber: runningNumber.toUpperCase() })
        .populate('busDetails routeDetails');
};

// Static method to find available buses for a time slot
tripSchema.statics.findAvailableBuses = async function(startTime, endTime, excludeTripId = null) {
    // Convert time strings to minutes for comparison
    const timeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Find all trips that might conflict
    const allTrips = await this.find({
        _id: { $ne: excludeTripId },
        status: { $in: ['scheduled', 'in-progress'] }
    });
    
    // Filter trips that actually conflict with the time range
    const busyRegistrationNumbers = [];
    
    for (const trip of allTrips) {
        const tripStartMinutes = timeToMinutes(trip.scheduledDeparture);
        const tripEndMinutes = timeToMinutes(trip.scheduledArrival);
        
        // Check for time overlap
        if (startMinutes < tripEndMinutes && endMinutes > tripStartMinutes) {
            busyRegistrationNumbers.push(trip.busRegistrationNumber);
        }
    }
    
    const Bus = mongoose.model('Bus');
    return await Bus.find({
        registrationNumber: { $nin: busyRegistrationNumbers },
        status: 'active'
    });
};

// Static method to find trips by bus registration number
tripSchema.statics.findTripsByBus = function(registrationNumber) {
    return this.find({ busRegistrationNumber: registrationNumber })
        .populate('busDetails routeDetails')
        .sort({ scheduledDeparture: -1 });
};

module.exports = mongoose.model('Trip', tripSchema);