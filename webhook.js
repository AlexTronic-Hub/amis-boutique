import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const body = req.body;
    const topic = body.type || body.topic;

    if (topic === 'payment') {
      const paymentId = body.data?.id || body.id;

      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      const status = paymentInfo.status;
      const orderId = paymentInfo.external_reference;

      console.log(`Webhook MP: Pedido ${orderId} - Estatus: ${status}`);

      if (orderId) {
        let nuevoEstatus = "En proceso";
        if (status === 'approved') {
          nuevoEstatus = "Pagado";
        } else if (status === 'pending' || status === 'in_process') {
          nuevoEstatus = "Pendiente de pago (OXXO)";
        } else if (status === 'rejected' || status === 'cancelled') {
          nuevoEstatus = "Pedido no completado";
        }

        const projectId = "amis-boutique";
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
        
        const queryRes = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'orders' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'orderId' },
                  op: 'EQUAL',
                  value: { stringValue: orderId }
                }
              }
            }
          })
        });

        const queryData = await queryRes.json();

        if (queryData && queryData.length > 0 && queryData[0].document) {
          const docName = queryData[0].document.name;
          const updateUrl = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=status`;
          
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: nuevoEstatus }
              }
            })
          });

          console.log(`¡Pedido ${orderId} actualizado en Firebase a: ${nuevoEstatus}!`);
        }
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Error procesando Webhook de MP:", error.message);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
}
