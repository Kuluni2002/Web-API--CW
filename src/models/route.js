const mongoose = require('mongoose');

// Schema for individual stops on a route
const stopSchema = new mongoose.Schema({
    locationName: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
        maxlength: [100, 'Location name cannot exceed 100 characters']
    },

    // Estimated arrival time at this stop
    estimatedArrivalTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        required: [true, 'Estimated arrival time is required'],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Estimated arrival must be in HH:MM format'
        }
    },

    // Estimated departure time from this stop
    estimatedDepartureTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        required: [true, 'Estimated departure time is required'],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Estimated departure must be in HH:MM format'
        }
    },

    // Estimated travel time to next stop (in minutes)
    travelTimeToNext: {
        type: Number,
        min: [0, 'Travel time cannot be negative']
    }
}, { _id: false });

const routeSchema = new mongoose.Schema({
    routeNumber: {
        type: String,
        required: [true, 'Route number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]+$/, 'Route number must contain only letters and numbers']
    },
    name: {
        type: String,
        required: [true, 'Route name is required'],
        trim: true,
        minlength: [3, 'Route name must be at least 3 characters long'],
        maxlength: [100, 'Route name cannot exceed 100 characters']
    },
    origin: {
        type: String,
        required: [true, 'Origin location is required'],
        trim: true,
        minlength: [2, 'Origin location must be at least 2 characters long'],
        maxlength: [100, 'Origin location cannot exceed 100 characters']
    },
    destination: {
        type: String,
        required: [true, 'Destination location is required'],
        trim: true,
        minlength: [2, 'Destination location must be at least 2 characters long'],
        maxlength: [100, 'Destination location cannot exceed 100 characters']
    },
    totalDistance: {
        type: Number,
        required: [true, 'Total distance is required'],
        min: [0.1, 'Total distance must be at least 0.1 km'],
        max: [1000, 'Total distance cannot exceed 1000 km']
    },
    estimatedDuration: {
        hours: {
            type: Number,
            required: true,
            min: [0, 'Hours cannot be negative'],
            max: [12, 'Hours cannot exceed 12']
        },
        minutes: {
            type: Number,
            required: true,
            min: [0, 'Minutes cannot be negative'],
            max: [59, 'Minutes cannot exceed 59']
        }
    },

    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        required: [true, 'Operator ID is required']
    },

    stops: [stopSchema],

 // Operating status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

// Custom validation for the entire document
routeSchema.pre('validate', function(next) {
    // Ensure start and end locations are different
    if (this.origin && this.destination) {
        if (this.origin.toLowerCase() === this.destination.toLowerCase()) {
            this.invalidate('destination', 'Start and end locations must be different');
        }
    }
    
    // Ensure at least 2 stops
    if (this.stops && this.stops.length < 2) {
        this.invalidate('stops', 'Route must have at least 2 stops');
    }
    
    
    next();
});

// Indexes
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ operatorId: 1 });
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ isActive: 1 });


// Virtual to get total stops count
routeSchema.virtual('totalStops').get(function() {
    return this.stops.length;
});

// Virtual for total minutes
routeSchema.virtual('totalMinutes').get(function() {
    return (this.estimatedDuration.hours * 60) + this.estimatedDuration.minutes;
});

// Virtual to get formatted duration
routeSchema.virtual('formattedDuration').get(function() {
    const { hours, minutes } = this.estimatedDuration;
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${minutes}m`;
});

// Index for efficient queries
//routeSchema.index({ routeNumber: 1 });
//routeSchema.index({ isActive: 1 });


// Method to get next stop by array index
routeSchema.methods.getNextStop = function(currentLocationName) {
    const currentIndex = this.stops.findIndex(stop => 
        stop.locationName.toLowerCase().includes(currentLocationName.toLowerCase()) ||
        currentLocationName.toLowerCase().includes(stop.locationName.toLowerCase())
    );
    
    if (currentIndex !== -1 && currentIndex < this.stops.length - 1) {
        return this.stops[currentIndex + 1];
    }
    
    return null;
};

// Method to get stop by location name
routeSchema.methods.getStopByLocationName = function(locationName) {
    return this.stops.find(stop => 
        stop.locationName.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(stop.locationName.toLowerCase())
    );
};

routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);