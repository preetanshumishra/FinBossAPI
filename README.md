# FinBossAPI

A comprehensive personal finance management backend API built with Express.js, TypeScript, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Transaction Management**: Track income and expenses with categories and dates
- **Budget Management**: Set and monitor spending budgets with alerts
- **Analytics**: Get insights on spending by category and transaction summaries
- **Category System**: Pre-seeded default categories with icons and colors

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Express middleware

## Live API

The API is currently live and running on Railway:
- **Base URL**: `https://finbossapi-production.up.railway.app`
- **API Docs**: `https://finbossapi-production.up.railway.app/api-docs` (Swagger UI)
- **OpenAPI Spec**: `https://finbossapi-production.up.railway.app/swagger.json`

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

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile (protected)

### Transactions
- `GET /api/v1/transactions` - Get all transactions (with filters)
- `POST /api/v1/transactions` - Create a new transaction
- `GET /api/v1/transactions/:id` - Get transaction by ID
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction
- `GET /api/v1/transactions/summary` - Get income/expense summary
- `GET /api/v1/transactions/analytics/category` - Get breakdown by category

### Budgets
- `GET /api/v1/budgets` - Get all budgets
- `POST /api/v1/budgets` - Create a new budget
- `GET /api/v1/budgets/:id` - Get budget details
- `PUT /api/v1/budgets/:id` - Update budget
- `DELETE /api/v1/budgets/:id` - Delete budget
- `GET /api/v1/budgets/status/overview` - Get budget health status

## API Documentation

### Swagger/OpenAPI

The API includes comprehensive Swagger documentation:
- **Interactive UI**: `https://finbossapi-production.up.railway.app/api-docs`
- **OpenAPI Spec**: `https://finbossapi-production.up.railway.app/swagger.json`

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
- Created at timestamp

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

### Railway Deployment

The API is deployed on [Railway](https://railway.app):
- **Live URL**: `https://finbossapi-production.up.railway.app`
- **Auto-deploys**: On every push to the `master` branch
- **Database**: MongoDB Atlas (cloud-hosted)
- **Free Tier**: Includes $5/month free credits

### Deploying Your Own

1. Create a [Railway account](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random secret
   - `NODE_ENV`: `production`
4. Railway automatically builds and deploys on each push

### MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist your IP or allow `0.0.0.0/0` for Railway
3. Get your connection string from the "Connect" button
4. Replace `<password>` with your actual password

## Development Notes

- All routes except `/health` require JWT authentication
- Transactions and budgets are user-specific (filtered by userId)
- Budget spending is calculated from matching transactions
- 13 default categories are pre-seeded on server startup
- Passwords are hashed with bcryptjs (salt rounds: 10)
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days
- TypeScript is compiled to JavaScript in the `dist/` folder
- All code is type-safe with proper interfaces

## Project Structure

```
src/
├── config/
│   ├── database.ts       # MongoDB connection
│   └── swagger.ts        # Swagger/OpenAPI configuration
├── controllers/          # Business logic
├── middleware/           # Express middleware
├── models/               # Mongoose schemas
├── routes/               # API endpoints
├── utils/                # Helper functions
└── index.ts              # Express app entry point
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
Visit `https://finbossapi-production.up.railway.app/api-docs` and click "Try it out" on any endpoint.

### Using cURL
```bash
# Register
curl -X POST https://finbossapi-production.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","firstName":"John","lastName":"Doe"}'

# Health check
curl https://finbossapi-production.up.railway.app/health
```

### Using Postman
1. Import the OpenAPI spec: `https://finbossapi-production.up.railway.app/swagger.json`
2. Set the `Authorization` header with your JWT token from login/register
3. Start testing endpoints

## License

MIT

## Author

Preetanshu Mishra
