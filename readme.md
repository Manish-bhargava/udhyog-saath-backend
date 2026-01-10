Here is a professional, production-ready `README.md` for your project. I have structured it specifically so that a Frontend Developer (or any new team member) can set it up in 5 minutes and understand exactly how to consume your APIs.

---

# 🚀 UdhyogSathi Backend API

This is the backend service for **UdhyogSathi**, a SaaS billing application that allows businesses to generate "Pakka" (GST Compliant) and "Kaccha" (Estimate) bills.

It handles User Authentication, Business Onboarding (Profile Management), and Invoice Generation with snapshot logic for audit trails.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose)
* **Authentication:** JWT (JSON Web Tokens)

---

## ⚙️ Prerequisites

Before running the project, ensure you have the following installed:

* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a generic Atlas URI)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/udhyog-sathi-backend.git
cd udhyog-sathi-backend

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env` file in the root directory. Copy the structure below and add your secrets:

```env
# Server Configuration
PORT=3000

# Database Connection
MONGO_URI=mongodb://localhost:27017/udhyogsathi

# Security
JWT_SECRET=your_super_secret_jwt_key

```

### 4. Run the Server

```bash
# Development Mode (with Nodemon)
npm run dev

# Production Mode
npm start

```

*Server runs on `http://localhost:3000` by default.*

---

## 📚 API Documentation

### Base URL: `/api/v1`

### 🔐 1. Authentication

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and get JWT Token | No |

### 🏢 2. User Onboarding (Business Profile)

*This step is mandatory before creating "Pakka" bills.*

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/user/onboarding` | Create/Update Business Profile | ✅ Yes |

**Request Body (Flat JSON Structure):**

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

### 🧾 3. Billing Management

*Supports both 'Pakka' (Formal) and 'Kaccha' (Rough) bills.*

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/bills/create/pakka` | Create a Formal GST Bill | ✅ Yes |
| `POST` | `/bills/create/kaccha` | Create a Rough Estimate | ✅ Yes |
| `GET` | `/bills/all` | Get **ALL** Bills (History) | ✅ Yes |
| `GET` | `/bills/all?type=pakka` | Get only **Pakka** Bills | ✅ Yes |
| `GET` | `/bills/all?type=kaccha` | Get only **Kaccha** Bills | ✅ Yes |
| `GET` | `/bills/:id` | Get Single Bill Details (For PDF) | ✅ Yes |

**Create Bill Request Body:**
*Note: Do not send company details. The backend automatically fetches them from the user's onboarding profile.*

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

## 📂 Project Structure

```text
src/
├── controllers/      # Logic for handling requests
│   ├── auth/         # Login/Signup logic
│   ├── onboarding/   # Business profile logic
│   └── bills/        # Billing & Calculation logic
├── models/           # Mongoose Schemas (User, Onboarding, Bill)
├── routes/           # API Route Definitions
│   ├── v1/           # Version 1 Routes
│   └── index.js      # Main Router Hub
├── middleware/       # Auth verification (JWT)
└── app.js            # Entry point

```

---

## 💡 Key Business Logic (For Developers)

1. **Onboarding Gatekeeping:**
* A user **cannot** create a "Pakka" bill until they have completed the `/user/onboarding` step. The backend will return a `400` error if they try.


2. **Snapshot Strategy for Invoices:**
* When a bill is created, we **copy** the user's current business details (Address, GST, Logo) into the Bill document permanently.
* *Why?* If the user changes their address next month, old bills created today should still show the old address (legal requirement).
* **Frontend Note:** When generating the PDF, simply use the data inside `response.data.sellerDetails`. Do not fetch the user profile separately.