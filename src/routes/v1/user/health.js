const router = require("express").Router();

const { sendResponse } = require("../../../utils/helpers");

// api health check
router.get("/ping", (req, res) => {
  sendResponse(200, "Successful.", { status: "OK", date: new Date() })(
    req,
    res
  );
});

module.exports = router;
