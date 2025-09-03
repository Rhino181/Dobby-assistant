export default async function handler(req, res) {
  console.log("Dobby handler invoked", req.method, req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  // Check API key
  if (!process.env.SENTIENT_API_KEY) {
    console.error("SENTIENT_API_KEY is missing!");
    return res.status(500).json({ error: "Server misconfigured: missing API key" });
  }

  try {
    console.log("Sending request to Sentient API with message:", message);

    const response = await fetch("https://api.sentient.foundation/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SENTIENT_API_KEY}`,
      },
      body: JSON.stringify({
        model: "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-8b",
        input: [{ role: "user", content: message }],
      }),
    });

    console.log("Sentient API response status:", response.status);
    const text = await response.text();
    console.log("Sentient API raw response:", text);

    if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to get response from Sentient API", details: text });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON from Sentient API:", err);
      return res.status(500).json({ error: "Invalid response from Sentient API" });
    }

    let output = "Sorry, I couldn't process that.";
    if (data.output?.[0]?.content) {
      const first = data.output[0].content.find(c => c.text);
      if (first) output = first.text;
    }
    
    // This line was missing, preventing a response from being sent on success.
    return res.status(200).json({ reply: output });

  } catch (error) {
    console.error("Error in /api/dobby:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
