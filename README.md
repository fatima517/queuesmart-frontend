# QueueSmart

QueueSmart is a smart queue management application. Users can register, log in, join queues, view their queue status, and receive notifications. Administrators can manage services, manage queues, serve customers, and generate reports.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MySQL
- Testing: Jest, Supertest
- PDF Reports: PDFKit

## Setup

Install backend dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
DB_HOST=localhost
DB_USER=queuesmart_user
DB_PASSWORD=qs12345
DB_NAME=queuesmart
```

Set up the MySQL database by running:

```text
backend/src/database/schema.sql
```

Then start the backend:

```bash
npm start
```

Open the frontend login page:

```text
frontend/pages/auth/login.html
```

## Main Features

- User registration and login
- Join and leave queues
- View queue position and estimated wait time
- Notifications
- Admin dashboard
- Service management
- Queue management
- Report generation
- PDF and CSV export

## Admin Reports

Admins can open the Reports page to preview queue activity and export reports as PDF or CSV. Reports include customer queue history, service details, queue status, queue position, join time, and summary statistics.

## Demo Admin Login

```text
Email: admin@example.com
Password: admin123
```

The admin role in the database should be `administrator`.

## Testing

Run backend tests from the `backend` folder:

```bash
npm test
```
