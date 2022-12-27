const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const postController = require("./../controllers/postController");
const pocketRouter = require("./../routes/pocketRoutes");

const router = express.Router();

//USER

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

//Only authorized users
router.use(authController.protect);

router.use("/myPocket", authController.restrictTo("user"), pocketRouter);

router.use(
  "/myPosts",
  authController.restrictTo("user"),
  postController.getMyPosts
);
router.patch(
  "/updatePassword",
  authController.restrictTo("user"),
  authController.updatePassword
);
router.patch(
  "/updateMe",
  authController.restrictTo("user"),
  userController.uploadUserPhoto,
  userController.updateMe
);
router.get("/me", authController.restrictTo("user"), userController.getMe);
router.patch(
  "/deleteMe",
  authController.restrictTo("user"),
  userController.deleteMe
);

//ADMIN

router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
