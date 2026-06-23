function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Webhook-Signature");
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  // Aqui é onde entra a automação final:
  // 1. validar a assinatura do webhook;
  // 2. localizar o pedido pelo externalId/metadata;
  // 3. marcar como pago no Firebase;
  // 4. chamar a API da Barata Fama / Barata Sociais.
  const event = req.body?.event;
  const payload = req.body?.data;

  console.log("Webhook AbacatePay recebido:", { event, payload });

  return res.status(200).json({ recebido: true });
}
