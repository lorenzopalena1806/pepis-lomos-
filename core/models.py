from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import time

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('COCINERO', 'Cocinero'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENTE')
    telefono = models.CharField(max_length=20, blank=True, null=True)
    puntos_pepis = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.username} - {self.role}"

class Product(models.Model):
    CATEGORY_CHOICES = (
        ('LOMO', 'Lomo'),
        ('PAPA', 'Papa'),
        ('BEBIDA', 'Bebida'),
        ('EXTRA', 'Extra'),
    )
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    imagen_url = models.URLField(blank=True, null=True, help_text="Link de internet (Ej: Google Imágenes)")
    imagen_archivo = models.ImageField(upload_to='productos/', blank=True, null=True, help_text="Sube un archivo desde tu computadora")
    disponible = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self):
        return self.nombre

class Modifier(models.Model):
    TYPE_CHOICES = (
        ('AGREGAR', 'Agregar'),
        ('QUITAR', 'Quitar'),
    )
    nombre = models.CharField(max_length=100)
    precio_adicional = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tipo = models.CharField(max_length=20, choices=TYPE_CHOICES)

    class Meta:
        verbose_name = "Modificador"
        verbose_name_plural = "Modificadores"

    def __str__(self):
        return f"{self.tipo} {self.nombre} (+${self.precio_adicional})"

class ProductModifier(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='modificadores')
    modifier = models.ForeignKey(Modifier, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.product.nombre} - {self.modifier.nombre}"

class Coupon(models.Model):
    DISCOUNT_CHOICES = (
        ('PORCENTAJE', 'Porcentaje'),
        ('MONTO_FIJO', 'Monto Fijo'),
    )
    codigo = models.CharField(max_length=20, unique=True)
    tipo_descuento = models.CharField(max_length=20, choices=DISCOUNT_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
    valido_hasta = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Cupón"
        verbose_name_plural = "Cupones de Descuento"

    def __str__(self):
        return self.codigo

class Order(models.Model):
    STATUS_CHOICES = (
        ('PENDIENTE', 'Pendiente'),
        ('PREPARANDO', 'Preparando'),
        ('LISTO', 'Listo para entregar/enviar'),
        ('FINALIZADO', 'Finalizado'),
        ('CANCELADO', 'Cancelado'),
    )
    DELIVERY_CHOICES = (
        ('DELIVERY', 'Delivery'),
        ('TAKE_AWAY', 'Take Away'),
    )
    PAGO_CHOICES = (
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia / Débito'),
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    nombre_cliente = models.CharField(max_length=100)
    telefono_cliente = models.CharField(max_length=20)
    notas_cliente = models.TextField(blank=True, null=True, help_text="Aclaraciones o instrucciones especiales del cliente")
    
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE')
    tipo_entrega = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='TAKE_AWAY')
    direccion_envio = models.CharField(max_length=255, blank=True, null=True)
    metodo_pago = models.CharField(max_length=20, choices=PAGO_CHOICES, default='EFECTIVO')
    costo_envio = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    descuento_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    cupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    puntos_ganados = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def __str__(self):
        return f"Pedido #{self.id} - {self.nombre_cliente}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario_historico = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad}x {self.product.nombre if self.product else 'Producto Eliminado'}"

class OrderItemModifier(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='modificadores')
    modifier = models.ForeignKey(Modifier, on_delete=models.SET_NULL, null=True)
    precio_historico = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Mod: {self.modifier.nombre if self.modifier else 'Eliminado'}"

class StoreSettings(models.Model):
    is_open = models.BooleanField(default=True)
    horario_apertura = models.TimeField(default=time(19, 0))
    horario_cierre = models.TimeField(default=time(23, 59))
    costo_delivery = models.DecimalField(max_digits=10, decimal_places=2, default=2000.00)
    telefono_sos = models.CharField(max_length=20, default="+5491100000000")
    descuento_efectivo_porcentaje = models.IntegerField(default=10, help_text="Porcentaje de descuento por pago en efectivo (ej: 10 para 10%)")

    class Meta:
        verbose_name = "Configuración Global"
        verbose_name_plural = "Configuraciones Globales"

    def __str__(self):
        return "Configuración Global"
