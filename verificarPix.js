function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ erro: "ABACATEPAY_API_KEY não configurada no Vercel" });
    }

    const { id } = req.query || {};
    if (!id) return res.status(400).json({ erro: "ID do PIX não informado" });

    const resposta = await fetch(`https://api.abacatepay.com/v2/transparents/check?id=${encodeURIComponent(id)}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    const data = await resposta.json();

    if (!resposta.ok || data.error) {
      return res.status(resposta.status || 400).json({
        erro: data?.error?.message || data?.error || "Erro ao verificar PIX",
        detalhes: data
      });
    }

    return res.status(200).json({
      sucesso: true,
      id: data.data.id,
      status: data.data.status,
      pago: data.data.status === "PAID",
      expiresAt: data.data.expiresAt
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}
