const express = require("express");
const pocketController = require("./../controllers/pocketController");

const router = express.Router({ mergeParams: true });

router.get("/", pocketController.getPocket);
router.patch("/add/:postId/", pocketController.addPostToPocket);
router.patch("/remove/:postId/", pocketController.removePostFromPocket);

module.exports = router;
