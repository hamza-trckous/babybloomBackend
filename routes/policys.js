const express = require("express");
const router = express.Router();
const Policy = require("../models/policys");

// Get all policies
router.get("/policies", async (req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new policy
router.post("/policies", async (req, res) => {
  const policy = new Policy({
    title: req.body.title,
    content: req.body.content,
  });

  try {
    const newPolicy = await policy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a policy
router.put("/policies/:id", async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.title = req.body.title;
    policy.content = req.body.content;

    const updatedPolicy = await policy.save();
    res.json(updatedPolicy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a policy
router.delete("/policies/:id", async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    await policy.remove();
    res.json({ message: "Policy deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
