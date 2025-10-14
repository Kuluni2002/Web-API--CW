const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: [true, 'Trip reference is required'],
        index: true
    },

    busRegistrationNumber: {
        type: String,
        required: [true, 'Bus registration number is required'],
        trim: true,
        uppercase: true,
        index: true
    },

    routeNumber: {
        type: String,
        required: [true, 'Route number is required'],
        trim: true,
        index: true
    },
     // Current actual stop name where bus is located
    stopName: {
        type: String,
        required: [true, 'Stop name is required'],
        trim: true,
        maxlength: [100, 'Stop name cannot exceed 100 characters']
    },

    stopSequence: {
        type: Number,
        required: [true, 'Stop sequence is required']
    },

      // Scheduled arrival time for this stop (from trip)
    scheduledArrival: {
        type: String,
        required: [true, 'Scheduled arrival time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Scheduled arrival must be in HH:MM format']
    },
    
       // When bus actually arrived at this stop
    actualArrival: {
        type: String,
        required: [true, 'Actual arrival time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual arrival must be in HH:MM format']
    },

      // Calculated delay in minutes (positive = late, negative = early)
    delayMinutes: {
        type: Number,
        required: [true, 'Delay minutes is required']
    },
    
    actualDeparture: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Actual departure must be in HH:MM format']
    },
    // Optional notes from operator
    notes: {
        type: String,
        trim: true,
        maxlength: [200, 'Notes cannot exceed 200 characters']
    },
    
    // Status of the bus at this location
    status: {
        type: String,
        enum: ['on-time', 'delayed', 'early', 'arrived', 'departed'],
        required: [true, 'Status is required']
    },
    
    timestamp: {
        type: Date,
        default: Date.now,
        required: [true, 'Timestamp is required']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for efficient queries
locationSchema.index({ busRegistrationNumber: 1, timestamp: -1 });
locationSchema.index({ trip: 1, timestamp: -1 });
locationSchema.index({ routeNumber: 1, timestamp: -1 });
locationSchema.index({ trip: 1, stopSequence: 1 });


// Virtual for time ago
locationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diffMs = now - this.timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
});

// Virtual for checking if location is recent
locationSchema.virtual('isRecent').get(function() {
    const now = new Date();
    const ageMs = now - this.timestamp;
    const ageMinutes = ageMs / 60000;
    return ageMinutes <= 15; // Consider recent if within 15 minutes
});


module.exports = mongoose.model('Location', locationSchema);