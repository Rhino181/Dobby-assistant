export const handler = async (event, context) => {
  try {
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server is misconfigured: API key not found" }),
      };
    }

    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new",
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to get a response from the AI model", details: errorDetails }),
      };
    }

    const data = await response.json();
    const output = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: output }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An internal server error occurred" }),
    };
  }
};
