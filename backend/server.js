import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateComboFromAI, generateFoodImage } from "./ai-service.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ status: "FoodieGenie API is running 🧞‍♂️" });
});

app.post("/generate-combo", async (req, res) => {
  console.log("📥 Request:", req.body);

  const { type, maxTime, maxCalories } = req.body;

  if (!type) {
    return res.status(400).json({ error: "Missing food type" });
  }

  try {
    const noPickle = Math.random() > 0.2;

    const result = await generateComboFromAI({
      type: type || "sweet",
      maxTime: maxTime || 15,
      maxCalories: maxCalories || 600,
      noPickle,
    });
    // Strip emojis from name
result.name = result.name.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]/gu, "").trim();

    console.log("✅ Generated:", result.name);

    let imageUrl = null;

    const ingredientNames = (result.ingredients || [])
      .map(ing => ing.name)
      .slice(0, 4)
      .join(", ");

    const builtPrompt =  `Food photography of a ${type} dish called "${result.name}". 
The dish contains: ${ingredientNames}. 
This is a casual home-style dish, NOT fine dining, NOT restaurant plating. 
Show it in a simple bowl or plate matching the ingredients exactly. 
No garnishes that are not in the ingredients list. 
Photorealistic, bright lighting, top-down view, clean white background, no people, no text.`;
    imageUrl = await generateFoodImage(builtPrompt);

    res.json({
      result: {
        ...result,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🧞‍♂️ FoodieGenie Server running on http://localhost:${PORT}`);
});