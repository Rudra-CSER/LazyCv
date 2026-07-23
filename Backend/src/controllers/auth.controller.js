const userModel = require('../models/user.model');
const otpModel  = require('../models/otp.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');
const { sendOtpEmail } = require('../services/email.service');

// Shared cookie options — must be identical for set and clear
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms, matches JWT expiry
    path: '/',
};

/** Generate a random 6-digit numeric OTP */
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
* @route POST /api/auth/register
* @desc  Validate fields, check uniqueness, send OTP email.
*        Does NOT create the user yet — that happens in verify-otp.
* @access Public
*/
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide Username, Email and Password' });
        }

        const normalisedEmail    = email.trim().toLowerCase();
        const normalisedUsername = username.trim().toLowerCase();

        const isUserAlreadyExist = await userModel.findOne({
            $or: [{ username: normalisedUsername }, { email: normalisedEmail }],
        });

        if (isUserAlreadyExist) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        // Hash password now so we can store it in the pending OTP record
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate OTP, hash it, save pending record (old record for same email is replaced)
        const otp     = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);

        await otpModel.deleteMany({ email: normalisedEmail }); // remove any previous attempt
        await otpModel.create({
            email: normalisedEmail,
            username: normalisedUsername,
            passwordHash,
            otpHash,
        });

        await sendOtpEmail(normalisedEmail, otp);

        return res.status(200).json({
            message: 'OTP sent to your email. Please verify to complete registration.',
            requiresOtp: true,
            email: normalisedEmail,
        });
    } catch (error) {
        console.error('registerUserController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @route POST /api/auth/verify-otp
 * @desc  Verify the OTP, create the user, and return a JWT cookie.
 * @access Public
 */
async function verifyOtpController(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const normalisedEmail = email.trim().toLowerCase();

        const pendingRecord = await otpModel.findOne({ email: normalisedEmail });

        if (!pendingRecord) {
            return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
        }

        const isOtpValid = await bcrypt.compare(String(otp).trim(), pendingRecord.otpHash);

        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP is correct — create the user and clean up
        const user = await userModel.create({
            username: pendingRecord.username,
            email: pendingRecord.email,
            Password: pendingRecord.passwordHash,
        });

        await otpModel.deleteMany({ email: normalisedEmail });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(201).json({
            message: 'Email verified. User registered successfully.',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('verifyOtpController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @route POST /api/auth/login
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide Email and Password' });
        }

        const normalisedEmail = email.trim().toLowerCase();

        const user = await userModel.findOne({ email: normalisedEmail });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.Password);

        console.log('[LOGIN DEBUG] password match:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: 'User Logged In Successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('loginUserController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @route GET /api/auth/logout
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token;

        if (token) {
            await tokenBlacklistModel.create({ token });
        }

        res.clearCookie('token', { path: COOKIE_OPTIONS.path, sameSite: COOKIE_OPTIONS.sameSite, secure: COOKIE_OPTIONS.secure });
        res.status(200).json({ message: 'User Logged Out Successfully' });
    } catch (error) {
        console.error('logoutUserController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @route GET /api/auth/get-me
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User Details Fetched Successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('getMeController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    registerUserController,
    verifyOtpController,
    loginUserController,
    logoutUserController,
    getMeController,
};
