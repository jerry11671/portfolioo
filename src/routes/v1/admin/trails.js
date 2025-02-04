const router = require("express").Router();

const { isLoggedInAdmin } = require("../../../middleware/auth");

const { read } = require("../../../controllers/trails");

router.get("/trails", isLoggedInAdmin, read);

module.exports = router;
