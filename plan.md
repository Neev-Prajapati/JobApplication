# Job Application Website - Stage 1

Build a professional job application form inspired by the provided reference URL and connect it to an MS SQL backend. The admin dashboard for tracking applicants through stages (Raw, Meeting Appointed, etc.) will be addressed in future stages.

## Overview

The tech stack is finalized: **React (Frontend)**, **C# ASP.NET Core (Backend API)**, and **MS SQL (Database)**. 

## Open Questions

1. **Database Credentials:** Do you have an existing MS SQL server setup that we should use for the connection string?
2. **Design:** Do you have specific brand colors or a logo you want included, or should we create a premium, modern design from scratch using the reference layout?

## Proposed Changes

### 1. Frontend: React Application
- Initialize a new React project using Vite in a folder (e.g., `JobAppFrontend`).
- Implement the job application form matching the fields from the reference:
  - Position Selection
  - Name, Mobile, Email
  - Location Details (State, City)
  - Work Experience & Employment Status
  - Current/Last Employer & Salary Details
  - Joining Date
  - Subjective questions
- Style using Vanilla CSS with modern, rich aesthetics (clean typography, subtle gradients, and micro-animations) to ensure a premium look.
- Use `fetch` or `axios` to submit the form data to the C# backend.

### 2. Backend: C# ASP.NET Core Web API
- Create a new ASP.NET Core Web API project in a folder (e.g., `JobAppBackend`).
- Implement a controller (e.g., `ApplicationController`) with a `POST` endpoint to receive application data.
- Use ADO.NET or Entity Framework Core to connect to the MS SQL Database.
- Map the incoming request to the database columns, setting the `Status` column to `'Raw'` by default.
- Enable CORS in the C# API so the React frontend can communicate with it.

### 3. Database: MS SQL
- Create a `schema.sql` file containing the `CREATE TABLE` statement for the `Applications` table, including all necessary form fields and the `Status` tracking column.

## Verification Plan

### Manual Verification
- Start the C# API backend locally.
- Start the React frontend locally.
- Open the React application in the browser to ensure the UI looks professional, modern, and responsive.
- Submit a test application and verify via logs or database query that the data successfully inserts into the MS SQL database.

---

# Job Application Website - Stage 2: Authentication

Implement a secure authentication system allowing users to sign up and log in using only their **Mobile Number** and **Password**. 

## Open Questions

1. **Routing / Flow**: Since we are adding multiple pages (Login, Signup, and the existing Application Form), I will install `react-router-dom` in the frontend to handle navigation. After a user successfully logs in or signs up, should they be immediately redirected to the Job Application form we built in Stage 1?
2. **Access Control**: Should the Job Application form now be *locked* so that only logged-in users can view and submit it?
3. **Password Rules**: Do you want any specific rules for the password (e.g., minimum 8 characters), or keep it simple for now?

## Proposed Changes

### 1. Frontend: React Application (Login & Signup)
- Install `react-router-dom` to manage multiple pages (`/login`, `/signup`, `/apply`).
- Create a **Signup Page**: Fields for Mobile Number and Password, with password confirmation.
- Create a **Login Page**: Fields for Mobile Number and Password.
- Implement sleek, minimalist styling (dark mode compatible) to match the existing application form.
- Save the authentication token received from the backend into `localStorage` to keep the user logged in.

### 2. Backend: C# ASP.NET Core API
- Add a `Users` table to the MS SQL database to store `Id`, `MobileNumber`, and `PasswordHash`.
- Install JWT authentication packages (`Microsoft.AspNetCore.Authentication.JwtBearer`).
- Create an `AuthController` with two endpoints:
  - `POST /api/auth/register`: Hashes the password using `BCrypt.Net-Next` and saves the user.
  - `POST /api/auth/login`: Verifies the password and returns a JWT token.
- Secure the `ApplicationController` so that only authenticated requests can submit job applications (if required by your answer to Question 2).

### 3. Database: MS SQL
- Provide a new SQL script to create the `Users` table in the database.

## Verification Plan
- Attempt to register a new account with a mobile number and password in the browser.
- Log in with those credentials and verify the UI transitions smoothly.
