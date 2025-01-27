const router = require("express").Router();

const { isLoggedIn } = require("../../../middleware/auth");

const {
  read,
  create,
  readSingle,
  update,
  deleteSingle,
} = require("../../../controllers/examples");

router.get("/examples", isLoggedIn, read);

router.post("/examples", isLoggedIn, create);

router.get("/examples/:example_id", isLoggedIn, readSingle);

router.patch("/examples/:example_id", isLoggedIn, update);

router.delete("/examples/:example_id", isLoggedIn, deleteSingle);

module.exports = router;
