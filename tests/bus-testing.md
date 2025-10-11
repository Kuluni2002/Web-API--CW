Bus Management - Test Report

**Project:** NTC Bus Tracking API  
**Feature:** Bus Management  
**Date:** 2025-10-10  
**Branch:** testing  

## Test Environment
**Server Configuration:**
Base URL: http://localhost:3000
Database: MongoDB Atlas
Authentication: JWT Bearer Token
Token Source: Login with admin1@ntc.lk

**Testing Tools:**
API Testing: Postman
Server: Node.js + Express.js
Database: MongoDB with Mongoose

**Test Endpoints:**
POST /api/buses - Create bus (admin, operator)
GET /api/buses - Get all buses (authenticated)
GET /api/buses/:id - Get bus by ID (authenticated)
PUT /api/buses/:id - Update bus (admin, operator)
DELETE /api/buses/:id - Delete bus (admin only)


## Positive Test Cases



### TC-BUS-001: Create Bus With Valid Data

**Objective:** Verify admin can create a new bus with valid data
**Endpoint:** POST /api/buses

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Admin_token]

**Request Body:**
json
{
  "registrationNumber": "NB-8546",
  "operator": "68e40e7c493aa86101ad2b59",
  "routeNumber": "57",
  "type": "Normal"
}

**Expected Response:**
Status Code: 201 Created
Response includes bus with generated ID
All fields stored correctly

**Actual Response:**
json
{
    "success": true,
    "message": "Bus created successfully",
    "data": {
        "bus": {
            "registrationNumber": "NB-8546",
            "operator": "68e40e7c493aa86101ad2b59",
            "routeNumber": "57",
            "type": "Normal",
            "_id": "68e948ea6813b589e642fd05",
            "createdAt": "2025-10-10T17:56:58.474Z",
            "updatedAt": "2025-10-10T17:56:58.474Z",
            "__v": 0
        }
    }
}

**Status Code:** 201

**Verification:**
Bus created successfully
ID auto-generated
All fields stored correctly
Timestamps added

**Result:** pass



### TC-BUS-002: Get All Buses

**Objective:** Verify authenticated users can retrieve all buses
**Endpoint:** GET /api/buses

**Request Headers:**
Authorization: Bearer [token]


**Expected Response:**
Status Code: 200 OK
Array of buses with populated operator information

**Actual Response:**
json
{
    "success": true,
    "count": 2,
    "data": {
        "buses": [
            {
                "_id": "68e948ea6813b589e642fd05",
                "registrationNumber": "NB-8546",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Luxury",
                "createdAt": "2025-10-10T17:56:58.474Z",
                "updatedAt": "2025-10-11T02:00:35.997Z",
                "__v": 0
            },
            {
                "_id": "68e9bf032c622a93e9cc2718",
                "registrationNumber": "NC-1438",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:20:51.582Z",
                "updatedAt": "2025-10-11T02:20:51.582Z",
                "__v": 0
            }
        ]
    }
}
**Status Code:** 200

**Verification:**
All buses returned
Operator information populated
Correct data structure

**Result:** pass



### TC-BUS-003: Get Bus by ID

**Objective:** Verify specific bus can be retrieved by ID
**Endpoint:** GET /api/buses/:id

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Single bus object with all details and populated operator

**Actual Response:**
json
{
    "success": true,
    "data": {
        "bus": {
            "_id": "68e948ea6813b589e642fd05",
            "registrationNumber": "NB-8546",
            "operator": {
                "_id": "68e40e7c493aa86101ad2b59",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0719876543",
                "email": "dsgunasekara.updated@ntc.lk",
                "permitNumber": "F13855",
                "createdAt": "2025-10-06T18:46:20.537Z",
                "updatedAt": "2025-10-07T14:28:02.883Z",
                "__v": 0
            },
            "routeNumber": "57",
            "type": "Normal",
            "createdAt": "2025-10-10T17:56:58.474Z",
            "updatedAt": "2025-10-10T17:56:58.474Z",
            "__v": 0
        }
    }
}

**Status Code:** 200

**Verification:**
Correct bus retrieved
All fields present
Operator information populated

**Result:** pass



### TC-BUS-004: Update Bus Details

**Objective:** Verify authorized users can update bus details
**Endpoint:** PUT /api/buses/:id

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Admin_token]


**Request Body:**
json
{
  "type": "Luxury"
}

**Expected Response:**
Status Code: 200 OK
Updated bus returned with only specified fields changed

**Actual Response:**
json
{
    "success": true,
    "data": {
        "bus": {
            "_id": "68e948ea6813b589e642fd05",
            "registrationNumber": "NB-8546",
            "operator": {
                "_id": "68e40e7c493aa86101ad2b59",
                "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                "contactNumber": "0719876543",
                "email": "dsgunasekara.updated@ntc.lk",
                "permitNumber": "F13855",
                "createdAt": "2025-10-06T18:46:20.537Z",
                "updatedAt": "2025-10-07T14:28:02.883Z",
                "__v": 0
            },
            "routeNumber": "57",
            "type": "Luxury",
            "createdAt": "2025-10-10T17:56:58.474Z",
            "updatedAt": "2025-10-11T02:00:35.997Z",
            "__v": 0
        }
    }
}

**Status Code:** 200

**Verification:**
Capacity updated correctly
Route number updated
Other fields unchanged
updatedAt timestamp changed

**Result:** pass



### TC-BUS-005: Delete Bus

**Objective:** Verify admin can delete a bus
**Endpoint:** DELETE /api/buses/:id

**Request Headers:**
Authorization: Bearer [Admin_token]

**Expected Response:**
Status Code: 200 OK
Success message confirming deletion

**Actual Response:**
json
{
    "success": true,
    "message": "Bus deleted successfully"
}

**Status Code:** 200

**Verification:**
Bus deleted successfully
Appropriate success message

**Result:** Pass



### TC-BUS-006: Filter Buses by Operator

**Objective:** Verify buses can be filtered by operator ID
**Endpoint:** GET /api/buses?operatorId=68e40e7c493aa86101ad2b59

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Array of buses belonging to specified operator only

**Actual Response:**
json
{
    "success": true,
    "count": 3,
    "data": {
        "buses": [
            {
                "_id": "68e9c3802c622a93e9cc272b",
                "registrationNumber": "NB-8546",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:40:00.322Z",
                "updatedAt": "2025-10-11T02:40:00.322Z",
                "__v": 0
            },
            {
                "_id": "68e9bf032c622a93e9cc2718",
                "registrationNumber": "NC-1438",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:20:51.582Z",
                "updatedAt": "2025-10-11T02:20:51.582Z",
                "__v": 0
            },
            {
                "_id": "68e9c3ee2c622a93e9cc272e",
                "registrationNumber": "NC-2603",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:41:50.624Z",
                "updatedAt": "2025-10-11T02:41:50.624Z",
                "__v": 0
            }
        ]
    }
}

**Status Code:** 200

**Verification:**
Only buses from specified operator returned
Correct filtering applied
Proper data structure maintained

**Result:** Pass



### TC-BUS-007: Filter Buses by Route Number

**Objective:** Verify buses can be filtered by route number
**Endpoint:** GET /api/buses?routeNumber=57

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Array of buses assigned to route 57 only

**Actual Response:**
json
{
    "success": true,
    "count": 3,
    "data": {
        "buses": [
            {
                "_id": "68e9c3802c622a93e9cc272b",
                "registrationNumber": "NB-8546",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:40:00.322Z",
                "updatedAt": "2025-10-11T02:40:00.322Z",
                "__v": 0
            },
            {
                "_id": "68e9bf032c622a93e9cc2718",
                "registrationNumber": "NC-1438",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:20:51.582Z",
                "updatedAt": "2025-10-11T02:20:51.582Z",
                "__v": 0
            },
            {
                "_id": "68e9c3ee2c622a93e9cc272e",
                "registrationNumber": "NC-2603",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:41:50.624Z",
                "updatedAt": "2025-10-11T02:41:50.624Z",
                "__v": 0
            }
        ]
    }
}

**Status Code:** 200

**Verification:**
Only buses with route number 57 returned
Filter working correctly
All required fields present

**Result:** Pass



### TC-BUS-008: Search Buses by Registration Number

**Objective:** Verify buses can be searched by partial registration number
**Endpoint:** GET /api/buses?search=NB

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Array of buses with registration numbers containing "NB"

**Actual Response:**
json
{
    "success": true,
    "count": 1,
    "data": {
        "buses": [
            {
                "_id": "68e9c3802c622a93e9cc272b",
                "registrationNumber": "NB-8546",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:40:00.322Z",
                "updatedAt": "2025-10-11T02:40:00.322Z",
                "__v": 0
            }
        ]
    }
}

**Status Code:** 200

**Verification:**
Search functionality working
Partial matching implemented

**Result:** Pass



### TC-BUS-009: Combined Filters

**Objective:** Verify multiple filters can be applied simultaneously
**Endpoint:** GET /api/buses?operatorId=68e40e7c493aa86101ad2b59&search=NC

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Array of buses matching ALL specified criteria

**Actual Response:**
json
{
    "success": true,
    "count": 2,
    "data": {
        "buses": [
            {
                "_id": "68e9bf032c622a93e9cc2718",
                "registrationNumber": "NC-1438",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:20:51.582Z",
                "updatedAt": "2025-10-11T02:20:51.582Z",
                "__v": 0
            },
            {
                "_id": "68e9c3ee2c622a93e9cc272e",
                "registrationNumber": "NC-2603",
                "operator": {
                    "_id": "68e40e7c493aa86101ad2b59",
                    "name": "D.S.GUNASEKARA PASSENGER TRANSPORT SERVICE (PVT)LTD",
                    "permitNumber": "F13855"
                },
                "routeNumber": "57",
                "type": "Normal",
                "createdAt": "2025-10-11T02:41:50.624Z",
                "updatedAt": "2025-10-11T02:41:50.624Z",
                "__v": 0
            }
        ]
    }
}

**Status Code:** 200

**Verification:**
All filters applied correctly
Only buses meeting ALL criteria returned
Combined filtering logic working

**Result:** Pass



## Negative Test Cases



### TC-BUS-010: Create Bus Without Authentication

**Objective:** Verify that bus creation requires authentication
**Endpoint:** POST /api/buses

**Request Headers:**
Content-Type: application/json
(No Authorization header)

**Request Body:**
json
{
  "registrationNumber": " NC-2603",
  "operator": "68e40e7c493aa86101ad2b59",
  "routeNumber": "57",
  "type": "Semi Luxury"
}

**Expected Response:**
Status Code: 401 Unauthorized
Error message indicating authentication required

**Actual Response:**
json
{
    "success": false,
    "message": "Not authorized, no token"
}

**Status Code:** 401

**Verification:**
Request correctly rejected
Appropriate error message
No bus created
Security middleware working

**Result:** Pass



### TC-BUS-011: Create Bus With Missing Required Fields

**Objective:** Verify required field validation
**Endpoint:** POST /api/buses

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Admin_token]

**Request Body:**
json
{
  "registrationNumber": "NB-9999"
}


**Expected Response:**
Status Code: 400 Bad Request
Validation error for missing fields

**Actual Response:**
json
{
    "success": false,
    "message": "Validation failed",
    "error": "Bus validation failed: operator: Operator is required, routeNumber: Path `routeNumber` is required."
}

**Status Code:** 400

**Verification:**
Validation errors for missing fields
Appropriate error messages
No bus created

**Result:** pass



### TC-BUS-012: Create Bus With Duplicate Registration Number

**Objective:** Verify that duplicate registration numbers are prevented
**Endpoint:** POST /api/buses

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Admin_token]


**Request Body:**
json
{
  "registrationNumber": "NC-1438",
  "operator": "68e40e7c493aa86101ad2b59",
  "routeNumber": "57",
  "type": "Normal"
}

**Expected Response:**
Status Code: 409 Conflict
Error message indicating duplicate registration number

**Actual Response:**
json
{
    "success": false,
    "message": "Bus with this registration number already exists"
}

**Status Code:** 409

**Verification:**
Duplicate registration prevented
Appropriate error message
No duplicate bus created

**Result:** Pass



### TC-BUS-013: Get Bus With Non-Existent ID

**Objective:** Verify handling of valid but non-existent ID
**Endpoint:** GET /api/buses/68e948ea6813b589e642fd05

**Request Headers:**
Authorization: Bearer [token]

**Expected Response:**
Status Code: 404 Not Found
Message: "Bus not found"

**Actual Response:**
json
{
    "success": false,
    "message": "Bus not found"
}

**Status Code:** 404

**Verification:**
Non-existent bus handled correctly
Appropriate 404 status code
Clear error message

**Result:** Pass



### TC-BUS-014: Update Bus Without Proper Authorization

**Objective:** Verify that only authorized users can update buses
**Endpoint:** PUT /api/buses/:id

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Commuter_token]

**Request Body:**
json
{
   "type": "Semi Luxury"
}

**Expected Response:**
Status Code: 403 Forbidden
Error message indicating insufficient permissions

**Actual Response:**
json
{
    "success": false,
    "message": "User role 'commuter' is not authorized to access this resource"
}

**Status Code:** 403

**Verification:**
Unauthorized update blocked
Appropriate error message
Bus remains unchanged

**Result:** Pass



