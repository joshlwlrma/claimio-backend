<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Laravel\Socialite\Facades\Socialite;

/**
 * GoogleAuthController
 *
 * Handles Google OAuth2 authentication flow for the Claimio SPA.
 * Uses Socialite in stateless mode (no sessions) and issues
 * Sanctum API tokens for subsequent authenticated requests.
 */
class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth consent screen.
     *
     * Socialite's stateless() method is used because this is
     * a token-based API — no server-side session is maintained.
     */
    public function redirect()
    {
        // Redirect to Google OAuth consent page (stateless = no session)
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle the callback from Google after the user grants consent.
     *
     * Steps:
     * 1. Retrieve user info from Google via Socialite
     * 2. Validate email domain against ALLOWED_EMAIL_DOMAIN (.env)
     * 3. Find or create the user in the local database
     * 4. Issue a Sanctum API token
     * 5. Return the token + user data as JSON
     */
    public function callback()
    {
        try {
            // Step 1: Get the authenticated Google user (stateless mode)
            $googleUser = Socialite::driver('google')->stateless()->user();
        }
        catch (\Exception $e) {
            // If the OAuth flow fails (e.g. user denied access, invalid code)
            return response()->json([
                'error' => 'Google authentication failed.',
                'message' => $e->getMessage(),
            ], 401);
        }

        // Step 2: Domain restriction — only allow emails from the configured domain
        $allowedDomain = env('ALLOWED_EMAIL_DOMAIN', 'tip.edu.ph');
        $emailDomain = substr(strrchr($googleUser->getEmail(), '@'), 1);

        if (strtolower($emailDomain) !== strtolower($allowedDomain)) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect($frontendUrl . '/login?error=invalid_domain');
        }

        // Step 3: Find existing user by google_id, or by email, or create new
        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            // Check if a user with this email already exists (e.g. manually created)
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Link existing account to Google
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }
            else {
                // Create a brand-new user from Google profile
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'role' => 'student', // Default role for new users
                ]);
            }
        }

        // Step 4: Revoke any old tokens
        $user->tokens()->delete();

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        if ($user->role === 'admin') {
            // Admin users get a temporary token and are redirected to the PIN entry screen
            $tempToken = $user->createToken('admin-verify', ['admin:verify'], now()->addMinutes(5))->plainTextToken;
            $query = http_build_query([
                'status' => 'admin_verification_required',
                'temp_token' => $tempToken,
            ]);
            return redirect($frontendUrl . '?' . $query);
        }

        // Student users get their full token immediately
        $token = $user->createToken('claimio-auth-token')->plainTextToken;
        $query = http_build_query([
            'token' => $token,
            'name' => $user->name,
        ]);

        return redirect($frontendUrl . '?' . $query);
    }

    /**
     * Secondary verification step for admin users.
     * Validates a 6-digit PIN and exchanges the temporary token for a full token.
     */
    public function verifyAdmin(\Illuminate\Http\Request $request)
    {
        $request->validate(['pin' => 'required|string|size:6']);

        $user = $request->user();

        // Ensure they are authenticated with an admin-verify token
        if (!$user || !$user->currentAccessToken()->can('admin:verify')) {
            return response()->json(['message' => 'Invalid or expired temporary token.'], 401);
        }

        if ($request->pin !== env('ADMIN_PIN')) {
            return response()->json(['message' => 'Invalid PIN.'], 403);
        }

        // Verification successful: revoke temp token and issue full token
        $user->currentAccessToken()->delete();
        $token = $user->createToken('claimio-auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user
        ]);
    }
}
