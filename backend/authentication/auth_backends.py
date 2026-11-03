from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication without Django DRF's CSRF enforcement.
    Because our React frontend runs on localhost:5173 (port origin separation)
    and uses CORS with credentials + strict Django CORS origin whitelist,
    this allows seamless REST API calls using session cookies.
    """
    def enforce_csrf(self, request):
        return

