const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');


async function authUser(req ,res,next) {
    const token = req.cookies.token || (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

     if(!token) {
        return res.status(401).json({message: "Unauthorized , No token found"});
     }  // middleware/auth.middeleware.js
     const isBlacklisted = await tokenBlacklistModel.findOne({token});
     if(isBlacklisted) {
        return res.status(401).json({message: "Unauthorized , Token is blacklisted"});
     }
     try{
    const decoded =  jwt.verify(token, process.env.JWT_SECRET)
         req.user = decoded;
         next();
    }catch(err) {
        return res.status(401).json({message: "Unauthorized , Invalid token"});
    }
 }




module.exports = {authUser};