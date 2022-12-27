const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const globalErrorHandler = require("./utils/globalErrorHandler");
const AppError = require("./utils/AppError");

const app = express();

//Set secure HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === "development") app.use(morgan("tiny"));

//limit request from one IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api", limiter);

//Parsers
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//XSS sanitization
app.use(xss());

//Parameters pollution
app.use(hpp());

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
