import urllib.parse
from datetime import datetime
from django.utils.timezone import localtime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Modifier, Order, OrderItem, OrderItemModifier, StoreSettings, Coupon
from .serializers import ProductSerializer, CheckoutSerializer

class MenuListView(APIView):
    """
    Endpoint GET para listar los productos activos con sus modificadores.
    """
    def get(self, request):
        products = Product.objects.filter(disponible=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StoreStatusView(APIView):
    """
    Endpoint GET para validar si el local está abierto según horario del servidor y configuración manual.
    """
    def get(self, request):
        settings = StoreSettings.objects.first()
        if not settings:
            return Response({
                "is_open": False, 
                "message": "Configuración del local no encontrada."
            }, status=status.HTTP_200_OK)
        
        now = datetime.now().time()
        # Verificar cierre forzado o validación de horarios
        is_open_now = settings.is_open and (settings.horario_apertura <= now <= settings.horario_cierre)
        
        return Response({
            "is_open": is_open_now,
            "horario_apertura": settings.horario_apertura.strftime('%H:%M'),
            "horario_cierre": settings.horario_cierre.strftime('%H:%M'),
            "costo_delivery": settings.costo_delivery,
            "telefono_sos": settings.telefono_sos
        }, status=status.HTTP_200_OK)

class CheckoutView(APIView):
    """
    Endpoint POST para procesar el carrito, guardar la orden y devolver el link de WhatsApp.
    """
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        settings = StoreSettings.objects.first()
        
        # Validar si está abierto (Opcional, pero recomendado en backend)
        now = datetime.now().time()
        if not settings or not (settings.is_open and settings.horario_apertura <= now <= settings.horario_cierre):
            return Response({"error": "El local se encuentra cerrado actualmente."}, status=status.HTTP_400_BAD_REQUEST)

        # Iniciar variables de cálculo
        subtotal_pedido = 0
        items_db = []
        whatsapp_text_items = ""

        # Guardar Cabecera del Pedido (Order) provisionalmente para obtener ID
        order = Order.objects.create(
            nombre_cliente=data['nombre_cliente'],
            telefono_cliente=data['telefono_cliente'],
            tipo_entrega=data['tipo_entrega'],
            direccion_envio=data.get('direccion_envio', ''),
            metodo_pago=data.get('metodo_pago', 'EFECTIVO'),
            notas_cliente=data.get('notas_cliente', ''),
            estado='PENDIENTE'
        )

        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product_id'])
            except Product.DoesNotExist:
                return Response({"error": f"Producto ID {item_data['product_id']} no existe."}, status=status.HTTP_400_BAD_REQUEST)

            precio_unitario = product.precio_base
            whatsapp_item_text = f"{item_data['cantidad']}x {product.nombre}"
            
            # Crear OrderItem
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                cantidad=item_data['cantidad'],
                precio_unitario_historico=precio_unitario,
                subtotal=0  # Se calcula ahora
            )

            # Procesar Modificadores
            mod_subtotal = 0
            if item_data.get('modifiers'):
                for mod_id in item_data['modifiers']:
                    try:
                        mod = Modifier.objects.get(id=mod_id)
                        mod_subtotal += mod.precio_adicional
                        OrderItemModifier.objects.create(
                            order_item=order_item,
                            modifier=mod,
                            precio_historico=mod.precio_adicional
                        )
                        whatsapp_item_text += f"\n  - {mod.nombre}"
                    except Modifier.DoesNotExist:
                        pass
            
            # Calcular subtotal del item
            item_total = (precio_unitario + mod_subtotal) * item_data['cantidad']
            order_item.subtotal = item_total
            order_item.save()

            subtotal_pedido += item_total
            whatsapp_text_items += whatsapp_item_text + "\n"

        # Calcular Costo de Envío
        costo_envio = settings.costo_delivery if data['tipo_entrega'] == 'DELIVERY' else 0
        
        # Lógica de Cupones (Básica) y Descuento Efectivo
        descuento = 0
        cupon_obj = None
        
        # Descuento por pago en Efectivo
        if data.get('metodo_pago', 'EFECTIVO') == 'EFECTIVO' and settings.descuento_efectivo_porcentaje > 0:
            descuento_efectivo = (subtotal_pedido * settings.descuento_efectivo_porcentaje) / 100
            descuento += descuento_efectivo

        if data.get('cupon_codigo'):
            try:
                cupon_obj = Coupon.objects.get(codigo=data['cupon_codigo'], activo=True)
                if not cupon_obj.valido_hasta or cupon_obj.valido_hasta.replace(tzinfo=None) > datetime.now():
                    if cupon_obj.tipo_descuento == 'PORCENTAJE':
                        descuento += (subtotal_pedido * cupon_obj.valor) / 100
                    else:
                        descuento += cupon_obj.valor
            except Coupon.DoesNotExist:
                pass

        total_pedido = subtotal_pedido + costo_envio - descuento

        # Actualizar Order
        order.subtotal = subtotal_pedido
        order.costo_envio = costo_envio
        order.descuento_aplicado = descuento
        order.total = total_pedido
        order.cupon = cupon_obj
        order.save()

        # Generar URL de WhatsApp
        wa_phone = settings.telefono_sos.replace('+', '')
        wa_msg = f"Hola Pepi's! Quiero hacer un pedido:\n\n"
        wa_msg += f"*Pedido #{order.id}*\n"
        wa_msg += f"{whatsapp_text_items}\n"
        wa_msg += f"*Entrega:* {data['tipo_entrega']}\n"
        if data['tipo_entrega'] == 'DELIVERY':
            wa_msg += f"*Dirección:* {data.get('direccion_envio', '')}\n"
        wa_msg += f"*Método de Pago:* {data.get('metodo_pago', 'EFECTIVO')}\n"
        if descuento > 0:
            wa_msg += f"*Descuento:* -${descuento:.2f}\n"
        wa_msg += f"*Total a Pagar:* ${total_pedido:.2f}\n\n"
        if data.get('notas_cliente'):
            wa_msg += f"*Notas/Aclaraciones:* {data['notas_cliente']}\n\n"
        if data.get('metodo_pago', 'EFECTIVO') == 'TRANSFERENCIA':
            wa_msg += f"Por favor envíenme el alias para transferir.\n"

        wa_url = f"https://wa.me/{wa_phone}?text={urllib.parse.quote(wa_msg)}"

        return Response({
            "order_id": order.id,
            "whatsapp_url": wa_url,
            "total": total_pedido
        }, status=status.HTTP_201_CREATED)

class KitchenOrderListView(APIView):
    """
    Endpoint GET para la comandera digital: Lista pedidos PENDIENTE y PREPARANDO.
    """
    def get(self, request):
        orders = Order.objects.filter(estado__in=['PENDIENTE', 'PREPARANDO']).order_by('creado_en')
        data = []
        for order in orders:
            items = []
            for item in order.items.all():
                mods = [m.modifier.nombre for m in item.modificadores.all() if m.modifier]
                items.append({
                    "cantidad": item.cantidad,
                    "producto": item.product.nombre if item.product else "Eliminado",
                    "modificadores": mods
                })
            
            data.append({
                "id": order.id,
                "cliente": order.nombre_cliente,
                "tipo_entrega": order.tipo_entrega,
                "estado": order.estado,
                "notas_cliente": order.notas_cliente,
                "hora": localtime(order.creado_en).strftime('%H:%M'),
                "items": items
            })
        return Response(data, status=status.HTTP_200_OK)

class KitchenOrderStatusUpdateView(APIView):
    """
    Endpoint POST para que la cocina cambie el estado de un pedido.
    """
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"error": "Pedido no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        nuevo_estado = request.data.get('estado')
        if nuevo_estado in dict(Order.STATUS_CHOICES):
            order.estado = nuevo_estado
            order.save()
            return Response({"status": "ok", "nuevo_estado": order.estado}, status=status.HTTP_200_OK)
        return Response({"error": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)
