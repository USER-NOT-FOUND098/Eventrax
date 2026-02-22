# EVENTRAX - Event Management System

A comprehensive event management platform built with React (Frontend) and PHP (Backend), designed for educational institutions to manage events, registrations, volunteers, and budgets.

## Features

- **Role-Based Access Control**: Admin, Event Creator, Team Lead, and Student roles
- **Event Management**: Create, manage, and track events with sub-events
- **User Registration**: Students can register for events
- **Volunteer Management**: Assign and manage volunteers for sub-events
- **Budget Tracking**: Monitor event expenses and budgets
- **Real-Time Notifications**: Live notification system with polling
- **Approval Workflow**: Admin approval for Event Creators and Team Leads

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS
- Radix UI Components
- React Router
- Axios
- date-fns

### Backend
- PHP 8.x
- MySQL/MariaDB
- RESTful API architecture

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **XAMPP** (or similar LAMP/WAMP stack) - [Download](https://www.apachefriends.org/)
- **Git** (optional, for cloning)

## Installation & Setup

### 1. Clone or Download the Project

```bash
git clone <your-repo-url>
cd eventrax
```

### 2. Database Setup

1. **Start XAMPP**:
   - Open XAMPP Control Panel
   - Start **Apache** and **MySQL**

2. **Create Database**:
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Create a new database named `eventrax_db`
   - Import the initial schema:
     - Go to the **SQL** tab
     - Copy and paste the contents of `api/database.sql`
     - Click **Go**

3. **Run Migrations**:
   - Open the **SQL** tab in phpMyAdmin
   - Run the Phase 2 migration:
     ```sql
     -- Copy contents from api/migrations/phase2_migration.sql
     ```
   - Run the Notifications migration:
     ```sql
     -- Copy contents from api/migrations/notifications_migration.sql
     ```

### 3. Backend Setup (PHP API)

1. **Move API to XAMPP**:
   - Copy the `api` folder to `C:\xampp\htdocs\eventrax\`
   - Or create a symbolic link:
     ```powershell
     mklink /D "C:\xampp\htdocs\eventrax" "F:\PROJECT 77\eventrax"
     ```

2. **Configure Database Connection**:
   - Open `api/config/db.php`
   - Verify the database credentials:
     ```php
     $host = 'localhost';
     $db = 'eventrax_db';
     $user = 'root';
     $pass = ''; // Default XAMPP password is empty
     ```

3. **Test API**:
   - Navigate to: `http://localhost/eventrax/api/v1/auth/login.php`
   - You should see a JSON response (not an error page)

### 4. Frontend Setup (React App)

1. **Navigate to the app folder**:
   ```powershell
   cd app
   ```

2. **Install Dependencies**:
   ```powershell
   npm install
   ```

3. **Start Development Server**:
   ```powershell
   npm run dev
   ```

4. **Open in Browser**:
   - The terminal will show the URL (usually `http://localhost:5173`)
   - Open this URL in your browser

## Running the Project

### Quick Start Commands

**Option 1: From the `app` folder**
```powershell
cd app
npm run dev
```

**Option 2: From the root folder**
```powershell
npm run dev --prefix app
```

### Example Login Credentials

**Example Admin Account**:
- Email: `admin@eventrax.com`
- Password: `admin123`
*(Note: Remember to change default credentials in production!)*

## Project Structure

```
eventrax/
├── api/                      # PHP Backend
│   ├── config/              # Database & CORS configuration
│   ├── migrations/          # Database migration scripts
│   └── v1/                  # API endpoints
│       ├── auth/           # Authentication (login, register, logout)
│       ├── events/         # Event management
│       ├── users/          # User management
│       ├── notifications/  # Notification system
│       ├── registrations/  # Event registrations
│       ├── sub_events/     # Sub-event management
│       └── stats/          # Dashboard statistics
├── app/                     # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context (Auth)
│   │   ├── lib/           # Utilities & API client
│   │   ├── pages/         # Page components
│   │   │   ├── Admin/     # Admin dashboard & users
│   │   │   ├── Creator/   # Event creator pages
│   │   │   ├── Student/   # Student pages
│   │   │   └── TeamLead/  # Team lead pages
│   │   └── types/         # TypeScript type definitions
│   └── package.json
└── README.md
```

## User Roles & Features

### 1. **Admin**
- Approve/suspend users
- View all events and statistics
- Manage system-wide settings

### 2. **Event Creator**
- Create and manage events
- Create sub-events
- Assign team leads
- Track budgets and expenses

### 3. **Team Lead**
- Manage assigned sub-events
- Coordinate volunteers
- Update sub-event schedules

### 4. **Student**
- Browse and register for events
- View registered events
- Apply for volunteer positions

## API Endpoints

### Authentication
- `POST /api/v1/auth/register.php` - User registration
- `POST /api/v1/auth/login.php` - User login
- `POST /api/v1/auth/logout.php` - User logout
- `GET /api/v1/auth/me.php` - Get current user

### Events
- `GET /api/v1/events/index.php` - List all events
- `GET /api/v1/events/index.php?mine=true` - Get creator's events
- `POST /api/v1/events/index.php` - Create event

### Users (Admin only)
- `GET /api/v1/users/index.php` - List all users
- `POST /api/v1/users/approve.php` - Approve user
- `POST /api/v1/users/suspend.php` - Suspend/reactivate user

### Notifications
- `GET /api/v1/notifications/index.php` - Get user notifications
- `POST /api/v1/notifications/index.php` - Mark as read

## Troubleshooting

### Port Already in Use
If you see `Port 5173 is in use`, Vite will automatically try the next port (5174, 5175, etc.). Check the terminal output for the actual URL.

### CORS Errors
Ensure `api/config/cors.php` has the correct frontend URL:
```php
header("Access-Control-Allow-Origin: http://localhost:5173");
```

### Database Connection Failed
1. Verify MySQL is running in XAMPP
2. Check database credentials in `api/config/db.php`
3. Ensure the database `eventrax_db` exists

### Blank Admin Users Page
Run the database migrations to ensure the `status` and `last_login` columns exist in the `users` table.

## Development

### Building for Production

```powershell
cd app
npm run build
```

The production files will be in `app/dist/`.

### Running Tests

```powershell
cd app
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ for educational institutions**
