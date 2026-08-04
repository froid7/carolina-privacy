// api/checar-pagamento.js
//
// Função serverless (Vercel) que consulta na Dotfy se uma cobrança
// já foi paga. Chamada repetidamente (polling) pela página de checkout
// enquanto o cliente não paga o Pix.
//
// GET /api/checar-pagamento?correlationID=dotfy-xxxx

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

    return res.status(200).json({
      success: true,
      is_paid: !!data.data.isPaid,
      is_expired: !!data.data.isExpired,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'erro_interno' });
  }
}
