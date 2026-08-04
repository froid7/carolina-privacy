// api/liberar-acesso.js
//
// Confirma na Dotfy se a cobrança foi paga e, se sim, gera convites
// únicos (uso único) pros canais do Telegram.
//
// GET /api/liberar-acesso?correlationID=dotfy-xxxx

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CANAL_CONTEUDO_ID = process.env.CANAL_CONTEUDO_ID;
const CANAL_TREINOS_ID = process.env.CANAL_TREINOS_ID;

async function criarConviteUnico(chatId) {
  const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createChatInviteLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + 3600, // expira em 1h
    }),
  });
  const data = await resp.json();
  if (!data.ok) throw new Error('Falha ao criar convite: ' + JSON.stringify(data));
  return data.result.invite_link;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }

  const { correlationID } = req.query;

  if (!correlationID) {
    return res.status(400).json({ success: false, error: 'correlationID_ausente' });
  }

  try {
    const dotfyResp = await fetch(`https://app.dotfy.com.br/api/charges/${encodeURIComponent(correlationID)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.DOTFY_API_KEY}`,
      },
    });

    const data = await dotfyResp.json();

    if (!dotfyResp.ok || !data.success) {
      return res.status(dotfyResp.status).json({ success: false, error: data.error || 'erro_dotfy' });
    }

    const isPaid = !!data.data.isPaid;
    const isExpired = !!data.data.isExpired;

    if (!isPaid) {
      return res.status(200).json({ success: true, is_paid: false, is_expired: isExpired });
    }

    const [inviteConteudo, inviteAcesso] = await Promise.all([
      criarConviteUnico(CANAL_CONTEUDO_ID),
      criarConviteUnico(CANAL_TREINOS_ID),
    ]);

    return res.status(200).json({
      success: true,
      is_paid: true,
      is_expired: isExpired,
      invite_conteudo: inviteConteudo,
      invite_acesso: inviteAcesso,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'erro_interno', debug: err.message });
  }
}
