import { useContext } from "react";
import {AuthContext} from "../aut.context.jsx"
import {InterviewContext} from "../../interview/interview.context.jsx"
import {login,register,logout,verifyOtp} from "../services/auth.api.js"


export const useAuth = () =>{
    const context = useContext(AuthContext)
    const interviewContext = useContext(InterviewContext)

    const {user,setUser,Loading,setLoading} = context
    const {setReports, setReport} = interviewContext

/** handeling user Login State */
    const handelLogin = async ({email,password}) =>{
        setLoading(true)
        try{
        const data = await login(email,password)
        setUser(data.user)
        return true
        }catch(error){console.log(error);
        return false
        }finally{
            setLoading(false)
        }

}
/** handeling user Register State — now returns { requiresOtp, email } or false */
const handelRegister = async ({username,email,password}) =>{
    setLoading(true)
    try {
        const data = await register(username,email,password)
        // Backend no longer creates the user here; it sends an OTP
        return { requiresOtp: data.requiresOtp, email: data.email }
    } catch(error) {
        console.log(error)
        return false
    } finally {
        setLoading(false)
    }
}

/** verify OTP and complete registration */
const handelVerifyOtp = async ({email, otp}) => {
    setLoading(true)
    try {
        const data = await verifyOtp(email, otp)
        setUser(data.user)
        return true
    } catch(error) {
        console.log(error)
        return false
    } finally {
        setLoading(false)
    }
}


/** handeling user Logout State */
const handelLogout = async () =>{
    setLoading(true)
    try {
        await logout()
    } catch(error) {
        console.log(error)
    } finally {
        setUser(null)
        // Clear cached interview data so the next user never sees a previous user's reports
        setReport(null)
        setReports([])
        setLoading(false)
    }
}


return {
    user,
    Loading,
    handelLogin,
    handelRegister,
    handelVerifyOtp,
    handelLogout}
}

