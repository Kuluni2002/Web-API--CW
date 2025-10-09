const mongoose = require('mongoose');

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
    startLocation: {
        type: String,
        required: [true, 'Start location is required'],
        trim: true,
        minlength: [2, 'Start location must be at least 2 characters long'],
        maxlength: [100, 'Start location cannot exceed 100 characters']
    },
    endLocation: {
        type: String,
        required: [true, 'End location is required'],
        trim: true,
        minlength: [2, 'End location must be at least 2 characters long'],
        maxlength: [100, 'End location cannot exceed 100 characters']
    },
    distance: {
        type: Number,
        required: [true, 'Distance is required'],
        min: [0.1, 'Distance must be at least 0.1 km'],
        max: [1000, 'Distance cannot exceed 1000 km']
    },
    estimatedDuration: {
        hours: {
            type: Number,
            required: true,
            min: [0, 'Hours cannot be negative'],
            max: [12, 'Hours cannot exceed 10']
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

   stops: [{
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location ID is required']
        },
        order: {
            type: Number,
            required: [true, 'Stop order is required'],
            min: [1, 'Stop order must start from 1']
        },
        estimatedArrivalTime: {
            type: String,
            validate: {
                validator: function(v) {
                    // Validates HH:MM format (24-hour)
                    return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: 'Arrival time must be in HH:MM format (24-hour)'
            }
        }
    }],
}, {
    timestamps: true,
});

// Custom validation for the entire document
routeSchema.pre('validate', function(next) {
    // Ensure start and end locations are different
    if (this.startLocation && this.endLocation) {
        if (this.startLocation.toLowerCase() === this.endLocation.toLowerCase()) {
            this.invalidate('endLocation', 'Start and end locations must be different');
        }
    }
    
    // Ensure at least 2 stops
    if (this.stops && this.stops.length < 2) {
        this.invalidate('stops', 'Route must have at least 2 stops');
    }
    
    // Validate stop order sequence
    if (this.stops && this.stops.length > 1) {
        const orders = this.stops.map(stop => stop.order).sort((a, b) => a - b);
        const expectedOrders = Array.from({length: orders.length}, (_, i) => i + 1);
        
        if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
            this.invalidate('stops', 'Stop orders must be sequential starting from 1');
        }
    }
    
    next();
});

// Virtual for total minutes
routeSchema.virtual('totalMinutes').get(function() {
    return (this.estimatedDuration.hours * 60) + this.estimatedDuration.minutes;
});

// Virtual for formatted duration
routeSchema.virtual('formattedDuration').get(function() {
    const { hours, minutes } = this.estimatedDuration;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
});

// Index for efficient queries
//routeSchema.index({ routeNumber: 1 });
//routeSchema.index({ isActive: 1 });

// Virtual for stop count
routeSchema.virtual('stopCount').get(function() {
    return this.stops ? this.stops.length : 0;
});

// Instance method to toggle active status
routeSchema.methods.toggleActive = function() {
    this.isActive = !this.isActive;
    return this.save();
};

// Static method to find active routes
routeSchema.statics.findActiveRoutes = function() {
    return this.find({ isActive: true });
};

// Instance method to add stop
routeSchema.methods.addStop = function(locationId, order, arrivalTime) {
    // Check if order already exists
    const existingStop = this.stops.find(stop => stop.order === order);
    if (existingStop) {
        throw new Error(`Stop with order ${order} already exists`);
    }
    
    this.stops.push({
        locationId,
        order,
        estimatedArrivalTime: arrivalTime
    });
    
    // Sort stops by order
    this.stops.sort((a, b) => a.order - b.order);
    
    return this.save();
};

// Static method to find routes by operator
routeSchema.statics.findByOperator = function(operatorId) {
    return this.find({ operatorId }).populate('operatorId', 'name permitNumber contactNumber');
};

// Static method to find routes with stops populated
routeSchema.statics.findWithPopulatedStops = function(query = {}) {
    return this.find(query)
        .populate('operatorId', 'name permitNumber contactNumber')
        .populate('stops.locationId', 'name coordinates type address')
        .sort({ routeNumber: 1 });
};

// Index for efficient queries
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ operatorId: 1 });
routeSchema.index({ 'stops.locationId': 1 });

// Compound index for operator and status
routeSchema.index({ operatorId: 1, status: 1 });

// Transform function to clean up output
routeSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Route', routeSchema);