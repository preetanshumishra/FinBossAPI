import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinBoss API',
      version: '1.1.0',
      description: 'Personal Finance Management API - Track income, expenses, budgets, analyze spending trends, and manage preferences with advanced analytics',
      contact: {
        name: 'FinBoss Support',
        email: 'support@finboss.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://finbossapi-production.up.railway.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            userId: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              example: 'expense',
            },
            amount: {
              type: 'number',
              example: 50.00,
            },
            category: {
              type: 'string',
              example: 'Food & Dining',
            },
            description: {
              type: 'string',
              example: 'Lunch at restaurant',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            userId: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            category: {
              type: 'string',
              example: 'Food & Dining',
            },
            limit: {
              type: 'number',
              example: 500.00,
            },
            period: {
              type: 'string',
              enum: ['monthly', 'yearly'],
              example: 'monthly',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6921e345bd11e0565579e349',
            },
            name: {
              type: 'string',
              example: 'Food & Dining',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              example: 'expense',
            },
            icon: {
              type: 'string',
              example: '🍽️',
            },
            color: {
              type: 'string',
              example: '#FF6B6B',
            },
            isDefault: {
              type: 'boolean',
              example: true,
            },
            userId: {
              type: 'string',
              nullable: true,
              example: null,
              description: 'Owner user ID (null for default categories)',
            },
          },
        },
        UserPreferences: {
          type: 'object',
          properties: {
            emailNotifications: {
              type: 'boolean',
              example: true,
            },
            budgetAlerts: {
              type: 'boolean',
              example: true,
            },
            weeklyReport: {
              type: 'boolean',
              example: false,
            },
          },
        },
        TransactionTrend: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              example: '2025-11-23',
            },
            income: {
              type: 'number',
              example: 1000.00,
            },
            expense: {
              type: 'number',
              example: 500.00,
            },
            balance: {
              type: 'number',
              example: 500.00,
            },
          },
        },
        SpendingForecast: {
          type: 'object',
          properties: {
            historical_average: {
              type: 'number',
              example: 450.50,
            },
            projected_spending: {
              type: 'number',
              example: 450.50,
            },
            confidence: {
              type: 'number',
              example: 85,
            },
            months: {
              type: 'number',
              example: 1,
            },
          },
        },
        BudgetComparison: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              example: 'Food & Dining',
            },
            budgeted: {
              type: 'number',
              example: 500.00,
            },
            actual: {
              type: 'number',
              example: 425.50,
            },
            variance: {
              type: 'number',
              example: 74.50,
            },
            variancePercent: {
              type: 'number',
              example: 14.9,
            },
            period: {
              type: 'string',
              enum: ['monthly', 'yearly'],
              example: 'monthly',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/auth.ts',
    './src/routes/transactions.ts',
    './src/routes/budgets.ts',
    './src/routes/analytics.ts',
    './src/routes/categories.ts',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
