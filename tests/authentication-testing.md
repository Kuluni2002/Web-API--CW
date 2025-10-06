Authentication Feature - Test Report


Project: NTC Bus Tracking API
Feature: User Authentication 
Date: 2025-10-05
Branch: testing
Version: v0.3-authentication

Test Environment
Server Configuration:

Base URL: http://localhost:3000
Database: MongoDB Atlas
Authentication: JWT 
Token Expiry: 7 days

Testing Tools:

API Testing: Postman 
Server: Node.js + Express.js
Database: MongoDB with Mongoose

Test Endpoints:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Positive Test Cases


TC-001: Register New User

Objective: Verify that a new user can successfully register
Endpoint: POST /api/auth/register
Request Headers:
Content-Type: application/json

Request Body:
json{
  "username": "admin1",
  "email": "admin1@ntc.lk",
  "password": "admin1@123",
  "role": "admin"
}

Expected Response:
Status Code: 201 Created
Response includes user data (without password)
Response includes JWT token
User created in database with hashed password

Actual Response:
json{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "677...",
      "username": "admin1",
      "email": "admin1@ntc.lk",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3N..."
  }
}
Status Code: 201 

Verification:
User created successfully
Password hashed in database (not stored as plain text)
JWT token generated and returned
Response excludes sensitive data (password)
User ID automatically generated

Result: PASS



TC-002: Login With Correct Credentials

Objective: Verify that a user can log in with correct credentials
Endpoint: POST /api/auth/login
Request Headers:
Content-Type: application/json

Request Body:
json{
  "email": "admin1@ntc.lk",
  "password": "admin1@123"
}

Expected Response:
Status Code: 200 OK
Response includes user data
Response includes valid JWT token
Token contains user ID

Actual Response:
json{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "677...",
      "username": "admin1",
      "email": "admin1@ntc.lk",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3N..."
  }
}
Status Code: 200 

Verification:
Login successful with correct credentials
JWT token generated
User data returned correctly
Password not included in response
Token valid for 7 days

Result: PASS


TC-003: Access Protected Route - With Valid Token


Objective: Verify that authenticated users can access protected routes
Endpoint: GET /api/auth/me

Request Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3N...

Request Body: None

Expected Response:
Status Code: 200 OK
Response includes authenticated user's data
Password excluded from response

Actual Response:
json{
  "success": true,
  "data": {
    "user": {
      "_id": "677...",
      "username": "admin1",
      "email": "admin1@ntc.lk",
      "role": "admin",
      "createdAt": "2025-01-06T10:30:45.123Z",
      "updatedAt": "2025-01-06T10:30:45.123Z",
      "__v": 0
    }
  }
}
Status Code: 200 

Verification:
Protected route accessible with valid token
JWT token verified successfully
User data retrieved from token
Password field excluded from response
Middleware working correctly

Result: PASS


Negative Test Cases


TC-004: Access Protected Route - Without Token

Objective: Verify that unauthenticated requests are rejected
Endpoint: GET /api/auth/me

Request Headers:
(No Authorization header)
Request Body: None

Expected Response:
Status Code: 401 Unauthorized
Error message indicating no token provided

Actual Response:
json{
  "success": false,
  "message": "Not authorized, no token"
}
Status Code: 401 

Verification:
Request correctly rejected
Appropriate error message returned
No user data exposed
Security middleware working

Result: PASS (Correctly blocks unauthorized access)



TC-005: Register Duplicate USer

Objective: Verify that duplicate user registration is prevented
Endpoint: POST /api/auth/register

Request Headers:
Content-Type: application/json

Request Body:
json{
  "username": "admin1",
  "email": "admin1@ntc.lk",
  "password": "admin1@123",
  "role": "admin"
}
(Same email and username as TC-001)

Expected Response:
Status Code: 400 Bad Request
Error message indicating user already exists

Actual Response:
json{
  "success": false,
  "message": "User already exists"
}
Status Code: 400 

Verification:
Duplicate registration prevented
Database constraint working
Appropriate error message
No duplicate users created

Result: PASS (Correctly prevents duplicate registration)


TC-006: User Login With Wrong Password

Objective: Verify that login fails with incorrect password
Endpoint: POST /api/auth/login

Request Headers:
Content-Type: application/json

Request Body:
json{
  "email": "admin1@ntc.lk",
  "password": "wrongpassword123"
}

Expected Response:
Status Code: 401 Unauthorized
Generic error message (security best practice)

Actual Response:
json{
  "success": false,
  "message": "Invalid credentials"
}
Status Code: 401

Verification:
Login rejected with wrong password
Generic error message (doesn't reveal if email exists)
Password comparison working
Security best practice followed

Result: PASS (Correctly rejects invalid credentials)


TC-007: User Login With  Non-Existent Email

Objective: Verify that login fails for non-existent user
Endpoint: POST /api/auth/login

Request Headers:
Content-Type: application/json

Request Body:
json{
  "email": "nonexistent@ntc.lk",
  "password": "admi123"
}

Expected Response:
Status Code: 401 Unauthorized
Generic error message

Actual Response:
json{
  "success": false,
  "message": "Invalid credentials"
}
Status Code: 401 

Verification:
Login rejected for non-existent user
Same error message as wrong password 
Doesn't reveal if email exists in system

Result: PASS (Correctly handles non-existent user)


TC-008: User Registration With Missing Required Fields

Objective: Verify that registration validates all required fields
Endpoint: POST /api/auth/register

Request Headers:
Content-Type: application/json

Request Body:
json{
  "username": "admin2"
}

Expected Response:
Status Code: 500 Internal Server Error (Mongoose validation error)
Error message indicating both password and email are required

Actual Response:
json{
  "success": false,
  "message": "Registration failed",
  "error": "User validation failed: email: Email is required, password: Password is required"
}
Status Code: 500 

Verification:
Missing email and password detected
Mongoose validation triggered
Appropriate error message
User not created

Result: PASS (Correctly validates all required fields for registration)


TC-009: User Login With Missing Password

Objective: Verify that login requires both email and password
Endpoint: POST /api/auth/login

Request Headers:
Content-Type: application/json

Request Body:
json{
  "email": "admin1@ntc.lk"
}

Expected Response:
Status Code: 400 Bad Request
Error message indicating missing fields

Actual Response:
json{
  "success": false,
  "message": "Please provide email and password"
}
Status Code: 400

Verification:
Request validation working
Missing password detected
Appropriate error message
Bad request status code

Result: PASS (Correctly validates required fields for login)


TC-011: Access Protected Route With Invalid Token

Objective: Verify that invalid/malformed tokens are rejected
Endpoint: GET /api/auth/me

Request Headers:
Authorization: Bearer invalidtoken123

Request Body: None

Expected Response:
Status Code: 401 Unauthorized
Error message indicating invalid token

Actual Response:
json{
  "success": false,
  "message": "Not authorized, invalid token"
}

Status Code: 401 

Verification:
Invalid token rejected
JWT verification working
Appropriate error message
Access denied correctly

Result: PASS (Correctly validates JWT tokens)
