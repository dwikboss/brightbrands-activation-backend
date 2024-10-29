const OpenAI = require("openai");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cheerio = require("cheerio");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function fetchAndParseHtml(siteUrl) {
    try {
        const response = await axios.get(siteUrl);
        const $ = cheerio.load(response.data);

        let footerText = $("footer").text() || "";
        footerText = footerText.replace(/\s+/g, ' ').trim();

        const titles = [];
        $("h1, h2, h3, h4, h5").each((i, el) => {
            titles.push($(el).text().trim());
        });

        const rootColors = extractButtonColors($);

        const pageText = $("body").text().toLowerCase();
        const developedByUs = pageText.includes("vgi") || pageText.includes("brightbrands");

        return {
            footerText,
            titles,
            colors: rootColors,
            developedByUs
        };
    } catch (error) {
        console.error("Error fetching website content:", error);
        throw new Error("Failed to fetch and parse website content");
    }
}

function extractButtonColors($) {
    const buttonColors = [];
    const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;

    $("button, a, span").each((i, element) => {
        const styleAttr = $(element).attr("style");

        if (styleAttr) {
            const bgColorMatch = styleAttr.match(/background-color:\s*(#[0-9A-Fa-f]{3,6})/);
            const colorMatch = styleAttr.match(/color:\s*(#[0-9A-Fa-f]{3,6})/);

            if (bgColorMatch && hexColorRegex.test(bgColorMatch[1]) && !buttonColors.includes(bgColorMatch[1])) {
                buttonColors.push(bgColorMatch[1]);
            }
            if (colorMatch && hexColorRegex.test(colorMatch[1]) && !buttonColors.includes(colorMatch[1])) {
                buttonColors.push(colorMatch[1]);
            }
        }
    });

    return buttonColors;
}

async function handleMessage(parsedContent, dev) {
    const fbType = dev
        ? "De feedback moet positief zijn! Geen kritiek!"
        : "De feedback moet kritisch zijn! De klant zit niet bij ons dus we moeten negatieve dingen highlighten op een grappige niet al te serieuze manier. Maak het geen complete roast sessie, hou het luchtig maar wel grappig.";
    console.log(parsedContent.colors);
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: 
                    `Je bent vier personen die hun eigen feedback geven op de volgende website: Dit zijn de titels: ${parsedContent.titles}, Dit zijn de kleuren: ${parsedContent.colors}. Benoem de kleur hexcodes NIET maar benoem de kleur naam. Reken dus zelf om welke hexcode welke kleur is. ALS er geen opgegeven kleuren zijn, maak dan een lichte grap over hoe de site wat meer verschillende kleuren kan gebruiken maar benoem verder GEEN kleuren. Baseer je tekst hierop! Je speelt Rick Bakens, Dwiky van Bosstraten, Eric van den Berk en Olaf van Gastel. De reactie moet in het NEDERLANDS zijn. We zijn een NEDERLANDS bureau. Geef het terug in het volgende JSON-formaat: {'RICK': '<RICKS TIPS/COMPLIMENTS>', 'DWIKY': '<DWIKYS TIPS/COMPLIMENTS>'}. etc. Laat ze casual praten met af en toe een grapje naar elkaar. Vertel bijvoorbeeld ook iets over de content/kleuren/opmaak van de site. Vertel NIKS over eventuele animaties! Let op! Bekijk de meegegeven site samenvatting goed en baseer het hier op! Verzin geen onzin. Het moet echt van de site afkomen! Geef veel referenties naar de website en benoem ook zeker welke teksten die bevat zodat de klant weet dat zijn website echt wordt bekeken. ${fbType}`
                }
            ],
            model: "gpt-4o",
            response_format: { "type": "json_object" },
        });

        return completion.choices[0].message;
    } catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to process message");
    }
}

app.post("/message", async (req, res) => {
    try {
        const siteUrl = req.body.inputMessage;
        const parsedContent = await fetchAndParseHtml(siteUrl);
        const reply = await handleMessage(parsedContent, parsedContent.developedByUs);
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
