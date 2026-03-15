import axios from "axios";


const api = axios.create({
    baseURL:"",
    withCredentials:true
})

/**
 * 
 * @description Sevice to generate interview report based on user self description , resume and job
 */
export const generateInterviewReport =async ({jobDescription , selfDescription , resumeFile}) =>{
    const fromData = new FormData()
    fromData.append("jobDescription" , jobDescription)
    fromData.append("selfDescription",selfDescription)
    fromData.append("resume",resumeFile)

 const response = await api.post("/api/interview",fromData ,{
      headers:{
            "Content-Type":"multipart/form-data"
        }
    })
    return response.data
}

/**
 * @description Sevice to generate interview report by interviewId.
 */
export const getInterviewReportById =  async(interviewId) => {
 const response = await api.get(`/api/interview/report/${interviewId}`)
 return response.data
}
/**
 * @description Sevice to generate interview report of logged user .
 */
export const getAllInterviewReports = async()  =>{
    const response = await api.get("/api/interview/")
    return response.data
}

/**
 * @description Download interview report as PDF blob
 */
export const downloadInterviewPdf = async (interviewId) => {
    const response = await api.get(`/api/interview/pdf/${interviewId}`, { responseType: "blob" });
    return response.data;
}