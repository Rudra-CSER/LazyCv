/*Require all the dependencies here */ 
const express = require('express');
const dotenv = require('dotenv')
dotenv.config();
const connectDB = require('./config/dataBase');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');

const authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');

/*all the middlewares here */ 
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true
}))
/*using all the routes here */      

app.use('/api/auth', authRouter);
connectDB();
app.use('/api/interview', interviewRouter);

// Friendly multipart/form-data errors (does not change core logic)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: err.message,
            code: err.code,
        });
    }
    return next(err);
});









module.exports = app;