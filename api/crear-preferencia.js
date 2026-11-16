import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configura las credenciales usando la variable de entorno que pusiste en Vercel
const client = new MercadoPagoConfig({ 
  access_token: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Asegurarnos de que solo responda a peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body;

    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: items.map(item => ({
          title: item.title,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
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

    // Devolvemos el ID de la preferencia para que el cliente abra el checkout
    return res.status(200).json({ id: result.id });

  } catch (error) {
    console.error('Error al crear la preferencia:', error);
    return res.status(500).json({ error: 'Error al procesar el pago con Mercado Pago' });
  }
}
