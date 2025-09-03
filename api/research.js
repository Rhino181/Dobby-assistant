export default async function handler(req, res) {
  console.log("Research handler invoked at", new Date().toISOString(), "Method:", req.method, "Body:", req.body);
  console.log("SENTIENT_API_KEY exists:", !!process.env.SENTIENT_API_KEY);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query in request body" });
  }

  if (!process.env.SENTIENT_API_KEY) {
    console.error("SENTIENT_API_KEY missing at", new Date().toISOString());
    return res.status(500).json({ error: "Server misconfigured: missing API key" });
  }

  try {
    console.log("Sending request to Sentient API with query:", query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiResponse = await fetch("https://api.sentient.foundation/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SENTIENT_API_KEY}`,
      },
      body: JSON.stringify({
        model: "accounts/sentientfoundation-serverless/models/dobby-mini-unhinged-plus-llama-3.1-8b",
        messages: [{ role: "user", content: query }],
        max_tokens: 512,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("Sentient API response status:", apiResponse.status);

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error("Sentient API error at", new Date().toISOString(), ":", errText);
      if (apiResponse.status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded, please try again later" });
      }
      if (apiResponse.status === 401) {
        return res.status(401).json({ error: "Invalid API key - check SENTIENT_API_KEY" });
      }
      if (apiResponse.status === 404) {
        return res.status(404).json({ error: "API endpoint or model not found" });
      }
      return res.status(apiResponse.status).json({ error: `API error (${apiResponse.status}): ${errText.substring(0, 200)}` });
    }

    const data = await apiResponse.json();
    console.log("Sentient API raw response at", new Date().toISOString(), ":", JSON.stringify(data));

    let output = "No response received";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      output = data.choices[0].message.content;
    } else if (data.output && data.output[0] && data.output[0].content) {
      const first = data.output[0].content.find(c => c.text);
      output = first ? first.text : JSON.stringify(data.output);
    } else {
      output = JSON.stringify(data); // Fallback to raw data
    }

    return res.status(200).json({ reply: output });
  } catch (error) {
    console.error("Error in /api/research at", new Date().toISOString(), ":", error);
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Request to Sentient API timed out" });
    }
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
