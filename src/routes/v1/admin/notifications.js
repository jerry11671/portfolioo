const router = require("express").Router();

const { isLoggedInAdmin } = require("../../../middleware/auth");

const {
  read,
  checkNotificationAvailablility,
  deleteSingle,
} = require("../../../controllers/notifications");

router.get("/notifications", isLoggedInAdmin, read);

router.get(
  "/notifications/availability",
  isLoggedInAdmin,
  checkNotificationAvailablility
);

router.delete("/notifications/:notification_id", isLoggedInAdmin, deleteSingle);

module.exports = router;
