import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function generateComboFromAI({ type, maxTime, maxCalories, noPickle }) {
  const prompt = `You are FoodieGenie, a magical viral food combo generator.
Create a creative, weird, trending ${type} food combo.
Max prep time: ${maxTime} minutes. Max calories: ${maxCalories} kcal.

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Creative Combo Name - text only, no emojis",
  "tagline": "A short catchy tagline",
  "ingredients": [
    { "name": "ingredient name", "amount": "amount with unit", "emoji": "relevant emoji" }
  ],
  "recipe": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "prepTime": 10,
  "calories": 400,
  "protein": "12g",
  "funFact": "A weird or funny fact about this combo",
  "imagePrompt": "professional food photography of the exact dish described, showing all the key ingredients visibly plated together, vibrant appetizing colors, studio lighting, top view, white marble background, no people, no text, no camera"
}`;

  // gemini-2.5-flash is the most widely available model - works on all free API keys
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  console.log("🌐 Calling URL:", url.replace(process.env.GEMINI_API_KEY, "***"));

  let response;
  try {
    response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 4096,
      }
    });
  } catch (err) {
    console.error("❌ Gemini API error:", err.response?.status, JSON.stringify(err.response?.data));
    throw err;
  }

  const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const finishReason = response.data?.candidates?.[0]?.finishReason;
  console.log("🏁 Finish reason:", finishReason);
  console.log("🤖 RAW (first 300 chars):", raw?.slice(0, 300));

  if (!raw) throw new Error("No response from Gemini");

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("JSON parse failed: " + cleaned.slice(0, 200));
  }
}

export async function generateFoodImage(imagePrompt) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${process.env.GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      instances: [{ prompt: `${imagePrompt}. IMPORTANT: show ONLY these exact ingredients as described. Simple honest food photo. No fancy restaurant plating. No extra garnishes. No cameras. No people.` 
}],
      parameters: { sampleCount: 1, aspectRatio: "1:1" }
    });
    const imageData = response.data?.predictions?.[0]?.bytesBase64Encoded;
    return imageData ? `data:image/png;base64,${imageData}` : null;
  } catch (err) {
    console.error("🖼️ Image generation failed:", err.response?.data?.error?.message || err.message);
    return null;
  }
}