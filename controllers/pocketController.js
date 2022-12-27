const AppError = require("./../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const Pocket = require("./../models/pocketModel");
const Post = require("../models/postModel");

exports.getPocket = catchAsync(async (req, res, next) => {
  const pocket = await Pocket.findOne({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: pocket.posts.length,
    data: {
      pocket,
    },
  });
});

exports.addPostToPocket = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return next(new AppError("This post does not exist", 404));

  let pocket = await Pocket.findOne({ user: req.user._id });
  for (let i = 0; i < pocket.posts.length; i++) {
    if (pocket.posts[i].equals(post._id))
      return next(new AppError("This post already exists in your pocket", 400));
  }

  pocket = await Pocket.findOneAndUpdate(
    { user: req.user._id },
    {
      $push: { posts: post._id },
    },
    { new: true }
  );

  // pocket.posts.push(post._id);
  // pocket = await pocket.save();

  res.status(200).json({
    status: "success",
    data: {
      pocket,
    },
  });
});

exports.removePostFromPocket = catchAsync(async (req, res, next) => {
  //Get the pocket
  const pocket = await Pocket.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { posts: req.params.postId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      pocket,
    },
  });
});
