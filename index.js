import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: "AIzaSyD5B2nqeihW_WXyGgRHalD_bSNcsiMVD-w",
});

async function main(data) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `you are an expert AI assistant that helps people convert kirilcha to lotin
      1.Always reply in JSON format only with these keys:

      {
        "data": "string"
      }
      Now use the same logic for this user input:
      ${data}
    `,
  });

  const text = response.text;
  return text;
}

const filePath = path.join(__dirname, "file", "fileText.txt");

fs.readFile(filePath, "utf8", async (err, data) => {
  if (err) {
    console.error("Error reading file:", err.message);
    return;
  }

  console.log("File read successfully!");
  console.log(data);

  try {
    const res = await main(data.toString());
    console.log("Response from AI:", res);

    const outputPath = path.join(__dirname, "file", "fileLotin.txt");

    fs.writeFile(outputPath, res, (err) => {
      if (err) {
        console.error("Error writing file:", err.message);
      } else {
        console.log("File written successfully at:", outputPath);
      }
    });
  } catch (error) {
    console.error("Error during AI generation:", error.message);
  }
});
