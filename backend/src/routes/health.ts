import express from "express";

export const router = express.Router();

// Example GET endpoint
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is alive!" });
});
