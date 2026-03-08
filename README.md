# InternHub — React Frontend

A complete React frontend for the InternshipManagement.Api .NET backend.

## Project Structure

```
src/
├── api/
│   └── api.js              # All API calls (auth, internships, applications, users)
├── components/
│   └── ProtectedRoute.jsx  # Role-based route guard
├── context/
│   └── AuthContext.jsx     # JWT auth state management
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── student/
│   │   └── StudentDashboard.jsx
│   └── admin/
│       └── AdminDashboard.jsx
└── styles/
    ├── auth.css
    ├── dashboard.css
    └── admin.css
```

## Setup & Run

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## ⚠️ Important: Set your API base URL

In `src/api/api.js`, change the `BASE_URL` to match your .NET API:

```js
// Development (HTTP)
const BASE_URL = "http://localhost:5000/api";

// Development (HTTPS)
const BASE_URL = "https://localhost:7000/api";
```

Check your `launchSettings.json` for the exact port.

## Features

### Student
- Register / Login with JWT
- Browse internships with search + pagination
- Apply to internships (duplicate prevention handled by API)
- View "My Applications" with live status badges (Pending / Approved / Rejected)
- View profile with application stats dashboard
- Edit profile (name, email)

### Admin
- View all applications across all students
- Filter by status (All / Pending / Approved / Rejected)
- Approve / Reject / Reset to Pending with one click
- Stats overview at top

## Routes

| Route | Access |
|-------|--------|
| `/login` | Public |
| `/register` | Public |
| `/dashboard` | Student only |
| `/admin` | Admin only |

## API Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/register | Register |
| POST | /auth/login | Login → JWT |
| GET | /internships | Browse (search + pagination) |
| POST | /applications/{id} | Apply to internship |
| GET | /applications/my | My applications |
| GET | /applications | All applications (Admin) |
| PUT | /applications/{id}/status | Update status (Admin) |
| GET | /users/me | Get profile |
| PUT | /users/me | Update profile |
| GET | /users/me/stats | Application stats |
