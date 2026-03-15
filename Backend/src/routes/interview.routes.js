const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const interviewController = require('../controllers/interview.controller');
const {upload} = require('../middleware/file.middleware');

const interviewRouter = express.Router();
/**
 * @route POST api/interview
 * @desc Generate a interview report for a candidate, based on the basis of user self description , resume and job description
 * @access Private
 */
interviewRouter.post(
    '/',
    authMiddleware.authUser,
    upload.single("resume"),
    interviewController.generateInterviewReportController
  );
/** 
 * @route GET/api/interview/:interviewId
 * @description get interview report by interviewId
 * @access private
 */

interviewRouter.get("/report/:interviewId", authMiddleware.authUser , interviewController.generateInterviewReportByIdController)



/**
 * @route GET/api/interview 
 * @description get all interview reports of logged in users 
 * @access privet
 */

interviewRouter.get("/", authMiddleware.authUser , interviewController.generateInterviewReportsController)



/**
 * @route GET /api/interview/pdf/:interviewId
 * @description Generate and download a PDF of the interview report
 * @access Private
 */
interviewRouter.get("/pdf/:interviewId", authMiddleware.authUser, interviewController.downloadInterviewPdfController);

module.exports = interviewRouter;