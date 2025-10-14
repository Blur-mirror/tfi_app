import express from "express";

export const router = express.Router();

// Example GET endpoint
router.get("/", (req, res) => {
  res.json({ status: "Can't stop me now!", message: "Alive and kicking baby!" });
});
