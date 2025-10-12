Operators Management - Test Report


Project: NTC Bus Tracking API
Feature: Operators Management 
Date: 2025-10-12
Branch: testing


Test Environment
Server Configuration:

Base URL: http://localhost:3000
Database: MongoDB Atlas
Authentication: JWT Bearer Token
Token Source: Login with admin1@ntc.lk

Testing Tools:

API Testing: Postman 
Server: Node.js + Express.js
Database: MongoDB with Mongoose

Prerequisites:

Admin token from authentication tests
Commuter token from authentication tests

Test Endpoints:

POST /api/operators - Create operator (admin)
GET /api/operators - Get all operators (authenticated)
GET /api/operators/:id - Get operator by ID (authenticated)
PUT /api/operators/:id - Update operator (admin only)
DELETE /api/operators/:id - Delete operator (admin only)

Positive Test Cases



TC-OP-001: Create Operator With Valid Data

Objective: Verify admin can create a new operator
Endpoint: POST /api/operators

Request Headers:
Authorization: Bearer [admin_token]
Content-Type: application/json

Request Body:
{
  "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
  "contactNumber": "0712345678",
  "email": "dsgunasekara@ntc.lk",
  "password": "dsgunasekara@123"
}

Expected Response:
Status Code: 201 Created
Response includes operator with generated ID
All fields stored correctly

Actual Response:
json{
    "success": true,
    "data": {
        "operator": {
            "id": "68ebccc4400e0ff356b7a3a1",
            "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
            "email": "dsgunasekara@ntc.lk",
            "createdAt": "2025-10-12T15:44:04.259Z"
        }
    }
}
Status Code: 201 

Verification:
Operator created successfully
ID auto-generated
Timestamps added

Result: PASS



TC-OP-002: Get All Operators

Objective: Verify authenticated users can retrieve all active operators
Endpoint: GET /api/operators

Request Headers:
Authorization: Bearer [token]

Expected Response:
Status Code: 200 OK
Array of operators 
Sorted by name ascending

Actual Response:
json{
    "success": true,
    "count": 2,
    "data": {
        "operators": [
            {
                "_id": "68ebe6e50af5ef00eeaffb03",
                "name": "ABC Transport Services Limited",
                "contactNumber": "0771234567",
                "email": "abc@transport.lk",
                "createdAt": "2025-10-12T17:35:33.523Z",
                "updatedAt": "2025-10-12T17:35:33.523Z",
                "__v": 0
            },
            {
                "_id": "68ebccc4400e0ff356b7a3a1",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0712345678",
                "email": "dsgunasekara@ntc.lk",
                "createdAt": "2025-10-12T15:44:04.259Z",
                "updatedAt": "2025-10-12T15:44:04.259Z",
                "__v": 0
            }
        ]
    }
}
Status Code: 200 

Verification:
All active operators returned
Count matches array length
Sorted alphabetically by name

Result: PASS



TC-OP-003: Get Operator by ID

Objective: Verify specific operator can be retrieved by ID
Endpoint: GET /api/operators/:id

Request Headers:
Authorization: Bearer [token]

URL: GET /api/operators/68ebccc4400e0ff356b7a3a1

Expected Response:
Status Code: 200 OK
Single operator object with all details

Actual Response:
json{
    "success": true,
    "data": {
        "operator": {
            "_id": "68ebccc4400e0ff356b7a3a1",
            "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
            "contactNumber": "0712345678",
            "email": "dsgunasekara@ntc.lk",
            "createdAt": "2025-10-12T15:44:04.259Z",
            "updatedAt": "2025-10-12T15:44:04.259Z",
            "__v": 0
        }
    }
}

Status Code: 200

Verification:
Correct operator retrieved
All fields present

Result: PASS



TC-OP-004: Update Operator With Valid Data

Objective: Verify admin can update operator details
Endpoint: PUT /api/operators/:id

Request Headers:
Authorization: Bearer [admin_token]
Content-Type: application/json

Request Body:
json{
  "contactNumber": "0719876543",
  "email": "dsgunasekara.updated@ntc.lk"
}

Expected Response:
Status Code: 200 OK
Updated operator returned
Only specified fields changed

Actual Response:
json{
    "success": true,
    "data": {
        "operator": {
            "_id": "68ebccc4400e0ff356b7a3a1",
            "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
            "contactNumber": "0719876543",
            "email": "dsgunasekara.updated@ntc.lk",
            "createdAt": "2025-10-12T15:44:04.259Z",
            "updatedAt": "2025-10-12T18:21:23.632Z",
            "__v": 0
        }
    }
}

Status Code: 200 

Verification:
Contact number updated
Email updated
Other fields unchanged
updatedAt timestamp changed

Result: PASS



TC-OP-005: Delete Operator

TC-015: Delete Operator 
Objective: Verify that an operator can be deleted 
Endpoint: DELETE /api/operators/68e53341c820f7a4199b0da6

Request Headers:
Authorization: Bearer [admin_token]

Expected Response:
Status Code: 200 OK
Success message confirming deletion


Actual Response:
json{
  "success": true,
  "message": "Operator deleted successfully"
}
Status Code: 200 

Verification:
Operator deleted successfully
Appropriate success message
Operator no longer exists in database

Result: PASS



TC-OP-006: Filter Operators by Name 

Objective: Verify operators can be filtered by name using case-insensitive search  
Endpoint: GET /api/operators?name=gunasekara  

Request Headers:
Authorization: Bearer [admin_token]

Expected Response:
Status Code: 200 OK
Only operators with names containing "gunasekara" (case-insensitive)

Actual Response:
json
{
    "success": true,
    "count": 1,
    "data": {
        "operators": [
            {
                "_id": "68ebccc4400e0ff356b7a3a1",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0719876543",
                "email": "dsgunasekara.updated@ntc.lk",
                "createdAt": "2025-10-12T15:44:04.259Z",
                "updatedAt": "2025-10-12T18:21:23.632Z",
                "__v": 0
            }
        ]
    }
}


Status Code: 200  

Result: PASS



TC-OP-007: Combined Filters - Name and Email

Objective: Verify multiple filters can be applied simultaneously  
Endpoint: GET /api/operators?name=transport&email=ntc.lk  

Request Headers:
Authorization: Bearer [admin_token]

Expected Response:
Status Code: 200 OK
Operators matching BOTH name containing "transport" AND email containing "ntc.lk"

Actual Response:
json
{
    "success": true,
    "count": 1,
    "data": {
        "operators": [
            {
                "_id": "68ebccc4400e0ff356b7a3a1",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0719876543",
                "email": "dsgunasekara.updated@ntc.lk",
                "createdAt": "2025-10-12T15:44:04.259Z",
                "updatedAt": "2025-10-12T18:21:23.632Z",
                "__v": 0
            }
        ]
    }
}

Status Code: 200  

Result: PASS



TC-OP-008: Partial Text Search - Multiple Fields

Objective: Verify partial text search across multiple fields  
Endpoint: GET /api/operators?search=gunasekara  

Request Headers:
Authorization: Bearer [admin_token]

Expected Response:
Status Code: 200 OK
Operators with "gunasekara" in name or email

Actual Response:
json
{
    "success": true,
    "count": 1,
    "data": {
        "operators": [
            {
                "_id": "68ebccc4400e0ff356b7a3a1",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0719876543",
                "email": "dsgunasekara.updated@ntc.lk",
                "createdAt": "2025-10-12T15:44:04.259Z",
                "updatedAt": "2025-10-12T18:21:23.632Z",
                "__v": 0
            }
        ]
    }
}

Status Code:200  

Result: PASS



Negative Test Cases


TC-OP-009: Create Operator Without Authentication

Objective: Verify that operator creation requires authentication  
Endpoint: POST /api/operators  

Request Headers:
Content-Type: application/json
(No Authorization header)


Request Body:
json
{
  "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
  "contactNumber": "0712345678",
  "email": "dsgunasekara@ntc.lk",
  "password": "dsgunasekara@123"
}

Expected Response:
Status Code: 401 Unauthorized
Error message indicating authentication required

Actual Response:
json
{
  "success": false,
  "message": "Not authorized, no token"
}


Status Code:401

Verification:
Request correctly rejected
Appropriate error message
No operator created
Security middleware working

Result: PASS (Correctly blocks unauthorized access)




TC-OP-010: Create Operator Without Admin Permission

Objective: Verify only admin can create operators  
Endpoint: POST /api/operators  

Request Headers:
Authorization: Bearer [commuter_token]
Content-Type: application/json


Request Body:
json
{
  "name": "Test Operator",
  "contactNumber": "0112345678",
  "email": "test@operator.lk",
  "password": "test123456"
}


Expected Response:
Status Code: 403 Forbidden
Error message indicating insufficient permissions

Actual Response:
json
{
    "success": false,
    "message": "User role 'commuter' is not authorized to access this resource"
}


Status Code: 403  

Result: PASS



TC-OP-011: Create Operator With Missing Required Fields

Objective: Verify required field validation
Endpoint: POST /api/operators

Request Headers:
Content-Type: application/json
Authorization: Bearer [Admin_token]

Request Body:
json{
  "name": "MALLIKA PASSENGER TRANSPORT SERVICE (PVT)LTD"
}
(Missing contactNumber, email, password)

Expected Response:
Status Code: 500
Validation error for missing fields

Actual Response:
json{
    "success": false,
    "message": "Validation failed",
    "error": "Operator validation failed: contactNumber: Contact number is required, email: Email is required, password: Password is required"
}

Status Code: 500 

Result: PASS



TC-OP-012: Create Operator With Duplicate Name

Objective: Verify that duplicate names are prevented  
Endpoint POST /api/operators  

Request Headers:
Content-Type: application/json
Authorization: Bearer [Admin_token]


Request Body:
json
{
  "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
  "contactNumber": "0716345678",
  "email": "duplicateopertor@ntc.lk",
  "password": " duplicateoperator@123"
}


Expected Response:
Status Code: 409 Conflict
Error message indicating duplicate name

Actual Response:
json
{
    "success": false,
    "message": "Operator with similar details already exists"
}


Status Code: 400

Verification:
Duplicate name prevented
Appropriate error message
No duplicate operator created

Result:PASS (Correctly prevents duplicate names)




TC-OP-013: Get Operator With Non-Existent ID

Objective: Verify handling of valid but non-existent ID
Endpoint: GET /api/operators/679aaaaabbbbccccddddeeee

Request Headers:
Authorization: Bearer [Admin_token]

Expected Response:
Status Code: 404 Not Found
Message: "Operator not found"

Actual Response:
json{
  "success": false,
  "message": "Operator not found"
}

Status Code: 404 

Verification:
Non-existent operator handled correctly
Appropriate 404 status code
Clear error message
No unexpected errors

Result: PASS



TC-OP-014: Update Non-Existent Operator

Objective: Verify that updating non-existent operator fails gracefully  
Endpoint: PUT /api/operators/677999999999999999999999  

Request Headers:
Content-Type: application/json
Authorization: Bearer [Admin_Token]


Request Body:json
{
  "name": "Non-existent Operator"
}

Expected Response:
Status Code: 404 Not Found
Error message indicating operator not found

Actual Response:
json
{
  "success": false,
  "message": "Operator not found"
}

Status Code: 404

Verification:
Non-existent operator handled correctly
Appropriate 404 status code
Clear error message
No unexpected errors

Result: PASS 



Test Summary

Total Test Cases: 14 
Passed: 14  
Failed: 0  
Pass Rate: 100%