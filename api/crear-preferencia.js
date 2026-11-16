import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: items.map(item => ({
          title: String(item.title),
          unit_price: Number(item.unit_price), // <--- Forzamos que sea número
          quantity: Number(item.quantity || 1),
          currency_id: 'MXN'
        })),
        back_urls: {
          success: 'https://amisboutique.com',
          failure: 'https://amisboutique.com',
          pending: 'https://amisboutique.com'
        },
        auto_return: 'approved',
      }
    });

    return res.status(200).json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("Error de Mercado Pago:", error.response?.data || error.message);
    return res.status(500).json({ error: error.message || 'Error al procesar el pago' });
  }
}
