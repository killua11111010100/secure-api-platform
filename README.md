# 🔐 Secure API Platform

A secure and production-ready REST API built with Node.js, Express, and PostgreSQL. This project demonstrates modern authentication systems, backend security best practices, and cloud deployment.

---

## 🚀 Overview

This API simulates a real-world authentication system used in modern applications (ex: Netflix, Uber). It includes JWT authentication, refresh tokens stored in httpOnly cookies, PostgreSQL integration, security protections, and deployment on Microsoft Azure.

---

## 🧱 Tech Stack

Backend: Node.js, Express.js  
Database: PostgreSQL (Neon Cloud)  
Authentication: JSON Web Tokens (JWT)  
Security: Helmet, CORS, Express Rate Limit, Cookie Parser  
Deployment: Microsoft Azure  
Testing: Postman / Swagger  

---

## 📁 Project Structure

secure-api/  
│  
├── src/  
│   ├── config/        → Database configuration  
│   ├── routes/        → API routes (auth & protected)  
│   ├── middleware/    → Security & error handling  
│   ├── utils/         → Token utilities  
│  
├── server.js          → Entry point  
├── package.json       → Dependencies  
├── .env               → Environment variables  
└── README.md  

---

## 🔐 Features

Authentication:
- Register users  
- Login system  
- Password hashing (bcrypt)  
- Access Token (short-lived)  
- Refresh Token (httpOnly cookie)  

Token System:
- Refresh tokens without re-login  
- Secure logout  

Security:
- Helmet → secure HTTP headers  
- CORS → control frontend access  
- Rate limiting → prevent brute-force  
- Environment variables → protect secrets  

Database:
- PostgreSQL cloud database  
- Connection pooling  
- Initialization  

---

## ⚙️ Installation

Clone repository:
git clone https://github.com/your-username/secure-api.git  
cd secure-api  

Install dependencies:
npm install  

Create `.env` file:

PORT=3000  
DATABASE_URL=your_database_url  
JWT_SECRET=your_secret  
JWT_REFRESH_SECRET=your_refresh_secret  
CORS_ORIGIN=http://localhost:5173  

Run server:
npm run dev  

Server runs on:
http://localhost:3000  

---

## 🌐 API Endpoints

Authentication:
POST /api/auth/register → Register  
POST /api/auth/login → Login  
POST /api/auth/refresh → Refresh token  
POST /api/auth/logout → Logout  

Protected:
GET /api/protected → Requires authentication  

---

## 🧪 Testing

Use Postman or Swagger.

Example:
{
  "email": "test@test.com",
  "password": "123456"
}

Important:
- Enable cookies  
- Send credentials  

---

## ☁️ Deployment (Azure)

1. Push to GitHub  
2. Connect to Azure App Service  
3. Configure environment variables  
4. Deploy  

---

## 📊 Security Design

- Short-lived access tokens  
- Refresh tokens in httpOnly cookies  
- No sensitive data in frontend  
- Rate limiting protection  
- Environment variables for secrets  

---

## 🧠 Learning Outcomes

- Built a secure backend API  
- Implemented JWT authentication  
- Managed refresh tokens securely  
- Deployed to Azure  
- Debugged real-world issues  

---

## 📌 Future Improvements

- RBAC (roles)  
- Email verification  
- Password reset  
- Logging system  
- Docker  
- CI/CD  

---

## 👨‍💻 Author

Edwar Nazzarian  
Software Engineering Student  

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
