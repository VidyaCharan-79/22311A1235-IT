# Social Media Feed App

A modern, full-stack social networking feed application built with React, Express, and SQLite.

## 🚀 Features
- User authentication (register/login/logout)
- Create posts with text and images
- Like and comment on posts
- User profiles with post history
- Edit your profile picture and bio
- Search posts by content or user
- Follow/unfollow users
- Real-time post updates (UI refresh)
- Responsive, modern UI with Tailwind CSS

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)

## 📦 Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/VidyaCharan-79/22311A1235-IT.git
cd <project-folder>
```

### 2. Install dependencies
```sh
npm install
```

### 3. Start the app (dev mode)
```sh
npm run dev
```
- The backend server will run on `http://localhost:5000` (or next available port)
- The frontend will run on `http://localhost:3000` (or next available port)

### 4. Demo Accounts
- `john@example.com` / `password123`
- `jane@example.com` / `password123`
- `mike@example.com` / `password123`

Or register a new account!

## 📝 Usage
- **Feed:** See all posts in chronological order
- **Create Post:** Add a new post with text and/or image
- **Like/Comment:** Interact with posts
- **Profile:** View your own or others' profiles, see post history
- **Edit Profile:** Update your profile picture and bio
- **Search:** Find posts by content or user
- **Follow:** Follow or unfollow other users


## 📂 Project Structure
```
charanias/
├── server/           # Express backend
│   └── index.js
├── src/              # React frontend
│   ├── components/
│   ├── context/
│   ├── services/
│   ├── App.jsx
│   └── ...
├── database.sqlite   # SQLite database (auto-generated)
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## ⚡ Deployment
- You can deploy the backend and frontend separately (e.g., Vercel/Netlify for frontend, Render/Heroku for backend)
- Make sure to update API URLs in `src/services/api.js` for production


Enjoy your own social media platform! 🎉
