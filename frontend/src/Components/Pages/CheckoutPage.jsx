import React, { useState } from "react";
import "./CheckoutPage.css";

const CheckoutPage = () => {
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Error message state for online payment validation

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (address) {
      // Proceed to payment options once address is submitted
      setPaymentMethod(""); // Reset payment method in case user re-submits
    }
  };

  const handlePlaceOrder = () => {
    // Validate online payment fields before placing the order
    if (paymentMethod === "online" && (!cardNumber || !expiryDate || !cvv)) {
      setErrorMessage("Please fill in all payment fields before placing your order.");
    } else {
      setErrorMessage(""); // Clear the error message
      setOrderPlaced(true); // Place the order if all fields are filled
    }
  };

  return (
    <div className="checkout-page">
      {!orderPlaced ? (
        <>
          {/* Step 1: Address Form */}
          {!paymentMethod ? (
            <form onSubmit={handleAddressSubmit}>
              <h2>Enter your delivery address</h2>
              <input
                type="text"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <button type="submit">Submit Address</button>
            </form>
          ) : null}

          {/* Step 2: Choose Payment Method */}
          {address && !paymentMethod && (
            <div className="payment-methods">
              <h2>Select Payment Method</h2>
              <button onClick={() => setPaymentMethod("online")}>Pay Online</button>
              <button onClick={() => setPaymentMethod("cod")}>Cash on Delivery</button>
            </div>
          )}

          {/* Step 3: Payment Form for Online Payment */}
          {paymentMethod === "online" && (
            <div className="payment-form">
              <h2>Payment Details</h2>
              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Expiry Date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
              />
              {/* Display error message if any payment field is missing */}
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              <button onClick={handlePlaceOrder}>Place Order</button>
            </div>
          )}

          {/* Step 3: Cash on Delivery */}
          {paymentMethod === "cod" && (
            <div>
              <h2>You selected Cash on Delivery</h2>
              <button onClick={handlePlaceOrder}>Place Order</button>
            </div>
          )}
        </>
      ) : (
        // Step 4: Thank You Message
        <div className="order-confirmation">
          <h2>Thank you for ordering! Your order is accepted.</h2>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
