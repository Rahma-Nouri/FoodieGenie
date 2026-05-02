# 🧞‍♂️ FoodieGenie

> *Your wish is my recipe* — a magical AI-powered food combo generator

FoodieGenie generates creative, weird, and trending food combos using Google's Gemini AI. Pick a food type, set your time and calorie limits, and the Genie conjures a full recipe complete with ingredients, steps, a fun fact, and an AI-generated food photo.

---

## 🎬 Demo

(https://youtu.be/P8uWnSB9GN8)


---

## ✨ Features

- 🍕 **AI Combo Generation** — Gemini 2.5 Flash generates creative food combos with full recipes
- 📸 **AI Food Photography** — Imagen 4 generates a matching food image for each combo
- 🎵 **Sound Effects** — Mysterious magical sounds play while your wish is being granted
- 🧞‍♂️ **Animated Genie UI** — Aladdin-inspired design with floating food emojis and a magic lamp loading screen
- ⭐ **Rating System** — Rate each combo after it's revealed
---

## 🗂️ Project Structure

```
combo-generator/
├── backend/
│   ├── server.js        # Express API server
│   ├── ai-service.js    # Gemini AI + Imagen calls
│   ├── .env             # API keys (never commit this)
│   └── package.json
└── frontend/
    ├── public/
│   ├── genie.png    # Genie hero image
│   └── magic.png    # Magic lamp loading image
    ├── src/
    │   └── App.jsx      # Full React frontend
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key — get one free at [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/combo-generator.git
cd combo-generator
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

Start the server:

```bash
node server.js
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | CSS-in-JS (inline `<style>`) |
| Backend | Node.js + Express |
| AI Text | Google Gemini 2.5 Flash |
| AI Images | Google Imagen 4 Fast |
| HTTP Client | Axios |
| Fonts | Playfair Display, Cinzel Decorative, Nunito |

---

## 🌐 API Endpoints

### `GET /`
Health check — returns server status.

### `POST /generate-combo`
Generates a food combo with image.

**Request body:**
```json
{
  "type": "sweet",
  "maxTime": 15,
  "maxCalories": 600
}
```

**Response:**
```json
{
  "result": {
    "name": "Mango Chili Yogurt Bowl",
    "tagline": "Sweet heat you didn't know you needed",
    "ingredients": [...],
    "recipe": [...],
    "prepTime": 10,
    "calories": 320,
    "protein": "18g",
    "funFact": "...",
    "imageUrl": "data:image/png;base64,..."
  }
}
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `PORT` | Server port (default: 5000) |

---

## 📄 License

MIT — feel free to use, modify, and share.