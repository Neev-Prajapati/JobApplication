# Architecture & Concepts Explanation

This document serves as a reference for the key technologies and concepts used to build the Job Application Website. 

## 1. Authentication & Security (Stage 2)

We implemented a secure authentication system using industry-standard practices. Here is a breakdown of how it works.

### What is JWT (JSON Web Token)?

**JWT** is an open standard used to securely transmit information between parties as a JSON object. We use it to keep users logged in.

**How it works in our app:**
1. **Login:** When a user enters their mobile number and password on the React frontend, it sends a `POST` request to the C# Backend.
2. **Verification:** The backend verifies the password. If correct, the C# server generates a JWT.
3. **The Token:** The JWT contains a "payload" (like the user's mobile number) and an expiration date. Most importantly, it is **cryptographically signed** using a secret key (stored in `appsettings.json`). This signature ensures that the token cannot be altered or forged by a hacker.
4. **Storage:** The backend sends the token to the frontend. The React frontend stores this token in the browser's `localStorage`.
5. **Subsequent Requests:** Whenever the frontend wants to submit a job application, it attaches this JWT to the HTTP `Authorization` header.
6. **Validation:** The C# backend intercepts the request, looks for the token, and verifies the signature. If valid, the request is allowed through via the `[Authorize]` attribute.

*Analogy:* Think of a JWT as a digital VIP wristband at a concert. The backend checks your ID (password) once, hands you the wristband (JWT), and from then on, the bouncers at the door just check for the wristband instead of asking for your ID every time.

### What is BCrypt (Password Hashing)?

**BCrypt** is a password-hashing function designed to securely store passwords.

**Why we use it:**
If a database is ever compromised, storing passwords in plain text is extremely dangerous. BCrypt takes the user's password (e.g., `P@ssw0rd123`) and runs it through a one-way mathematical algorithm to produce a "hash" (e.g., `$2a$11$eO5WzO...`). 

- **One-way:** You cannot reverse a hash to figure out the original password.
- **Salting:** BCrypt automatically adds random data (a "salt") to every password before hashing it. This means even if two users have the same password, their hashes will look completely different in the database.
- **Verification:** When a user logs in, BCrypt takes the password they typed, hashes it again using the same rules, and checks if it matches the hash saved in the database.

### `localStorage` vs Cookies

We chose to store the JWT in the browser's `localStorage`. 
- **Pros:** It's very easy to implement, persists even if the user refreshes or closes the browser tab, and works perfectly for Single Page Applications (SPAs) like React making API calls.
- **Cons:** It can be susceptible to Cross-Site Scripting (XSS) attacks if the frontend code is compromised. (For banking apps, `HttpOnly` cookies are often preferred, but `localStorage` is standard for general web apps).

## 2. Frontend Architecture (React + Vite)

- **Vite:** We use Vite as the build tool instead of Create React App because it is significantly faster and provides instant hot module replacement (HMR).
- **Component State:** React uses `useState` to manage the form data. As the user types, the state updates in real-time.
- **Modal Overlay:** Instead of routing the user away from the application form when they need to log in (which would cause them to lose all the data they just typed), we implemented a CSS modal. This overlay sits on top of the DOM, allowing them to authenticate seamlessly and return exactly where they left off.

## 3. Backend Architecture (C# ASP.NET Core API)

- **Controllers:** We use an MVC (Model-View-Controller) pattern. The `Controllers` act as the entry points for the React app. `ApplicationController.cs` handles job submissions, and `AuthController.cs` handles login/registration.
- **ADO.NET:** Instead of a heavy ORM like Entity Framework, we used raw ADO.NET (`SqlConnection`, `SqlCommand`). This gives us ultimate performance and explicit control over the SQL queries being executed.
- **Parameterization:** All SQL queries use parameters (e.g., `@Mobile`). This strictly separates the SQL code from the user's input, completely preventing **SQL Injection** attacks.

## 4. Database (MS SQL)

We are using a relational MS SQL database with two core tables:
- **Applications:** Stores the subjective and objective data of the job applicant. It includes a `Status` column (defaulting to 'Raw') which will be vital for Stage 3 (The Admin Dashboard).
- **Users:** Stores the authentication credentials, specifically relying on `MobileNumber` as a UNIQUE identifier.
