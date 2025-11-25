# 🧩 TinyLink – URL Shortener

A lightweight and fast **URL Shortening Web Application** built with **Node.js, Express, EJS, and MongoDB**.  
It allows users to shorten long URLs, manage links, view click stats, search links, and delete links easily.

---

## 🚀 Features

- Shorten long URLs instantly
- Redirect using short IDs
- View all URLs in dashboard
- Click count tracking
- Delete links
- Search by keyword
- Clean UI using EJS templates
- MongoDB database integration
- Fully deployment-ready

---

## 🛠️ Tech Stack

**Frontend:**

- HTML, CSS (via EJS templates)

**Backend:**

- Node.js
- Express.js

**Database:**

- MongoDB (Atlas recommended)

---

## 📦 Project Structure

```
`TinyLink/
│── server.js
│── package.json
│── models/
│── public/
│── views/
└── README.md`
```

---

## ⚙️ Installation & Local Setup

### **1. Clone the Repository**

`git clone https://github.com/Suhas26-05/TinyLink-Aganitha.git cd TinyLink-Aganitha`

### **2. Install Dependencies**

`npm install`

### **3. Create `.env` File**

Create a file named `.env` in the project root:

`MONGO_URI=your-mongodb-connection-string`

Make sure `.env` is added to `.gitignore`.

### **4. Run the Server**

`npm run dev`

or

`npm start`

Server runs at:

`http://localhost:5000`

---

## 🌐 Deployment Guide (Render + MongoDB Atlas)

### **1. Update code to use environment variables**

Your `server.js` should contain:

`const  PORT = process.env.PORT || 5000; const  MONGO_URI = process.env.MONGO_URI;`

### **2. Push code to GitHub**

### **3. Deploy on Render**

- Go to [https://render.com](https://render.com)
- Click **New → Web Service**
- Select your GitHub repo
- Set:

  - **Build Command:** `npm install`
  - **Start Command:** `npm start`

### **4. Add Environment Variable in Render**

`MONGO_URI = your-atlas-url`

### **5. Deploy**

Render assigns a live URL like:

`https://tinylink.onrender.com`

---

## 🧪 API Endpoints

### **POST /shorten**

Create a new shortened URL.

### **GET /:shortId**

Redirect to original URL.

### **GET /dashboard**

View all URLs and stats.

### **DELETE /delete/:id**

Delete a URL entry.

### **GET /search?query=keyword**

Search links by keyword.

### **GET /healthz**

Health check endpoint for deployment services.

---

## 👨‍💻 Developer Notes

- Do **NOT** commit your `.env` file.
- Rotate MongoDB credentials if accidentally exposed.
- Update `.gitignore` to include `.env`.
- For production, always use MongoDB Atlas.
