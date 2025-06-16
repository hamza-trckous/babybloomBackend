# 🛒 BabyBloom E-commerce Backend

A secure, scalable backend built with **Node.js**, **Express**, and **MongoDB**, powering the BabyBloom eCommerce platform.

Live Frontend: [vs-ebon.vercel.app](https://vs-ebon.vercel.app)  
Frontend Repo: [vsFrontEnd](https://github.com/hamza-trckous/vsFrontEnd)

---

## ⚙️ Tech Stack

| Tool            | Purpose                      |
| --------------- | ---------------------------- |
| **Node.js**     | Backend JavaScript runtime   |
| **Express**     | HTTP server framework        |
| **MongoDB**     | NoSQL database               |
| **Mongoose**    | MongoDB ODM                  |
| **Zod**         | Input validation             |
| **JWT**         | Authentication (token-based) |
| **Bcrypt.js**   | Password hashing             |
| **dotenv**      | Environment config           |
| **Helmet**      | Security headers             |
| **CORS**        | Cross-origin support         |
| **Cookies**     | Auth/session support         |
| **Google APIs** | For integrations (optional)  |
| **UUID**        | Unique ID generation         |

---

## 📁 Folder Structure

babybloomBackend/
├── models/ # Mongoose models (User, Product, etc.)
├── routes/ # Express routes
├── middleware/ # Auth, error handling, etc.
├── utils/ # Helper functions
├── scripts/ # Script to create admin users
├── .env # Environment variables
├── index.js # Entry point
└── README.md

---

## 🚀 Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/hamza-trckous/babybloomBackend.git
cd babybloomBackend

2 Install dependencies
npm install

Set up your .env file

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
COOKIE_SECRET=your_cookie_key


Start the development server

npm run dev

 Deployment
Hosted on Render

Exposes a REST API consumed by the BabyBloom frontend

Secure with Helmet, CORS, and cookie-based authentication



📜 License
This project is for educational and demonstration purposes only.


🙋‍♂️ Author
Hamza Benchadi
GitHub: hamza-trckous



  ---


```
