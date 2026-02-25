# FinBossAPI

A comprehensive personal finance management backend API built with Express.js, TypeScript, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **User Profile Management**: Update profile, change password, delete account with cascade operations
- **User Preferences**: Save and retrieve notification and alert preferences
- **Transaction Management**: Track income and expenses with categories and dates
- **Advanced Analytics**: Spending trends, forecasting, and budget comparisons
- **Budget Management**: Set and monitor spending budgets with alerts and analysis
- **Category System**: Pre-seeded default categories with icons and colors, plus custom categories
- **Analytics Insights**: Get insights on spending by category, transaction summaries, and forecasts

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Express middleware

## Live API

The API is currently live and running on Google Cloud Run:
- **Base URL**: `https://finbossapi-618844932346.us-central1.run.app`
- **API Docs**: `https://finbossapi-618844932346.us-central1.run.app/api-docs` (Swagger UI)
- **OpenAPI Spec**: `https://finbossapi-618844932346.us-central1.run.app/swagger.json`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/preetanshumishra/FinBossAPI.git
cd FinBossAPI
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (see `.env.example`):
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
```

4. Make sure MongoDB Atlas IP Whitelist includes your IP or allows `0.0.0.0/0`

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Build TypeScript:
```bash
npm run build
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication (7 endpoints)
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile (protected)
- `POST /api/v1/auth/change-password` - Change password (protected)
- `DELETE /api/v1/auth/account` - Delete account and cascade delete all associated data (protected)

### User Preferences (2 endpoints)
- `GET /api/v1/auth/preferences` - Get user preferences (protected)
- `POST /api/v1/auth/preferences` - Save user preferences (protected)

### Transactions (9 endpoints)
- `GET /api/v1/transactions` - Get all transactions (with filters and pagination)
- `POST /api/v1/transactions` - Create a new transaction
- `GET /api/v1/transactions/:id` - Get transaction by ID
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/transactions/summary` - Get income/expense summary
- `GET /api/v1/transactions/analytics/category` - Get breakdown by category
- `GET /api/v1/transactions/trends` - Get spending trends (daily/weekly/monthly)
- `GET /api/v1/transactions/forecast` - Get spending forecast with confidence score

### Analytics (1 endpoint)
- `GET /api/v1/analytics/budget-vs-actual` - Compare budgeted vs actual spending by category

### Budgets (6 endpoints)
- `GET /api/v1/budgets` - Get all budgets
- `POST /api/v1/budgets` - Create a new budget
- `GET /api/v1/budgets/:id` - Get budget details
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget
- `GET /api/v1/budgets/status/overview` - Get budget health status

### Categories (4 endpoints)
- `GET /api/v1/categories` - Get all categories (default and custom)
- `POST /api/v1/categories` - Create custom category (protected)
- `PUT /api/v1/categories/:id` - Update category (protected)
- `DELETE /api/v1/categories/:id` - Delete custom category (protected)

## API Documentation

### Swagger/OpenAPI

The API includes comprehensive Swagger documentation:
- **Interactive UI**: `https://finbossapi-618844932346.us-central1.run.app/api-docs`
- **OpenAPI Spec**: `https://finbossapi-618844932346.us-central1.run.app/swagger.json`

You can:
- View all endpoints with descriptions
- See request/response schemas
- Try out endpoints directly from the browser
- Export the spec to Postman or other API tools

### Health Check & Info

- `GET /health` - Server health status
- `GET /api/v1` - API version info

## Database Models

### User
- Email (unique)
- Password (hashed)
- First name
- Last name
- Preferences (emailNotifications, budgetAlerts, weeklyReport)
- Created at timestamp
- Updated at timestamp

### Transaction
- User ID (reference)
- Type (income/expense)
- Amount
- Category
- Description
- Date

### Budget
- User ID (reference)
- Category
- Limit
- Period (monthly/yearly)
- Created/Updated timestamps

### Category
- Name
- Icon (emoji)
- Color (hex code)
- Default flag

## Error Handling

All API endpoints return consistent error responses:
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Deployment

### Google Cloud Run

FinBossAPI is deployed on Google Cloud Run with continuous deployment via GitHub integration.

**Production URL:**
- Google Cloud Run: https://finbossapi-618844932346.us-central1.run.app

### Deployment Pipeline
- **Platform**: Google Cloud Run (serverless)
- **Build System**: Cloud Build with Developer Connect
- **Container**: Node.js buildpack
- **Trigger**: Automatic on push to `master` branch
- **Environment**: Production configuration with MongoDB Atlas
- **Project**: finboss-488502

### Deploying Your Own

1. Create a Google Cloud project
2. Set up Cloud Build with Developer Connect for GitHub integration
3. Create a Cloud Run service with the following environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random secret
   - `JWT_REFRESH_SECRET`: A separate secret for refresh tokens
   - `NODE_ENV`: `production`
4. Configure Cloud Build trigger to deploy automatically on push to `master` branch

### MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist your IP or allow `0.0.0.0/0` for Google Cloud Run (depends on your Cloud Run service region)
3. Get your connection string from the "Connect" button
4. Replace `<password>` with your actual password

## Development Notes

- All routes except `/health` and `GET /api/v1/categories` require JWT authentication
- Transactions, budgets, and preferences are user-specific (filtered by userId)
- Budget spending is calculated from matching transactions
- Deleting a user cascades to delete all their transactions and budgets
- 13 default categories are pre-seeded on server startup
- Default categories cannot be modified or deleted
- User preferences are stored server-side with defaults (emailNotifications: true, budgetAlerts: true, weeklyReport: false)
- Transaction trends support daily, weekly, and monthly grouping
- Spending forecasts are calculated from 3-month historical averages with confidence scoring
- Budget vs actual comparisons show variance and variance percentages
- Passwords are hashed with bcryptjs (salt rounds: 10)
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- TypeScript is compiled to JavaScript in the `dist/` folder
- All code is type-safe with proper interfaces and validation

## Project Structure

```
src/
├── config/
│   ├── database.ts          # MongoDB connection
│   └── swagger.ts           # Swagger/OpenAPI configuration
├── controllers/
│   ├── authController.ts    # Auth and profile management
│   ├── transactionController.ts  # Transactions, trends, forecast
│   ├── budgetController.ts  # Budget management
│   ├── analyticsController.ts   # Budget vs actual analysis
│   └── categoryController.ts    # Category CRUD operations
├── middleware/
│   └── auth.ts              # JWT authentication middleware
├── models/
│   ├── User.ts              # User schema with preferences
│   ├── Transaction.ts       # Transaction schema
│   ├── Budget.ts            # Budget schema
│   └── Category.ts          # Category schema
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── transactions.ts      # Transaction routes
│   ├── budgets.ts           # Budget routes
│   ├── analytics.ts         # Analytics routes
│   └── categories.ts        # Category routes
├── utils/
│   ├── jwt.ts               # JWT token generation
│   └── seedCategories.ts    # Default category seeding
└── index.ts                 # Express app entry point
```

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: MongoDB 9.x with Mongoose 9.x
- **Authentication**: JWT (jsonwebtoken 9.x)
- **Password Hashing**: bcryptjs 3.x
- **API Documentation**: Swagger/OpenAPI with swagger-ui-express
- **Development**: ts-node, nodemon, TypeScript compiler

## Testing the API

### Using Swagger UI
Visit `https://finbossapi-618844932346.us-central1.run.app/api-docs` and click "Try it out" on any endpoint.

### Using cURL (Development)
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","firstName":"John","lastName":"Doe"}'

# Health check
curl http://localhost:5000/health
```

### Using cURL (Production)
```bash
# Register
curl -X POST https://finbossapi-618844932346.us-central1.run.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","firstName":"John","lastName":"Doe"}'

# Health check
curl https://finbossapi-618844932346.us-central1.run.app/health
```

### Using Postman
1. Import the OpenAPI spec: `https://finbossapi-618844932346.us-central1.run.app/swagger.json`
2. Set the `Authorization` header with your JWT token from login/register
3. Start testing endpoints

## Deployment

FinBossAPI is deployed on Google Cloud Run with continuous deployment via GitHub integration.

**Production URL:**
- Google Cloud Run: https://finbossapi-618844932346.us-central1.run.app

### Deployment Pipeline
- **Platform**: Google Cloud Run (serverless)
- **Build System**: Cloud Build with Developer Connect
- **Container**: Node.js buildpack
- **Trigger**: Automatic on push to `master` branch
- **Environment**: Production configuration with MongoDB Atlas
- **Project**: finboss-488502

## FinBoss Ecosystem

This project is part of the FinBoss financial management ecosystem:

- **[FinBossWeb](https://github.com/preetanshumishra/FinBossWeb)** - React web frontend
- **[FinBossMobile](https://github.com/preetanshumishra/FinBossMobile)** - React Native mobile app (iOS/Android via Expo)
- **[FinBossAndroid](https://github.com/preetanshumishra/FinBossAndroid)** - Native Android app (Kotlin + Jetpack Compose)
- **[FinBossiOS](https://github.com/preetanshumishra/FinBossiOS)** - Native iOS app (Swift + SwiftUI)

## License

MIT

## Author

Preetanshu Mishra


