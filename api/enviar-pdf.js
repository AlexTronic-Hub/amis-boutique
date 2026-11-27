const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Ignora la discrepancia del certificado del servidor SMTP
    }
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { correoCliente, nombreCliente, pdfBase64, nombreArchivo } = req.body;

        if (!correoCliente) {
            return res.status(400).json({ error: 'Falta el correo del cliente.' });
        }

        const matches = pdfBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Formato de PDF inválido.' });
        }
        const pdfBuffer = Buffer.from(matches[2], 'base64');

        const mailOptions = {
            from: `"AMIS Boutique" <${process.env.SMTP_USER}>`,
            to: correoCliente,
            subject: `Comprobante de tu pedido en AMIS Boutique - ${nombreCliente}`,
            text: `Hola ${nombreCliente},\n\nAdjunto encontrarás el comprobante oficial de tu pedido en AMIS Boutique.\n\n¡Gracias por tu compra!\nInstagram: @amisboutique.official`,
            attachments: [
                {
                    filename: nombreArchivo || 'Comprobante_Pedido.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });

    } catch (error) {
        console.error('Error al enviar correo:', error);
        return res.status(500).json({ error: error.message });
    }
};
