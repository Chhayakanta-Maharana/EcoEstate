from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        try:
            from api.socket_listener import start_iot_socket_listeners
            start_iot_socket_listeners()
        except Exception as e:
            print(f"[ApiConfig] Failed to start socket listeners: {e}")
