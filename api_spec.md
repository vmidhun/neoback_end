# NEO Timesheet & Project Management API Specification

This document outlines the API endpoints for the NEO Timesheet & Project Management application. It includes authentication mechanisms, core functionalities, and administrative operations, providing the necessary details for backend implementation and integration.

## Base URL

`http://localhost:3003/api` (or your deployed backend URL)

## Authentication

All protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` header as a Bearer token.

**Header:**
`Authorization: Bearer <YOUR_JWT_TOKEN>`

---

## Endpoints

### 1. Authentication

#### `POST /auth/login`

**Description:** Authenticates a user and returns a JWT token if successful.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```
**Request Body Schema:**
*   `email` (string, required): User's email address.
*   `password` (string, required): User's password.

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "emp_1",
    "name": "Alex Doe",
    "email": "alex.doe@neo.com",
    "role": "Employee",
    "avatarUrl": "https://i.pravatar.cc/150?u=emp_1"
  }
}
```
**Error Responses:**
*   `400 Bad Request`: Invalid input (e.g., missing email/password).
    ```json
    {"error": "Email and password are required."}
    ```
*   `401 Unauthorized`: Invalid credentials.
    ```json
    {"error": "Invalid email or password."}
    ```

---

#### `GET /auth/me`

**Description:** Retrieves the authenticated user's details. Requires a valid JWT.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "id": "emp_1",
  "name": "Alex Doe",
  "email": "alex.doe@neo.com",
  "role": "Employee",
  "avatarUrl": "https://i.pravatar.cc/150?u=emp_1",
  "teamId": "team_alpha"
}
```
**Error Responses:**
*   `401 Unauthorized`: No token provided or invalid token.
    ```json
    {"error": "Unauthorized: Invalid or missing token."}
    ```

---

### 2. User & Dashboard Data

#### `GET /users`

**Description:** Retrieves a list of all employees. Accessible by Admin, HR, Scrum Master roles. Requires a valid JWT.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
[
  {
    "id": "emp_1",
    "name": "Alex Doe",
    "role": "Employee",
    "avatarUrl": "https://i.pravatar.cc/150?u=emp_1",
    "teamId": "team_alpha"
  },
  {
    "id": "emp_2",
    "name": "Liam Gallagher",
    "role": "Scrum Master",
    "avatarUrl": "https://i.pravatar.cc/150?u=emp_2",
    "teamId": "team_alpha"
  }
]
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have the necessary role.

---

#### `GET /users/{id}`

**Description:** Retrieves details for a specific employee. Requires a valid JWT.

**Path Parameters:**
*   `id` (string, required): The ID of the employee.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "id": "emp_1",
  "name": "Alex Doe",
  "role": "Employee",
  "avatarUrl": "https://i.pravatar.cc/150?u=emp_1",
  "teamId": "team_alpha"
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have permission to view this employee (e.g., non-admin viewing another user's private data).
*   `404 Not Found`: Employee with the given ID not found.

---

#### `GET /dashboards/employee/{userId}`

**Description:** Retrieves all data required for the Employee Dashboard for a specific user. Requires a valid JWT.

**Path Parameters:**
*   `userId` (string, required): The ID of the employee.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "checkInStatus": {
    "isCheckedIn": true,
    "checkInTime": "2024-07-20T09:05:00Z"
  },
  "dailyPlan": [
    {
      "id": "task_1",
      "name": "Implement user authentication",
      "job": {
        "id": "job_1",
        "name": "Backend Development",
        "project": {
          "id": "proj_1",
          "name": "Project Phoenix",
          "client": { "id": "cli_1", "name": "Innovate Corp" }
        }
      },
      "allocatedHours": 4,
      "status": "In Progress",
      "assignedBy": "Liam G.",
      "loggedHours": 2.5
    },
    {
      "id": "task_2",
      "name": "Design dashboard wireframes",
      "job": {
        "id": "job_2",
        "name": "UI/UX Design",
        "project": {
          "id": "proj_1",
          "name": "Project Phoenix",
          "client": { "id": "cli_1", "name": "Innovate Corp" }
        }
      },
      "allocatedHours": 3,
      "status": "To Do",
      "assignedBy": "Self",
      "loggedHours": 0
    }
  ],
  "totalLoggedHoursToday": 2.5,
  "requiredDailyHours": 8,
  "leaveBalance": {
    "annual": 12,
    "sick": 5,
    "casual": 2
  }
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to view this dashboard data.
*   `404 Not Found`: User not found.

---

#### `GET /dashboards/scrum-master/{teamId}`

**Description:** Retrieves data for the Scrum Master Dashboard for a specific team. Requires a valid JWT and Scrum Master role.

**Path Parameters:**
*   `teamId` (string, required): The ID of the team.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "teamName": "Alpha Squad",
  "teamMembersStatus": [
    {
      "id": "emp_1",
      "name": "Alex Doe",
      "avatarUrl": "https://i.pravatar.cc/150?u=emp_1",
      "checkInTime": "2024-07-20T09:05:00Z",
      "totalLoggedHours": 4.5,
      "requiredHours": 8,
      "progressPercentage": 56.25
    },
    {
      "id": "emp_3",
      "name": "Jane Smith",
      "avatarUrl": "https://i.pravatar.cc/150?u=emp_3",
      "checkInTime": "2024-07-20T09:15:00Z",
      "totalLoggedHours": 3.0,
      "requiredHours": 8,
      "progressPercentage": 37.5
    }
  ]
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have Scrum Master role or is not assigned to this team.
*   `404 Not Found`: Team not found.

---

#### `GET /dashboards/reports`

**Description:** Retrieves data for the Reports Dashboard. Accessible by HR or Admin roles. Requires a valid JWT.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "projectHoursDistribution": [
    { "name": "Project Phoenix", "value": 400 },
    { "name": "Orion Platform", "value": 300 },
    { "name": "RetailNext", "value": 300 },
    { "name": "Internal Training", "value": 200 }
  ],
  "reportTypes": [
    "Client-based Timesheet",
    "Project-based Timesheet",
    "Individual Timesheet"
  ]
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have HR or Admin role.

---

#### `GET /dashboards/admin`

**Description:** Retrieves data for the Admin Dashboard. Accessible by Admin role. Requires a valid JWT.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "moduleConfigurations": [
    { "name": "Time & Attendance", "enabled": true },
    { "name": "Leave Management", "enabled": true },
    { "name": "Payroll Integration", "enabled": false }
  ],
  "masterDataSummaries": {
    "clientsCount": 3,
    "projectsCount": 3,
    "jobsCount": 5
  }
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have Admin role.

---

### 3. Tasks

#### `GET /tasks`

**Description:** Retrieves a list of all available tasks. Can be filtered by `userId`, `projectId`, `clientId`, `status`. Requires a valid JWT.

**Query Parameters:**
*   `userId` (string, optional): Filter tasks assigned to a specific user.
*   `projectId` (string, optional): Filter tasks belonging to a specific project.
*   `clientId` (string, optional): Filter tasks related to a specific client.
*   `status` (string, optional): Filter tasks by status (e.g., 'To Do', 'In Progress', 'Completed').

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
[
  {
    "id": "task_1",
    "name": "Implement user authentication",
    "job": {
      "id": "job_1",
      "name": "Backend Development",
      "project": {
        "id": "proj_1",
        "name": "Project Phoenix",
        "client": { "id": "cli_1", "name": "Innovate Corp" }
      }
    },
    "allocatedHours": 8,
    "status": "To Do",
    "assignedBy": "Liam G."
  }
]
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to view these tasks.

---

#### `GET /tasks/{id}`

**Description:** Retrieves details for a specific task. Requires a valid JWT.

**Path Parameters:**
*   `id` (string, required): The ID of the task.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "id": "task_1",
  "name": "Implement user authentication",
  "job": {
    "id": "job_1",
    "name": "Backend Development",
    "project": {
      "id": "proj_1",
      "name": "Project Phoenix",
      "client": { "id": "cli_1", "name": "Innovate Corp" }
    }
  },
  "allocatedHours": 8,
  "status": "To Do",
  "assignedBy": "Liam G."
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to view this task.
*   `404 Not Found`: Task with the given ID not found.

---

#### `POST /tasks/suggest-plan`

**Description:** Generates a suggested daily work plan using an AI model based on provided tasks. Requires a valid JWT. This is the endpoint that `geminiService.ts` will call.

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task_1",
      "name": "Implement user authentication",
      "job": { "id": "job_1", "name": "Backend Development", "project": { "id": "proj_1", "name": "Project Phoenix", "client": { "id": "cli_1", "name": "Innovate Corp" } } },
      "allocatedHours": 0,
      "status": "To Do",
      "assignedBy": "Liam G."
    }
    // ... more tasks
  ]
}
```
**Request Body Schema:**
*   `tasks` (array of Task objects, required): A list of tasks available for planning. The `allocatedHours` in these input tasks might be 0, as the AI will suggest them.

**Success Response (200 OK):**
```json
[
  {
    "id": "task_1",
    "allocatedHours": 4
  },
  {
    "id": "task_2",
    "allocatedHours": 3
  }
  // ... suggested allocated hours for tasks to fill an 8-hour day
]
```
**Success Response Schema:**
*   (array of objects): Each object contains:
    *   `id` (string): The ID of the task.
    *   `allocatedHours` (number): The suggested hours to allocate for this task today.

**Error Responses:**
*   `400 Bad Request`: Invalid input.
    ```json
    {"error": "Invalid tasks array provided."}
    ```
*   `401 Unauthorized`: Invalid or missing token.
*   `500 Internal Server Error`: Error from the AI service or backend processing.
    ```json
    {"error": "Failed to generate plan from AI: <AI_SERVICE_ERROR_MESSAGE>"}
    ```

---

#### `PUT /tasks/{id}/status`

**Description:** Updates the status of a specific task. Requires a valid JWT.

**Path Parameters:**
*   `id` (string, required): The ID of the task.

**Request Body:**
```json
{
  "status": "Completed"
}
```
**Request Body Schema:**
*   `status` (string, required): The new status of the task ('To Do', 'In Progress', 'Completed').

**Success Response (200 OK):**
```json
{
  "id": "task_1",
  "name": "Implement user authentication",
  "job": { /* ... */ },
  "allocatedHours": 8,
  "status": "Completed",
  "assignedBy": "Liam G."
}
```
**Error Responses:**
*   `400 Bad Request`: Invalid status provided.
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to change status of this task.
*   `404 Not Found`: Task with the given ID not found.

---

### 4. Time Logs

#### `GET /timelogs`

**Description:** Retrieves time logs. Can be filtered by `userId`, `taskId`, `date`. Requires a valid JWT.

**Query Parameters:**
*   `userId` (string, optional): Filter time logs for a specific user.
*   `taskId` (string, optional): Filter time logs for a specific task.
*   `date` (string, optional, YYYY-MM-DD): Filter time logs for a specific date.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
[
  {
    "id": "log_1",
    "taskId": "task_1",
    "loggedHours": 2.5,
    "notes": "Worked on auth middleware.",
    "date": "2024-07-20T10:30:00Z",
    "userId": "emp_1"
  }
]
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to view these time logs.

---

#### `POST /timelogs`

**Description:** Creates a new time log entry. Requires a valid JWT.

**Request Body:**
```json
{
  "taskId": "task_1",
  "loggedHours": 1.5,
  "notes": "Refactored login component.",
  "date": "2024-07-20T14:00:00Z"
}
```
**Request Body Schema:**
*   `taskId` (string, required): The ID of the task the time is logged against.
*   `loggedHours` (number, required): The number of hours logged.
*   `notes` (string, optional): Additional notes for the time log.
*   `date` (string, optional, ISO 8601 format): The date/time of the log. Defaults to current time if not provided.

**Success Response (201 Created):**
```json
{
  "id": "log_new_id",
  "taskId": "task_1",
  "loggedHours": 1.5,
  "notes": "Refactored login component.",
  "date": "2024-07-20T14:00:00Z",
  "userId": "emp_1"
}
```
**Error Responses:**
*   `400 Bad Request`: Invalid input.
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to log time for this task/user.
*   `404 Not Found`: Task not found.

---

### 5. Master Data Management (Admin Only)

The following endpoints are for managing core data entities. All require `Admin` role and a valid JWT.

#### `GET /clients`

**Description:** Retrieves a list of all clients.

**Success Response (200 OK):**
```json
[
  { "id": "cli_1", "name": "Innovate Corp" },
  { "id": "cli_2", "name": "Quantum Solutions" }
]
```

---

#### `POST /clients`

**Description:** Creates a new client.

**Request Body:**
```json
{ "name": "New Client Name" }
```
**Success Response (201 Created):**
```json
{ "id": "cli_new", "name": "New Client Name" }
```

---

#### `PUT /clients/{id}`

**Description:** Updates an existing client.

**Path Parameters:**
*   `id` (string, required): The ID of the client.

**Request Body:**
```json
{ "name": "Updated Client Name" }
```
**Success Response (200 OK):**
```json
{ "id": "cli_1", "name": "Updated Client Name" }
```

---

#### `DELETE /clients/{id}`

**Description:** Deletes a client.

**Path Parameters:**
*   `id` (string, required): The ID of the client.

**Success Response (204 No Content)**

---

**Similar CRUD operations apply to `projects` and `jobs`:**

*   `GET /projects`
*   `POST /projects`
*   `PUT /projects/{id}`
*   `DELETE /projects/{id}`

*   `GET /jobs`
*   `POST /jobs`
*   `PUT /jobs/{id}`
*   `DELETE /jobs/{id}`

**Example Project Request/Response:**

**`POST /projects` Request Body:**
```json
{
  "name": "New Awesome Project",
  "clientId": "cli_1"
}
```
**`POST /projects` Success Response (201 Created):**
```json
{
  "id": "proj_new",
  "name": "New Awesome Project",
  "client": { "id": "cli_1", "name": "Innovate Corp" }
}
```

**Example Job Request/Response:**

**`POST /jobs` Request Body:**
```json
{
  "name": "Frontend Refactoring",
  "projectId": "proj_1"
}
```
**`POST /jobs` Success Response (201 Created):**
```json
{
  "id": "job_new",
  "name": "Frontend Refactoring",
  "project": {
    "id": "proj_1",
    "name": "Project Phoenix",
    "client": { "id": "cli_1", "name": "Innovate Corp" }
  }
}
```

---

### 6. Reports

#### `GET /reports/timesheet`

**Description:** Generates a timesheet report based on specified filters. Accessible by HR or Admin roles. Requires a valid JWT.

**Query Parameters:**
*   `reportType` (string, required): Type of report ('Client-based Timesheet', 'Project-based Timesheet', 'Individual Timesheet').
*   `startDate` (string, required, YYYY-MM-DD): Start date for the report.
*   `endDate` (string, required, YYYY-MM-DD): End date for the report.
*   `clientId` (string, optional): Filter by client (for Client-based).
*   `projectId` (string, optional): Filter by project (for Project-based).
*   `userId` (string, optional): Filter by user (for Individual Timesheet).

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "reportTitle": "Individual Timesheet Report for Alex Doe (2024-07-01 to 2024-07-31)",
  "period": "July 2024",
  "generatedBy": "Priya Sharma",
  "data": [
    {
      "date": "2024-07-01",
      "tasks": [
        {
          "taskName": "Implement user authentication",
          "projectName": "Project Phoenix",
          "clientName": "Innovate Corp",
          "loggedHours": 4.5,
          "notes": "Worked on user auth module."
        },
        {
          "taskName": "Design dashboard wireframes",
          "projectName": "Project Phoenix",
          "clientName": "Innovate Corp",
          "loggedHours": 3.0,
          "notes": "Initial wireframes for dashboard."
        }
      ],
      "totalHoursDay": 7.5
    }
    // ... more daily entries
  ],
  "grandTotalHours": 150.25
}
```
**Error Responses:**
*   `400 Bad Request`: Invalid query parameters.
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have HR or Admin role.

---

#### `GET /reports/leave-balance/{userId}`

**Description:** Retrieves leave balance for a specific user. Accessible by HR, Admin, or the user themselves. Requires a valid JWT.

**Path Parameters:**
*   `userId` (string, required): The ID of the employee.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
{
  "userId": "emp_1",
  "userName": "Alex Doe",
  "annualLeave": 12,
  "sickLeave": 5,
  "casualLeave": 2
}
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User not authorized to view this user's leave balance.
*   `404 Not Found`: User not found.

---

### 7. Admin Configurations

#### `GET /config/modules`

**Description:** Retrieves the current configuration of application modules. Accessible by Admin role. Requires a valid JWT.

**Request Headers:**
*   `Authorization: Bearer <JWT_TOKEN>`

**Success Response (200 OK):**
```json
[
  { "name": "Time & Attendance", "enabled": true },
  { "name": "Leave Management", "enabled": true },
  { "name": "Payroll Integration", "enabled": false }
]
```
**Error Responses:**
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have Admin role.

---

#### `PUT /config/modules/{moduleName}`

**Description:** Updates the enabled status of a specific application module. Accessible by Admin role. Requires a valid JWT.

**Path Parameters:**
*   `moduleName` (string, required): The name of the module (e.g., 'Time & Attendance').

**Request Body:**
```json
{
  "enabled": true
}
```
**Request Body Schema:**
*   `enabled` (boolean, required): The new status of the module.

**Success Response (200 OK):**
```json
{
  "name": "Payroll Integration",
  "enabled": true
}
```
**Error Responses:**
*   `400 Bad Request`: Invalid input or module name.
*   `401 Unauthorized`: Invalid or missing token.
*   `403 Forbidden`: User does not have Admin role.
*   `404 Not Found`: Module not found.

---

## Security Considerations

### JWT (JSON Web Token)

*   **Generation:** Tokens should be signed using a strong secret key (e.g., HMAC-SHA256) and include claims such as `userId`, `role`, `exp` (expiration time), and `iat` (issued at time).
*   **Expiration:** Implement short-lived access tokens (e.g., 15-60 minutes) and longer-lived refresh tokens (if refresh token flow is implemented for seamless user experience).
*   **Storage:** On the client-side, access tokens should be stored securely (e.g., in `localStorage` or `sessionStorage` for SPA, though `HttpOnly` cookies are preferred for XSS resistance).
*   **Validation:** Backend must validate the JWT on every protected request:
    *   Verify the signature.
    *   Check expiration (`exp`).
    *   Ensure issuer and audience (if used) are correct.
    *   Extract user ID and role for authorization.

### Role-Based Access Control (RBAC)

*   Each endpoint specifies which user roles are authorized to access it.
*   The backend should implement middleware to check the user's role (extracted from the JWT) against the required roles for each route.

### Input Validation

*   All incoming request bodies and query parameters should be rigorously validated on the backend to prevent injection attacks and ensure data integrity.

### Error Handling

*   Consistent and informative error messages should be returned, but without exposing sensitive server-side details. Use appropriate HTTP status codes (4xx for client errors, 5xx for server errors).

---

## Data Models (Refer to `types.ts` for detailed structures)

### `Client`
```json
{
  "id": "string",
  "name": "string"
}
```

### `Project`
```json
{
  "id": "string",
  "name": "string",
  "client": { /* Client object */ }
}
```

### `Job`
```json
{
  "id": "string",
  "name": "string",
  "project": { /* Project object */ }
}
```

### `Task`
```json
{
  "id": "string",
  "name": "string",
  "job": { /* Job object */ },
  "allocatedHours": "number",
  "status": "enum (To Do, In Progress, Completed)",
  "assignedBy": "string (optional)"
}
```

### `TimeLog`
```json
{
  "id": "string",
  "taskId": "string",
  "loggedHours": "number",
  "notes": "string",
  "date": "string (ISO 8601)",
  "userId": "string"
}
```

### `Employee`
```json
{
  "id": "string",
  "name": "string",
  "role": "enum (Employee, Scrum Master, HR, Admin)",
  "avatarUrl": "string",
  "teamId": "string (optional)"
}
```
