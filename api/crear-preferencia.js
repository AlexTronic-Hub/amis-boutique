import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items, backUrl, orderId, shippingCost, shippingMethod } = req.body;

    const preference = new Preference(client);
    const mappedItems = items.map(item => ({
      title: String(item.title),
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity || 1),
      currency_id: 'MXN'
    }));
    if (Number(shippingCost) > 0) mappedItems.push({ title: "Envio - " + String(shippingMethod || "Envio"), quantity: 1, unit_price: Number(shippingCost), currency_id: "MXN" });
    const result = await preference.create({
      body: {
        items: mappedItems,
        external_reference: orderId || '',
        back_urls: {
          success: `${backUrl || 'https://amisboutique.com'}?mp_result=approved`,
          pending: `${backUrl || 'https://amisboutique.com'}?mp_result=pending`,
          failure: `${backUrl || 'https://amisboutique.com'}?mp_result=failure`
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
