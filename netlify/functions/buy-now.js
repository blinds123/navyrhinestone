// Netlify serverless function to proxy buy-now requests to pool server
// This bypasses CORS issues since server-to-server requests don't have CORS

const POOL_SERVER = "https://simpleswap-automation-1.onrender.com";

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { amountUSD } = JSON.parse(event.body || "{}");

    // Validate amount - accept standard price points
    if (!amountUSD || ![19, 29, 59, 69].includes(amountUSD)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Invalid amount. Accepted values: 19, 29, 59, 69",
          received: amountUSD,
        }),
      };
    }

    // Forward request to pool server
    const response = await fetch(`${POOL_SERVER}/buy-now`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUSD }),
    });

    const data = await response.json();

    return {
      statusCode: response.ok ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Buy-now error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: error.message,
        success: false,
      }),
    };
  }
};
