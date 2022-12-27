const AppError = require("./AppError");

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path} : ${err.value}`, 400);
};

const handleDuplicateErrorDB = (err) => {
  return new AppError(
    `This ${Object.keys(err.keyPattern)} already exists`,
    400
  );
};

const handleValidationErrorDB = (err) => {
  return new AppError(`Invalid inputs : ${Object.keys(err.errors)}`, 400);
};

const sendErrorProd = (err, req, res) => {
  //Operational errors : trusted errors that we created
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Uknown errors: not trusted
  console.log("ERROR 🎃", err);
  return res.status(err.statusCode).json({
    status: err.status,
    message: "Something went wrong, try again later !",
  });
};

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  //Define statusCode and status for none operationa errors
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateErrorDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
  }
};

module.exports = globalErrorHandler;
