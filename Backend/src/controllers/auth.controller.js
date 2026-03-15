const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');

// Shared cookie options — must be identical for set and clear
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day in ms, matches JWT expiry
    path: '/',
};

/**
* name: registerUser
* @route POST api/auth/register
* @desc Register a new user , except uername  , email , password in body the request body
* @access Public
*/
async function registerUserController(req, res) {
    try {
        const {username, email, password} = req.body;

        if(!username || !email || !password) {
            return res.status(400).json({message: "Please provide Username , Email and Password"});
        }

        // Normalise to lowercase so lookups are case-insensitive
        const normalisedEmail    = email.trim().toLowerCase();
        const normalisedUsername = username.trim().toLowerCase();

        const isUserAlreadyExist = await userModel.findOne({
            $or:[{username: normalisedUsername}, {email: normalisedEmail}]
        });

        if(isUserAlreadyExist) {
           return res.status(400).json({message: "User Name or Email Already Exists"});
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: normalisedUsername,
            email: normalisedEmail,
            Password: hash
        });

        const token = jwt.sign(
            {id: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: '1d'}
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(201).json({message: "User Registered Successfully",
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('registerUserController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @name loginUserController
 * @route POST api/auth/login
 * @desc Login a user , except uername  , password in body the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({message: "Please provide Email and Password"});
        }

        // Normalise email so "User@Email.com" matches the stored "user@email.com"
        const normalisedEmail = email.trim().toLowerCase();

        const user = await userModel.findOne({email: normalisedEmail});

        if(!user) {
            return res.status(400).json({message: "Invalid Email or Password"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.Password);

        if(!isPasswordValid) {
            return res.status(400).json({message: "Invalid Email or Password"});
        }

        const token = jwt.sign(
            {id: user._id, username: user.username},
            process.env.JWT_SECRET,
            {expiresIn: '1d'}
        );

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({message: "User Logged In Successfully",
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('loginUserController error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * @name logoutUserController
 * @route GET /api/auth/logout
 * @desc clear token from cookie and add token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token;

    if(token){
        await tokenBlacklistModel.create({token});
    }

    // Pass matching options so the browser actually removes the cookie
    res.clearCookie("token", { path: COOKIE_OPTIONS.path, sameSite: COOKIE_OPTIONS.sameSite, secure: COOKIE_OPTIONS.secure });
    res.status(200).json({message: "User Logged Out Successfully"});
}

/**
 * @name getMeController
 * @route GET api/auth/get-me
 * @desc Get current logged in user details
 * @access Private
 */


async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "User Details Fetched Successfully",
        user:{
            id: user._id,
            username: user.username,   
            email: user.email
        }
    })
}


module.exports = {registerUserController , loginUserController ,logoutUserController , getMeController};