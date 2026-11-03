from rest_framework import permissions

class MustNotRequirePasswordChange(permissions.BasePermission):
    """
    Permission check that ensures the authenticated user does not have
    a pending mandatory password change before accessing business CRM data.
    """
    message = "Password change required before accessing CRM records."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check UserProfile must_change_password
        if hasattr(request.user, 'crm_profile'):
            if request.user.crm_profile.must_change_password:
                return False

        return True

