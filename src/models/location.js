const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: [true, 'Trip reference is required'],
        //index: true
    },
     // Current actual stop name where bus is located
    stopName: {
        type: String,
        required: [true, 'Stop name is required'],
        trim: true,
        maxlength: [100, 'Stop name cannot exceed 100 characters']
    },
    
    // When bus actually arrived at this stop
    actualArrival: {
        type: Date,
        default: Date.now,
        required: [true, 'Actual arrival time is required']
    },
    
    // When bus actually departed from this stop (optional)
    actualDeparture: {
        type: Date
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
        enum: ['arrived', 'departed', 'stopped'],
        default: 'arrived'
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
locationSchema.index({ trip: 1, timestamp: -1 });
locationSchema.index({ timestamp: -1 });
locationSchema.index({ trip: 1, stopName: 1 });


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

locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Location', locationSchema);