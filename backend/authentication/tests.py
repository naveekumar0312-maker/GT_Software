from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from authentication.models import UserProfile

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='admin',
            password='admin@123',
            email='admin@crm.local'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            must_change_password=True
        )

    def test_unauthenticated_me(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('authenticated'))
        self.assertIsNone(response.data.get('user'))

    def test_unauthenticated_protected_api(self):
        response = self.client.get('/api/first-reports/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data.get('success'))

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin@123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data['user']['username'], 'admin')
        self.assertTrue(response.data['user']['must_change_password'])

        # Now me endpoint should return user
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(me_resp.data['authenticated'])

        # Protected API should now be accessible
        rep_resp = self.client.get('/api/first-reports/')
        self.assertEqual(rep_resp.status_code, status.HTTP_200_OK)

    def test_change_password(self):
        self.client.login(username='admin', password='admin@123')
        
        # Test wrong current password
        resp = self.client.post('/api/auth/change-password/', {
            'current_password': 'wrong',
            'new_password': 'NewPassword@2026',
            'confirm_password': 'NewPassword@2026'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Test valid change password
        resp = self.client.post('/api/auth/change-password/', {
            'current_password': 'admin@123',
            'new_password': 'NewPassword@2026',
            'confirm_password': 'NewPassword@2026'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(resp.data['user']['must_change_password'])

        # Check DB user password updated
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPassword@2026'))
        self.assertFalse(self.user.crm_profile.must_change_password)

    def test_logout(self):
        self.client.login(username='admin', password='admin@123')
        resp = self.client.post('/api/auth/logout/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # After logout, me should be 200 with authenticated=False
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(me_resp.data.get('authenticated'))
