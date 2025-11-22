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

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FinBossAPI.git
cd FinBossAPI
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
```

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

## Health Check

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

## Development Notes

- All routes except health check require authentication
- Transactions and budgets are user-specific
- Budget spending is calculated from matching transactions
- Categories are pre-seeded on server startup
- Passwords are hashed with bcryptjs (salt rounds: 10)
- Access tokens expire in 7 days
- Refresh tokens expire in 30 days

## License

MIT
