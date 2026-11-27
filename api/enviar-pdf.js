import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { correoCliente, nombreCliente, pdfBase64, nombreArchivo } = req.body;

  if (!correoCliente || !pdfBase64) {
    return res.status(400).json({ error: 'Falta el correo del cliente o el PDF' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const base64Limpio = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    await transporter.sendMail({
      from: `"AMIS Boutique" <${process.env.SMTP_USER}>`,
      to: correoCliente,
      subject: 'Tu comprobante de compra - AMIS Boutique',
      html: `
        <p>Hola <strong>${nombreCliente || 'Cliente'}</strong>,</p>
        <p>Gracias por tu compra en <strong>AMIS Boutique</strong>. Adjunto encontrarás tu comprobante en formato PDF.</p>
        <p>Saludos,<br>AMIS Boutique</p>
      `,
      attachments: [
        {
          filename: nombreArchivo || 'Nota_AMIS_Boutique.pdf',
          content: base64Limpio,
          encoding: 'base64',
        },
      ],
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error SMTP:', error);
    return res.status(500).json({ error: error.message });
  }
}
