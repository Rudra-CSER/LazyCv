const pdfParse = require('pdf-parse');
const generateInterviewReport = require('../services/ai.service');
const { generatePdf, generatePdfFromCv } = require('../services/pdf.service');
const { generateTailoredResume, structuredToCv } = require('../services/resume.service');
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
 * @description Download a job-tailored resume PDF.
 *
 * Flow:
 *  1. Fetch the saved interview report (resumeText, jobDescription, selfDescription, title).
 *  2. Call OpenAI to rewrite the resume content so it is optimised for that specific job.
 *  3. Convert the structured AI output to the cv object the PDF template expects.
 *  4. Render and stream the A4 PDF using the existing template in pdf.service.js.
 *
 * If the AI call fails for any reason we fall back to the original raw-text render
 * so the user always gets a downloadable file.
 */
async function downloadInterviewPdfController(req, res) {
  try {
    const { interviewId } = req.params;
    const interviewReport = await interViewReportModel.findOne({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    const report = typeof interviewReport.toObject === "function"
      ? interviewReport.toObject()
      : interviewReport;

    let pdfBuffer;

    try {
      // ── AI-tailored path ────────────────────────────────────────────────
      const tailored = await generateTailoredResume(
        report.resumeText,
        report.jobDescription,
        report.selfDescription,
        report.title,
      );
      const cv = structuredToCv(tailored, report);
      pdfBuffer = await generatePdfFromCv(cv);
    } catch (aiErr) {
      // ── Fallback: raw resume text → template (no AI tailoring) ──────────
      console.warn("AI tailoring failed, falling back to raw resume render:", aiErr.message);
      pdfBuffer = await generatePdf(report);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="resume-${interviewId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
}

module.exports = { generateInterviewReportController, generateInterviewReportByIdController, generateInterviewReportsController, downloadInterviewPdfController };
