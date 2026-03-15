const {Router} = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const authRouter = Router();


/** 
* @route POST api/auth/register
* @desc Register a new user
* @access Public
*/

authRouter.post("/register", authController.registerUserController)




/**
* 
* @route POST api/auth/login
* @desc Login a user with email and password
* @access Public
*/

authRouter.post("/login", authController.loginUserController)


/**
 * @name  logoutUserController
 * @route GET /api/auth/logout  
 * @desc clear token from cookie and add token in blacklist
 * @access public
 */
authRouter.get("/logout", authController.logoutUserController)

/** 
 * @name getMeController
 * @desc Get current logged in user details
 * @access Private
 */

authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

module.exports = authRouter;