CREATE DATABASE JobAppDb;
GO

USE JobAppDb;
GO

CREATE TABLE Applications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Position NVARCHAR(100) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    Mobile NVARCHAR(20) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    FromState NVARCHAR(100),
    FromCity NVARCHAR(100),
    BasedState NVARCHAR(100),
    BasedCity NVARCHAR(100),
    WorkExperienceYears INT NOT NULL,
    WorkExperienceMonths INT NOT NULL,
    IsCurrentlyEmployed BIT NOT NULL,
    Employer NVARCHAR(200),
    Salary DECIMAL(18,2),
    ExpectedSalary DECIMAL(18,2),
    JoiningDate DATE NOT NULL,
    RecentLearning NVARCHAR(MAX),
    WhyHireYou NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'Raw',
    SubmittedAt DATETIME DEFAULT GETDATE()
);

-- Stage 2: Authentication
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MobileNumber NVARCHAR(20) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO
