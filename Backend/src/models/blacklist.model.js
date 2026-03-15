const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to added in blacklist"]
    }
},{
    timestamps: true
});

// Auto-delete blacklist entries after 24 hours (matches JWT expiry)
// so the collection never grows unboundedly
blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const tokenBlacklistModel = mongoose.model("TokenBlacklist", blacklistSchema);

module.exports = tokenBlacklistModel;