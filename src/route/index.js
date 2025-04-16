import express from "express";
import authRoutes from "../api/auth/authRoute.js"; // Add `.js` extension
import mallRoute from "../api/mall/mallRoute.js"; // Add `.js` extension
import roomRoute from "../api/room/roomRoute.js";
import tenantRoute from "../api/tenant/tenatRoute.js";
import rentRoute from "../api/rent/rentRoute.js";
import paymentRoute from "../api/payment/paymentRoute.js";
import appAuthRoute from "../api/app/auth/appAuthRoute.js";
import postRoute from "../api/post/postRoute.js";
import requestRoute from "../api/app/request/requestRoute.js";
import requestOwnerRoute from "../api/request/requestOwnerRoute.js";
import bidRoute from "../api/app/bid/bidRoute.js";
import bidOwnerRoute from "../api/bid/bidOwnerRoute.js";
import notificationRoute from "../api/notifications/notificationRoute.js";
const router = express.Router();

// Auth routes
router.use("/auth", authRoutes);
router.use("/app/auth", appAuthRoute);
router.use("/mall", mallRoute);
router.use("/room", roomRoute);
router.use("/tenant", tenantRoute);
router.use("/rent", rentRoute);
router.use("/payment", paymentRoute);
router.use("/post", postRoute);
router.use("/request", requestRoute);
router.use("/owner/request", requestOwnerRoute);
router.use("/bid", bidRoute);
router.use("/owner/bid", bidOwnerRoute);
router.use("/notification", notificationRoute);

export default router;
