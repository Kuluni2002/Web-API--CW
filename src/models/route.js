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
    stops: {
        type: [String],
        required: [true, 'At least one stop is required'],
        validate: {
            validator: function(stops) {
                return stops && stops.length >= 2;
            },
            message: 'Route must have at least 2 stops (start and end)'
        }
    }
}, {
    timestamps: true,

    validate: {
        validator: function() {
            return this.startLocation.toLowerCase() !== this.endLocation.toLowerCase();
        },
        message: 'Start and end locations must be different'
    }
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

module.exports = mongoose.model('Route', routeSchema);