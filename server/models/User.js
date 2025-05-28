const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/dotEnvConfig'); // Adjust the path as needed

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'Nigeria'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    firstname: {
        type: String,
        required: true,
        trim: true,
    },
    lastname: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'],
        default: 'user',
    },
    profilePicture: {
        type: String,
        default: 'default.jpg',
    },
    addresses: [addressSchema],
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
}, { timestamps: true });

// Hash the password before saving it to the database
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
// Method to get fullname
userSchema.methods.getFullName = function () {
    return `${this.firstname} ${this.lastname}`;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;