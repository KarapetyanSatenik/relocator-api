const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, "User must have a firstname"],
    minLength: [2, "firstanme must be longer than 2 chars"],
  },
  lastname: {
    type: String,
    required: [true, "User must have a lastname"],
    minLength: [2, "lastname must be longer than 2 chars"],
  },
  photo: String,
  email: {
    type: String,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: "Email is unvalid",
    },
    required: [true, "User must have an email"],
    unique: [true, "User email already exists"],
  },
  password: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  pocket: {
    type: mongoose.Schema.ObjectId,
    ref: "Pocket",
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  resetTokenExpires: Date,
});

userSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});

userSchema.methods.passwordChangedAfter = function (date) {
  if (this.passwordChangedAt) {
    const changedDate = this.passwordChangedAt.getTime();

    return changedDate > date * 1000;
  } else return false;
};

userSchema.methods.correctPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  //We generate a token
  const resetToken = crypto.randomBytes(32).toString("hex");

  //We hash the token and then save it to the document
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetTokenExpires = Date.now() + 10 * 60 * 1000;

  //we return the non-hashed token
  return resetToken;
};

userSchema.pre("save", async function (next) {
  //If password did not change, don't run the function
  if (!this.isModified("password")) return next();
  //Hash password
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
