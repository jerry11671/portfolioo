const router = require("express").Router();

const { isLoggedIn } = require("../../../middleware/auth");

const {
  readSingle,
  update,
  deleteSingle,
} = require("../../../controllers/users");

// get current user/my profile
router.get("/me", isLoggedIn, readSingle);

// update profile
router.patch("/me", isLoggedIn, update);

router.delete("/me", isLoggedIn, deleteSingle);

module.exports = router;
