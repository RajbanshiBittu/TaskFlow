import swaggerUi from "swagger-ui-express";

const swaggerDocument = {
    openapi: "3.0.3",

    info: {
        title: "TaskFlow API",
        version: "1.0.0",
        description:
            "TaskFlow project and task management REST API"
    },

    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development server"
        }
    ],

    tags: [
        {
            name: "Health",
            description: "API health checks"
        },
        {
            name: "Authentication",
            description: "Authentication and token management"
        },
        {
            name: "Projects",
            description: "Project management"
        },
        {
            name: "Tasks",
            description: "Task management"
        },
        {
            name: "Jobs",
            description: "Background job status"
        }
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },

        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: false
                    },
                    error: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                example: "VALIDATION_ERROR"
                            },
                            message: {
                                type: "string",
                                example: "Validation failed."
                            },
                            details: {
                                type: "array",
                                items: {
                                    type: "object"
                                }
                            }
                        }
                    }
                }
            },

            AuthResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        example: true
                    },
                    data: {
                        type: "object",
                        properties: {
                            user: {
                                type: "object"
                            },
                            organization: {
                                type: "object"
                            },
                            role: {
                                type: "string",
                                example: "org_admin"
                            },
                            accessToken: {
                                type: "string"
                            },
                            refreshToken: {
                                type: "string"
                            },
                            expiresIn: {
                                type: "string",
                                example: "15m"
                            }
                        }
                    }
                }
            },

            Project: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid"
                    },
                    name: {
                        type: "string",
                        example: "TaskFlow Project"
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "Project management system"
                    }
                }
            },

            Task: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        format: "uuid"
                    },
                    title: {
                        type: "string",
                        example: "Implement authentication"
                    },
                    description: {
                        type: "string",
                        nullable: true
                    },
                    status: {
                        type: "string",
                        enum: [
                            "todo",
                            "in_progress",
                            "review",
                            "done"
                        ]
                    },
                    priority: {
                        type: "string",
                        enum: [
                            "low",
                            "medium",
                            "high",
                            "urgent"
                        ]
                    }
                }
            }
        }
    },

    paths: {

        "/health": {
            get: {
                tags: ["Health"],
                summary: "Check API health",

                responses: {
                    200: {
                        description: "API is healthy"
                    }
                }
            }
        },

        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "Register a new user",

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "name",
                                    "email",
                                    "password",
                                    "organizationName"
                                ],
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Bittu"
                                    },
                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "bittu@example.com"
                                    },
                                    password: {
                                        type: "string",
                                        format: "password",
                                        example: "Password@123"
                                    },
                                    organizationName: {
                                        type: "string",
                                        example: "TaskFlow Organization"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "User registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AuthResponse"
                                }
                            }
                        }
                    },

                    400: {
                        description: "Validation error"
                    },

                    409: {
                        description: "User already exists"
                    }
                }
            }
        },

        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Login",

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "email",
                                    "password"
                                ],
                                properties: {
                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "bittu@example.com"
                                    },
                                    password: {
                                        type: "string",
                                        format: "password",
                                        example: "Password@123"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AuthResponse"
                                }
                            }
                        }
                    },

                    401: {
                        description: "Invalid credentials"
                    }
                }
            }
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
                                type: "object",
                                required: ["refreshToken"],
                                properties: {
                                    refreshToken: {
                                        type: "string"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Token refreshed"
                    },

                    401: {
                        description: "Invalid or revoked refresh token"
                    }
                }
            }
        },

        "/auth/logout": {
            post: {
                tags: ["Authentication"],
                summary: "Logout",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    200: {
                        description: "Logout successful"
                    },

                    401: {
                        description: "Unauthorized"
                    }
                }
            }
        },

        "/projects": {
            get: {
                tags: ["Projects"],
                summary: "Get projects",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    200: {
                        description: "Projects retrieved successfully"
                    },

                    401: {
                        description: "Unauthorized"
                    }
                }
            },

            post: {
                tags: ["Projects"],
                summary: "Create project",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Website Redesign"
                                    },
                                    description: {
                                        type: "string",
                                        example: "Redesign company website"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "Project created"
                    },

                    400: {
                        description: "Validation error"
                    },

                    401: {
                        description: "Unauthorized"
                    }
                }
            }
        },

        "/projects/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            get: {
                tags: ["Projects"],
                summary: "Get project",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    200: {
                        description: "Project retrieved"
                    },

                    403: {
                        description: "Forbidden"
                    },

                    404: {
                        description: "Project not found"
                    }
                }
            },

            patch: {
                tags: ["Projects"],
                summary: "Update project",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Updated Project"
                                    },
                                    description: {
                                        type: "string",
                                        nullable: true
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Project updated"
                    },

                    403: {
                        description: "Forbidden"
                    },

                    404: {
                        description: "Project not found"
                    }
                }
            },

            delete: {
                tags: ["Projects"],
                summary: "Delete project",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    204: {
                        description: "Project deleted"
                    },

                    403: {
                        description:
                            "Only organization administrators can delete projects"
                    },

                    404: {
                        description: "Project not found"
                    }
                }
            }
        },

        "/projects/{projectId}/tasks": {
            parameters: [
                {
                    name: "projectId",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            get: {
                tags: ["Tasks"],
                summary: "Get project tasks",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "todo",
                                "in_progress",
                                "review",
                                "done"
                            ]
                        }
                    },
                    {
                        name: "priority",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "low",
                                "medium",
                                "high",
                                "urgent"
                            ]
                        }
                    },
                    {
                        name: "assignee",
                        in: "query",
                        schema: {
                            type: "string",
                            format: "uuid"
                        }
                    },
                    {
                        name: "page",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            default: 1
                        }
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        }
                    }
                ],

                responses: {
                    200: {
                        description: "Tasks retrieved"
                    }
                }
            },

            post: {
                tags: ["Tasks"],
                summary: "Create task",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: {
                                        type: "string",
                                        example: "Implement dashboard"
                                    },
                                    description: {
                                        type: "string"
                                    },
                                    status: {
                                        type: "string",
                                        enum: [
                                            "todo",
                                            "in_progress",
                                            "review",
                                            "done"
                                        ],
                                        default: "todo"
                                    },
                                    priority: {
                                        type: "string",
                                        enum: [
                                            "low",
                                            "medium",
                                            "high",
                                            "urgent"
                                        ],
                                        default: "medium"
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    201: {
                        description: "Task created"
                    },

                    400: {
                        description: "Validation error"
                    }
                }
            }
        },

        "/tasks/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    }
                }
            ],

            get: {
                tags: ["Tasks"],
                summary: "Get task",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    200: {
                        description: "Task retrieved"
                    },

                    403: {
                        description: "Forbidden"
                    },

                    404: {
                        description: "Task not found"
                    }
                }
            },

            patch: {
                tags: ["Tasks"],
                summary: "Update task",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                type: "object",

                                properties: {
                                    title: {
                                        type: "string"
                                    },
                                    description: {
                                        type: "string",
                                        nullable: true
                                    },
                                    status: {
                                        type: "string",
                                        enum: [
                                            "todo",
                                            "in_progress",
                                            "review",
                                            "done"
                                        ]
                                    },
                                    priority: {
                                        type: "string",
                                        enum: [
                                            "low",
                                            "medium",
                                            "high",
                                            "urgent"
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },

                responses: {
                    200: {
                        description: "Task updated"
                    }
                }
            },

            delete: {
                tags: ["Tasks"],
                summary: "Delete task",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {
                    204: {
                        description: "Task deleted"
                    }
                }
            }
        },

        "/jobs/{id}": {
            get: {
                tags: ["Jobs"],
                summary: "Get background job status",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string"
                        }
                    }
                ],

                responses: {
                    200: {
                        description: "Job status retrieved"
                    },

                    403: {
                        description: "Forbidden"
                    },

                    404: {
                        description: "Job not found"
                    }
                }
            }
        }
    }
};

export const setupSwagger = (app) => {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customSiteTitle: "TaskFlow API Documentation"
        })
    );
};

export default swaggerDocument;