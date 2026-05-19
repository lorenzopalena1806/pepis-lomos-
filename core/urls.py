from django.urls import path
from .views import MenuListView, StoreStatusView, CheckoutView, KitchenOrderListView, KitchenOrderStatusUpdateView

urlpatterns = [
    path('menu/', MenuListView.as_view(), name='api-menu'),
    path('store-status/', StoreStatusView.as_view(), name='api-store-status'),
    path('checkout/', CheckoutView.as_view(), name='api-checkout'),
    path('kitchen/orders/', KitchenOrderListView.as_view(), name='api-kitchen-orders'),
    path('kitchen/orders/<int:pk>/status/', KitchenOrderStatusUpdateView.as_view(), name='api-kitchen-order-status'),
]
