const { OpenAI } = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");

const ai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z.number().describe("A score between 0 and 100 based on how well the candidate matches the job description"),
  technicalQuestions: z.array(
    z.object({
      question: z.string().describe("A technical interview question relevant to the role"),
      intention: z.string().describe("The interviewer's intention behind asking this question"),
      answer: z.string().describe("A strong answer covering key points and approach to impress the interviewer"),
    })
  ).describe("Technical questions that may be asked in the interview along with intentions and answers"),
  behavioralQuestions: z.array(
    z.object({
      question: z.string().describe("A behavioral interview question"),
      intention: z.string().describe("The interviewer's intention behind asking this question"),
      answer: z.string().describe("A strong STAR-format answer covering key points to impress the interviewer"),
    })
  ).describe("Behavioral questions that may be asked in the interview along with intentions and answers"),
  skillGaps: z.array(
    z.object({
      skill: z.string().describe("A skill the candidate is lacking based on the job requirements"),
      severity: z.enum(["low", "medium", "high"]).describe("How critical this gap is for the role"),
    })
  ).describe("Skills the candidate lacks compared to the job requirements, with severity levels"),
  preparationPlan: z.array(
    z.object({
      day: z.number().describe("Day number in the preparation plan, starting from 1"),
      focus: z.string().describe("The main topic or area to focus on this day"),
      task: z.string().describe("Specific actionable tasks to complete on this day"),
    })
  ).describe("A day-by-day preparation plan for the candidate to follow before the interview"),
  title: z.string().describe("The job title extracted from the job description"),
});
async function generateInterviewReport(resume, jobDescription, selfDescription) {
  const prompt = `Generate a comprehensive interview preparation report for a candidate.

Job Description:
${jobDescription}

Candidate Resume / Background:
${resume || "No resume provided"}

Candidate Self-Description:
${selfDescription || "No self-description provided"}

Analyze the candidate's fit for the role and generate a detailed, actionable interview report.`;

  const response = await ai.responses.parse({
    model: "gpt-4o-mini",
    input: prompt,
    text: {
      format: zodTextFormat(interviewReportSchema, "report"),
    },
  });

  return response.output_parsed;
  
}

module.exports = generateInterviewReport;
