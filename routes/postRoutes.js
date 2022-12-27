const express = require("express");
const postController = require("./../controllers/postController");
const authController = require("./../controllers/authController");
const feedbackRouter = require("./../routes/feedbackRoutes");

const router = express.Router();

router.use("/:id/feedback", feedbackRouter);

router
  .route("/")
  .get(authController.checkIfAdmin, postController.getAllPosts)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    postController.createPost
  );

router
  .route("/:id")
  .get(authController.protect, postController.getPost)
  .patch(
    authController.protect,
    postController.uploadPostPhoto,
    postController.updatePost
  )
  .delete(authController.protect, postController.deletePost);

module.exports = router;
