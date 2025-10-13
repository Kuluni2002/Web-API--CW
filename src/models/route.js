const mongoose = require('mongoose');

// Schema for individual stops on a route
const stopSchema = new mongoose.Schema({
    locationName: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true,
        maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    estimatedArrivalTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        required: [true, 'Estimated arrival time is required'],
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Estimated arrival must be in HH:MM format'
        }
    }
   
});

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
        maxlength: [150, 'Route name cannot exceed 150 characters']
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
            required: [true, 'Hours are required'],
            min: [0, 'Hours cannot be negative'],
            max: [12, 'Hours cannot exceed 12']
        },
        minutes: {
            type: Number,
            required: [true, 'Minutes are required'],
            min: [0, 'Minutes cannot be negative'],
            max: [59, 'Minutes cannot exceed 59']
        }
    },
    stops: {
        type: [stopSchema],
        validate: [
            {
                validator: function(stops) {
                    return stops && stops.length >= 2;
                },
                message: 'Route must have at least 2 stops (start and end)'
            },
            {
                validator: function(stops) {
                    return stops && stops.length <= 50;
                },
                message: 'Route cannot have more than 50 stops'
            }
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// **CUSTOM VALIDATIONS (Pre-save middleware)**
routeSchema.pre('validate', function(next) {
    // Ensure start and end locations are different
    if (this.origin && this.destination) {
        if (this.origin.toLowerCase().trim() === this.destination.toLowerCase().trim()) {
            this.invalidate('destination', 'Origin and destination must be different');
        }
    }
    
    next();
});

// **INDEXES for efficient queries**
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ origin: 1 });
routeSchema.index({ destination: 1 });
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ isActive: 1 });
routeSchema.index({ 'stops.locationName': 1 });

// **VIRTUAL FIELDS**
routeSchema.virtual('totalStops').get(function() {
    return this.stops ? this.stops.length : 0;
});

routeSchema.virtual('totalMinutes').get(function() {
    if (!this.estimatedDuration) return 0;
    return (this.estimatedDuration.hours * 60) + this.estimatedDuration.minutes;
});

routeSchema.virtual('formattedDuration').get(function() {
    if (!this.estimatedDuration) return 'Unknown';
    const { hours, minutes } = this.estimatedDuration;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
});


// Get stop by location name (fuzzy matching)
routeSchema.methods.getStopByLocationName = function(locationName) {
    if (!this.stops || !locationName) return null;
    
    const searchTerm = locationName.toLowerCase().trim();
    
    return this.stops.find(stop => {
        const stopName = stop.locationName.toLowerCase().trim();
        return stopName.includes(searchTerm) || searchTerm.includes(stopName);
    });
};

// Get next stop after current location
routeSchema.methods.getNextStop = function(currentLocationName) {
    if (!this.stops || !currentLocationName) return null;
    
    const currentIndex = this.stops.findIndex(stop => {
        const stopName = stop.locationName.toLowerCase().trim();
        const searchTerm = currentLocationName.toLowerCase().trim();
        return stopName.includes(searchTerm) || searchTerm.includes(stopName);
    });
    
    if (currentIndex !== -1 && currentIndex < this.stops.length - 1) {
        return this.stops[currentIndex + 1];
    }
    
    return null; // No next stop found
};

// Get previous stop before current location
routeSchema.methods.getPreviousStop = function(currentLocationName) {
    if (!this.stops || !currentLocationName) return null;
    
    const currentIndex = this.stops.findIndex(stop => {
        const stopName = stop.locationName.toLowerCase().trim();
        const searchTerm = currentLocationName.toLowerCase().trim();
        return stopName.includes(searchTerm) || searchTerm.includes(stopName);
    });
    
    if (currentIndex > 0) {
        return this.stops[currentIndex - 1];
    }
    
    return null; // No previous stop found
};

// Get all stops between two locations
routeSchema.methods.getStopsBetween = function(fromLocation, toLocation) {
    if (!this.stops || !fromLocation || !toLocation) return [];
    
    const fromIndex = this.stops.findIndex(stop => {
        const stopName = stop.locationName.toLowerCase().trim();
        const searchTerm = fromLocation.toLowerCase().trim();
        return stopName.includes(searchTerm) || searchTerm.includes(stopName);
    });
    
    const toIndex = this.stops.findIndex(stop => {
        const stopName = stop.locationName.toLowerCase().trim();
        const searchTerm = toLocation.toLowerCase().trim();
        return stopName.includes(searchTerm) || searchTerm.includes(stopName);
    });
    
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        return this.stops.slice(fromIndex, toIndex + 1);
    }
    
    return [];
};

// Check if route passes through a location
routeSchema.methods.passesThrough = function(locationName) {
    return this.getStopByLocationName(locationName) !== null;
};


// Find routes between two locations
routeSchema.statics.findRoutesBetween = function(fromLocation, toLocation) {
    const fromRegex = new RegExp(fromLocation, 'i');
    const toRegex = new RegExp(toLocation, 'i');
    
    return this.find({
        isActive: true,
        $and: [
            { 'stops.locationName': fromRegex },
            { 'stops.locationName': toRegex }
        ]
    });
};

// **JSON TRANSFORMATION**
routeSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);