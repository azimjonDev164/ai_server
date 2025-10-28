import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getContent = async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Please provide some input text." });
  }

  try {
    const prompt = `
      You are an expert AI assistant that helps small fruit business owners plan production and calculate profits. 
      The user will describe available resources (for example: 200 kg apples, 150 kg oranges, 100 kg sugar) and the recipe or formula for one product (jam, juice, marmalade, etc). 
      Each product requires different ingredient amounts, and ingredient costs can also vary.

      Your job:
      1. Calculate how many total products can be made.
      2. Estimate maximum profit (based on ingredient costs if given).
      3. Show how much of each ingredient is used and how much is left.
      4. If prices are missing, give an estimated total cost and profit.
      5. Always reply in JSON format only with these keys:

      {
        "productType": "string",
        "totalProducts": number,
        "estimatedProfit": number,
        "usedIngredients": { "ingredientName": number },
        "leftoverIngredients": { "ingredientName": number },
        "notes": "string"
      }

      Now use the same logic for this user input:
      ${text}
    `;

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    const cleanedOutput = output.replace(/```json|```/g, "").trim();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanedOutput);
    } catch {
      jsonResponse = { message: "Invalid JSON format", raw: cleanedOutput };
    }

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Server error!", error);
    return res.status(500).json({ message: "Server error!" });
  }
};

export const getContenttoLotin = async (text) => {
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Please provide some input text." });
  }

  try {
    const prompt = `You are an expert AI assistant that helps people convert kirilcha to lotin
      1.Always reply in JSON format only with these keys:

      {
        "data": "string"
      }
      Now use the same logic for this user input:
      ${text}
    `;

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    const cleanedOutput = output.replace(/```json|```/g, "").trim();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanedOutput);
    } catch {
      jsonResponse = { message: "Invalid JSON format", raw: cleanedOutput };
    }

    return jsonResponse;
  } catch (error) {
    console.error("Server error!", error);
    return { message: "Server error!" };
  }
};
