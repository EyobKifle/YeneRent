# YeneRent System Architecture: Frontend, Node.js Backend, and MongoDB Connection

## Overview
YeneRent is a rental property management system built with a modern full-stack architecture:
- **Frontend**: React application built with Vite
- **Backend**: Node.js/Express API server
- **Database**: MongoDB with Mongoose ODM

## Architecture Diagram

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐    MongoDB Protocol    ┌─────────────────┐
│                 │ ──────────────► │                 │ ─────────────────────► │                 │
│   React Frontend│                  │ Node.js Backend │                        │     MongoDB     │
│   (Vite)        │ ◄──────────────  │ (Express)       │ ◄────────────────────  │   (Atlas/Local) │
│                 │                  │                 │                        │                 │
└─────────────────┘                  └─────────────────┘                        └─────────────────┘
         │                                   │                                           │
         │                                   │                                           │
         ▼                                   ▼                                           ▼
    ┌─────────────┐                   ┌─────────────┐                            ┌─────────────┐
    │  Components │                   │   Routes    │                            │   Models    │
    │  Pages      │                   │ Middleware  │                            │ Collections │
    │  Utils      │                   │ Controllers │                            │ Documents   │
    └─────────────┘                   └─────────────┘                            └─────────────┘
```

## Detailed Connection Flow

### 1. Frontend to Backend Connection
- **Technology**: HTTP/HTTPS requests using Fetch API
- **Base URL**: `http://localhost:5000/api` (configurable via `VITE_API_URL`)
- **Authentication**: JWT tokens stored in localStorage, sent in Authorization header
- **API Client**: Centralized in `src/utils/api.js` using a custom ApiClient class

**Example API Call Flow:**
```
User Action → React Component → api.js → Fetch Request → Express Route → Controller → Response → Component Update
```

### 2. Backend to MongoDB Connection
- **Technology**: Mongoose ODM (Object Data Modeling)
- **Connection**: Established on server startup in `backend/server.js`
- **URI**: `process.env.MONGODB_URI` or fallback to MongoDB Atlas cluster
- **Options**: `{ autoIndex: true }` for automatic index creation

**Connection Code:**
```javascript
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://...', {
  autoIndex: true,
}).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
```

### 3. Data Flow Architecture

#### Request Flow:
1. **Frontend**: User interacts with React component
2. **API Call**: Component calls method from `api.js` (e.g., `api.getProperties()`)
3. **HTTP Request**: Fetch sends request to `/api/properties`
4. **Backend Route**: Express route handler in `backend/routes/properties.js`
5. **Middleware**: Authentication (`authenticateToken`) and other middleware
6. **Controller Logic**: Route calls controller function
7. **Database Query**: Controller uses Mongoose model to query MongoDB
8. **Response**: Data returned through the chain back to frontend

#### Data Models:
- **User**: Authentication and user management
- **Property**: Rental properties
- **Unit**: Individual units within properties
- **Tenant**: Tenant information
- **Lease**: Lease agreements
- **Payment**: Payment records
- **Expense**: Property expenses
- **Maintenance**: Maintenance requests
- **Document**: File uploads and documents
- **Utility**: Utility bills
- **AuditLog**: System audit logs

### 4. Security & Middleware
- **CORS**: Configured for `http://localhost:5173` (Vite dev server)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **Authentication**: JWT-based with middleware
- **Role-Based Access**: Owner/Admin/User roles with `requireRole` middleware

### 5. Security Features

#### Password Security
- **Hashing Algorithm**: bcryptjs with 10 salt rounds (configurable via `BCRYPT_ROUNDS`)
- **Automatic Hashing**: Pre-save hook in User model automatically hashes passwords
- **Secure Comparison**: Timing-safe password verification using `bcrypt.compare()`
- **No Plain Text Storage**: Passwords never stored in readable form

**Password Hashing Code (from `backend/models/User.js`):**
```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
```

#### Authentication & Authorization
- **JWT Tokens**: JSON Web Tokens for session management
- **Token Storage**: Stored in localStorage on frontend
- **Middleware Protection**: `authenticateToken` middleware for protected routes
- **Role-Based Access**: Owner/Admin/User roles with `requireRole` middleware
- **CORS Protection**: Configured for frontend origin only
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js for additional security

### 6. Development Setup
- **Frontend**: `npm run dev` (Vite on port 5173)
- **Backend**: `node server.js` (Express on port 5000)
- **Database**: MongoDB Atlas or local MongoDB instance
- **Environment**: `.env` file for sensitive config (MONGODB_URI, JWT_SECRET)

### 6. Production Considerations
- **Environment Variables**: Secure storage of database credentials
- **Connection Pooling**: Mongoose handles connection pooling automatically
- **Indexing**: Auto-indexing enabled for performance
- **Error Handling**: Centralized error middleware
- **Logging**: Morgan for request logging, custom audit logging

This architecture provides a scalable, secure, and maintainable full-stack application for rental property management.
