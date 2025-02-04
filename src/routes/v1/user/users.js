const router = require("express").Router();

const { isLoggedIn } = require("../../../middleware/auth");

const { readSingle, update } = require("../../../controllers/users");

// get current user/my profile
router.get("/me", isLoggedIn, readSingle);

// update profile
router.patch("/me", isLoggedIn, update);

module.exports = router;
