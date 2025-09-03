export default async function handler(req, res) {
  // 1. Check if the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  try {
    const { query } = req.body;

    // 2. Validate that a 'query' was provided in the request body
    if (!query) {
      return res.status(400).json({ error: "Missing 'query' in request body" });
    }

    // 3. Ensure the API key is available in environment variables
    const apiKey = process.env.SENTIENT_API_KEY;
    if (!apiKey) {
      console.error("Fireworks AI API key is missing from environment variables!");
      return res.status(500).json({ error: "Server is misconfigured: API key not found" });
    }

    // 4. Call the Fireworks AI API
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`, // Use the Fireworks key
      },
      body: JSON.stringify({
        // Use the custom Sentient model hosted on Fireworks
        model: "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-8b",
        // Structure the request according to Fireworks' API specification
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1500, // Optional: Adjust as needed
        temperature: 0.7,  // Optional: Adjust for creativity vs. consistency
      }),
    });

    // 5. Handle errors from the API call
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("Fireworks API error response:", errorDetails);
      // The single, correct error response line:
      return res.status(response.status).json({ error: "Failed to get a response from the AI model", details: errorDetails });
    }

    const data = await response.json();

    // 6. Extract the text from the response object
    // The response structure from Fireworks is data -> choices -> [0] -> message -> content
    const output = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // 7. Send the successful response back to the client
    return res.status(200).json({ reply: output });

  } catch (error) {
    // Handle unexpected server-side errors
    console.error("An unexpected error occurred in the research handler:", error);
    return res.status(500).json({ error: "An internal server error occurred" });
  }
}
