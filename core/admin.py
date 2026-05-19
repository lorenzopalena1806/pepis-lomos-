from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Product, Modifier, ProductModifier, Coupon, Order, OrderItem, OrderItemModifier, StoreSettings
from django.contrib.auth.models import Group

# Ocultar el modelo Groups por defecto de Django
admin.site.unregister(Group)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email', 'telefono')}),
        ('Roles de Pepi\'s Lomos', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Puntos', {'fields': ('puntos_pepis',)}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'puntos_pepis', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')

    def save_model(self, request, obj, form, change):
        # Si el usuario tiene rol de COCINERO o ADMIN, automáticamente debe tener acceso al panel (is_staff = True)
        if obj.role in ['COCINERO', 'ADMIN']:
            obj.is_staff = True
        super().save_model(request, obj, form, change)

class ProductModifierInline(admin.TabularInline):
    model = ProductModifier
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'precio_base', 'disponible')
    list_filter = ('categoria', 'disponible')
    search_fields = ('nombre',)
    inlines = [ProductModifierInline]

@admin.register(Modifier)
class ModifierAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'precio_adicional')
    list_filter = ('tipo',)
    search_fields = ('nombre',)

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo_descuento', 'valor', 'activo', 'valido_hasta')
    list_filter = ('activo', 'tipo_descuento')
    search_fields = ('codigo',)

class OrderItemModifierInline(admin.TabularInline):
    model = OrderItemModifier
    extra = 0

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

import openpyxl
from django.http import HttpResponse

@admin.action(description="Exportar Seleccionados a Excel")
def export_selected_to_excel(modeladmin, request, queryset):
    return generate_excel_response(queryset)

@admin.action(description="Exportar TODA la Base a Excel")
def export_all_to_excel(modeladmin, request, queryset):
    from .models import Order
    return generate_excel_response(Order.objects.all())

def generate_excel_response(queryset):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Cierre de Caja"
    
    # Columnas
    headers = ["#ID", "Fecha", "Cliente", "Método Entrega", "Método Pago", "Estado", "Total ($)"]
    ws.append(headers)
    
    for order in queryset:
        fecha = order.creado_en.strftime("%d/%m/%Y %H:%M") if order.creado_en else ""
        ws.append([
            order.id,
            fecha,
            order.nombre_cliente,
            order.tipo_entrega,
            order.metodo_pago,
            order.estado,
            float(order.total)
        ])
        
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=ventas_pepis.xlsx'
    wb.save(response)
    return response

from django.urls import path
from django.template.response import TemplateResponse

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    change_list_template = "admin/order_changelist.html"
    list_display = ('id', 'nombre_cliente', 'estado', 'tipo_entrega', 'total', 'creado_en')
    list_filter = ('estado', 'tipo_entrega', 'creado_en')
    search_fields = ('nombre_cliente', 'telefono_cliente', 'id')
    readonly_fields = ('creado_en', 'actualizado_en')
    inlines = [OrderItemInline]
    actions = [export_selected_to_excel, export_all_to_excel]

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('hoja-ventas/', self.admin_site.admin_view(self.hoja_ventas_view), name='hoja_ventas'),
        ]
        return custom_urls + urls

    def hoja_ventas_view(self, request):
        orders = self.model.objects.all().order_by('-creado_en')
        context = dict(
            self.admin_site.each_context(request),
            orders=orders,
            title="Hoja de Ventas en Vivo (Auto-actualizable)"
        )
        return TemplateResponse(request, "admin/hoja_ventas.html", context)

@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_open', 'horario_apertura', 'horario_cierre', 'costo_delivery', 'telefono_sos')
    list_editable = ('is_open', 'horario_apertura', 'horario_cierre', 'costo_delivery', 'telefono_sos')

    def has_add_permission(self, request):
        # Prevent adding more than one settings object
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)
