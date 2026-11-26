# Doctor Management System

A full-stack healthcare appointment management platform built on the MERN stack and enhanced with **LangChain** and **Retrieval-Augmented Generation (RAG)**. The platform provides a patient-facing web portal, dedicated doctor and admin dashboards, online Razorpay payments, WebRTC video consultations, a rule-based symptom checker, an intelligent RAG-powered assistant for doctor discovery, and multi-channel notifications.

---

## Core Features

### Patient Portal (`fronted/`)
- **Authentication:** Secure user registration and login powered by JSON Web Tokens (JWT) and bcrypt password hashing.
- **Doctor Discovery:** Filter and browse medical specialists, inspect detailed profiles (experience, qualifications, fees, clinic address), and view real-time slot availability.
- **Appointment Booking:** Schedule either in-person clinic visits or remote video consultations, with support for cancellations within permitted windows.
- **Online Payments:** Integrated **Razorpay** checkout for seamless fee processing and payment status tracking in appointment history.
- **Video Consultations:** Join paid WebRTC video calls directly in the browser during scheduled appointment windows.
- **Rule-Based Symptom Checker:** Structured patient intake that detects red-flag warning signs, provides care-level guidance, recommends suitable doctors, stores local assessment history, and generates downloadable reports.
- **LangChain & RAG Assistant Chatbot:** An interactive AI assistant built with **LangChain** that guides users through platform workflows and uses **Retrieval-Augmented Generation (RAG)** to query live doctor records and provide tailored specialist recommendations.
- **Notification Center:** Real-time in-app notification bell supporting mark-as-read, individual deletion, and bulk clear actions.

### Doctor Dashboard (`admin/`)
- **Appointment Management:** Dedicated doctor login to view assigned schedules and update appointment statuses (`pending`, `confirmed`, `cancelled`, `completed`).
- **Telemedicine:** Launch and conduct scheduled video consultations with patients.
- **Profile & Schedule Control:** Update consultation fees, clinic address, bio details, and booking availability.

### Admin Dashboard (`admin/`)
- **Platform Oversight:** Secure administrator login to monitor all registered doctors and platform-wide appointments.
- **Doctor Onboarding:** Add new doctors with profile imagery uploaded to Cloudinary and manage their active availability status.

### Automated Multi-Channel Notifications
- **In-App:** Persistent notification records stored in MongoDB.
- **Email:** Transactional emails dispatched via **Nodemailer** (SMTP).
- **SMS:** Automated text alerts sent via **Twilio**.
- **Event Triggers:** Covers appointment bookings, cancellations, payment confirmations, and upcoming appointment reminders.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Patient Frontend** | React, Vite, Tailwind CSS |
| **Admin / Doctor Panel** | React, Vite, Tailwind CSS |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **AI & RAG Pipeline** | LangChain, Retrieval-Augmented Generation (RAG), Groq API, Google Gemini API |
| **Authentication** | JWT, bcrypt |
| **Media & Storage** | Multer, Cloudinary |
| **Payments** | Razorpay |
| **Real-Time Video** | WebRTC, WebSockets (custom signaling server) |
| **Communications** | Nodemailer, Twilio |

---

## Project Architecture

```text
doctor_management/
├── backend/    # Express REST API, WebSocket signaling, Mongoose models, LangChain RAG services
├── fronted/    # Patient-facing React + Vite application
└── admin/      # Unified Admin and Doctor React + Vite dashboard
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** instance (local or MongoDB Atlas)
- Active accounts/keys for **Cloudinary**, **Razorpay**, **Groq**, **Google AI Studio (Gemini)**, **SMTP**, and **Twilio**

### 1. Installation

Clone the repository and install dependencies across the root, backend, patient frontend, and admin panel:

```bash
npm install
cd backend && npm install
cd ../fronted && npm install
cd ../admin && npm install
```

### 2. Environment Configuration

#### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory with the following variables:

```env
# Server & Database
PORT=4000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# AI & LangChain RAG Providers
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key

# Cloudinary Media Storage
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CURRENCY=INR

# Email Notifications (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
NOTIFICATION_EMAIL_FROM=your_email@gmail.com

# SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

#### Patient App (`fronted/.env`)
Create a `.env` file inside the `fronted/` directory:

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_TEST_API_KEY=your_razorpay_public_key
```

#### Admin & Doctor Panel (`admin/.env`)
Create a `.env` file inside the `admin/` directory:

```env
VITE_BACKEND_URL=http://localhost:4000
```

### 3. Running Locally

Start each service in a separate terminal window:

**Start the Backend Server:**
```bash
cd backend
npm run server
```

**Start the Patient Application:**
```bash
cd fronted
npm run dev
```

**Start the Admin / Doctor Dashboard:**
```bash
cd admin
npm run dev
```

#### Default Local Endpoints
- **Backend API:** `http://localhost:4000`
- **Patient Portal:** `http://localhost:5173`
- **Admin / Doctor Panel:** `http://localhost:5174`

---

## Available Scripts

| Directory | Command | Description |
| :--- | :--- | :--- |
| `backend/` | `npm start` | Runs the production Node.js server |
| `backend/` | `npm run server` | Runs the backend server in development mode |
| `fronted/` & `admin/` | `npm run dev` | Starts the Vite development server |
| `fronted/` & `admin/` | `npm run build` | Bundles the application for production |
| `fronted/` & `admin/` | `npm run preview` | Previews the production build locally |
| `fronted/` & `admin/` | `npm run lint` | Runs ESLint across the codebase |

---

## Operational Notes

- **AI Assistant & Medical Disclaimer:** The chatbot leverages LangChain and RAG to retrieve relevant doctor data and generate suggestions, while the symptom checker uses deterministic rules. Neither feature constitutes a medical diagnosis or emergency service; always verify doctor availability directly before booking.
- **Video Consultations:** Browser permissions for both camera and microphone are required. Video rooms unlock strictly for paid video appointments within their designated time windows.
- **Notification Delivery:** Ensure SMTP app passwords are valid for email delivery and Twilio recipient phone numbers follow international E.164 formatting (e.g., `+91XXXXXXXXXX`).

---

## License

This project is licensed under the **ISC** License.