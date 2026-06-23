export default async function handler(req, res) {
  // CORS sempre primeiro
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ erro: "ABACATEPAY_API_KEY não configurada no Vercel" });
    }

    const { id } = req.query || {};
    if (!id) return res.status(400).json({ erro: "ID do PIX não informado" });

    const resposta = await fetch(
      `https://api.abacatepay.com/v2/transparents/check?id=${encodeURIComponent(id)}`,
      { headers: { "Authorization": `Bearer ${apiKey}` } }
    );

    const texto = await resposta.text();
    let data = {};
    try { data = texto ? JSON.parse(texto) : {}; }
    catch { data = { error: texto || "Resposta inválida da AbacatePay" }; }

    if (!resposta.ok || data.error) {
      const msg = data?.error?.message || data?.error || data?.message || "Erro ao verificar PIX";
      return res.status(resposta.status || 400).json({ erro: msg, detalhes: data });
    }

    const pix    = data.data || {};
    const status = String(pix.status || "PENDING").toUpperCase();

    return res.status(200).json({
      sucesso:   true,
      id:        pix.id || String(id),
      status,
      pago:      status === "PAID",
      expiresAt: pix.expiresAt || null
    });

  } catch (error) {
    console.error("verificarPix error:", error);
    return res.status(500).json({ erro: error.message || "Erro interno ao verificar PIX" });
  }
}
