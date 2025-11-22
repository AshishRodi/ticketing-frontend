const backend = "http://13.203.205.182:3000"; // EC2 backend URL

// Load Razorpay script dynamically
async function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// REGISTER
async function register() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPass").value;

  const res = await fetch(`${backend}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  alert(data.message || JSON.stringify(data));
}

// LOGIN
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPass").value;

  const res = await fetch(`${backend}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    alert("Login successful!");
  } else {
    alert(data.message || JSON.stringify(data));
  }
}

// PAY NOW
async function payNow() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first!");
    return;
  }

  const ticketId = 1;       // Example ticket
  const amount = 50000;     // ₹500.00

  // Create order
  const res = await fetch(`${backend}/api/payment/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ ticket_id: ticketId, amount })
  });

  const order = await res.json();

  const loaded = await loadRazorpay();
  if (!loaded) {
    alert("Failed to load Razorpay");
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
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          ticket_id: ticketId
        })
      });

      const verify = await verifyRes.json();
      alert(verify.message);
    }
  };

  const paymentObj = new window.Razorpay(options);
  paymentObj.open();
}
