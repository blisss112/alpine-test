// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { getHubSpotContacts } = require("./hubspot");

const app = express();
app.use(express.json());

// ─── HTML Frontend ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alpine Commercial</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 20px; position: relative; background: #c9b9a8; }
    h1   { margin-bottom: 8px; }
    p    { color: #555; margin-bottom: 32px; }
    button {
      display: block; width: 100%; margin-bottom: 12px; padding: 14px 20px;
      font-size: 15px; border: none; border-radius: 6px;
      cursor: pointer; text-align: left; color: #fff; font-weight: 500;
    }
    button:hover { filter: brightness(1.1); }
    #btn-contact    { background: #3b82f6; }
    #btn-retail     { background: #10b981; }
    #btn-office     { background: #8b5cf6; }
    #btn-score      { background: #f59e0b; }
    #btn-draft      { background: #ef4444; }
    pre {
      background: #f4f4f4; padding: 16px; border-radius: 6px;
      white-space: pre-wrap; word-break: break-word; font-size: 13px;
      margin: 0;
    }
    #output { margin-top: 0; }
    .contact-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px;
      margin-bottom: 6px; cursor: pointer; background: #fff;
    }
    .contact-item:hover { background: #f0fdf4; border-color: #10b981; }
    .contact-item.selected { background: #dcfce7; border-color: #10b981; font-weight: 600; }
    .contact-name  { font-size: 14px; color: #111; }
    .contact-email { font-size: 12px; color: #6b7280; }
    #penguin {
      position: fixed; top: 20px; right: 24px; width: 80px;
    }
    #elephant {
      position: fixed; top: 20px; left: 24px; width: 90px;
    }
    #score-panel {
      position: fixed; top: 136px; right: 16px; width: 200px;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 12px; font-size: 12px; line-height: 1.5;
      box-shadow: 0 2px 8px rgba(0,0,0,.08); display: none;
    }
    #score-panel.visible { display: block; }
    #score-panel .sp-name  { font-weight: 600; margin-bottom: 6px; color: #111; }
    #score-panel .sp-score { font-size: 22px; font-weight: 700; color: #10b981; }
    #score-panel .sp-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    #score-panel .sp-rec   { display: inline-block; margin-top: 6px; padding: 2px 8px;
                             border-radius: 999px; font-size: 11px; font-weight: 600; }
    #score-panel .rec-reach { background: #dcfce7; color: #15803d; }
    #score-panel .rec-skip  { background: #fee2e2; color: #b91c1c; }
  </style>
</head>
<body>
  <svg id="elephant" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
    <!-- ear -->
    <ellipse cx="28" cy="52" rx="18" ry="22" fill="#a08888"/>
    <!-- body -->
    <ellipse cx="72" cy="82" rx="42" ry="32" fill="#8b7d7b"/>
    <!-- head -->
    <circle cx="34" cy="58" r="24" fill="#8b7d7b"/>
    <!-- trunk -->
    <path d="M 18 70 Q 6 88 12 106 Q 15 112 21 106 Q 16 90 26 74" fill="#8b7d7b"/>
    <!-- tusk -->
    <path d="M 22 72 Q 12 80 15 90" stroke="#f5f0e0" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <!-- eye -->
    <circle cx="40" cy="52" r="5" fill="#fff"/>
    <circle cx="41" cy="53" r="3" fill="#222"/>
    <!-- legs -->
    <rect x="40" y="108" width="15" height="20" rx="5" fill="#7a6d6d"/>
    <rect x="60" y="108" width="15" height="20" rx="5" fill="#7a6d6d"/>
    <rect x="80" y="108" width="15" height="20" rx="5" fill="#7a6d6d"/>
    <rect x="100" y="108" width="13" height="20" rx="5" fill="#7a6d6d"/>
    <!-- tail -->
    <path d="M 112 78 Q 122 72 118 88" stroke="#7a6d6d" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>

  <svg id="penguin" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
    <!-- body -->
    <ellipse cx="50" cy="80" rx="32" ry="42" fill="#1a1a2e"/>
    <!-- belly -->
    <ellipse cx="50" cy="88" rx="18" ry="28" fill="#f0f0f0"/>
    <!-- left wing -->
    <ellipse cx="18" cy="82" rx="10" ry="22" fill="#1a1a2e" transform="rotate(-10 18 82)"/>
    <!-- right wing -->
    <ellipse cx="82" cy="82" rx="10" ry="22" fill="#1a1a2e" transform="rotate(10 82 82)"/>
    <!-- head -->
    <circle cx="50" cy="38" r="22" fill="#1a1a2e"/>
    <!-- left eye white -->
    <circle cx="42" cy="33" r="7" fill="#fff"/>
    <!-- right eye white -->
    <circle cx="58" cy="33" r="7" fill="#fff"/>
    <!-- left pupil -->
    <circle cx="43" cy="34" r="4" fill="#111"/>
    <!-- right pupil -->
    <circle cx="59" cy="34" r="4" fill="#111"/>
    <!-- beak -->
    <polygon points="50,42 44,50 56,50" fill="#f59e0b"/>
    <!-- left foot -->
    <ellipse cx="38" cy="124" rx="10" ry="5" fill="#f59e0b"/>
    <!-- right foot -->
    <ellipse cx="62" cy="124" rx="10" ry="5" fill="#f59e0b"/>
  </svg>

  <div id="score-panel">
    <div class="sp-name" id="sp-name"></div>
    <div class="sp-label">Match score</div>
    <div class="sp-score" id="sp-score"></div>
    <div id="sp-rationale" style="margin-top:6px;color:#374151"></div>
    <div id="sp-rec"></div>
  </div>

  <h1>Alpine Commercial</h1>
  <p>Silver Lake listing tools</p>

  <button id="btn-contact" onclick="getContact()">Get HubSpot Contact</button>
  <button id="btn-retail"  onclick="getContacts('Retail')">Get Retail Contacts</button>
  <button id="btn-office"  onclick="getContacts('Office')">Get Office Contacts</button>
  <button id="btn-score"   onclick="getScore()">Get Match Score</button>
  <button id="btn-draft"   onclick="openDraft()">Open Gmail Draft</button>

  <div id="output"><pre>Results will appear here…</pre></div>

  <script>
    let currentContact = { name: "", email: "" };
    let contactsList   = [];

    function showText(html) {
      document.getElementById("output").innerHTML = "<pre>" + html + "</pre>";
    }

    async function getContact() {
      showText("Fetching contact…");
      try {
        const res  = await fetch("/hubspot");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        currentContact = { name: data.name, email: data.email };
        showText(JSON.stringify(data, null, 2));
      } catch (e) {
        showText("Error: " + e.message);
      }
    }

    async function getContacts(assetClass) {
      showText("Fetching " + assetClass + " contacts…");
      try {
        const res  = await fetch("/contacts?type=" + encodeURIComponent(assetClass));
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        contactsList = data;
        const out = document.getElementById("output");
        out.innerHTML = data.map((c, i) =>
          \`<div class="contact-item" id="ci-\${i}" onclick="selectContact(\${i}, '\${assetClass}')">
            <span class="contact-name">\${c.name}</span>
            <span class="contact-email">\${c.email}</span>
          </div>\`
        ).join("");
      } catch (e) {
        showText("Error: " + e.message);
      }
    }

    async function selectContact(index, assetClass) {
      const contact = contactsList[index];
      currentContact = { name: contact.name, email: contact.email };

      document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("selected"));
      document.getElementById("ci-" + index).classList.add("selected");

      const panel = document.getElementById("score-panel");
      panel.classList.add("visible");
      document.getElementById("sp-name").textContent  = contact.name;
      document.getElementById("sp-score").textContent = "…";
      document.getElementById("sp-rationale").textContent = "";
      document.getElementById("sp-rec").textContent   = "";

      try {
        const params = new URLSearchParams({
          name: contact.name, assetClass, submarket: "Silver Lake", type: "leasing"
        });
        const res  = await fetch("/score?" + params);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        document.getElementById("sp-score").textContent     = data.score + " / 100";
        document.getElementById("sp-rationale").textContent = data.rationale;
        const recEl = document.getElementById("sp-rec");
        recEl.textContent  = data.recommendation;
        recEl.className    = "sp-rec " + (data.recommendation === "Reach out" ? "rec-reach" : "rec-skip");
      } catch (e) {
        document.getElementById("sp-score").textContent = "Error: " + e.message;
      }
    }

    async function getScore() {
      const name       = currentContact.name || prompt("Enter a contact name:");
      if (!name) return;
      const assetClass = prompt("Asset class preference (e.g. Retail, Office, Industrial):", "Retail");
      if (!assetClass) return;
      const submarket  = prompt("Target submarket (e.g. Silver Lake, Echo Park):", "Silver Lake");
      if (!submarket) return;
      const type       = prompt("Scoring model — type 'leasing' or 'investment':", "leasing");
      if (!type) return;
      showText("Scoring (" + type + ")…");
      try {
        const params = new URLSearchParams({ name, assetClass, submarket, type });
        const res    = await fetch("/score?" + params);
        const data   = await res.json();
        if (data.error) throw new Error(data.error);
        showText(JSON.stringify(data, null, 2));
      } catch (e) {
        showText("Error: " + e.message);
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
app.get("/hubspot", async (req, res) => {
  try {
    const [contact] = await getHubSpotContacts();
    res.json(contact);
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    res.status(500).json({ error: message });
  }
});

// ─── Contacts by Asset Class ──────────────────────────────────────────────────
// GET /contacts?type=Retail  — returns all contacts where asset_class == type.
app.get("/contacts", async (req, res) => {
  const type = req.query.type;
  if (!type) return res.status(400).json({ error: "type query param required" });

  try {
    const contacts = await getHubSpotContacts(type);
    res.json(contacts);
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    res.status(500).json({ error: message });
  }
});

// ─── Scoring prompts ──────────────────────────────────────────────────────────

function buildLeasingPrompt(name, assetClass, submarket) {
  return (
    `You are a commercial real estate leasing expert. Evaluate how well a prospective tenant fits an available retail space.\n\n` +
    `Listing:\n` +
    `- Use type: Retail (street-level, 2,400 SF)\n` +
    `- Submarket: Silver Lake, Los Angeles\n` +
    `- Asking rent: $42/SF NNN\n` +
    `- Ideal tenant: experience in food & beverage, fitness, or specialty retail\n\n` +
    `Prospect:\n` +
    `- Name: ${name}\n` +
    `- Preferred asset class: ${assetClass}\n` +
    `- Target submarket: ${submarket}\n\n` +
    `Score the fit 0–100 across these dimensions: (1) use-type alignment, (2) submarket match, (3) likely rent affordability, (4) neighborhood demographic fit.\n\n` +
    `Respond with valid JSON only, no markdown, no extra keys:\n` +
    `{"score": <integer 0-100>, "rationale": "<one sentence>", "recommendation": "<Reach out|Skip>"}`
  );
}

function buildInvestmentPrompt(name, assetClass, submarket) {
  return (
    `You are a commercial real estate investment sales expert. Evaluate how well a prospective buyer fits an acquisition opportunity.\n\n` +
    `Listing:\n` +
    `- Asset type: Retail strip center (8 units, fully leased)\n` +
    `- Submarket: Silver Lake, Los Angeles\n` +
    `- Asking price: $14.5M\n` +
    `- Cap rate: 5.2%\n` +
    `- Value-add potential: moderate (below-market rents on 3 units expiring within 18 months)\n\n` +
    `Prospect:\n` +
    `- Name: ${name}\n` +
    `- Preferred asset class: ${assetClass}\n` +
    `- Target submarket: ${submarket}\n\n` +
    `Score the fit 0–100 across these dimensions: (1) asset class alignment, (2) submarket conviction, (3) likely equity capacity for a $14.5M deal, (4) appetite for light value-add vs. core hold.\n\n` +
    `Respond with valid JSON only, no markdown, no extra keys:\n` +
    `{"score": <integer 0-100>, "rationale": "<one sentence>", "recommendation": "<Reach out|Skip>"}`
  );
}

// ─── Anthropic Claude Match Score ─────────────────────────────────────────────
// GET /score?type=leasing|investment&name=…&assetClass=…&submarket=…
// Requires ANTHROPIC_API_KEY in .env.
app.get("/score", async (req, res) => {
  const { name, assetClass, submarket, type = "leasing" } = req.query;
  if (!name)       return res.status(400).json({ error: "name query param required" });
  if (!assetClass) return res.status(400).json({ error: "assetClass query param required" });
  if (!submarket)  return res.status(400).json({ error: "submarket query param required" });
  if (!["leasing", "investment"].includes(type))
    return res.status(400).json({ error: "type must be 'leasing' or 'investment'" });

  const prompt = type === "investment"
    ? buildInvestmentPrompt(name, assetClass, submarket)
    : buildLeasingPrompt(name, assetClass, submarket);

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

    let score, rationale, recommendation;
    try {
      const parsed    = JSON.parse(text);
      score          = typeof parsed.score === "number" ? Math.round(parsed.score) : null;
      rationale      = parsed.rationale || text;
      recommendation = ["Reach out", "Skip"].includes(parsed.recommendation)
        ? parsed.recommendation
        : null;
    } catch {
      const scoreMatch = text.match(/\b(\d{1,3})\b/);
      score          = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      rationale      = text;
      recommendation = null;
    }

    if (score === null || isNaN(score)) score = 50;
    if (!recommendation) recommendation = score >= 60 ? "Reach out" : "Skip";

    res.json({ type, score, rationale, recommendation });
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
