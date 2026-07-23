const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otpHash: {
        type: String,
        required: true,
    },
    // pending registration data — stored here until OTP is verified
    username: { type: String, required: true },
    passwordHash: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // TTL: auto-delete after 10 minutes
    },
});

module.exports = mongoose.model('Otp', otpSchema);
