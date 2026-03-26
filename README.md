# PostMusic AI-Enhanced Social Platform

A professional, full-stack social platform for musicians and creators, featuring AI-powered recommendations, creative tools, and a premium, modern UI.

## 🚀 Projects
- **[Backend](./Backend)**: Node.js/Express API with MongoDB, AI services, and professional security middleware.
- **[Frontend](./Frontend)**: Modern React/Vite application with Tailwind CSS, Lucide icons, and a high-performance UI.

## ✨ Key Features
- **AI-Powered Music Recommendations**: personalized tracks based on mood and user history.
- **Creative AI Suite**: AI-generated captions and creative hashtag suggestions.
- **Content Moderation**: Real-time safety filters and automated reporting tools.
- **Premium UI/UX**: Dark-themed, responsive design with glassmorphism and modern animations.
- **Secure Architecture**: JWT authentication, rate limiting, and security headers (Helmet).

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Axios.
- **Backend**: Node.js, Express, MongoDB/Mongoose, Groq AI SDK, JWT, Helmet.
- **Deployment**: Vercel ready (Separate configurations for Frontend & Backend).

## 📦 Setup & Installation

### Prerequisites
- Node.js >= 18.x
- MongoDB (Local or Atlas)
- Groq Cloud API Key
- ImageKit Account (for uploads)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd POSTFEED
   ```

2. Install all dependencies:
   ```bash
   npm run install-all
   ```

3. Setup environment variables:
   - Copy `Backend/.env.example` to `Backend/.env` and fill in your keys.
   - Copy `Frontend/.env.example` to `Frontend/.env` and fill in your keys.

4. Run the development servers:
   - **Backend**: `npm run backend` (starts on http://localhost:3001)
   - **Frontend**: `npm run frontend` (starts on http://localhost:5173)

## 🚢 Deployment
The project is configured for easy deployment to **Vercel**:
- Backend uses `@vercel/node` with serverless routing.
- Frontend uses Vite build and SPA routing.

## 📜 License
ISC License
