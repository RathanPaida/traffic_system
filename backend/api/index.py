import os
from django.core.wsgi import get_wsgi_application

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "traffic_project.settings")

# Vercel looks for an `app` variable by default
app = get_wsgi_application()
