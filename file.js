import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate-docx", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    console.log("📘 Received topic:", topic);

    // 🔹 Gemini prompt
    const prompt = `
      Write a structured academic document about "${topic}" in this JSON format:
      {
        "title": "string",
        "outline": ["point1", "point2", "point3"],
        "paragraphs": [{ "point1": ["para1", "para2"] }],
        "conclusion": "string",
        "references": ["ref1", "ref2"]
      }

      Guidelines:
      - The title should be short and academic.
      - The outline should contain 4–6 main sections.
      - For each outline point, write 2-3 paragraphs including 345 words
      - Each paragraph should be factual and clear.
      - Include APA-style references.
      - Conclusion must include at least 35 words.
      - Language must be in Uzbek.
      - Respond ONLY in pure JSON (no markdown).
    `;

    // 🔹 Ask Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    // 🧠 Get raw text
    let text = result.response.text();

    // 🧹 Clean up response
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1") // ✅ remove **bold**
      .replace(/\*(.*?)\*/g, "$1")     // ✅ remove *italic*
      .replace(/\\n/g, " ")            // ✅ remove literal \n
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 🧩 Parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ JSON parse failed, raw response:\n", text);
      return res.status(500).send("Invalid JSON from Gemini");
    }

    // ✅ Log parsed structure for debugging
    console.log("✅ Parsed structure:", Object.keys(data));

    // 🧱 Validate essential fields
    if (!data.title || !data.outline || !data.conclusion) {
      console.error("⚠️ Incomplete data:", data);
      return res.status(500).send("Gemini returned incomplete JSON");
    }

    // 📝 DOCX document
    const doc = new Document({
      sections: [
        {
          children: [
            // 🔹 Title
            new Paragraph({
              text: data.title || topic,
              heading: HeadingLevel.TITLE,
              alignment: "center",
            }),

            new Paragraph({ text: "" }),

            // 🔹 Outline (Reja)
            new Paragraph({
              text: "REJA",
              heading: HeadingLevel.HEADING_2,
              alignment: "center",
            }),
            ...(data.outline || []).map(
              (point, i) =>
                new Paragraph({
                  text: `${i + 1}. ${point}`,
                  style: "ListParagraph",
                })
            ),

            new Paragraph({ text: "" }),

            // 🔹 Each section
            ...(data.outline || []).flatMap((point) => {
              let paragraphs = [];

              // ✅ Handle both array or object formats
              if (Array.isArray(data.paragraphs)) {
                const parasObj = data.paragraphs.find((p) => p[point]);
                paragraphs = parasObj ? parasObj[point] : [];
              } else if (
                typeof data.paragraphs === "object" &&
                data.paragraphs !== null
              ) {
                paragraphs = data.paragraphs[point] || [];
              }

              // ✅ Ensure array format
              if (!Array.isArray(paragraphs)) paragraphs = [String(paragraphs)];

              return [
                new Paragraph({
                  text: point.toUpperCase(),
                  heading: HeadingLevel.HEADING_2,
                  alignment: "center",
                }),
                ...paragraphs.map(
                  (para) =>
                    new Paragraph({
                      text: para,
                      size: 14,
                      spacing: { before: 200 },
                      indent: { firstLine: 720 },
                    })
                ),
              ];
            }),

            // 🔹 Conclusion
            new Paragraph({
              text: "XULOSA",
              heading: HeadingLevel.HEADING_2,
              alignment: "center",
            }),
            new Paragraph({
              text: data.conclusion,
              size: 14,
              indent: { firstLine: 720 },
            }),

            new Paragraph({ text: "" }),

            // 🔹 References
            new Paragraph({
              text: "ADABIYOTLAR",
              heading: HeadingLevel.HEADING_2,
              alignment: "center",
            }),
            ...(data.references || []).map(
              (ref, i) => new Paragraph({ text: `${i + 1}. ${ref}` })
            ),
          ],
        },
      ],
    });

    // 📦 Save & send DOCX
    const buffer = await Packer.toBuffer(doc);
    const filePath = `./${topic.replace(/\s+/g, "_")}.docx`;
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, `${topic}.docx`, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(filePath); // delete after sending
    });
  } catch (err) {
    console.error("❌ Error generating DOCX:", err);
    res.status(500).send("Error generating document");
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
