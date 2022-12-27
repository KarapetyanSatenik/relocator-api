const multer = require("multer");

const Post = require("../models/postModel");
const User = require("../models/userModel");
const Pocket = require("../models/pocketModel");
const Feedback = require("../models/feedbackModel");
const AppError = require("../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const APIFeatures = require("../utils/APIFeatures");

//Users
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },

  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = file.originalname.split(".")[1];
  if (["jpg", "jpeg", "png"].includes(extension)) return cb(null, true);
  else
    return cb(
      new AppError("Only images are allowed, pleae upload an image.", 400)
    );
};
const upload = multer({ storage, fileFilter });

exports.uploadUserPhoto = upload.single("photo");

exports.updateMe = catchAsync(async (req, res, next) => {
  let filename = undefined;
  if (req.file) filename = req.file.filename;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      photo: filename,
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = {
    firstname: req.user.firstname,
    lastname: req.user.lastname,
    photo: req.user.photo,
    email: req.user.email,
  };
  res.status(200).json({
    status: "suuccess",
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!req.body.password || !(await user.correctPassword(req.body.password)))
    return next(new AppError("You provided a wrong password", 400));
  user.active = false;
  await user.save();

  res.status(204).json({
    status: "success",
  });
});

//Admin

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find().select("+active"), req.query)
    .filter()
    .sort()
    .page();
  const users = await features.query;
  // const users = await User.find().select("+active");
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+active");
  if (!user) return next(new AppError("This user does not exist", 404));

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("This user does not exist", 404));

  user.firstname = req.body.firstname || user.firstname;
  user.lastname = req.body.lastname || user.lastname;
  user.photo = req.body.photo || user.photo;
  user.email = req.body.email || user.email;
  user.active = req.body.active || user.active;
  user.role = req.body.role || user.role;

  await user.save();

  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  //Delete user
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("This user does not exists", 404));

  //Delete his pocket, posts and feedback
  await Pocket.findOneAndDelete({ user: user._id });
  await Post.deleteMany({ user: user._id });
  await Feedback.deleteMany({ user: user._id });

  res.status(204).json({
    status: "success",
  });
});
