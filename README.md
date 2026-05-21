# 📦 EasyBorrow – Peer-to-Peer Rental Management Platform

**EasyBorrow** is a full-stack MERN web application designed to simplify and streamline peer-to-peer item rentals. It allows users to list items they own, browse items available for rent, manage bookings, track rental activity, and communicate through a unified platform.

The system brings structure, trust, and transparency to the sharing economy by providing verified user profiles, booking workflows, owner approvals, rental tracking, and an admin oversight layer.

Built with  **MongoDB, Express.js, React.js, and Node.js** , the application focuses on scalability, modular architecture, and future-ready expansion such as payment integration and cloud storage.

---

## 🚀 Key Features

* **User Authentication & Verification** – Secure login, ID verification, and role-based access.
* **Item Listing System** – Owners can upload images, set rental rates, and manage availability.
* **Rental Booking Flow** – Structured request → approval → pickup → completion cycle.
* **Admin Panel** – User verification, complaint handling, and platform monitoring.
* **Dashboard for All Roles** – Tailored views for owners, renters, and admins.
* **Local File Uploads (with cloud-ready architecture)** – Images and documents stored locally for now, with planned integration of AWS S3 / Cloudinary.
* **Scalable Backend Architecture** – REST APIs with clean modular controllers, routes, and services.
* **Future Enhancements** – Payment gateway, automated security deposits, chat system, push notifications.

---

## 🛠️ Tech Stack

**Frontend:** React.js, Axios, Tailwind/Custom CSS

**Backend:** Node.js, Express.js

**Database:** MongoDB (Mongoose ORM)

**Storage:** Local file system → planned cloud migration

**Tools:** JWT Auth, Multer, Bcrypt, Nodemailer

---

## 📁 Project Structure (High-Level)EASYBORROW

<pre class="overflow-visible!" data-start="564" data-end="1953"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>EASYBORROW
│
├── server/                  </span><span># Backend (Node.js + Express)</span><span>
│   ├── config/              </span><span># DB config, environment setup, utility configs</span><span>
│   ├── controllers/         </span><span># Route logic / request handlers</span><span>
│   ├── middleware/          </span><span># Auth, validation, file upload, admin checks</span><span>
│   ├── models/              </span><span># Mongoose schemas & database models</span><span>
│   ├── routes/              </span><span># API route definitions</span><span>
│   └── app.js               </span><span># Main Express app entry point</span><span>
│
├── src/                     </span><span># Frontend (React + Vite + TypeScript)</span><span>
│   ├── components/          </span><span># Reusable UI components</span><span>
│   ├── hooks/               </span><span># Custom React hooks (auth, form, fetchers)</span><span>
│   ├── pages/               </span><span># Standalone page-level components</span><span>
│   ├── services/            </span><span># API service functions (Axios wrappers)</span><span>
│   ├── stores/              </span><span># State management (Zustand/Context)</span><span>
│   ├── utils/               </span><span># Helper functions & constants</span><span>
│   ├── App.tsx              </span><span># Root component</span><span>
│   └── main.tsx             </span><span># App bootstrap entry</span><span>
│
├── uploads/                 </span><span># Local storage for uploaded images/docs</span><span>
│
├── server.js           </span><span># server file to run backend</span><span>
├── .</span><span>env</span><span></span><span>               # Environment variables</span><span>
├── .gitignore               </span><span># Git ignored files</span><span>
├── index.html               </span><span># Frontend HTML template</span><span>
└── package.json             </span><span># Project metadata & dependencies</span><span>
</span></span></code></div></div></pre>

---

# 📌 Backend API Architecture (Express.js)

EASYBORROW aims to make renting as easy as online shopping — creating a trusted and user-friendly ecosystem where anyone can share or borrow items effortlessly.

# 🛠️ Installation & Setup Guide

Follow these steps to run **EASYBORROW** locally on your machine.

---

## **1️⃣ Prerequisites**

Make sure the following are installed:

* **Node.js** (v16+ recommended)
* **MongoDB** (local or Atlas Cloud)
* **Git**
* A package manager (**npm** or  **yarn** )

---

## **2️⃣ Clone the Repository**

https://github.com/SufiyanAnsari07/EasyBorrow.git
cd EASYBORROW

---

## **3️⃣ Backend & Frontend Setup**

### Navigate to backend folder:

<pre class="overflow-visible!" data-start="639" data-end="661"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>cd</span><span> backend
</span></span></code></div></div></pre>

### Install dependencies:

<pre class="overflow-visible!" data-start="689" data-end="712"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>npm install
</span></span></code></div></div></pre>

### Create a `.env` file:

**Database Configuration**

MONGODB_URI=mongodb://localhost:27017/EASYBORROW

NODE_ENV=development

**JWT Configuration**

JWT_SECRET=your_key

**Server Configuration**

PORT=5000

FRONTEND_URL=http://localhost:5173

# File Upload Configuration

UPLOAD_PATH=./server/uploads

MAX_FILE_SIZE=5242880

### Start backend server:

1. Open a terminal
   2. Enter node server.js

Backend will run on:

👉 **[http://localhost:5000]()**

1. Open a new teerminal
   2. Enter npm run dev

Frontend will run on:

👉 **[http://localhost:5]()173**
