export default async function handler(req, res) {
  console.log("Generate report handler invoked", req.method, req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Missing topic in request body" });
    }

    if (!process.env.SENTIENT_API_KEY) {
      console.error("SENTIENT_API_KEY is missing");
      return res.status(500).json({ error: "Server misconfigured" });
    }

    const response = await fetch("https://api.sentient.foundation/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": Bearer ${process.env.SENTIENT_API_KEY},
      },
      body: JSON.stringify({
        model: "accounts/sentientfoundation-serverless/models/dobby-mini-unhinged-plus-llama-3-1-8b",
        input: [{ role: "user", content: Generate a detailed report about: ${topic} }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sentient API error:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    let output = "No response received";
    if (data.output?.[0]?.content) {
      const first = data.output[0].content.find(c => c.text);
      if (first) output = first.text;
    }

    return res.status(200).json({ report: output });

  } catch (error) {
    console.error("Error in /api/generate-report:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
