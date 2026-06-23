export default async function handler(req, res) {
  // CORS sempre primeiro
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const apiKey = process.env.BARATO_SOCIAIS_API_KEY;
    const apiUrl = process.env.BARATO_SOCIAIS_API_URL || "https://baratosociais.com/api/v2";
    const { order } = req.query || {};

    if (!apiKey) return res.status(500).json({ erro: "BARATO_SOCIAIS_API_KEY não configurada no Vercel" });
    if (!order)  return res.status(400).json({ erro: "ID do pedido não informado" });

    const form = new URLSearchParams();
    form.append("key",    apiKey);
    form.append("action", "status");
    form.append("order",  String(order));

    const resposta = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });

    const texto = await resposta.text();
    let data;
    try { data = JSON.parse(texto); }
    catch { data = { raw: texto }; }

    if (!resposta.ok || data.error) {
      return res.status(resposta.status || 400).json({
        erro: data.error || "Erro ao consultar pedido",
        detalhes: data
      });
    }

    return res.status(200).json({ sucesso: true, detalhes: data });

  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}
