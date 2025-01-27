const router = require("express").Router();

const {
  isLoggedInAdmin,
  isLoggedInSuperAdmin,
} = require("../../../middleware/auth");

const {
  read,
  create,
  readSingle,
  update,
  deleteSingle,
} = require("../../../controllers/examples");

router.get("/examples", isLoggedInAdmin, read);

router.post("/examples", isLoggedInAdmin, create);

router.get("/examples/:example_id", isLoggedInAdmin, readSingle);

router.patch("/examples/:example_id", isLoggedInAdmin, update);

router.delete("/examples/:example_id", isLoggedInSuperAdmin, deleteSingle);

module.exports = router;
