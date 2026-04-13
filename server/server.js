require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY puuttuu .env-tiedostosta!");
  process.exit(1);
}

app.post("/api/feedback", async (req, res) => {
  const { tarina, vibes, skills } = req.body;
  if (!tarina || !Array.isArray(tarina) || tarina.length < 1) {
    return res.status(400).json({ error: "Tarina puuttuu" });
  }

  const tarinaText = tarina
    .map(
      (t, i) =>
        i +
        1 +
        ". " +
        t.e +
        " [" +
        t.cat +
        "] " +
        t.t +
        " -> " +
        t.choice +
        ": " +
        t.cl,
    )
    .join("\n");

  const vibesText = Object.entries(vibes || {})
    .map(([k, v]) => k + ":" + v + "/10")
    .join(", ");
  const skillsText = Object.entries(skills || {})
    .map(([k, v]) => k + ":" + v + "/5")
    .join(", ");

  const prompt =
    "Olet oppilaanohjaaja joka antaa lyhyen palautteen 15-vuotiaan elämänvalintapelistä.\n\nPelaaja teki " +
    tarina.length +
    " valintaa:\n" +
    tarinaText +
    "\n\nLopputilanne - Mittarit: " +
    vibesText +
    " | Taidot: " +
    skillsText +
    "\n\nKirjoita palaute suomeksi. Ohjeet:\n- Selkokieli: lyhyet lauseet, ei vaikeita sanoja\n- Rehellinen: kehut vain jos ansaittu, ei ylistystä\n- Konkreettinen: mainitse oikeat tilanteet nimeltä\n- Lyhyt: max 120 sanaa yhteensä\n- Ei johdantoa tai lopettelua\n\nRakenne TARKASTI näin:\n\n🌟 VAHVUUTESI\n1-2 lausetta. Mikä meni hyvin ja miksi se oli järkevää.\n\n🤔 POHDITTAVAA\n1 kysymys. Yksi tilanne jossa toisin toimiminen olisi voinut auttaa.\n\n💡 SINUSTA\n1 lause. Mitä valinnat kertovat sinusta ihmisenä.\n\n⭐ MUISTA TÄMÄ\n1 konkreettinen asia oikeaan elämään.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", response.status, err);
      return res.status(502).json({ error: "AI-palvelu ei vastannut" });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    // Loki: näytetään vastaus konsolissa debuggausta varten
    console.log("--- AI vastaus ---");
    console.log(text);
    console.log("------------------");

    if (!text) return res.status(502).json({ error: "Tyhjä vastaus" });

    res.json({ feedback: text });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Serveri kaynnissa: http://localhost:" + PORT);
});
