import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Si llega como JSON:
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { name, email, subject, message, honeypot } = body;

    // Anti-spam simple: si el honeypot viene relleno, rechazamos
    if (honeypot) return res.status(200).json({ ok: true });

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Valida tamaños para evitar abusos
    if ((message || '').length > 4000) {
      return res.status(400).json({ error: 'Mensaje demasiado largo' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY || 're_BE815YUy_KADLhzTdRngBkJ7TR6971wYZ');

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['franjimenezdiaz98@gmail.com'], // contacto@reformasmazur.com
      reply_to: email,
      subject: (subject && subject.trim()) ? subject : `Nuevo mensaje de ${name}`,
      html: `
        <h2>Nueva solicitud desde el formulario</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(subject || '-')}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo enviar el correo' });
  }
}

// Saneado básico para HTML
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
