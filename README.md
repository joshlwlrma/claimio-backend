# Claimio: A Secure Multi-Tier Web-Based Lost and Found System with Google OAuth Authentication and SMS Notification Integration for Academic Institutions

**Live Hosting Link (AWS):** [https://claimio.ddnsking.com/]
**Repository Link:** [https://github.com/joshlwlrma/claimio-backend]
## Group Members
* Ashley, Avanica
* Fangonilo, Josh Michael
* Martinez, Alexandra Pauline
* Roxas, John Ivan
* Supan, Katherine

## Tech Stack
* **Backend:** Laravel 11, PHP 8.2, MySQL (AWS RDS)
* **Frontend:** React.js, Tailwind CSS
* **Dependencies:** Defined in `composer.json` (Backend) and `package.json` (Frontend).

## Prerequisites
* **PHP:** 8.2 or higher
* **Composer**
* **Node.js:** 18 or higher & npm
* **Database:** MySQL

## Steps to Install and Run Locally

### 1. Clone the Repository
\`\`\`
* git clone https://github.com/joshlwlrma/claimio-backend
* cd claimio
\`\`\`

### 2. Backend Setup (Laravel)
\`\`\`
# Install PHP dependencies
composer install

# Copy environment file and set up keys
* cp .env.example .env
* php artisan key:generate

# IMPORTANT: Edit your .env file and add your credentials:
## Note that the .env file is not included for security reasons. So to fully experience the website, it is recommended to use the live hosting link.
### - DB_DATABASE, DB_USERNAME, DB_PASSWORD
### - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
### - UNISMS_API_KEY


# Run database migrations
php artisan migrate
\`\`\`

### 3. Frontend Setup (React)
\`\`\`
* cd claimio-frontend
* npm install
* npm run dev
\`\`\`

### 4. Start the Application
Open a new terminal in the root folder and run:
\`\`\`
* php artisan serve
# The Backend will be running on http://localhost:8000
# The Frontend will be running on http://localhost:5173
\`\`\`