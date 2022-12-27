const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "feedback must have user"],
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
      required: [true, "feedback must belong to a post"],
    },
    type: {
      type: String,
      required: [true, "feedback must have a type"],
      enum: ["like", "comment"],
    },
    content: {
      type: String,
    },
  },
  { timestamps: true }
);

feedbackSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstname lastname photo",
  });
  next();
});

module.exports = mongoose.model("Feedback", feedbackSchema);
