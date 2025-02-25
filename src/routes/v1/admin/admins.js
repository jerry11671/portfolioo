const router = require("express").Router();

const {
  isLoggedIn,
  isLoggedInAdmin,
  isLoggedInSuperAdmin,
} = require("../../../middleware/auth");

const {
  read,
  create,
  readSingle,
  update,
  updateStatus,
} = require("../../../controllers/admins");

// teams screen
router.get("/teams", isLoggedInAdmin, read);

// add team member screen
router.post("/teams", isLoggedInSuperAdmin, create);

// get current user/my profile
router.get("/me", isLoggedIn, readSingle);

// view team member
router.get("/teams/:user_id", isLoggedInAdmin, readSingle);

// edit team member screen
router.patch("/teams/:user_id", isLoggedInSuperAdmin, update);

// suspend/activate team member
router.patch(
  "/teams/:user_id/update-status",
  isLoggedInSuperAdmin,
  updateStatus
);

module.exports = router;
