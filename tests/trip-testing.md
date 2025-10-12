Trip Management - Test Report

**Project:** NTC Bus Tracking API  
**Feature:** Trip Management  
**Date:** 2025-10-11 
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
POST /api/trips - Create trip (admin)
GET /api/trips - Get all trips with filtering (authenticated)
GET /api/trips/:id - Get trip by ID (authenticated)
GET /api/trips/running/:runningNumber - Get trip by running number (authenticated)
GET /api/trips/route/:routeNumber - Get trips by route (authenticated)
GET /api/trips/bus/:busRegistrationNumber - Get trips by bus (authenticated)
GET /api/trips/active - Get active trips (authenticated)
GET /api/trips/available-buses - Get available buses (authenticated)
PUT /api/trips/:id - Update trip (admin)
PUT /api/trips/:id/status - Update trip status (operator)
DELETE /api/trips/:id - Cancel trip (admin)

## Positive Test Cases


### TC-TRIP-001: Create Trip With Valid Data

**Objective:** Verify trip creation with valid data
**Endpoint:** POST /api/trips

**Request Headers:**
Content-Type: application/json
Authorization: Bearer [Admin_token]

**Request Body:**
json
{
  "busId": "68e40e7c493aa86101ad2b59",
  "routeId": "68e40e7c493aa86101ad2b60",
  "driverId": "68e40e7c493aa86101ad2b61",
  "scheduledDeparture": "2025-10-11T08:00:00.000Z",
  "scheduledArrival": "2025-10-11T10:30:00.000Z"
}


**Expected Response:**
Status Code: 201 Created
Response includes trip with generated ID and populated references

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Trip created successfully
- ID auto-generated
- All references populated
- Status set to 'scheduled'

**Result:** [PASS/FAIL]

### TC-TRIP-002: Get All Trips

**Objective:** Verify authenticated users can retrieve all trips
**Endpoint:** GET /api/trips

**Request Headers:**
```
Authorization: Bearer [token]
```

**Request Body:**
N/A

**Expected Response:**
Status Code: 200 OK
Array of trips with populated bus, route, and driver information

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- All trips returned
- References populated correctly
- Proper data structure

**Result:** [PASS/FAIL]

### TC-TRIP-003: Get Trip by ID

**Objective:** Verify specific trip can be retrieved by ID
**Endpoint:** GET /api/trips/:id

**Request Headers:**
```
Authorization: Bearer [token]
```

**Request Body:**
N/A

**Expected Response:**
Status Code: 200 OK
Single trip object with all details and populated references

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Correct trip retrieved
- All fields present
- References populated

**Result:** [PASS/FAIL]

### TC-TRIP-004: Update Trip Details

**Objective:** Verify authorized users can update trip details
**Endpoint:** PUT /api/trips/:id

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer [Admin_token]
```

**Request Body:**
```json
{
  "scheduledDeparture": "2025-10-11T09:00:00.000Z",
  "scheduledArrival": "2025-10-11T11:30:00.000Z"
}
```

**Expected Response:**
Status Code: 200 OK
Updated trip returned with only specified fields changed

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Schedule times updated
- Other fields unchanged
- updatedAt timestamp changed

**Result:** [PASS/FAIL]

### TC-TRIP-005: Update Trip Status

**Objective:** Verify trip status can be updated by authorized users
**Endpoint:** PUT /api/trips/:id/status

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer [Driver_token]
```

**Request Body:**
```json
{
  "status": "in-progress"
}
```

**Expected Response:**
Status Code: 200 OK
Trip with updated status and timestamp

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Status updated correctly
- Actual departure/arrival times set appropriately
- updatedAt timestamp changed

**Result:** [PASS/FAIL]

### TC-TRIP-006: Delete Trip

**Objective:** Verify admin can delete a trip
**Endpoint:** DELETE /api/trips/:id

**Request Headers:**
```
Authorization: Bearer [Admin_token]
```

**Request Body:**
N/A

**Expected Response:**
Status Code: 200 OK
Success message confirming deletion

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Trip deleted successfully
- Appropriate success message
- Trip no longer exists in database

**Result:** [PASS/FAIL]

## Negative Test Cases

### TC-TRIP-007: Create Trip Without Authentication

**Objective:** Verify that trip creation requires authentication
**Endpoint:** POST /api/trips

**Request Headers:**
```
Content-Type: application/json
(No Authorization header)
```

**Request Body:**
```json
{
  "busId": "68e40e7c493aa86101ad2b59",
  "routeId": "68e40e7c493aa86101ad2b60",
  "driverId": "68e40e7c493aa86101ad2b61",
  "scheduledDeparture": "2025-10-11T08:00:00.000Z",
  "scheduledArrival": "2025-10-11T10:30:00.000Z"
}
```

**Expected Response:**
Status Code: 401 Unauthorized
Error message indicating authentication required

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Request correctly rejected
- Appropriate error message
- No trip created

**Result:** [PASS/FAIL]

### TC-TRIP-008: Create Trip With Invalid Bus ID

**Objective:** Verify validation of bus ID reference
**Endpoint:** POST /api/trips

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer [Admin_token]
```

**Request Body:**
```json
{
  "busId": "679aaaaabbbbccccddddeeee",
  "routeId": "68e40e7c493aa86101ad2b60",
  "driverId": "68e40e7c493aa86101ad2b61",
  "scheduledDeparture": "2025-10-11T08:00:00.000Z",
  "scheduledArrival": "2025-10-11T10:30:00.000Z"
}
```

**Expected Response:**
Status Code: 400 Bad Request
Error message indicating invalid bus reference

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Invalid bus ID rejected
- Appropriate error message
- No trip created

**Result:** [PASS/FAIL]

### TC-TRIP-009: Create Trip With Past Departure Time

**Objective:** Verify validation of schedule times
**Endpoint:** POST /api/trips

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer [Admin_token]
```

**Request Body:**
```json
{
  "busId": "68e40e7c493aa86101ad2b59",
  "routeId": "68e40e7c493aa86101ad2b60",
  "driverId": "68e40e7c493aa86101ad2b61",
  "scheduledDeparture": "2025-10-01T08:00:00.000Z",
  "scheduledArrival": "2025-10-01T10:30:00.000Z"
}
```

**Expected Response:**
Status Code: 400 Bad Request
Error message indicating past departure time not allowed

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Past departure time rejected
- Appropriate validation message
- No trip created

**Result:** [PASS/FAIL]

### TC-TRIP-010: Update Trip Status to Invalid Status

**Objective:** Verify status validation
**Endpoint:** PUT /api/trips/:id/status

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer [Driver_token]
```

**Request Body:**
```json
{
  "status": "invalid-status"
}
```

**Expected Response:**
Status Code: 400 Bad Request
Error message indicating invalid status value

**Actual Response:**
```json
[Record actual response here]
```

**Status Code:** [Record actual status code]

**Verification:**
- Invalid status rejected
- Appropriate validation message
- Trip status unchanged

**Result:** [PASS/FAIL]