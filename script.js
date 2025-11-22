async function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function payNow() {

  // IMPORTANT: User must login first and get real JWT token
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first!");
    return;
  }

  const ticketId = 1;
  const amount = 50000;

  // Use your EC2 backend URL
  const backend = "http://13.203.205.182:3000";

  const res = await fetch(`${backend}/api/payment/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ ticket_id: ticketId, amount }),
  });

  const order = await res.json();

  const loaded = await loadRazorpay();
  if (!loaded) {
    alert("Razorpay failed to load");
    return;
  }

  const options = {
    key: "rzp_test_RinSbJtXGfnbO5",
    amount: order.amount,
    currency: "INR",
    order_id: order.id,
    handler: async function (response) {

      const verifyRes = await fetch(`${backend}/api/payment/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          ticket_id: ticketId,
        }),
      });

      const verify = await verifyRes.json();
      alert(verify.message);
    },
  };

  const paymentObj = new window.Razorpay(options);
  paymentObj.open();
}
