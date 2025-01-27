const router = require("express").Router();

const { sendResponse } = require("../utils/helpers");

const v1Admin = require("./v1/admin"); // Array of v1/admin routes
const v1User = require("./v1/user"); // Array of v1/user routes

// On '/api/v1' use v1 routes
router.use("/v1/admin", ...v1Admin);
router.use("/v1/user", ...v1User);

// handling route 404 errors
router.use((req, res) => {
  sendResponse(404, `Cannot ${req.method} ${req.originalUrl}`)(req, res);
});

module.exports = router;
