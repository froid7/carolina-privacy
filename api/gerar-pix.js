// api/gerar-pix.js
//
// Função serverless (Vercel) que gera uma cobrança PIX na Dotfy.
// A chave da API fica SÓ aqui no servidor (variável de ambiente),
// nunca no HTML/JS que roda no navegador do cliente.
//
// Como configurar na Vercel:
// 1. Crie um projeto na Vercel e suba esta pasta (com a pasta api/ dentro)
// 2. Vá em Project Settings → Environment Variables
// 3. Adicione: DOTFY_API_KEY = sua chave (vk_live_...)
// 4. Faça o deploy — o endpoint fica em:
//    https://SEU-PROJETO.vercel.app/api/gerar-pix

export default async function handler(req, res) {
  // Permite chamada vindo da sua landing page (ajuste o domínio depois,
  // trocando '*' pelo domínio real do seu GitHub Pages, por segurança)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }

  try {
    const { valor, descricao, referencia } = req.body || {};

    if (!valor || valor <= 0) {
      return res.status(400).json({ success: false, error: 'valor_invalido' });
    }

    const dotfyResp = await fetch('https://app.dotfy.com.br/api/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DOTFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: valor,                          // em reais, ex: 23.99
        description: descricao || 'Assinatura',
        expiresIn: 3600,                       // expira em 1h
      }),
    });

    const data = await dotfyResp.json();

    if (!dotfyResp.ok || !data.success) {
      return res.status(dotfyResp.status).json({ success: false, error: data.error || 'erro_dotfy' });
    }

    // Devolve pro front-end só o que ele precisa mostrar
    return res.status(200).json({
      success: true,
      pix_copia_cola: data.data.qrCode,
      qr_code_image: data.data.qrCodeImage,
      correlation_id: data.data.correlationID,
      expires_at: data.data.expiresAt,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'erro_interno' });
  }
}
