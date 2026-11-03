from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    must_change_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'must_change_password']

    def get_must_change_password(self, obj):
        if hasattr(obj, 'crm_profile'):
            return obj.crm_profile.must_change_password
        return False


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, trim_whitespace=True)
    password = serializers.CharField(required=True, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)
    confirm_password = serializers.CharField(required=True, min_length=6, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({"new_password": "New password cannot be the same as current password."})
        return data

