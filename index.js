const OpenAI = require("openai");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let minjiSystemPrompt = {
    role: "system",
    content:
        '',
};

async function handleMessage(siteUrl) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Jullie spelen de rol van 4 webdesigners die een website beoordelen. Bezoek de opgegeven URL en voer het volgende uit: Controleer of de website is gemaakt door VGIWebsites of BrightBrands. Deze informatie kun je vinden in de footer of ergens anders op de site. ALS de site WEL is gemaakt door een van deze twee, geef de website dan complimenten en maak het grappig. Vertel hoe goed de website is en hoe mooi het eruitziet. ALS de website NIET is gemaakt door VGIWebsites of BrightBrands, bespreek dan hoe de website verbeterd kan worden. Dit moet wat kritischer zijn. Laat vier personen hun eigen feedback geven: Rick Bakens, Dwiky van Bosstraten, Eric van den Berk en Olaf van Gastel. De reactie moet in het NEDERLANDS zijn. We zijn een NEDERLANDS bureau. Geef het terug in het volgende JSON-formaat: {'RICK': '<RICKS TIPS/COMPILEMTNS>', 'DWIKY': '<DWIKYS TIPS/COMPLIMENTS>'}. etc. Laat ze casual praten met af een toe een grapje naar elkaar. Vertel bijvoorbeeld ook iets over de content/kleuren/opmaak van de site. Let op! Bekijk de site goed en verzin geen onzin. Het moet echt van de site afkomen! Bezoek dus eerst de URL om de website te analyzeren: " + siteUrl + "  Geef veel referenties naar de website en benoem ook zeker welke teksten die bevat zodat de klant weet dat zijn website echt wordt bekeken. Maak het geen complete roast sessie, hou het luchtig maar wel grappig."}],
            model: "gpt-4o",
            response_format: { "type": "json_object" },
        });

        return completion;
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to process message");
    }
}

app.post("/message", async (req, res) => {
    console.error("incoming request");
    try {
        const siteUrl = req.body.inputMessage;
        console.error("siteUrl " +siteUrl);
        const messageReply = await handleMessage(siteUrl);
        res.json({ reply: messageReply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;