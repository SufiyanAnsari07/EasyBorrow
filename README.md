# EasyBorrow

EasyBorrow is a full-stack MERN rental platform for borrowing and lending items within a local community. Users can register, list items, browse available items in their own city and state, send rental requests, and manage bookings through an owner approval flow.

Repository: [SufiyanAnsari07/EasyBorrow](https://github.com/SufiyanAnsari07/EasyBorrow.git)

## Features

- User registration and login with JWT authentication
- Unique user accounts by email and phone number
- ID proof upload during registration
- Item listing with images, price, value, deposit, condition, and location
- Region-based item browsing by the logged-in user's city and state
- Rental request flow where borrowers send requests to owners
- Owner approval or rejection for each rental request
- Booking status tracking for pending, accepted, rejected, active, completed, and cancelled bookings
- Borrower-only reviews for completed bookings
- Borrower-only complaints with one complaint allowed per booking
- Complaint page with clear labels for item-related and user-related complaints
- User dashboard for items, bookings, wallet, rental history, and owner requests
- Admin dashboard for user, complaint, review, and platform management

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Multer
- Bcrypt

## Project Structure

```text
EasyBorrow/
|-- server/
|   |-- config/          # Database configuration
|   |-- controllers/     # API controller logic
|   |-- middleware/      # Auth, maintenance, and upload middleware
|   |-- models/          # Mongoose models
|   |-- routes/          # Express API routes
|   `-- app.js           # Express app setup
|-- src/
|   |-- components/      # Reusable React components
|   |-- hooks/           # Custom React hooks
|   |-- pages/           # Page components
|   |-- services/        # Axios API services
|   |-- stores/          # Zustand stores
|   |-- utils/           # Frontend utilities
|   |-- App.tsx          # App routes
|   `-- main.tsx         # React entry point
|-- uploads/             # Local uploaded files
|-- server.js            # Backend entry point
|-- package.json
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 16 or newer
- MongoDB running locally or a MongoDB Atlas connection string
- Git
- npm

### Clone the Repository

```bash
git clone https://github.com/SufiyanAnsari07/EasyBorrow.git
cd EasyBorrow
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/EasyBorrow
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Run the Backend

Open one terminal:

```bash
node server.js
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

### Run the Frontend

Open another terminal:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Main User Flow

1. A user registers and logs in.
2. An owner lists an item with location, price, deposit, and images.
3. A borrower browses items available in their own city and state.
4. The borrower sends a rental request for an item.
5. The owner sees the request in the dashboard and accepts or rejects it.
6. The borrower sees the current request status in their bookings.
7. After completion, the borrower can submit one review and one complaint for that booking.

## Important Routes

Frontend:
- `/` - Home
- `/login` - Login
- `/register` - Register
- `/items` - Browse region-based items
- `/items/:id` - Item details
- `/dashboard` - User dashboard
- `/bookings` - Rental bookings and request status
- `/complaints` - Complaint management
- `/admin` - Admin dashboard

Backend API:
- `/api/auth` - Authentication and profile routes
- `/api/items` - Item routes
- `/api/bookings` - Booking and rental request routes
- `/api/reviews` - Review routes
- `/api/complaints` - Complaint routes
- `/api/admin` - Admin routes

## Notes

- Uploaded files are stored locally in the `uploads` folder.
- Restart the backend after changing server-side code.
- If MongoDB was dropped, start the backend again so Mongoose can recreate indexes.
- Keep `.env` out of GitHub and use `.env.example` for shared configuration.
