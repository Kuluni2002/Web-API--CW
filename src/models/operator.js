const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Operator name is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Operator name must be at least 3 characters long'],
        maxlength: [100, 'Operator name cannot exceed 100 characters']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        trim: true,
        match: [/^(\+94|0)[0-9]{9}$/, 'Please enter a valid Sri Lankan contact number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    permitNumber: {
        type: String,
        required: [true, 'Permit number is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9]+$/, 'Permit number must contain only letters and numbers']
    }
    
}, {
    timestamps: true
});

// Index for efficient queries
//operatorSchema.index({ name: 1 });
//operatorSchema.index({ permitNumber: 1 });
//operatorSchema.index({ isActive: 1 });

// Instance method to toggle active status
operatorSchema.methods.toggleActive = function() {
    this.isActive = !this.isActive;
    return this.save();
};

// Static method to find active operators
operatorSchema.statics.findActiveOperators = function() {
    return this.find({ isActive: true });
};

// Static method to find by permit number
operatorSchema.statics.findByPermitNumber = function(permitNumber) {
    return this.findOne({ permitNumber: permitNumber.toUpperCase() });
};

module.exports = mongoose.model('Operator', operatorSchema);