const express = require("express");
const authController = require("./../controllers/authController");
const feedbackController = require("./../controllers/feedbackController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

//posts/:postId/feedback
router
  .route("/")
  .get(feedbackController.getAllPostFeedback)
  .post(authController.restrictTo("user"), feedbackController.createFeedback);

//posts/:postId/feedback/:feedbackId
router
  .route("/:feedbackId")
  .get(feedbackController.getFeedback)
  .patch(feedbackController.updateFeedback)
  .delete(feedbackController.deleteFeedback);

module.exports = router;
