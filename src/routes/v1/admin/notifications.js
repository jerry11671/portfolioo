const router = require("express").Router();

const { isLoggedInAdmin } = require("../../../middleware/auth");

const {
  read,
  checkNotificationAvailability,
  deleteSingle,
} = require("../../../controllers/notifications");

router.get("/notifications", isLoggedInAdmin, read);

router.get(
  "/notifications/availability",
  isLoggedInAdmin,
  checkNotificationAvailability
);

router.delete("/notifications/:notification_id", isLoggedInAdmin, deleteSingle);

module.exports = router;
