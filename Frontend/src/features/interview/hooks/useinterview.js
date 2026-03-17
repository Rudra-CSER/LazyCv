import { getAllInterviewReports , getInterviewReportById , generateInterviewReport, downloadInterviewPdf } from "../services/interview.api";
import { InterviewContext } from "../interview.context";
import {useContext} from "react";
export const useInterview = () => {
 
 const context = useContext(InterviewContext)
 if(!context){
    throw new Error("useInterview must be used within InterviewProvider")
 }
 const {report , loading , setReport , setLoading , reports , setReports} = context
 
  const generateReport = async({jobDescription , selfDescription , resumeFile}) => {
    setLoading(true)
    try {
        const response = await generateInterviewReport({jobDescription , selfDescription , resumeFile})
        setReport(response.interviewReport)
        return response.interviewReport
    } catch (error) {
        console.log(error)
        return null
    } finally {
        setLoading(false)
    }
  }

   const getReportById = async(interviewId) => {
    setLoading(true)
    try {
        const response = await getInterviewReportById(interviewId)
        setReport(response.interviewReport)
        return response.interviewReport
    } catch (error) {
        console.log(error)
        return null
    } finally {
        setLoading(false)
    }
   }
   const getReports = async() => {
    setLoading(true)
    try {
        const response = await getAllInterviewReports()
        setReports(response.interviewReports)
        return response.interviewReports
    } catch (error) {
        console.log(error)
        return null
    } finally {
        setLoading(false)
    }
   }

   const downloadPdf = async (interviewId) => {
    try {
        const blob = await downloadInterviewPdf(interviewId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-report-${interviewId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
   }

    return {
        report,
        loading,
        setReport,
        setLoading,
        reports,
        setReports,
        generateReport,
        getReportById,
        getReports,
        downloadPdf,
    }
}