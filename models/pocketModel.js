const mongoose = require("mongoose");

const pocketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Pocket must belong to user"],
    unique: [true, "user is unique"],
  },
  posts: {
    type: [mongoose.Schema.ObjectId],
    ref: "Post",
  },
});

pocketSchema.pre(/^find/, function (next) {
  this.populate("posts");
  next();
});

module.exports = mongoose.model("pocket", pocketSchema);
