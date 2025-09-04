console.log("Page loaded - initializing Dobby Assistant");

async function sendMessage() {
  const query = document.getElementById("query").value.trim();
  if (!query) return;

  const chat = document.getElementById("chat");
  const errorDiv = document.getElementById("error");
  const sendButton = document.querySelector("button");

  chat.innerHTML += `<div class="message user"><b>You:</b> ${query}</div>`;
  document.getElementById("query").value = "";
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";

  try {
    console.log("Sending query to /api/research:", query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    console.log("Raw response from /api/research:", rawText.substring(0, 200) + "...");

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${rawText.substring(0, 100)}...`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonError) {
      throw new Error(`Invalid JSON response: ${rawText.substring(0, 100)}... (Full raw: ${rawText})`);
    }

    console.log("Parsed response from Dobby:", data);

    if (data.error) {
      chat.innerHTML += `<div class="message bot error"><b>Dobby:</b> Error: ${data.error}</div>`;
      errorDiv.style.display = "block";
    } else {
      chat.innerHTML += `<div class="message bot"><b>Dobby:</b> ${data.reply || 'No reply received'}</div>`;
      errorDiv.style.display = "none";
    }
  } catch (err) {
    console.error("Error in sendMessage:", err);
    let errorMessage = "Failed to get response from Dobby.";
    if (err.name === "AbortError") {
      errorMessage = "Request timed out—try a shorter query.";
    } else if (err.message.includes("HTTP error")) {
      errorMessage = err.message;
    } else if (err.message.includes("Invalid JSON")) {
      errorMessage = `Invalid response from server: ${err.message}`;
    }
    chat.innerHTML += `<div class="message bot error"><b>Error:</b> ${errorMessage}</div>`;
    errorDiv.style.display = "block";
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send";
    chat.scrollTop = chat.scrollHeight;
  }
}

// Initialize chat on load
window.addEventListener("load", () => {
  console.log("DOM fully loaded");
  document.getElementById("chat").innerHTML += `<div class="message bot">Dobby Assistant initialized!</div>`;
});

// Allow sending with Enter key
document.getElementById("query").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
