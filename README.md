# PostFeed - Responsive Social Media App

A modern, responsive full-stack social media application featuring a matrix grid layout, glassmorphism UI, and full-screen image viewing.

## 🚀 Local Development

To run the project on your machine (`localhost`):

### 1. Backend Setup

- Go to the `Backend` directory: `cd Backend`
- Install dependencies: `npm install`
- Ensure your `.env` file has the following keys:
  ```env
  MONGO_URI=your_mongodb_uri
  JWT_SECRET=any_random_string
  YOUR_PUBLIC_KEY=imagekit_public_key
  YOUR_PRIVATE_KEY=imagekit_private_key
  IMAGEKIT_URL_ENDPOINT=imagekit_url
  ```
- Run the server: `npm run dev` (Starts on `http://localhost:3001`)

### 2. Frontend Setup

- Go to the `Frontend` directory: `cd Frontend`
- Install dependencies: `npm install`
- Run the dev server: `npm run dev` (Starts on `http://localhost:5001`)

---

## ☁️ Deployment (Vercel)

This project is pre-configured for Vercel deployment via GitHub.

### 1. Push to GitHub

- `git init`
- `git add .`
- `git commit -m "Initial commit"`
- Create a new GitHub repo and push.

### 2. Deploy Backend

- Import the repo to Vercel.
- Select `Backend` as the **Root Directory**.
- **Crucial**: Add ALL environment variables from your `Backend/.env` to Vercel (Settings -> Environment Variables).

### 3. Deploy Frontend

- Import the repo as a new Vercel project.
- Select `Frontend` as the **Root Directory**.
- Add a new Environment Variable:
  - `VITE_API_URL` = `https://your-backend-vercel-url.vercel.app`

---

## 🔒 Security Features

- **JWT (JSON Web Tokens)**: Secure authentication via set HttpOnly cookies.
- **BCrypt**: Password hashing for data protection.
- **Glassmorphism UI**: High-end modern design using CSS backdrop filters.
- **Matrix Layout**: Fully responsive grid that adapts from mobile to widescreen.
