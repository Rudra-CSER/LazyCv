const mongoose = require("mongoose");

/**
 * -job description schema
 * -resume text : String
 * - Self description : String
 * 
 * -MatchScore : {
 *   technical : Number,
 *   behavioural : Number,
 *   overall : Number
 * }
 * -Techinal quistions :
 * [{
 *   quistion : "",
 *   intention : "",
 *   answer : "",
 *  }] 
 * -Behavioural quistions :
 *  [{
 *    quistion : "",
 *    intention : "",
 *    answer : "",
 * }]
 * -Skill gaps :
 *  [{ skill : "",
 *    severity : "",
 *    type : "",
 *    enum: ["low","medium","high"]
 *  }]
 * -Preparation Plan : [{
 *       day: Number,
 *       focus: String,
 *       task: [String]
 * }]
 * 
 */
const TechnicalQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Technical question is required"]
    },
    intention : {type : String,
        required : [true, "Intention is required"]
    },
    answer : {type : String,
        required : [true, "Answer is required"]
    }
},{
    _id:false
})

const BehavioralQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Behavioural quistion is required"]
    },
    intention : {type : String,
        required : [true, "Intention is required"]
    },
    answer : {type : String,
        required : [true, "Answer is required"]
    }
},{
    _id:false
})

const preparationPlanSchema = new mongoose.Schema({
    day:{
        type: Number ,
      required:[true,"Day is required "]
    },
    focus:{
        type: String ,
        required:[true , "Focus is required"]
    },
    task:{
        // AI may return a string or a list of strings; keep storage flexible.
        type: mongoose.Schema.Types.Mixed,
        required: [true , "Task is Required"]
    }
})

const skillGapsSchema = new mongoose.Schema({
    skill:{
        type:String,
        required:[true, "Skills is required"]
    },
    severity:{
        type:String,
        enum:["low","medium" , "high"],
        required : [true, "Severity is required"]
    },
},{_id:false})

const interviewReportSchema = new mongoose.Schema({
    jobDescription : {
        type : String,
        required : [true, "Job description is required"]},
    resumeText : {
        type : String,
        },
    selfDescription : {
        type : String },
    matchScore : {
        type : Number ,
        min : 0,
        max : 100,},
    technicalQuestions :[TechnicalQuestionSchema],
    behavioralQuestions:[BehavioralQuestionSchema],
    // Keep flexible because the AI schema has been inconsistent in some runs
    skillGaps: mongoose.Schema.Types.Mixed,
    preparationPlan:[preparationPlanSchema],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },title:{
        type:String ,
        required:[true , "Job title is required "]
    }
},{timestamps: true})

const interViewReportModel = mongoose.model("InterViewReport",interviewReportSchema)

module.exports = interViewReportModel;