// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ─── HTML Frontend ────────────────────────────────────────────────────────────
// Serves a simple page with three action buttons. The score button grabs the
// contact name returned by /hubspot so the prompt is pre-filled automatically.
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alpine Commercial</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 20px; }
    h1   { margin-bottom: 8px; }
    p    { color: #555; margin-bottom: 32px; }
    button {
      display: block; width: 100%; margin-bottom: 12px; padding: 14px 20px;
      font-size: 15px; border: 1px solid #ddd; border-radius: 6px;
      background: #fff; cursor: pointer; text-align: left;
    }
    button:hover { background: #f5f5f5; }
    pre {
      background: #f4f4f4; padding: 16px; border-radius: 6px;
      white-space: pre-wrap; word-break: break-word; font-size: 13px;
    }
  </style>
</head>
<body>
  <h1>Alpine Commercial</h1>
  <p>Silver Lake listing tools</p>

  <button onclick="getContact()">Get HubSpot Contact</button>
  <button onclick="getScore()">Get Match Score</button>
  <button onclick="openDraft()">Open Gmail Draft</button>

  <pre id="output">Results will appear here…</pre>

  <script>
    let currentContact = { name: "", email: "" };

    async function getContact() {
      const out = document.getElementById("output");
      out.textContent = "Fetching contact…";
      try {
        const res  = await fetch("/hubspot");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        currentContact = { name: data.name, email: data.email };
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = "Error: " + e.message;
      }
    }

    async function getScore() {
      const out = document.getElementById("output");
      const name = currentContact.name || prompt("Enter a contact name:");
      if (!name) return;
      out.textContent = "Scoring…";
      try {
        const res  = await fetch("/score?name=" + encodeURIComponent(name));
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        out.textContent = "Error: " + e.message;
      }
    }

    function openDraft() {
      const name    = currentContact.name || "there";
      const subject = encodeURIComponent("Alpine Commercial — Listing Match");
      const body    = encodeURIComponent(
        "Hi " + name + ",\\n\\nI wanted to reach out about a listing that matches your criteria."
      );
      const to = encodeURIComponent(currentContact.email || "");
      window.open("https://mail.google.com/mail/?view=cm&to=" + to + "&su=" + subject + "&body=" + body);
    }
  </script>
</body>
</html>`);
});

// ─── HubSpot Contacts API ─────────────────────────────────────────────────────
// Calls the HubSpot v3 Contacts endpoint and returns the first contact's
// name and email. Requires HUBSPOT_API_KEY in .env.
app.get("/hubspot", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        params: { limit: 1, properties: "firstname,lastname,email" },
        headers: { Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}` },
      }
    );

    const contact    = response.data.results[0];
    const properties = contact.properties;
    const name       = [properties.firstname, properties.lastname]
      .filter(Boolean)
      .join(" ") || "Unknown";

    res.json({ name, email: properties.email || "" });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    res.status(500).json({ error: message });
  }
});

// ─── Anthropic Claude Match Score ─────────────────────────────────────────────
// Sends a prompt to Claude asking it to score the buyer's match to a Silver
// Lake retail listing on 0–100 and provide one sentence of reasoning.
// Requires ANTHROPIC_API_KEY in .env.
app.get("/score", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "name query param required" });

  const prompt =
    `You are a commercial real estate analyst. Score how well the following buyer matches the listing criteria.\n\n` +
    `Buyer name: ${name}\n\n` +
    `Listing criteria:\n` +
    `- Asset class: Retail\n` +
    `- Target submarket: Silver Lake\n` +
    `- Equity check: $5M–$15M\n\n` +
    `Assume the buyer is a realistic investor whose profile is inferred from their name. ` +
    `Respond with valid JSON only, in this exact shape:\n` +
    `{"score": <integer 0-100>, "reasoning": "<one sentence>"}`;

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const text = response.data.content[0].text.trim();

    let score, reasoning;
    try {
      const parsed = JSON.parse(text);
      score     = typeof parsed.score === "number" ? Math.round(parsed.score) : null;
      reasoning = parsed.reasoning || text;
    } catch {
      const scoreMatch = text.match(/\b(\d{1,3})\b/);
      score     = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      reasoning = text;
    }

    // Guarantee score is always a number
    if (score === null || isNaN(score)) score = 50;

    res.json({ score, reasoning });
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    res.status(500).json({ error: message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Alpine Commercial server running at http://localhost:${PORT}`);
});
