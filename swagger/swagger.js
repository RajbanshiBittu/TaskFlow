import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",

    info: {
        title: "TaskFlow API",
        version: "1.0.0",
        description:
            "TaskFlow multi-tenant project and task management API with authentication, task assignments, background jobs, and email notifications.",
    },

    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development",
        },
    ],

    tags: [
        {
            name: "Health",
            description: "Application health",
        },
        {
            name: "Authentication",
            description: "User authentication and token management",
        },
        {
            name: "Projects",
            description: "Project management",
        },
        {
            name: "Tasks",
            description: "Task management and assignments",
        },
        {
            name: "Jobs",
            description: "Background job status",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter the JWT access token.",
            },
        },

        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: false,
                    },
                    error: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                example: "VALIDATION_ERROR",
                            },
                            message: {
                                type: "string",
                                example: "Validation failed.",
                            },
                            details: {
                                type: "array",
                                items: {},
                            },
                        },
                    },
                },
            },

            RegisterRequest: {
                type: "object",
                required: [
                    "name",
                    "email",
                    "password",
                    "organizationName",
                ],
                properties: {
                    name: {
                        type: "string",
                        example: "Bittu Rajbanshi",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "bittu@example.com",
                    },
                    password: {
                        type: "string",
                        format: "password",
                        example: "Password@123",
                    },
                    organizationName: {
                        type: "string",
                        example: "TaskFlow Organization",
                    },
                },
            },

            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "bittu@example.com",
                    },
                    password: {
                        type: "string",
                        format: "password",
                        example: "Password@123",
                    },
                },
            },

            RefreshRequest: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIs...",
                    },
                },
            },

            LogoutRequest: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: {
                        type: "string",
                        example: "eyJhbGciOiJIUzI1NiIs...",
                    },
                },
            },

            ProjectCreateRequest: {
                type: "object",
                required: ["name"],
                properties: {
                    name: {
                        type: "string",
                        example: "TaskFlow Backend",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "Backend development project",
                    },
                },
            },

            ProjectUpdateRequest: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        example: "Updated TaskFlow Backend",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "Updated project description",
                    },
                },
            },

            TaskCreateRequest: {
                type: "object",
                required: ["title"],
                properties: {
                    title: {
                        type: "string",
                        example: "Implement authentication",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "Implement JWT authentication",
                    },
                    status: {
                        type: "string",
                        enum: [
                            "todo",
                            "in_progress",
                            "review",
                            "done",
                        ],
                        example: "todo",
                    },
                    priority: {
                        type: "string",
                        enum: [
                            "low",
                            "medium",
                            "high",
                            "urgent",
                        ],
                        example: "high",
                    },
                    dueDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                        example: "2026-09-01T18:00:00.000Z",
                    },
                },
            },

            TaskUpdateRequest: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        example: "Updated authentication task",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                    },
                    status: {
                        type: "string",
                        enum: [
                            "todo",
                            "in_progress",
                            "review",
                            "done",
                        ],
                    },
                    priority: {
                        type: "string",
                        enum: [
                            "low",
                            "medium",
                            "high",
                            "urgent",
                        ],
                    },
                    dueDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                },
            },

            AssignmentRequest: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: {
                        type: "string",
                        format: "uuid",
                        example: "550e8400-e29b-41d4-a716-446655440000",
                    },
                },
            },

            User: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    name: {
                        type: "string",
                        example: "Bittu Rajbanshi",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "bittu@example.com",
                    },
                },
            },

            Organization: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    name: {
                        type: "string",
                        example: "TaskFlow Organization",
                    },
                    slug: {
                        type: "string",
                        example: "taskflow-organization-a1b2c3d4",
                    },
                },
            },

            Project: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    name: {
                        type: "string",
                        example: "TaskFlow Backend",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                    },
                },
            },

            Task: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                    },
                    title: {
                        type: "string",
                        example: "Implement authentication",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                    },
                    status: {
                        type: "string",
                        enum: [
                            "todo",
                            "in_progress",
                            "review",
                            "done",
                        ],
                    },
                    priority: {
                        type: "string",
                        enum: [
                            "low",
                            "medium",
                            "high",
                            "urgent",
                        ],
                    },
                    dueDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                },
            },

            Job: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                    },
                    status: {
                        type: "string",
                        enum: [
                            "pending",
                            "active",
                            "completed",
                            "failed",
                        ],
                    },
                    type: {
                        type: "string",
                        example: "task-assignment-notification",
                    },
                },
            },
        },
    },

    paths: {
        // =========================================================
        // HEALTH
        // =========================================================

        "/health": {
            get: {
                tags: ["Health"],
                summary: "Check API health",

                responses: {
                    200: {
                        description: "API is healthy",
                    },
                    204: {
                        description: "API is healthy with no response body",
                    },
                },
            },
        },

        // =========================================================
        // AUTHENTICATION
        // =========================================================

        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register a new user",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RegisterRequest",
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: "User registered successfully",
                    },

                    200: {
                        description: "User registered successfully",
                    },

                    400: {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },

                    409: {
                        description: "Account already exists",
                    },

                    429: {
                        description: "Rate limit exceeded",
                    },
                },
            },
        },

        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Login user",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/LoginRequest",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Login successful",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Invalid credentials",
                    },

                    429: {
                        description: "Rate limit exceeded",
                    },
                },
            },
        },

        "/auth/refresh": {
            post: {
                tags: ["Authentication"],
                summary: "Refresh access token",

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RefreshRequest",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Access token refreshed successfully",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description:
                            "Refresh token invalid, expired, or revoked",
                    },

                    429: {
                        description: "Rate limit exceeded",
                    },
                },
            },
        },

        "/auth/logout": {
            post: {
                tags: ["Authentication"],
                summary: "Logout user",

                /*
                 * This route uses validation but does NOT use
                 * authenticateUser middleware.
                 *
                 * Therefore do not add bearerAuth here.
                 */

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/LogoutRequest",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Logout completed",
                    },

                    400: {
                        description: "Validation error",
                    },

                    429: {
                        description: "Rate limit exceeded",
                    },
                },
            },
        },

        // =========================================================
        // PROJECTS
        // =========================================================

        "/projects": {
            get: {
                tags: ["Projects"],
                summary: "List projects",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "page",
                        in: "query",
                        required: false,
                        schema: {
                            type: "integer",
                            minimum: 1,
                            default: 1,
                        },
                    },
                    {
                        name: "limit",
                        in: "query",
                        required: false,
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20,
                        },
                    },
                ],

                responses: {
                    200: {
                        description: "Projects retrieved successfully",
                    },

                    400: {
                        description: "Invalid query parameters",
                    },

                    401: {
                        description: "Unauthorized",
                    },
                },
            },

            post: {
                tags: ["Projects"],
                summary: "Create project",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ProjectCreateRequest",
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: "Project created successfully",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/projects/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Project ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            get: {
                tags: ["Projects"],
                summary: "Get project",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    200: {
                        description: "Project retrieved successfully",
                    },

                    400: {
                        description: "Invalid project ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Project belongs to another organization",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },

            patch: {
                tags: ["Projects"],
                summary: "Update project",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ProjectUpdateRequest",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Project updated successfully",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Project belongs to another organization",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },

            delete: {
                tags: ["Projects"],
                summary: "Delete project",

                description:
                    "Only organization administrators can delete projects.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    204: {
                        description: "Project deleted successfully",
                    },

                    400: {
                        description: "Invalid project ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Only organization administrators can delete projects",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },
        },

        // =========================================================
        // PROJECT TASKS
        // =========================================================

        "/projects/{projectId}/tasks": {
            parameters: [
                {
                    name: "projectId",
                    in: "path",
                    required: true,
                    description: "Project ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            get: {
                tags: ["Tasks"],
                summary: "List tasks for a project",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                parameters: [
                    {
                        name: "status",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            enum: [
                                "todo",
                                "in_progress",
                                "review",
                                "done",
                            ],
                        },
                    },
                    {
                        name: "priority",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            enum: [
                                "low",
                                "medium",
                                "high",
                                "urgent",
                            ],
                        },
                    },
                    {
                        name: "assignee",
                        in: "query",
                        required: false,
                        description: "Filter by assignee user ID",
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                    },
                    {
                        name: "dueFrom",
                        in: "query",
                        required: false,
                        description: "Filter tasks from this due date",
                        schema: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                    {
                        name: "dueTo",
                        in: "query",
                        required: false,
                        description: "Filter tasks until this due date",
                        schema: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                    {
                        name: "page",
                        in: "query",
                        required: false,
                        schema: {
                            type: "integer",
                            minimum: 1,
                            default: 1,
                        },
                    },
                    {
                        name: "limit",
                        in: "query",
                        required: false,
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20,
                        },
                    },
                ],

                responses: {
                    200: {
                        description: "Tasks retrieved successfully",
                    },

                    400: {
                        description: "Invalid parameters",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Project belongs to another organization",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },

            post: {
                tags: ["Tasks"],
                summary: "Create task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/TaskCreateRequest",
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: "Task created successfully",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Project belongs to another organization",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },
        },

        "/projects/{id}/dashboard": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Project ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            get: {
                tags: ["Projects"],
                summary: "Get project task dashboard",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    200: {
                        description:
                            "Dashboard statistics retrieved successfully",
                    },

                    400: {
                        description: "Invalid project ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Project belongs to another organization",
                    },

                    404: {
                        description: "Project not found",
                    },
                },
            },
        },

        // =========================================================
        // TASKS
        // =========================================================

        "/tasks/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Task ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            get: {
                tags: ["Tasks"],
                summary: "Get task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    200: {
                        description: "Task retrieved successfully",
                    },

                    400: {
                        description: "Invalid task ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Task belongs to another organization",
                    },

                    404: {
                        description: "Task not found",
                    },
                },
            },

            patch: {
                tags: ["Tasks"],
                summary: "Update task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/TaskUpdateRequest",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Task updated successfully",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Task belongs to another organization",
                    },

                    404: {
                        description: "Task not found",
                    },
                },
            },

            delete: {
                tags: ["Tasks"],
                summary: "Delete task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    204: {
                        description: "Task deleted successfully",
                    },

                    400: {
                        description: "Invalid task ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Task belongs to another organization",
                    },

                    404: {
                        description: "Task not found",
                    },
                },
            },
        },

        // =========================================================
        // TASK ASSIGNMENT
        // =========================================================

        "/tasks/{id}/assign": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Task ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            post: {
                tags: ["Tasks"],
                summary: "Assign a user to a task",

                description:
                    "Creates the task assignment and asynchronously queues an assignment notification.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AssignmentRequest",
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description:
                            "Assignment created and notification job queued",
                    },

                    400: {
                        description: "Validation error",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Task or user belongs to another organization",
                    },

                    404: {
                        description:
                            "Task or assignee not found",
                    },

                    409: {
                        description:
                            "User is already assigned to the task",
                    },
                },
            },
        },

        "/tasks/{id}/assign/{userId}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Task ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
                {
                    name: "userId",
                    in: "path",
                    required: true,
                    description: "Assigned user ID",
                    schema: {
                        type: "string",
                        format: "uuid",
                    },
                },
            ],

            delete: {
                tags: ["Tasks"],
                summary: "Unassign a user from a task",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    204: {
                        description:
                            "User successfully unassigned from task",
                    },

                    400: {
                        description: "Invalid task or user ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Task belongs to another organization",
                    },

                    404: {
                        description: "Assignment not found",
                    },
                },
            },
        },

        // =========================================================
        // JOBS
        // =========================================================

        "/jobs/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "Background job ID",
                    schema: {
                        type: "string",
                        minLength: 1,
                        maxLength: 200,
                    },
                },
            ],

            get: {
                tags: ["Jobs"],
                summary: "Get background job status",

                description:
                    "Returns organization-scoped background job metadata and normalized job status.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                responses: {
                    200: {
                        description:
                            "Background job status retrieved successfully",
                    },

                    400: {
                        description: "Invalid job ID",
                    },

                    401: {
                        description: "Unauthorized",
                    },

                    403: {
                        description:
                            "Job belongs to another organization",
                    },

                    404: {
                        description: "Job not found",
                    },
                },
            },
        },
    },
};

export const setupSwagger = (app) => {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customSiteTitle: "TaskFlow API Documentation",
        })
    );
};

export default swaggerDocument;