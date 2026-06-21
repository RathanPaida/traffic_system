from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.predict_traffic),
    path('route/', views.calculate_dynamic_route),
    path('heatmap/', views.get_heatmap_data),
    path('corridors/', views.get_corridors),
]