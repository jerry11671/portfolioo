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
router.get("/users", isLoggedInAdmin, read);

// add team member screen
router.post("/users", isLoggedInSuperAdmin, create);

// get current user/my profile
router.get("/me", isLoggedIn, readSingle);

// view team member
router.get("/users/:user_id", isLoggedInAdmin, readSingle);

// edit team member screen
router.patch("/users/:user_id", isLoggedInSuperAdmin, update);

// suspend/acivate team member
router.patch(
  "/users/:user_id/update-status",
  isLoggedInSuperAdmin,
  updateStatus
);

module.exports = router;
