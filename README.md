# Job Application Platform

A full-stack, modern web application for managing job applications. The system features a responsive React frontend, a robust C# ASP.NET Core backend, and a secure MS SQL database, built with a focus on premium aesthetics and security.

## Technologies Used

- **Frontend:** React (Vite), Vanilla CSS (Dark Mode supported)
- **Backend:** C# ASP.NET Core Web API
- **Database:** Microsoft SQL Server
- **Security:** JWT (JSON Web Tokens) for authentication, BCrypt for password hashing

## Architecture Overview

- **Authentication:** Users must securely log in or sign up using their mobile number and a password to submit a job application. The backend hashes the password using BCrypt. Upon successful login, the backend issues a JWT, which the frontend stores in `localStorage`.
- **Form Submission:** The job application form uses the `[Authorize]` attribute on the C# backend to ensure that only authenticated users with a valid JWT can submit data.
- **Database:** Raw ADO.NET parameterization is used to communicate with the MS SQL Database, preventing SQL injection attacks and maximizing performance.

*(For a deeper dive into how the authentication and architecture work, please see the [Architecture_Explanation.md](./Architecture_Explanation.md) file).*

## Local Setup Instructions

Follow these steps to run the project locally on your machine.

### 1. Database Setup (MS SQL)
1. Ensure you have **SQL Server Express** and **SQL Server Management Studio (SSMS)** installed.
2. Open SSMS and connect to your local server (usually `localhost\SQLEXPRESS`).
3. Open the `schema.sql` file located in the root of this repository.
4. Execute the script in SSMS to automatically create the `JobAppDb` database and the required `Applications` and `Users` tables.

### 2. Backend Setup (C# API)
1. Open a terminal and navigate to the `JobAppBackend` folder.
2. Ensure you have the .NET SDK installed (v10+).
3. Run the following command to start the server:
   ```bash
   dotnet run
   ```
4. The backend will typically start on port `5086` (or similar). Leave this terminal open.

### 3. Frontend Setup (React)
1. Open a *new* terminal window and navigate to the `JobAppFrontend` folder.
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to `http://localhost:5173` to view the application!

## Current Stages Completed
- **Stage 1:** Frontend form design and Backend database connection.
- **Stage 2:** Secure Authentication (Login/Signup Modal, JWT, BCrypt).
- **Stage 3:** Admin Dashboard (Coming soon).
