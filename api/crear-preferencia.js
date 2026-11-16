export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body;
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({ error: 'Falta configurar MP_ACCESS_TOKEN en las variables de entorno' });
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        items: items.map(item => ({
          title: String(item.nombre || 'Producto'),
          unit_price: Number(item.precio),
          quantity: Number(item.cantidad || 1),
          currency_id: 'MXN'
        })),
        back_urls: {
          success: `${req.headers.origin}/?status=success`,
          failure: `${req.headers.origin}/?status=failure`,
          pending: `${req.headers.origin}/?status=pending`
        },
        auto_return: 'approved'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Mercado Pago:', data);
      return res.status(500).json({ 
        error: 'Error al procesar el pago con Mercado Pago', 
        detalle: data.message || JSON.stringify(data) 
      });
    }

    return res.status(200).json({ id: data.id });
  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el pago' });
  }
}
