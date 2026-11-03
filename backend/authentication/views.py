from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import AnonRateThrottle

from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer
from .models import UserProfile

class LoginRateThrottle(AnonRateThrottle):
    rate = '5/min'


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates user and starts a secure Django session.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Invalid login details provided.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"success": False, "message": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"success": False, "message": "This account is inactive. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Login and establish session
        login(request, user)

        # Ensure user profile exists
        profile, _ = UserProfile.objects.get_or_create(user=user)

        user_data = UserSerializer(user).data

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "user": user_data
            },
            status=status.HTTP_200_OK
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logs out the user and flushes the session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(
            {"success": True, "message": "Logged out successfully."},
            status=status.HTTP_200_OK
        )


@method_decorator(ensure_csrf_cookie, name='dispatch')
class MeView(APIView):
    """
    GET /api/auth/me/
    Returns currently authenticated user information with HTTP 200.
    If unauthenticated, returns 200 {"authenticated": False, "user": None}
    so browsers and console will never show a red 401 error on initial visit.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"authenticated": False, "user": None},
                status=status.HTTP_200_OK
            )

        # Ensure profile exists
        if hasattr(request.user, 'crm_profile'):
            profile = request.user.crm_profile
        else:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)

        return Response(
            {
                "authenticated": True,
                "user": UserSerializer(request.user).data
            },
            status=status.HTTP_200_OK
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Changes current user password and clears must_change_password flag.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response(
                {"success": False, "message": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        # Update profile flag
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.must_change_password = False
        profile.save()

        # Update session auth hash to maintain active session seamlessly
        update_session_auth_hash(request, user)

        return Response(
            {
                "success": True,
                "message": "Password changed successfully.",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_200_OK
        )
