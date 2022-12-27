const multer = require("multer");

const AppError = require("../utils/AppError");
const catchAsync = require("./../utils/catchAsync");
const Post = require("./../models/postModel");
const Feedback = require("../models/feedbackModel");
const Pocket = require("../models/pocketModel");
const APIFeatures = require("./../utils/APIFeatures");

exports.getAllPosts = catchAsync(async (req, res) => {
  let fields = "";
  let opts = {};
  if (!req.user || req.user.role !== "admin") {
    fields = "-content -__v";
    opts = { validated: { $ne: false } };
  }

  const features = new APIFeatures(Post.find(opts).select(fields), req.query)
    .filter()
    .sort()
    .page();
  const posts = await features.query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.getMyPosts = catchAsync(async (req, res, next) => {
  const myPosts = await Post.find({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: myPosts.length,
    data: {
      posts: myPosts,
    },
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  // const post = await Post.findById(req.params.id).populate("feedback");
  const post = await Post.findById(req.params.id)
    .populate("feedback")
    .select("");

  if (!post) return next(new AppError("This post does not exist", 404));

  res.status(200).json({
    status: "success",
    data: {
      post,
    },
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/posts");
  },

  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    cb(null, `post-${req.user._id}-${Date.now()}.${extension}`);
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

exports.uploadPostPhoto = upload.single("photo");

exports.createPost = catchAsync(async (req, res) => {
  const newPost = await Post.create({
    user: req.user._id,
    title: req.body.title,
    tags: req.body.tags,
    description: req.body.description,
    content: req.body.content,
  });
  res.status(201).json({
    status: "success",
    data: {
      post: newPost,
    },
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  //Check if post exists
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("This post does not exist", 404));

  //Check if the current user is the creator of the post
  if (!req.user._id.equals(post.user._id) && req.user.role !== "admin")
    return next(new AppError("You can't update this post", 403));

  //Update post

  //only admin can validate post
  if (req.user.role !== "admin") req.body.validated = undefined;

  let filename = undefined;
  if (req.file) filename = req.file.filename;

  const newPost = await Post.findByIdAndUpdate(
    post._id,
    {
      title: req.body.title,
      tags: req.body.tags,
      description: req.body.description,
      photo: filename,
      validated: req.body.validated,
    },
    { new: true, runValidators: true }
  );

  //To run pre save middleware for calculating readTime
  newPost.content = req.body.content || newPost.content;
  await newPost.save();

  res.status(200).json({
    status: "success",
    data: {
      post: newPost,
    },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  //Check if post exists
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("This post does not exist", 404));

  //Check if current user is the creator of the post
  if (!req.user._id.equals(post.user._id) && req.user.role !== "admin")
    return next(new AppError("You can't delete this post", 403));

  //Delete post, post's feedbacks and remove post from users's pockets
  await Post.findByIdAndDelete(post._id);
  await Feedback.deleteMany({ post: post._id });
  await Pocket.updateMany({}, { $pull: { posts: post._id } });

  await res.status(204).json({
    status: "success",
  });
});
