const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // ← Add this import
const jwt = require('jsonwebtoken');

const operatorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Operator name is required'],
       // unique: true,
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
        // unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    }
    
}, {
    timestamps: true
});

// Index for efficient queries
//operatorSchema.index({ name: 1 });


operatorSchema.pre('save', async function(next) {
    console.log('Pre-save middleware triggered'); // Debug log
    console.log('Password modified:', this.isModified('password')); // Debug log

    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }
    
    console.log('Hashing password...'); // Debug log
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
});


// operatorSchema.methods.matchPassword = async function(enteredPassword) {
//     console.log('Comparing passwords...'); // Debug log
//     const result = await bcrypt.compare(enteredPassword, this.password);
//     console.log('Password comparison result:', result); // Debug log
//     return result;
// };

operatorSchema.methods.matchPassword = async function(enteredPassword) {
    console.log('=== PASSWORD COMPARISON ===');
    console.log('Entered password:', enteredPassword);
    console.log('Stored hash (first 20 chars):', this.password ? this.password.substring(0, 20) + '...' : 'NO PASSWORD');
    console.log('bcrypt available:', typeof require('bcryptjs').compare === 'function');
    
    try {
        const result = await require('bcryptjs').compare(enteredPassword, this.password);
        console.log('Comparison result:', result);
        return result;
    } catch (error) {
        console.error('bcrypt.compare error:', error);
        return false;
    }
};


operatorSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Instance method to toggle active status
operatorSchema.methods.toggleActive = function() {
    this.isActive = !this.isActive;
    return this.save();
};

// Static method to find active operators
operatorSchema.statics.findActiveOperators = function() {
    return this.find({ isActive: true });
};


module.exports = mongoose.model('Operator', operatorSchema);