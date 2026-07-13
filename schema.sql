USE JobAppDb;
GO

DROP TABLE IF EXISTS ApplicationInteractions;
DROP TABLE IF EXISTS ApplicationDetails;
DROP TABLE IF EXISTS Applications;
DROP TABLE IF EXISTS Users;
GO

CREATE TABLE Applications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Position NVARCHAR(100) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    Mobile NVARCHAR(20) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Raw',
    AdminNotes NVARCHAR(MAX),
    SubmittedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ApplicationDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationId INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Applications(Id) ON DELETE CASCADE,
    LocationData NVARCHAR(MAX),
    ExperienceData NVARCHAR(MAX),
    TextResponses NVARCHAR(MAX)
);

-- Stage 2: Authentication
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MobileNumber NVARCHAR(20) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsAdmin BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Stage 4: Admin Interactions
CREATE TABLE ApplicationInteractions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationId INT NOT NULL FOREIGN KEY REFERENCES Applications(Id) ON DELETE CASCADE,
    AdminId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    OldStatus NVARCHAR(50) NOT NULL,
    NewStatus NVARCHAR(50) NOT NULL,
    ChangedAt DATETIME DEFAULT GETDATE()
);
GO
