from rest_framework import serializers
from .models import Product, Modifier, ProductModifier, Order, OrderItem, OrderItemModifier, StoreSettings

class ModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modifier
        fields = ['id', 'nombre', 'precio_adicional', 'tipo']

class ProductModifierSerializer(serializers.ModelSerializer):
    # Flatten the modifier properties for easier frontend consumption
    id = serializers.IntegerField(source='modifier.id', read_only=True)
    nombre = serializers.CharField(source='modifier.nombre', read_only=True)
    precio_adicional = serializers.DecimalField(source='modifier.precio_adicional', max_digits=10, decimal_places=2, read_only=True)
    tipo = serializers.CharField(source='modifier.tipo', read_only=True)

    class Meta:
        model = ProductModifier
        fields = ['id', 'nombre', 'precio_adicional', 'tipo']

class ProductSerializer(serializers.ModelSerializer):
    modificadores = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'nombre', 'descripcion', 'precio_base', 'categoria', 'imagen_url', 'disponible', 'modificadores']

    def get_modificadores(self, obj):
        return [
            {
                'id': pm.modifier.id,
                'nombre': pm.modifier.nombre,
                'precio_adicional': pm.modifier.precio_adicional,
                'tipo': pm.modifier.tipo
            }
            for pm in obj.modificadores.all()
        ]
        
    def get_imagen_url(self, obj):
        if obj.imagen_archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_archivo.url)
            return f"http://localhost:8000{obj.imagen_archivo.url}"
        return obj.imagen_url

class StoreSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSettings
        fields = ['is_open', 'horario_apertura', 'horario_cierre', 'costo_delivery', 'telefono_sos']

# Serializers for Checkout Payload Validation
class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)
    modifiers = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )

class CheckoutSerializer(serializers.Serializer):
    nombre_cliente = serializers.CharField(max_length=100)
    telefono_cliente = serializers.CharField(max_length=20)
    tipo_entrega = serializers.ChoiceField(choices=['DELIVERY', 'TAKE_AWAY'])
    direccion_envio = serializers.CharField(required=False, allow_blank=True)
    metodo_pago = serializers.ChoiceField(choices=['EFECTIVO', 'TRANSFERENCIA'], default='EFECTIVO')
    cupon_codigo = serializers.CharField(required=False, allow_blank=True)
    notas_cliente = serializers.CharField(required=False, allow_blank=True)
    items = CheckoutItemSerializer(many=True)
