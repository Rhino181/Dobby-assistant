// Use 'export const handler' instead of 'export default' or 'module.exports'
export const handler = async (event, context) => {
  // 1. Netlify functions only run on the method they receive.
  //    A POST request from your frontend will trigger this.
  
  try {
    // 2. The request body is a string that needs to be parsed
    const body = JSON.parse(event.body);
    const { query } = body;

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'query' in request body" }),
      };
    }

    const apiKey = process.env.SENTIENT_API_KEY;
    if (!apiKey) {
      console.error("Fireworks AI API key is missing!");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server is misconfigured: API key not found" }),
      };
    }

    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-8b",
        messages: [{ role: "user", content: query }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Fireworks API error response:", errorDetails);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to get a response from the AI model", details: errorDetails }),
      };
    }

    const data = await response.json();
    const output = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // 3. The return value must be an object with statusCode and a stringified body
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: output }),
    };

  } catch (error) {
    console.error("An unexpected error occurred in the handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal server error occurred" }),
    };
  }
};
