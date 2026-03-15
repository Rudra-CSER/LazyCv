const mogoose = require('mongoose');

const userSchema = new mogoose.Schema({
    username: {
        type: String,
        required: [true, 'User Name is Required'],
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        trim: true,
        lowercase: true
    },
    Password: {
        type: String,
        required: [true, 'Password is Required']
    }
});

// ensure the two fields have unique indexes at the database level
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

const User = mogoose.model('Users', userSchema);

module.exports = User;