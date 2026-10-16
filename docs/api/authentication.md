> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: implemented; acceptance in progress

# Authentication

Web uses Supabase SSR cookies. Native clients send `Authorization: Bearer <access_token>`; the server calls Supabase `getUser(token)` rather than trusting decoded claims. Each request checks the active profile and current database permissions. Cookie mutations require the same origin. Bearer requests do not depend on browser cookies.

Use the Supabase client SDK to sign up, sign in, refresh sessions and sign out. Never bundle a secret/service-role key in a browser or mobile application. The callback accepts only same-origin relative redirects, including rejecting backslash redirects. Disabled users are denied even if a token remains otherwise valid.

The first owner must be an explicitly selected, confirmed account: follow [local setup](../operations/local-development.md). The selected real owner has now been granted access. No default administrator exists. Mocked boundary tests and real owner/customer desktop/mobile-browser login, permission and sign-out checks pass. Six live bearer/session checks passed: cookie-independent identity, refresh, tampered signature rejection, current-role revocation, disabled-account blocking and global-sign-out refresh rejection. Natural expiry, complete role matrix and all-device browser acceptance remain pending. Issued access JWTs can remain valid until expiry; authorization checks use current profile/permissions.

