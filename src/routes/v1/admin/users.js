const router = require("express").Router();

const {
  isLoggedInAdmin,
  isLoggedInSuperAdmin,
} = require("../../../middleware/auth");

const {
  read,
  readSingle,
  updateStatus,
  deleteSingle,
} = require("../../../controllers/users");

// users screen
router.get("/users", isLoggedInAdmin, read);

// view user
router.get("/users/:user_id", isLoggedInAdmin, readSingle);

// suspend/activate user
router.patch(
  "/users/:user_id/update-status",
  isLoggedInSuperAdmin,
  updateStatus
);

// edit user screen
router.delete("/users/:user_id", isLoggedInSuperAdmin, deleteSingle);

module.exports = router;
