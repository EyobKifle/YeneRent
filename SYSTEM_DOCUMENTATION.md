# YeneRent System Documentation

This document provides a comprehensive overview of the technical stack, dependencies, and core concepts used in the **YeneRent** Property Management System.

---

## 🏗️ Architecture Overview

YeneRent is built using the **MERN Stack**, a popular full-stack development framework that includes:
- **M**ongoDB: The database.
- **E**xpress.js: The backend web framework.
- **R**eact: The frontend library.
- **N**ode.js: The runtime environment for the server.

The project is split into two main parts:
1.  **Backend (`/backend`)**: A RESTful API that handles data, authentication, and business logic.
2.  **Frontend (`/src`)**: A single-page application (SPA) built with React and Vite for a fast user experience.

---

## �️ Database Schema (MongoDB & ER Diagram)

YeneRent uses a **NoSQL Database (MongoDB)**. Unlike traditional tables, data is stored in "Collections". Below is the visual map of how different data pieces (Documents) relate to each other.

### 🗺️ Relationship Diagram (ER Diagram)

    USER {
        string name
        string email
        string password
        string role
    }
    PROPERTY {
        string name
        string address
        string type
        number rent
        number unitsCount
    }
    UNIT {
        string unitNumber
        string floor
        string status
        number rent
    }
    TENANT {
        string name
        string email
        string phone
        string status
    }
    LEASE {
        date startDate
        date endDate
        number rentAmount
        string status
    }
    PAYMENT {
        number amount
        string type
        date date
        string status


### 📄 Data Models Breakdown
- **User**: The root entity. Property owners or managers who can see and edit their own data.
- **Property**: Represents a building (e.g., "Grand Villa"). It holds multiple units.
- **Unit**: The specific room or space (e.g., "Apt 101"). Can be `Available` or `Occupied`.
- **Tenant**: The individual living in a unit. Linked to a `Unit` via a `Lease`.
- **Lease**: The contract that connects a `Tenant`, a `Unit`, and a `Property`. It tracks start/end dates.
- **Payment**: Tracks rent, deposits, and fees. Each payment is linked back to a `Lease` and `Tenant`.
- **Maintenance/Utility**: Operational logs. Maintenance tracks repairs, and Utilities track bills.

---


## �🛠️ Backend Technologies & Concepts

The backend is responsible for interacting with the database and serving data to the frontend securely.

### Core Concepts

#### 🔐 JWT (JSON Web Token)
Used for **Authentication**. When a user logs in, the server generates a unique "token" (JWT) and sends it to the client. The client include this token in the header of every subsequent request to prove their identity. It consists of three parts: a header, a payload (user info), and a signature (to prevent tampering).

#### 🛡️ Bcrypt (bcryptjs)
Used for **Password Hashing**. You should *never* store plain-text passwords in a database. Bcrypt takes a password and turns it into a "hash" (a long string of random characters). Even if the database is leaked, the actual passwords remain safe because the hashing is irreversible.

#### 🚦 Middleware
In Express, middleware are functions that run *before* the request reaches your final logic. Examples in this project include:
-   `authenticateToken`: Checks if the user is logged in.
-   `errorHandler`: Catches any system errors and returns a clean message.
-   `sanitizeData`: Cleans user input to prevent security attacks like XSS.

---

## 📦 Dependency Breakdown

Here is a detailed explanation of the libraries used in the system:

### Backend-Specific Dependencies
| Dependency | Purpose | Simple Explanation |
| :--- | :--- | :--- |
| **express** | Web Framework | The "skeleton" of the backend. It routes requests (like `/api/properties`) to the right functions. |
| **mongoose** | MongoDB ODM | A tool that helps us talk to MongoDB using JavaScript objects. It enforces a "Schema" so data stays organized. |
| **jsonwebtoken** | Auth Tokens | Implements the JWT login system mentioned above. |
| **bcryptjs** | Security | Handles password hashing and verification. |
| **cors** | Security | Stands for "Cross-Origin Resource Sharing". It allows your frontend (on port 5173) to talk to your backend (on port 5000). |
| **dotenv** | Configuration | Loads secret variables (like database URLs and API keys) from a `.env` file into the app. |
| **multer** | File Uploads | A middleware for handling `multipart/form-data`, used for uploading property images and lease documents. |
| **helmet** | Security | Automatically sets various HTTP headers to make the app more secure against common web vulnerabilities. |
| **morgan** | Logging | Prints "logs" in the terminal whenever a request is made, helping developers see what's happening in real-time. |
| **express-validator** | Validation | Ensures that data sent by the user (like email or price) is in the correct format before saving it to the database. |

### Frontend-Specific Dependencies
| Dependency | Purpose | Simple Explanation |
| :--- | :--- | :--- |
| **react** | UI Library | The core library for building the user interface using components. |
| **react-router-dom** | Navigation | Allows the app to have multiple "pages" (like Dashboard, Tenants, Payments) without reloading the browser. |
| **axios** | HTTP Client | The "messenger" that sends requests from the frontend to the backend API. |
| **chart.js** & **react-chartjs-2** | Analytics | Power the visual charts and graphs on the Analytics page. |
| **lucide-react** | Icons | A library of beautiful, modern SVG icons used throughout the dashboard. |
| **date-fns** | Date Handling | A library for formatting and manipulating dates (e.g., turning `2024-05-01` into `May 1, 2024`). |
| **i18next** & **react-i18next** | Translation | Handles Internationalization, allowing the app to support multiple languages. |
| **react-modal** | UI Components | Used for the pop-up windows (modals) when adding properties, editing tenants, etc. |

---

## 🌐 External APIs & Services

1.  **MongoDB Atlas**: A cloud-hosted database service where all the system's data (tenants, properties, payments) is stored.
2.  **Font Awesome**: A CDN used in `index.html` to provide additional icon support.
3.  **Local File System**: Used (via `uploads/` folder) to store documents and images locally on the server.

---

## 📁 System Folder Structure

-   `/backend`
    -   `/models`: Defines the data structure (Tenant, Property, etc.).
    -   `/routes`: Defines the API endpoints (GET, POST, etc.).
    -   `/middleware`: Security and helper functions.
    -   `/uploads`: Storage for uploaded files.
-   `/src`
    -   `/components`: Reusable UI pieces (Buttons, Cards, Modals).
    -   `/pages`: The main views of the application.
    -   `/context`: Global state management (like User Auth).
    -   `/assets`: Static files like CSS and images.
