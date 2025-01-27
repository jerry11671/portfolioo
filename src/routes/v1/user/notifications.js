const router = require("express").Router();

const { isLoggedIn } = require("../../../middleware/auth");

const {
  read,
  sendPush,
  checkNotificationAvailablility,
  deleteSingle,
} = require("../../../controllers/notifications");

router.get("/notifications", isLoggedIn, read);

router.post("/notifications/send-push", isLoggedIn, sendPush);

router.get(
  "/notifications/availability",
  isLoggedIn,
  checkNotificationAvailablility
);

router.delete("/notifications/:notification_id", isLoggedIn, deleteSingle);

module.exports = router;
