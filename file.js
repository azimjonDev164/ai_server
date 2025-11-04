import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Document,
  Packer,
  ImageRun,
  Paragraph,
  HeadingLevel,
  AlignmentType,
} from "docx";

dotenv.config();
const app = express();
app.use(cors());

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const styles = fs.readFileSync("./assets/styles.xml", "utf-8");

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
      - For each outline point, write  paragraphs including 345 words and if formules exists, add those 
      - Each paragraph should be factual and clear.
      - Include APA-style references.
      - Conclusion must include at least 35 words.
      - Language must be in Uzbek.
      - Respond ONLY in pure JSON (no markdown).
    `;

    // 🔹 Ask Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    let text = result.response.text();

    // 🧹 Clean up response
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\\n/g, " ")
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

    // 🧱 Validate essential fields
    if (!data.title || !data.outline || !data.conclusion) {
      console.error("⚠️ Incomplete data:", data);
      return res.status(500).send("Gemini returned incomplete JSON");
    }

    console.log("sacussfully: ", Object.keys(data));

    // 📝 Build sections
    const sections = [];

    sections.push({
      children: [
        new Paragraph({
          text: "O’ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR HAMDA RAQAMLI TEXNOLOGIYALAR VAZIRLIGI MUHAMMAD AL-XORAZMIY NOMIDAGI TOSHKENT AXBOROT TEXNOLOGIYALARI UNIVERSITETI",
          heading: HeadingLevel.TITLE,
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Matematik injiniring asoslari",
          heading: HeadingLevel.TITLE,
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Bajardi: Polvonov Azimjon",
          heading: HeadingLevel.TITLE,
          alignment: "end",
        }),
        new Paragraph({
          text: "Tekshirdi: Ravshanov Shohjaxon",
          heading: HeadingLevel.TITLE,
          alignment: "end",
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "TOSHKENT 2025",
          heading: HeadingLevel.TITLE,
          alignment: "center",
        }),
      ],
    });

    // 🔹 Title + Outline section
    sections.push({
      properties: { pageBreakBefore: true },
      children: [
        new Paragraph({
          text: data.title,
          heading: HeadingLevel.TITLE,
          alignment: "center",
        }),
        new Paragraph({ text: "" }),
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
      ],
    });

    // 🔹 Each outline point in its own section
    (data.outline || []).forEach((point) => {
      let paragraphs = [];
      const parasObj = data.paragraphs.find((p) => p[point]);
      if (parasObj) paragraphs = parasObj[point];
      if (!Array.isArray(paragraphs)) paragraphs = [String(paragraphs)];

      sections.push({
        properties: { pageBreakBefore: true },
        children: [
          new Paragraph({
            text: point.toUpperCase(),
            heading: HeadingLevel.HEADING_2,
            alignment: "center",
          }),
          ...paragraphs.map(
            (para) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                text: para,
                size: 28,
                spacing: { before: 360 },
                indent: { firstLine: 720 },
              })
          ),
        ],
      });
    });

    // 🔹 Conclusion section
    sections.push({
      properties: { pageBreakBefore: true },
      children: [
        new Paragraph({
          text: "XULOSA",
          heading: HeadingLevel.HEADING_2,
          alignment: "center",
        }),
        new Paragraph({
          text: data.conclusion,
          alignment: AlignmentType.JUSTIFIED,
          size: 28,
          indent: { firstLine: 720 },
        }),
      ],
    });

    // 🔹 References section
    sections.push({
      properties: { pageBreakBefore: true },
      children: [
        new Paragraph({
          text: "ADABIYOTLAR",
          heading: HeadingLevel.HEADING_2,
          alignment: "center",
        }),
        ...(data.references || []).map(
          (ref, i) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              text: `${i + 1}. ${ref}`,
            })
        ),
      ],
    });

    const doc = new Document({
      externalStyles: styles,
      sections,
    });

    // 📦 Save & send DOCX
    const buffer = await Packer.toBuffer(doc);
    const filePath = `./${topic.replace(/\s+/g, "_")}.docx`;
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, `${topic}.docx`, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error("❌ Error generating DOCX:", err);
    res.status(500).send("Error generating document");
  }
});

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
