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
     permitNumber: {
        type: String,
        required: [true, 'Permit number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]+$/, 'Permit number must contain only letters and numbers']
    },

    operator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        required: [true, 'Operator is required']
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
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance', 'retired'],
        default: 'active'
    },
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
busSchema.index({ registrationNumber: 1 }, { unique: true });
busSchema.index({ permitNumber: 1 }, { unique: true });
busSchema.index({ operator: 1 });
busSchema.index({ routeNumber: 1 });
busSchema.index({ type: 1 });
busSchema.index({ status: 1 });

// Compound index for operator and route queries
busSchema.index({ operator: 1, routeNumber: 1 });
busSchema.index({ routeNumber: 1, status: 1 });

// Virtual to populate route details
busSchema.virtual('routeDetails', {
    ref: 'Route',
    localField: 'routeNumber',
    foreignField: 'routeNumber',
    justOne: true
});

// Virtual to populate operator details
busSchema.virtual('operatorDetails', {
    ref: 'Operator',
    localField: 'operator',
    foreignField: '_id',
    justOne: true
});

// Virtual for permit status
busSchema.virtual('permitStatus').get(function() {
    const now = new Date();
    if (this.validityDate < now) {
        return 'expired';
    } else if (this.validityDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        return 'expiring_soon';
    }
    return 'valid';
});

// Static method to find buses by operator
busSchema.statics.findByOperator = function(operatorId) {
    return this.find({ operator: operatorId })
        .populate('operatorDetails', 'name email phone')
        .populate('routeDetails', 'routeNumber origin destination');
};

busSchema.statics.findByRoute = function(routeNumber) {
    return this.find({ routeNumber: routeNumber, status: 'active' })
        .populate('operatorDetails', 'name email')
        .populate('routeDetails', 'routeNumber origin destination');
};

// Static method to find buses by type
busSchema.statics.findByType = function(type) {
    return this.find({ type: type })
        .populate('operatorDetails', 'name email')
        .populate('routeDetails', 'routeNumber origin destination');
};

// Instance method to get full bus details with populated references
busSchema.methods.getFullDetails = function() {
    return this.populate('operatorDetails routeDetails');
};

module.exports = mongoose.model('Bus', busSchema);