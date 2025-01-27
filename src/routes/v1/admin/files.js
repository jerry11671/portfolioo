const router = require("express").Router();

const { isLoggedIn } = require("../../../middleware/auth");

const { upload } = require("../../../controllers/files");

router.post("/files", isLoggedIn, upload);

module.exports = router;
