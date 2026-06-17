# Claimio Information Assurance Documentation

## 3. Information Assurance Overview
Information Assurance (IA) in the Claimio system is embedded deeply within its multi-tier architecture, spanning the React frontend and Laravel 12 backend. The system employs a defense-in-depth strategy, integrating access control, rate limiting, and data validation at multiple layers. While currently deployed in a local environment (`http://localhost`), the architecture utilizes environment parameterization (via `.env`) to seamlessly transition to production-grade security measures such as HTTPS and encrypted databases.

## 4. Information Assurance Requirements

**Confidentiality:** Confidentiality is achieved by restricting system access strictly to authorized users and protecting sensitive data from unauthorized disclosure. Access is restricted at the authentication layer by enforcing a domain-specific policy (`@tip.edu.ph`) within `app/Http/Controllers/GoogleAuthController.php` (Lines 54-61), preventing external users from accessing the system. Furthermore, sensitive images previously obscured via CSS are now protected by backend access controls. As seen in `app/Http/Controllers/ReportImageController.php` (Lines 36-62), image requests are validated against user authorization (admin, owner, or approved claimant), ensuring unauthorized actors cannot bypass UI obfuscation to view protected assets. Unauthenticated API responses via `app/Http/Resources/PublicReportResource.php` strictly censor sensitive identifiers (e.g., `name_on_item`, returning 'PROTECTED' for image URLs) to maintain confidentiality during public browsing.

**Integrity:** The integrity of the system and its data is maintained through rigorous backend validation and the use of the Eloquent ORM to prevent injection attacks and enforce data relationships. The `app/Http/Controllers/ClaimController.php` requires a mandatory `decision_notes` parameter (Line 159) for claim approvals or rejections, ensuring that administrative decisions are justified and auditable. Furthermore, the `app/Models/ActivityLog.php` model defines `const UPDATED_AT = null;` (Line 19) to create an immutable audit trail of critical actions, ensuring that historical records cannot be tampered with after creation.

**Availability:** Availability is safeguarded against denial-of-service (DoS) attempts through API rate limiting implemented via Laravel's built-in throttle middleware. In `routes/api.php`, public-facing and resource-intensive endpoints are explicitly protected: the Google OAuth redirect is limited by `throttle:5,1` (Line 19), claim submissions by `throttle:5,1` (Line 62), and report creations by `throttle:10,1` (Line 51). These restrictions ensure the application remains responsive to legitimate users by mitigating automated abuse.

**Authentication:** Authentication is implemented securely using stateless Google OAuth via Laravel Socialite, combined with Laravel Sanctum for API token management. As seen in `app/Http/Controllers/GoogleAuthController.php`, the system authenticates users via their Google ID and issues a Sanctum token (`claimio-auth-token`) for subsequent requests (Lines 105-106). To elevate security for privileged operations, a Multi-Factor Authentication (MFA) step requires a 6-digit Admin PIN. This is enforced in `GoogleAuthController.php` (Lines 118-141) and the `AdminVerify.jsx` React component, where administrators must exchange a temporary token for a full access token using a PIN defined in the `.env` file (`ADMIN_PIN`).

## 5. Risk Assessment and Management

The recent security patches mitigate primary risks modeled under the STRIDE framework:

*   **Spoofing (Admin MFA PIN):** Mitigated by the 6-digit Admin PIN. Attackers who might compromise an admin's Google account cannot access the admin dashboard without the secondary PIN (`GoogleAuthController.php`, `AdminVerify.jsx`).
*   **Tampering (Mandatory Decision Notes):** Mitigated by requiring `decision_notes` (`ClaimController.php`, Line 159). Malicious or accidental approval of claims without documented justification is prevented, ensuring decision integrity.
*   **Repudiation (Domain Restriction & Activity Logs):** Mitigated by restricting access to the `@tip.edu.ph` domain (`GoogleAuthController.php`) and recording immutable actions in `activity_logs`. Users cannot deny actions they performed while authenticated under their institutional email.
*   **Information Disclosure (CSS Blur Fix & Sanctum Middleware):** Mitigated by enforcing server-side image delivery (`ReportImageController.php`) and moving the Public Claims Endpoint into the `auth:sanctum` middleware group (`routes/api.php`, Line 60). This prevents attackers from directly requesting image URLs or enumerating claims without valid authorization.
*   **Denial of Service (API Rate Limiting):** Mitigated by the `throttle` middleware (`routes/api.php`). Automated scripts cannot flood the authentication, report creation, or claim submission endpoints, protecting server resources.
*   **Elevation of Privilege (Middleware & Claim Guards):** Mitigated by strict middleware (`EnsureUserIsAdmin.php`) and guards in `ClaimController.php` (e.g., preventing users from claiming their own reports or claiming archived reports).

## 6. Information Assurance Implementation

**Integration with System Architecture:** Security is enforced across all tiers. The React frontend handles user-facing validation and conditional rendering based on authentication state (`ProtectedRoute.jsx`, `AuthContext.jsx`). The Laravel backend acts as the primary enforcement point, validating all incoming requests via controllers and middleware (`routes/api.php`). The MySQL database stores immutable audit trails (`activity_logs` table) and relies on Eloquent ORM to prevent SQL injection.

**Encryption:** The application is currently deployed in a local development environment (`http://localhost:8000` and `http://localhost:5173` as per `.env`). Consequently, traffic is transmitted over unencrypted HTTP, and database-level encryption is not active. However, the system securely hashes passwords (`BCRYPT_ROUNDS=12` in `.env`) and utilizes securely generated Sanctum tokens for session management (`personal_access_tokens` table), preparing the architecture for production HTTPS deployment.

**Firewalls:** While traditional network firewalls operate at the infrastructure level, application-level defense is provided by CORS configuration and rate limiting. The `config/cors.php` file restricts cross-origin requests to the defined `FRONTEND_URL` (`http://localhost:5173`), preventing unauthorized domains from interacting with the API. The `throttle` middleware acts as an application-layer firewall against volumetric abuse.

**Intrusion Detection Systems:** Although enterprise IDS solutions like AWS GuardDuty are not present in the local deployment, the system employs an application-level forensic tracking mechanism via `app/Models/ActivityLog.php`. Critical actions (report submission, updates, deletions, and claim decisions) are logged immutably, providing administrators with an audit trail to detect and investigate anomalous behavior.

**Access Control Mechanisms:** Access control is multi-layered:
1.  **Domain Restriction:** OAuth logins are restricted to `@tip.edu.ph` (`GoogleAuthController.php`).
2.  **Authentication Middleware:** API routes are protected by the `auth:sanctum` middleware (`routes/api.php`).
3.  **Role-Based Access Control (RBAC):** Admin routes are protected by the `EnsureUserIsAdmin` middleware (`routes/api.php`, Line 72).
4.  **Multi-Factor Authentication:** Admins must verify via a 6-digit PIN (`GoogleAuthController.php`).
5.  **Resource-Level Control:** Image access is verified against ownership and claim status (`ReportImageController.php`).

## 7. Security Testing and Evaluation

**Vulnerability Assessments:**
*   **Gap Identified:** Brute-force and DoS vulnerabilities on authentication and submission endpoints.
    *   **Fix Implemented:** Added `throttle:5,1` and `10,1` to `routes/api.php` for Google OAuth redirect, claim submissions, and report creation.
*   **Gap Identified:** Claims endpoint exposed to unauthenticated enumeration.
    *   **Fix Implemented:** Moved `/reports/{report}/claims` inside the `auth:sanctum` middleware group in `routes/api.php` (Line 60).
*   **Gap Identified:** Unaccountable administrative claim approvals.
    *   **Fix Implemented:** Added mandatory `decision_notes` validation (`'required|string|min:10'`) in `app/Http/Controllers/ClaimController.php` (Line 159).
*   **Gap Identified:** Sensitive images accessible via direct URL despite UI CSS blur.
    *   **Fix Implemented:** Created `app/Http/Controllers/ReportImageController.php` to restrict image delivery at the backend, replacing direct storage URLs with the protected `/reports/{report}/image/{image}` endpoint.
*   **Gap Identified:** Admin accounts vulnerable to single-factor compromise.
    *   **Fix Implemented:** Implemented a 6-digit Admin PIN MFA step utilizing temporary Sanctum tokens with the `admin:verify` ability in `app/Http/Controllers/GoogleAuthController.php` (Lines 94-102, 114-142).

**Penetration Testing:** Simulated volumetric DoS attacks against the login and submission endpoints are now mitigated by the HTTP 429 Too Many Requests responses generated by the new `throttle` middleware in `routes/api.php`. Insecure Direct Object Reference (IDOR) attempts to access sensitive images or enumerate claims of other users are blocked by the `auth:sanctum` middleware and the ownership/claim validation checks implemented in `ReportImageController.php` and `ClaimController.php`.

## 8. Conclusion & Future Work

Claimio possesses a robust security architecture that effectively leverages Laravel's built-in protections and custom middleware to ensure confidentiality, integrity, and availability. The system relies on stateless Sanctum tokens, strict OAuth domain restrictions, and resource-level authorization to protect user data. 

**Future Work:** 
For future production deployment, we recommend the following enhancements:
1.  **Server-Side Image Processing:** Implement Intervention Image to securely process, resize, and permanently watermark/blur sensitive images on the server before storage, rather than relying solely on access controls for raw uploads.
2.  **Database-Level Encryption:** Implement At-Rest Encryption for sensitive database columns (e.g., PII in the `users` table or contact information in the `reports` table) to protect data in the event of a database dump compromise.
3.  **Production Infrastructure Security:** Enforce mandatory HTTPS via TLS certificates and configure robust infrastructure-level firewalls (e.g., AWS WAF) to complement the application-level rate limiting.
