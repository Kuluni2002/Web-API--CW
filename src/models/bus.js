const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{2,3}-\d{4}$/, 'Registration number must be in format XX-1234 or XXX-1234']
    },
    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        required: [true, 'Operator is required']
    },
    // 
    routeNumber: { type: String, required: true }, 
    type: {
        type: String,
        required: [true, 'Bus type is required'],
        enum: {
            values: ['Normal', 'Semi Luxury', 'Luxury'],
            message: 'Bus type must be either Normal, Semi Luxury, or Luxury'
        },
        default: 'Normal'
    }
}, {
    timestamps: true
});

// Index for efficient queries
//busSchema.index({ registrationNumber: 1 });
busSchema.index({ operator: 1 });
busSchema.index({ route: 1 });
busSchema.index({ type: 1 });

// Compound index for operator and route queries
busSchema.index({ operator: 1, route: 1 });

// Static method to find buses by operator
busSchema.statics.findByOperator = function(operatorId) {
    return this.find({ operator: operatorId }).populate('operator route');
};

// Static method to find buses by route
busSchema.statics.findByRoute = function(routeId) {
    return this.find({ route: routeId }).populate('operator route');
};

// Static method to find buses by type
busSchema.statics.findByType = function(type) {
    return this.find({ type: type }).populate('operator route');
};

// Instance method to get full bus details with populated references
busSchema.methods.getFullDetails = function() {
    return this.populate('operator route');
};

module.exports = mongoose.model('Bus', busSchema);