import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    // --- 1. SEND EMAIL (Nodemailer) ---
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Smart Cane System" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: '🚨 EMERGENCY: SMART CANE SOS 🚨',
      html: `
        <div style="font-family: sans-serif; border: 5px solid red; padding: 20px; text-align: center;">
          <h1 style="color: red;">🚨 EMERGENCY ALERT</h1>
          <p>The SOS button on the Smart Cane has been pressed.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="background: #fee2e2; padding: 15px; font-weight: bold;">Please check on the user immediately.</p>
        </div>
      `,
    };

    const mailPromise = transporter.sendMail(mailOptions);

// --- 2. TELEGRAM ---
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramPromise = fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `🚨 *EMERGENCY ALERT* 🚨\nSmart Cane SOS pressed at ${new Date().toLocaleString()}`,
        parse_mode: 'Markdown',
      }),
    }).then(async (res) => {
      const result = await res.json();
      if (!res.ok) console.error("❌ Telegram API Error:", result);
      else console.log("✅ Telegram Sent Successfully");
      return result;
    });

    // --- 3. RUN BOTH SIMULTANEOUSLY ---
    await Promise.all([mailPromise, telegramPromise]);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("SOS Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}