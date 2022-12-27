const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Post must belong to a user"],
    },
    title: {
      type: String,
      required: [true, "Post must have a title"],
    },
    tags: {
      type: [String],
      validate: {
        validator: (value) => value.length !== 0,
        message: "Post must have a tag",
      },
    },
    description: String,
    photo: String,
    content: {
      type: String,
      required: [true, "Post must have content"],
    },
    readTime: Number,
    validated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

postSchema.virtual("feedback", {
  ref: "Feedback",
  localField: "_id",
  foreignField: "post",
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "firstname lastname photo",
  });

  next();
});

postSchema.pre("save", function (next) {
  this.readTime = Math.round(this.content.split(" ").length / 200) || 1;
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
