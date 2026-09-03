# 🚀 UdhyogSathi Backend API

Backend service for **UdhyogSathi**, a SaaS billing application that helps businesses generate **"Pakka" (GST-compliant)** and **"Kaccha" (estimate/rough)** bills.

The backend handles user authentication, business onboarding, invoice generation, and invoice snapshot logic for maintaining historical billing information.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **Authentication:** JWT (JSON Web Tokens)
* **Password Hashing:** bcrypt
* **File Uploads:** Multer
* **Cloud Storage:** Cloudinary
* **Payment Gateway:** Razorpay
* **AI Integration:** OpenAI API
* **Containerization:** Docker
* **Development:** Nodemon

---

## ⚙️ Prerequisites

Before running the project, make sure you have:

* [Node.js](https://nodejs.org/) v16+
* MongoDB / MongoDB Atlas
* Docker (optional, for containerized deployment)
* Git

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Manish-bhargava/udhyog-saath-backend.git

cd udhyog-saath-backend
```

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the root directory.

Example structure:

```env
# Server
PORT=7777

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

> **Important:** Never commit `.env` to GitHub. Add `.env` to `.gitignore`.

---

# ▶️ Running Locally

## Development

Run the backend using Nodemon:

```bash
npm run dev
```

The server runs on:

```text
http://localhost:7777
```

## Production

```bash
npm start
```

---

# 🐳 Running with Docker

The backend can also be run as a Docker container.

## 1. Build the Docker Image

```bash
docker build -t udhyog-backend .
```

## 2. Run the Container

```bash
docker run --env-file .env -p 7777:7777 udhyog-backend
```

The application will then be available at:

```text
http://localhost:7777
```

### Docker Architecture

```text
                    Docker Host
                         │
                         │ :7777
                         ▼
              ┌─────────────────────┐
              │   udhyog-backend    │
              │                     │
              │   Node.js           │
              │   Express.js        │
              │   Port: 7777        │
              └──────────┬──────────┘
                         │
                         │ MongoDB URI
                         ▼
                    MongoDB Atlas
```

### Docker Image

The Docker image uses Node.js Alpine for a lightweight production container.

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 7777

CMD ["node", "src/app.js"]
```

Environment variables are passed at runtime using:

```bash
--env-file .env
```

The `.env` file is intentionally excluded from the Docker image.

---

# ❤️ Health Check

The backend exposes a health-check endpoint:

```http
GET /health
```

Example:

```bash
curl http://localhost:7777/health
```

Expected response:

```text
server is up and running
```

---

# 📚 API Documentation

## Base URL

```text
http://localhost:7777/api
```

---

## 🔐 1. Authentication

| Method | Endpoint         | Description                 | Auth Required |
| ------ | ---------------- | --------------------------- | ------------- |
| `POST` | `/auth/register` | Register a new user         | No            |
| `POST` | `/auth/login`    | Login and receive JWT token | No            |

---

## 🏢 2. User Onboarding

Business onboarding is required before creating a **Pakka** bill.

| Method | Endpoint           | Description                    | Auth Required |
| ------ | ------------------ | ------------------------------ | ------------- |
| `POST` | `/user/onboarding` | Create/update business profile | ✅ Yes         |

### Request Body

```json
{
  "companyName": "Tech Solutions Pvt Ltd",
  "GST": "22AAAAA0000A1Z5",
  "companyAddress": "123, Tech Park, Mumbai",
  "companyPhone": "9876543210",
  "companyLogo": "https://url-to-logo.com/image.png",
  "accountNumber": "1234567890",
  "IFSC": "SBIN0001234",
  "bankName": "SBI"
}
```

---

# 🧾 3. Billing Management

UdhyogSathi supports two types of bills:

* **Pakka Bill** — Formal GST-compliant invoice
* **Kaccha Bill** — Rough estimate

| Method | Endpoint                 | Description            | Auth Required |
| ------ | ------------------------ | ---------------------- | ------------- |
| `POST` | `/bills/create/pakka`    | Create formal GST bill | ✅ Yes         |
| `POST` | `/bills/create/kaccha`   | Create rough estimate  | ✅ Yes         |
| `GET`  | `/bills/all`             | Get all bills          | ✅ Yes         |
| `GET`  | `/bills/all?type=pakka`  | Get only Pakka bills   | ✅ Yes         |
| `GET`  | `/bills/all?type=kaccha` | Get only Kaccha bills  | ✅ Yes         |
| `GET`  | `/bills/:id`             | Get a single bill      | ✅ Yes         |

---

## Create Bill Request

The frontend does **not** need to send seller/company information.

The backend automatically retrieves the user's business profile.

Example:

```json
{
  "buyer": {
    "clientName": "Client Name",
    "clientAddress": "Client Address",
    "clientGst": "OPTIONAL_GST_NO"
  },
  "products": [
    {
      "name": "Product A",
      "rate": 100,
      "quantity": 2
    }
  ],
  "gstPercentage": 18,
  "discount": 50
}
```

---

# 📂 Project Structure

```text
src/
├── controllers/
│   ├── auth/
│   ├── onboarding/
│   └── bills/
│
├── models/
│   ├── User
│   ├── Onboarding
│   └── Bill
│
├── routes/
│   ├── v1/
│   └── index.js
│
├── middleware/
│   └── authentication / authorization
│
├── config/
│   └── db.js
│
└── app.js
```

---

# 💡 Key Business Logic

## 1. Onboarding Gatekeeping

A user cannot create a **Pakka bill** until their business profile has been completed.

The backend validates the onboarding status before allowing a formal invoice to be created.

---

## 2. Invoice Snapshot Strategy

When a bill is created, the backend stores a snapshot of the user's business information inside the bill document.

This includes information such as:

* Company name
* Address
* GST number
* Phone number
* Company logo
* Bank details

### Why?

Suppose a business changes its address next month.

Old invoices should still contain the **original business information that existed when those invoices were created**.

This maintains historical consistency for invoices and audit purposes.

---

## 3. Frontend PDF Generation

When generating a bill PDF, the frontend should use:

```text
response.data.sellerDetails
```

instead of fetching the current user profile separately.

This ensures that the PDF displays the seller information captured at the time the invoice was created.

---

# 🔒 Security

The project uses:

* JWT-based authentication
* bcrypt password hashing
* Environment variables for secrets
* CORS configuration
* Protected API routes
* `.gitignore` for sensitive files
* Docker runtime environment variables

Never commit:

```text
.env
node_modules/
```

to the repository.

---

# 🐳 Docker Commands

### Build

```bash
docker build -t udhyog-backend .
```

### Run

```bash
docker run --env-file .env -p 7777:7777 udhyog-backend
```

### View Running Containers

```bash
docker ps
```

### View Backend Logs

```bash
docker logs <container_id>
```

### Stop Container

```bash
docker stop <container_id>
```

### Remove Container

```bash
docker rm <container_id>
```

---

# 📌 Current Backend Port

```text
7777
```

Local API:

```text
http://localhost:7777
```

Health check:

```text
http://localhost:7777/health
```

API:

```text
http://localhost:7777/api
```

---

# 👨‍💻 Author

**Manish Bhargava**

UdhyogSathi Backend API
