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
        rejectUnauthorized: false
    }
});

module.exports = async (req, res) => {
    // Configurar cabeceras CORS por seguridad
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

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
        
        // Asegurar respuesta estricta en JSON
        return res.status(200).setHeader('Content-Type', 'application/json').json({ success: true, message: 'Correo enviado correctamente' });

    } catch (error) {
        console.error('Error detallado al enviar correo:', error);
        return res.status(500).setHeader('Content-Type', 'application/json').json({ error: error.message });
    }
};
