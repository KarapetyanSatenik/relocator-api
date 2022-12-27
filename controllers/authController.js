const AppError = require("../utils/AppError");
const User = require("./../models/userModel");
const Pocket = require("./../models/pocketModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const sendEmail = require("./../utils/sendEmail");
const crypto = require("crypto");

const jwtSignPromise = (userId) => {
  return new Promise((reslove, reject) => {
    jwt.sign({ userId }, process.env.JWT_SECRET, (err, token) => {
      if (err) reject(err);
      else reslove(token);
    });
  });
};

const jwtVerifyPromise = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

const createSendToken = catchAsync(async (user, res) => {
  //Sign token

  // const token = await jwt.sign({ user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES,
  // });

  const token = await jwtSignPromise(user._id);

  //Cookies options
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 3600 * 1000
    ),
    secure: process.env.NODE_ENV === "production",
  };

  //attach the cookie to response
  res.cookie("jwt", token, cookieOptions);

  //send response
  res.status(200).json({
    status: "success",
    data: {
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        photo: user.photo,
      },
    },
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  //Create User
  const newUser = await User.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: req.body.password,
  });

  //Create user's pocket
  await Pocket.create({
    user: newUser._id,
  });

  await createSendToken(newUser, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //if email and password are provided with request
  if (!req.body.email || !req.body.password)
    return next(new AppError("You must specify your email and password", 400));

  //Check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("email or password are incorrect", 401));

  //Check if password is correct
  const validated = await user.correctPassword(req.body.password);
  if (!validated)
    return next(new AppError("email or password are incorrect", 401));

  //If everythin OK, send token
  await createSendToken(user, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  //Cookies options
  const cookieOptions = {
    httpOnly: true,
    maxAge: 1,
    secure: process.env.NODE_ENV === "production",
  };

  //attach the cookie to response
  res.cookie("jwt", "", cookieOptions);

  //send response
  res.status(200).json({
    status: "success",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //if jwt is provided
  if (!req.cookies || !req.cookies.jwt)
    return next(
      new AppError("You are not logged in, please login to continue", 401)
    );

  //decoding the jwt

  // const decoded = await promisify(jwt.verify)(
  //   req.cookies.jwt,
  //   process.env.JWT_SECRET
  // );

  const decoded = await jwtVerifyPromise(req.cookies.jwt);

  if (!decoded)
    return next(
      new AppError("You are not logged in, please login to continue", 401)
    );

  //if user still exists
  const user = await User.findById(decoded.userId);
  if (!user) return next(new AppError("This user does not exist", 401));

  //if Password has changed after jwt issued

  const changed = user.passwordChangedAfter(decoded.iat);
  if (changed)
    return next(
      new AppError(
        "You recently changed your password, please login to continue",
        401
      )
    );

  req.user = user;

  next();
});

exports.checkIfAdmin = catchAsync(async (req, res, next) => {
  if (!req.cookies || !req.cookies.jwt) return next();

  const decoded = await jwtVerifyPromise(req.cookies.jwt);

  if (!decoded) return next();

  //if user still exists
  const user = await User.findById(decoded.userId);
  if (!user) return next();

  //if Password has changed after jwt issued

  const changed = user.passwordChangedAfter(decoded.iat);
  if (changed) return next();

  if (!user.role === "admin") return next();
  req.user = user;

  next();
});

exports.restrictTo = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role)
      return next(
        new AppError("You are not allowed to access this route", 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Check if email is provided
  const { email } = req.body;
  if (!email)
    return next(
      new AppError("Please provide your email to reset you password", 400)
    );

  //check if user exists
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User does not exist", 400));

  //Create password reset token and send an email
  const resetToken = await user.createPasswordResetToken();
  // await user.save({ validateBeforeSave: false });
  await user.save();

  resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetPassword/${resetToken}`;

  const message = `Reset your password from this url : ${resetUrl}`;

  try {
    await sendEmail({
      from: "blogmanity@server.com",
      to: `${email}`,
      subject: `Blogmanity: Reset Your Password`,
      text: message,
    });

    res.status(200).json({
      status: "success",
      message: "token sent successfully, check your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("Error happened, email was not sent. Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //check if new password is sent
  const { password, email } = req.body;
  if (!password || !email)
    return next(new AppError("Please provide a password", 400));

  //get token from params
  const resetToken = req.params.token;

  //get user
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError("Email does not belong to any user", 400));

  //Verify if reset token is valid
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  if (
    !(hashedToken === user.passwordResetToken) ||
    Date.now() > user.resetTokenExpires
  )
    return next(new AppError("Token is not valid", 401));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.resetTokenExpires = undefined;
  user.passwordChangedAt = Date.now() - 1000;
  await user.save();

  await createSendToken(user, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!(await user.correctPassword(req.body.password)))
    return next(
      new AppError(
        "You password is wrong, please provide you correct password !"
      )
    );

  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now() - 1000;
  await user.save();

  await createSendToken(user, res);
});
