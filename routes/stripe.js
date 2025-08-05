const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const dotenv = require("dotenv");

dotenv.config();
const stripe = Stripe(process.env.STRIPE_KEY);

router.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: "usd"
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
