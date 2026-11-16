import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body;
    const client = new MercadoPagoConfig({ access_token: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
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
        auto_return: 'approved',
      }
    });

    return res.status(200).json({ id: result.id });
  } catch (error) {
    console.error('Error MP:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar el pago' });
  }
}
