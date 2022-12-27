const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/AppError");
const Feedback = require("./../models/feedbackModel");
const Post = require("./../models/postModel");
const APIFeatures = require("../utils/APIFeatures");

exports.getAllPostFeedback = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("This post does not exist", 404));

  const features = new APIFeatures(Feedback.find({ post: post._id }), req.query)
    .filter()
    .sort()
    .page();

  const feedback = await features.query;
  // const feedback = await Feedback.find({ post: post._id });

  res.status(200).json({
    status: "success",
    results: feedback.length,
    data: {
      feedback,
    },
  });
});

exports.createFeedback = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("This post does not exist", 404));

  //If user already liked post, we send an error
  if (req.body.type === "like") {
    const liked = await Feedback.findOne({
      user: req.user._id,
      post: post._id,
      type: "like",
    });

    if (liked) return next(new AppError("You already liked this post", 400));
    req.body.content = undefined;
  }

  if (
    req.body.type === "comment" &&
    (!req.body.content || !req.body.content.trim().length)
  )
    return next(new AppError("Comment must have a content", 400));
  const feedback = await Feedback.create({
    user: req.user._id,
    post: req.params.id,
    type: req.body.type,
    content: req.body.content,
  });

  res.status(201).json({
    status: "success",
    data: {
      type: feedback.type,
      feedback,
    },
  });
});

exports.getFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.feedbackId);
  if (!feedback)
    return next(new AppError("This like or comment does not exist", 404));

  res.status(200).json({
    status: "success",
    data: {
      feedback,
    },
  });
});

exports.updateFeedback = catchAsync(async (req, res, next) => {
  //check if feedback exists
  let feedback = await Feedback.findById(req.params.feedbackId);
  if (!feedback)
    return next(new AppError("This like or comment does not exist", 404));

  //check if feedback belongs to current user
  if (!feedback.user.equals(req.user._id) && req.user.role !== "admin")
    return next(
      new AppError("You are not allowed to perform this action", 403)
    );

  if (feedback.type === "like") req.body.content = undefined;

  feedback.content = req.body.content;
  feedback = await feedback.save();

  res.status(200).json({
    status: "success",
    data: {
      feedback,
    },
  });
});

exports.deleteFeedback = catchAsync(async (req, res, next) => {
  //check if feedback exists
  let feedback = await Feedback.findById(req.params.feedbackId);
  if (!feedback)
    return next(new AppError("This like or comment does not exist", 404));

  //check if feedback belongs to current user
  if (!feedback.user.equals(req.user._id) && req.user.role !== "admin")
    return next(
      new AppError("You are not allowed to perform this action", 403)
    );

  await Feedback.findByIdAndDelete(feedback._id);

  res.status(204).json({
    status: "success",
  });
});
