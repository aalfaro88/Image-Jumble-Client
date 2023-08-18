// pages/PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { SERVER_URL } from "../services/SERVER_URL";

function PaymentPage() {
  const [stripePublishableKey, setStripePublishableKey] = useState(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/get-stripe-key`)
      .then((response) => response.json())
      .then((data) => setStripePublishableKey(data.publishableKey))
      .catch((error) => console.error("Error fetching Stripe key:", error));
  }, []);

  return (
    <div className="payment-page">
      {stripePublishableKey && (
        <Elements stripe={loadStripe(stripePublishableKey)}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}

export default PaymentPage;
