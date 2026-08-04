export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // TODO: se a Dotfy enviar um header de assinatura/secret, valide aqui
  // antes de confiar no payload (ex: comparar req.headers['x-dotfy-signature'])

  const payload = req.body;
  console.log('[Dotfy webhook] payload recebido:', JSON.stringify(payload));

  const { event, data } = payload || {};

  if (event === 'CHARGE_PAID') {
    console.log('[Dotfy webhook] CHARGE_PAID para correlationID:', data?.correlationID);
    // não precisa fazer mais nada aqui por enquanto — quem libera acesso
    // é o /api/liberar-acesso, chamado pelo front
  } else {
    console.log('[Dotfy webhook] evento ignorado:', event);
  }

  return res.status(200).json({ received: true });
}
