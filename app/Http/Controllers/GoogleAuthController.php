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
            return response()->json([
                'error' => 'Unauthorized email domain.',
                'message' => "Only @{$allowedDomain} email addresses are allowed to sign in.",
            ], 403);
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

        // Step 4: Revoke any old tokens, then generate a fresh Sanctum token
        $user->tokens()->delete();
        $token = $user->createToken('claimio-auth-token')->plainTextToken;

        // Step 5: Redirect to the frontend with token in the URL
        $frontendUrl = env('FRONTEND_URL', '/demo.html');
        $query = http_build_query([
            'token' => $token,
            'name' => $user->name,
        ]);

        return redirect($frontendUrl . '?' . $query);
    }
}
