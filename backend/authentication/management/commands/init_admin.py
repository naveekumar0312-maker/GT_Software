from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from authentication.models import UserProfile

class Command(BaseCommand):
    help = 'Ensures initial admin account exists idempotently'

    def handle(self, *args, **options):
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@crm.local',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Administrator',
            }
        )
        if created:
            admin_user.set_password('admin@123')
            admin_user.save()
            profile, _ = UserProfile.objects.get_or_create(user=admin_user)
            profile.must_change_password = True
            profile.save()
            self.stdout.write(self.style.SUCCESS("Admin account 'admin' created successfully."))
        else:
            profile, _ = UserProfile.objects.get_or_create(user=admin_user)
            self.stdout.write(self.style.SUCCESS("Admin account 'admin' already exists."))

