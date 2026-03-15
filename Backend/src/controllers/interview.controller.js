const pdfParse = require('pdf-parse');
const generateInterviewReport = require('../services/ai.service');
const generatePdf = require('../services/pdf.service');
const interViewReportModel = require('../models/interviewReport.model');

/**
 * @description Controller to generate interview report based on user self description, resume and job description
 */
async function generateInterviewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required" });
    }

    if (!req.file && !selfDescription) {
      return res.status(400).json({ message: "Either a resume file or a self-description is required" });
    }

    let resumeText = "";
    if (req.file) {
      const resumeContent = await pdfParse(req.file.buffer);
      resumeText = resumeContent.text;
    }

    const interviewReportByAi = await generateInterviewReport(
      resumeText,
      jobDescription,
      selfDescription
    );

    const interviewReport = await interViewReportModel.create({
      user: req.user.id,
      resumeText,
      selfDescription,
      jobDescription,
      ...interviewReportByAi,
    });

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Interview report generation error:", error);
    res.status(500).json({
      message: "Failed to generate interview report",
      error: error.message,
    });
  }
}

/**
 * @description Controller to get interview report by interviewId
 */
async function generateInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;
    const interviewReport = await interViewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    res.status(200).json({
      message: "Interview report fetched successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Get report by ID error:", error);
    res.status(500).json({ message: "Failed to fetch interview report", error: error.message });
  }
}

/**
 * @description Controller to get all interview reports of logged in user
 */
async function generateInterviewReportsController(req, res) {
  try {
    const interviewReports = await interViewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resumeText -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

    res.status(200).json({
      message: "Interview reports fetched successfully",
      interviewReports,
    });
  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({ message: "Failed to fetch interview reports", error: error.message });
  }
}

/**
 * @description Controller to generate and stream a PDF of the interview report
 */
async function downloadInterviewPdfController(req, res) {
  try {
    const { interviewId } = req.params;
    const interviewReport = await interViewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    const pdfBuffer = await generatePdf(interviewReport);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="interview-report-${interviewId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
}

module.exports = { generateInterviewReportController, generateInterviewReportByIdController, generateInterviewReportsController, downloadInterviewPdfController };
