# Route Management - Test Report

**Project:** NTC Bus Tracking API  
**Feature:** Route Management  
**Date:** 2025-10-13 
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

**Prerequisites:**
Admin token from authentication tests
Operator token from authentication tests
At least one operator created (from operator tests)

**Test Endpoints:**
POST /api/routes - Create route (admin only)
GET /api/routes - Get all routes with filtering (authenticated)
GET /api/routes/:id - Get route by ID (authenticated)
GET /api/routes/number/:routeNumber- Get route by route number (authenticated)
GET /api/routes//:routeNumber/stops- Get stops in the by route number (authenticated)
PUT /api/routes/:id - Update route (admin only)
DELETE /api/routes/:id - Delete route (admin only)



## Positive Test Cases

### TC-ROUTE-001: Create Route With Valid Data

**Objective:** Verify admin can create a new route with valid data  
**Endpoint:** POST /api/routes  
**Headers:** Authorization: Bearer [admin_token]

**Request Body:**
json
{
  "routeNumber": "57",
  "name": "Colombo - Anuradhapura",
  "origin": "Colombo Fort",
  "destination": "Anuradhapura",
  "totalDistance": 206,
  "estimatedDuration": {
    "hours": 5,
    "minutes": 15
  },
  "stops": [
    {
      "locationName": "Colombo Fort",
      "estimatedArrivalTime": "02:40"
    },
    {
      "locationName": "Kurunegala",
      "estimatedArrivalTime": "05:10"
    },
    {
      "locationName": "Thambuththegama",
      "estimatedArrivalTime": "05:50"
    },
    {
      "locationName": "Anuradhapura",
      "estimatedArrivalTime": "07:55"
    }
  ]
}


**Expected Response:**
Status Code: 201 Created
Response includes route with generated ID
All fields stored correctly
Virtual fields calculated (totalMinutes, formattedDuration, stopCount)

**Actual Response:**
json
{
    "success": true,
    "message": "Route created successfully",
    "data": {
        "route": {
            "routeNumber": "57",
            "name": "Colombo - Anuradhapura",
            "origin": "Colombo Fort",
            "destination": "Anuradhapura",
            "totalDistance": 206,
            "estimatedDuration": {
                "hours": 5,
                "minutes": 15
            },
            "stops": [
                {
                    "locationName": "Colombo Fort",
                    "estimatedArrivalTime": "02:40",
                    "_id": "68ec9240ac114b46e7b0e9aa"
                },
                {
                    "locationName": "Kurunegala",
                    "estimatedArrivalTime": "05:10",
                    "_id": "68ec9240ac114b46e7b0e9ab"
                },
                {
                    "locationName": "Thambuththegama",
                    "estimatedArrivalTime": "05:50",
                    "_id": "68ec9240ac114b46e7b0e9ac"
                },
                {
                    "locationName": "Anuradhapura",
                    "estimatedArrivalTime": "07:55",
                    "_id": "68ec9240ac114b46e7b0e9ad"
                }
            ],
            "isActive": true,
            "createdAt": "2025-10-13T05:46:40.812Z",
            "updatedAt": "2025-10-13T05:46:40.812Z",
            "totalStops": 4,
            "totalMinutes": 315,
            "formattedDuration": "5h 15m",
            "id": "68ec9240ac114b46e7b0e9a9"
        }
    }
}


**Status Code:** 201  

**Verification:**
Route created successfully
ID auto-generated
Virtual fields calculated correctly
Timestamps added

**Result:** PASS




### TC-ROUTE-002: Get All Routes

**Objective:** Verify authenticated users can retrieve all routes  
**Endpoint:** GET /api/routes  
**Headers:** Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Array of routes with populated operator information
Sorted by route number

**Actual Response:**
{
    "success": true,
    "count": 2,
    "data": {
        "routes": [
            {
                "estimatedDuration": {
                    "hours": 4,
                    "minutes": 10
                },
                "routeNumber": "01",
                "name": "Colombo - Kandy",
                "origin": "Colombo",
                "destination": "Kandy",
                "totalDistance": 116,
                "isActive": true,
                "createdAt": "2025-10-13T06:55:32.492Z",
                "updatedAt": "2025-10-13T06:55:32.492Z",
                "totalStops": 0,
                "totalMinutes": 250,
                "formattedDuration": "4h 10m",
                "id": "68eca264ac114b46e7b0e9b8"
            },
            {
                "estimatedDuration": {
                    "hours": 5,
                    "minutes": 15
                },
                "routeNumber": "57",
                "name": "Colombo - Anuradhapura",
                "origin": "Colombo Fort",
                "destination": "Anuradhapura",
                "totalDistance": 206,
                "isActive": true,
                "createdAt": "2025-10-13T05:46:40.812Z",
                "updatedAt": "2025-10-13T05:46:40.812Z",
                "totalStops": 0,
                "totalMinutes": 315,
                "formattedDuration": "5h 15m",
                "id": "68ec9240ac114b46e7b0e9a9"
            }
        ]
    }
}

**Status Code:** 200  

**Verification:**

All routes returned

Sorted by route number

Count matches array length

**Result:** PASS




### TC-ROUTE-003: Get Route by ID

**Objective:** Verify specific route can be retrieved by ID  
**Endpoint:** GET /api/routes/:id  
**Headers:** Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Single route object with all details
Populated operator information

**Actual Response:**
json
{
    "success": true,
    "data": {
        "route": {
            "estimatedDuration": {
                "hours": 4,
                "minutes": 10
            },
            "routeNumber": "01",
            "name": "Colombo - Kandy",
            "origin": "Colombo",
            "destination": "Kandy",
            "totalDistance": 116,
            "stops": [
                {
                    "locationName": "Colombo",
                    "estimatedArrivalTime": "10:15",
                    "_id": "68eca264ac114b46e7b0e9b9"
                },
                {
                    "locationName": "Nittambuwa",
                    "estimatedArrivalTime": "11:55",
                    "_id": "68eca264ac114b46e7b0e9ba"
                },
                {
                    "locationName": "Kegalle",
                    "estimatedArrivalTime": "12:55",
                    "_id": "68eca264ac114b46e7b0e9bb"
                },
                {
                    "locationName": "Kandy",
                    "estimatedArrivalTime": "14:25",
                    "_id": "68eca264ac114b46e7b0e9bc"
                }
            ],
            "isActive": true,
            "createdAt": "2025-10-13T06:55:32.492Z",
            "updatedAt": "2025-10-13T06:55:32.492Z",
            "totalStops": 4,
            "totalMinutes": 250,
            "formattedDuration": "4h 10m",
            "id": "68eca264ac114b46e7b0e9b8"
        }
    }
}


**Status Code:** 200  

**Verification:**
Correct route retrieved
All fields present
Virtual fields calculated

**Result:** PASS



### TC-ROUTE-004: Update Route Details

**Objective:** Verify admin can update route details  
**Endpoint:** PUT /api/routes/:id  
**Headers:** Authorization: Bearer [admin_token]

**Request Body:**
json
{
  "estimatedDuration": {
    "hours": 4,
    "minutes": 5
  }
}


**Expected Response:**
Status Code: 200 OK
Updated route returned
Only specified fields changed

**Actual Response:**
json
{
    "success": true,
    "message": "Route updated successfully",
    "data": {
        "route": {
            "estimatedDuration": {
                "hours": 4,
                "minutes": 5
            },
            "routeNumber": "01",
            "name": "Colombo - Kandy",
            "origin": "Colombo",
            "destination": "Kandy",
            "totalDistance": 116,
            "stops": [
                {
                    "locationName": "Colombo",
                    "estimatedArrivalTime": "10:15",
                    "_id": "68eca264ac114b46e7b0e9b9"
                },
                {
                    "locationName": "Nittambuwa",
                    "estimatedArrivalTime": "11:55",
                    "_id": "68eca264ac114b46e7b0e9ba"
                },
                {
                    "locationName": "Kegalle",
                    "estimatedArrivalTime": "12:55",
                    "_id": "68eca264ac114b46e7b0e9bb"
                },
                {
                    "locationName": "Kandy",
                    "estimatedArrivalTime": "14:25",
                    "_id": "68eca264ac114b46e7b0e9bc"
                }
            ],
            "isActive": true,
            "createdAt": "2025-10-13T06:55:32.492Z",
            "updatedAt": "2025-10-13T07:06:58.704Z",
            "totalStops": 4,
            "totalMinutes": 245,
            "formattedDuration": "4h 5m",
            "id": "68eca264ac114b46e7b0e9b8"
        }
    }
}


**Status Code:** 200  

**Verification:**
Duration updated
Virtual fields recalculated
updatedAt timestamp changed

**Result:** PASS



### TC-ROUTE-005: Delete Route

**Objective:** Verify admin can delete a route  
**Endpoint:** DELETE /api/routes/:id  
**Headers:** Authorization: Bearer [admin_token]

**Expected Response:**
Status Code: 200 OK
Success message confirming deletion

**Actual Response:**
json
{
    "success": true,
    "message": "Route deleted successfully"
}


**Status Code:** 200  

**Verification:**
Route deleted successfully
Appropriate success message

**Result:** PASS



## Filtering Test Cases


### TC-ROUTE-006: Filter Routes by Origin

**Objective:** Verify routes can be filtered by origin location  
**Endpoint:** GET /api/routes?origin=Colombo  
**Headers:** Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Only routes starting from locations containing "Colombo"

**Actual Response:**
json
{
    "success": true,
    "count": 2,
    "data": {
        "routes": [
            {
                "estimatedDuration": {
                    "hours": 4,
                    "minutes": 5
                },
                "routeNumber": "01",
                "name": "Colombo - Kandy",
                "origin": "Colombo",
                "destination": "Kandy",
                "totalDistance": 116,
                "isActive": true,
                "createdAt": "2025-10-13T06:55:32.492Z",
                "updatedAt": "2025-10-13T07:06:58.704Z",
                "totalStops": 0,
                "totalMinutes": 245,
                "formattedDuration": "4h 5m",
                "id": "68eca264ac114b46e7b0e9b8"
            },
            {
                "estimatedDuration": {
                    "hours": 5,
                    "minutes": 15
                },
                "routeNumber": "57",
                "name": "Colombo - Anuradhapura",
                "origin": "Colombo Fort",
                "destination": "Anuradhapura",
                "totalDistance": 206,
                "isActive": true,
                "createdAt": "2025-10-13T07:16:14.513Z",
                "updatedAt": "2025-10-13T07:16:14.513Z",
                "totalStops": 0,
                "totalMinutes": 315,
                "formattedDuration": "5h 15m",
                "id": "68eca73eac114b46e7b0e9ec"
            }
        ]
    }
}

**Status Code:** 200  

**Result:** PASS




### TC-ROUTE-007: Filter Routes by Destination

**Objective:** Verify routes can be filtered by destination location  
**Endpoint:** GET /api/routes?destination=Panadura  
**Headers:** Authorization: Bearer [token]

**Expected Response:**
Status Code: 200 OK
Only routes ending at locations containing "Anuradhapura" 

**Actual Response:**
json
{
    "success": true,
    "count": 1,
    "data": {
        "routes": [
            {
                "estimatedDuration": {
                    "hours": 5,
                    "minutes": 15
                },
                "routeNumber": "57",
                "name": "Colombo - Anuradhapura",
                "origin": "Colombo Fort",
                "destination": "Anuradhapura",
                "totalDistance": 206,
                "isActive": true,
                "createdAt": "2025-10-13T07:16:14.513Z",
                "updatedAt": "2025-10-13T07:16:14.513Z",
                "totalStops": 0,
                "totalMinutes": 315,
                "formattedDuration": "5h 15m",
                "id": "68eca73eac114b46e7b0e9ec"
            }
        ]
    }
}


**Status Code:** 200  

**Result:** PASS



### TC-ROUTE-008: Get Stops by Route Number

**Objective:** Verify stops can be retrieved for a specific route using route number  
**Endpoint:** GET /api/routes/:routeNumber/stops  
**Headers:** Authorization: Bearer [token]

**Test Route Number:** 57

**Expected Response:**
Status Code: 200 OK
Array of stops for the specified route
Each stop contains locationName and estimatedArrivalTime
Stops returned in correct sequence

**Actual Response:**
json
{
    "success": true,
    "data": {
        "routeNumber": "57",
        "routeName": "Colombo - Anuradhapura",
        "origin": "Colombo Fort",
        "destination": "Anuradhapura",
        "stops": [
            {
                "sequence": 1,
                "locationName": "Colombo Fort",
                "estimatedArrivalTime": "02:40"
            },
            {
                "sequence": 2,
                "locationName": "Kurunegala",
                "estimatedArrivalTime": "05:10"
            },
            {
                "sequence": 3,
                "locationName": "Thambuththegama",
                "estimatedArrivalTime": "05:50"
            },
            {
                "sequence": 4,
                "locationName": "Anuradhapura",
                "estimatedArrivalTime": "07:55"
            }
        ],
        "totalStops": 4
    }
}

**Status Code:** 200  

**Verification:**
Correct stops returned for route 57
All stops have required fields
Stops in logical sequence
Route metadata included

**Result:** PASS



## Negative Test Cases


### TC-ROUTE-009: Create Route Without Authentication

**Objective:** Verify route creation requires authentication  
**Endpoint:** POST /api/routes 

**Headers:** Content-Type: application/json (No Authorization header)

**Request Body:**
json
{
  "routeNumber": "02",
  "name": "Colombo - Matara",
  "origin": "Colombo Fort",
  "destination": "Matara",
  "totalDistance": 206,
  "estimatedDuration": {
    "hours": 5,
    "minutes": 15
  },
  "stops": [
    {
      "locationName": "Colombo Fort",
      "estimatedArrivalTime": "02:40"
    },
    
    {
      "locationName": "Matara",
      "estimatedArrivalTime": "07:55"
    }
  ]
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

**Result:** PASS



### TC-ROUTE-010: Create Route Without Admin Permission
**Objective:** Verify only admin can create routes  
**Endpoint:** POST /api/routes  
**Headers:** Authorization: Bearer [commuter_token]

**Request Body:**
json
{
  "routeNumber": "02",
  "name": "Colombo - Matara",
  "origin": "Colombo Fort",
  "destination": "Matara",
  "totalDistance": 206,
  "estimatedDuration": {
    "hours": 5,
    "minutes": 15
  },
  "stops": [
    {
      "locationName": "Colombo Fort",
      "estimatedArrivalTime": "02:40"
    },
    
    {
      "locationName": "Matara",
      "estimatedArrivalTime": "07:55"
    }
  ]
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

**Result:** PASS



### TC-ROUTE-011: Create Route With Missing Required Fields

**Objective:** Verify required field validation  
**Endpoint:** POST /api/routes  
**Headers:** Authorization: Bearer [admin_token]

**Request Body:**
json
{
  "routeNumber": "19",
  "name": "Colombo-Gampola"
}


**Expected Response:**
Status Code: 400 Bad Request
Validation error for missing fields

**Actual Response:**
json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "estimatedDuration.minutes": {
            "name": "ValidatorError",
            "message": "Minutes are required",
            "properties": {
                "message": "Minutes are required",
                "type": "required",
                "path": "estimatedDuration.minutes",
                "fullPath": "estimatedDuration.minutes"
            },
            "kind": "required",
            "path": "estimatedDuration.minutes"
        },
        "estimatedDuration.hours": {
            "name": "ValidatorError",
            "message": "Hours are required",
            "properties": {
                "message": "Hours are required",
                "type": "required",
                "path": "estimatedDuration.hours",
                "fullPath": "estimatedDuration.hours"
            },
            "kind": "required",
            "path": "estimatedDuration.hours"
        },
        "origin": {
            "name": "ValidatorError",
            "message": "Origin location is required",
            "properties": {
                "message": "Origin location is required",
                "type": "required",
                "path": "origin"
            },
            "kind": "required",
            "path": "origin"
        },
        "destination": {
            "name": "ValidatorError",
            "message": "Destination location is required",
            "properties": {
                "message": "Destination location is required",
                "type": "required",
                "path": "destination"
            },
            "kind": "required",
            "path": "destination"
        },
        "totalDistance": {
            "name": "ValidatorError",
            "message": "Total distance is required",
            "properties": {
                "message": "Total distance is required",
                "type": "required",
                "path": "totalDistance"
            },
            "kind": "required",
            "path": "totalDistance"
        },
        "stops": {
            "name": "ValidatorError",
            "message": "Route must have at least 2 stops (start and end)",
            "properties": {
                "message": "Route must have at least 2 stops (start and end)",
                "type": "user defined",
                "path": "stops",
                "value": []
            },
            "kind": "user defined",
            "path": "stops",
            "value": []
        }
    }
}


**Status Code:** 400  
**Result:** PASS



### TC-ROUTE-012: Create Route With Duplicate Route Number

**Objective:** Verify duplicate route number prevention  
**Endpoint:** POST /api/routes  
**Headers:** Authorization: Bearer [admin_token]

**Request Body:**
json
{
  "routeNumber": "01",
  "name": "Colombo - Matara",
  "origin": "Colombo Fort",
  "destination": "Matara",
  "totalDistance": 206,
  "estimatedDuration": {
    "hours": 5,
    "minutes": 15
  },
  "stops": [
    {
      "locationName": "Colombo Fort",
      "estimatedArrivalTime": "02:40"
    },
    
    {
      "locationName": "Matara",
      "estimatedArrivalTime": "07:55"
    }
  ]
}

**Expected Response:**
- Status Code: 500
- Error message indicating duplicate route number

**Actual Response:**
json
{
    "success": false,
    "message": "Server error",
    "error": "E11000 duplicate key error collection: test.routes index: routeNumber_1 dup key: { routeNumber: \"01\" }"
}

**Status Code:** 500 
**Result:** PASS




### TC-ROUTE-013: Delete Route Without Admin Permission

**Objective:** Verify only admin can delete routes  
**Endpoint:** DELETE /api/routes/ROUTE_ID  
**Headers:** Authorization: Bearer [commuter_token]

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

**Result:** PASS







## Test Summary

**Total Test Cases:** 13
**Passed:** 13 
**Failed:** 0  
**Pass Rate:** 100%



