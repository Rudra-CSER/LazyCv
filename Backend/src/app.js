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
const corsOptions = {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
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

// Generic catch-all error handler — must be last
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});









module.exports = app;