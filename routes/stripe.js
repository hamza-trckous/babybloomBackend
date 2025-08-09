const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const dotenv = require("dotenv");

dotenv.config();
const stripe = Stripe(process.env.STRIPE_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("✅ Payment succeeded:", paymentIntent.id);
      // مثال: تحديث قاعدة البيانات بحالة الدفع الناجح
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      console.log("❌ Payment failed:", paymentIntent.id);
      // مثال: تحديث قاعدة البيانات بحالة الدفع الفاشل
    }

    res.json({ received: true });
  }
);

module.exports = router;
