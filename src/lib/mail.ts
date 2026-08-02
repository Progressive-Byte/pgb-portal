import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  if (!transporter) {
    const port = Number(SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const t = getTransporter();

  if (!t) {
    console.log(
      `[mail:dev-fallback] SMTP not configured — logging instead of sending.\nTo: ${options.to}\nSubject: ${options.subject}\n${options.html}`,
    );
    return;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM ?? "PGB Portal <no-reply@example.com>",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
