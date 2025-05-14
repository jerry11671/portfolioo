const router = require("express").Router();

const passport = require("passport");

const { isLoggedIn } = require("../../../middleware/auth");

const {
  readSingle,
  update,
  deleteSingle,
} = require("../../../controllers/users");

// get current user/my profile
router.get("/me", isLoggedIn, readSingle);

// update profile
// router.patch("/me", isLoggedIn, update);
router.patch("/me", passport.authenticate("jwt", {session: true}), update);

router.delete("/me", isLoggedIn, deleteSingle);

module.exports = router;
