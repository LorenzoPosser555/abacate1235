const SERVICOS = {
  "ig-seg_br":      "996",   // Seguidores BR Instagram
  "ig-seg_world":   "1174",  // Seguidores Mundiais Instagram
  "ig-curtidas":    "58",    // Curtidas Mundiais Instagram (rápido)
  "ig-curtidas_br": "23",    // Curtidas BR Instagram
  "ig-views":       "349",   // Views/Reels Instagram
  "tt-seg":         "12",    // Seguidores TikTok
  "tt-curtidas":    "438",   // Curtidas TikTok
  "tt-views":       "30",    // Views TikTok
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const apiKey = process.env.BARATO_SOCIAIS_API_KEY;
    const apiUrl = process.env.BARATO_SOCIAIS_API_URL || "https://baratosociais.com/api/v2";

    if (!apiKey) {
      return res.status(500).json({ erro: "BARATO_SOCIAIS_API_KEY não configurada no Vercel" });
    }

    const { key, link, quantity } = req.body || {};
    const serviceId = SERVICOS[key];

    if (!serviceId) {
      return res.status(400).json({ erro: `Serviço "${key}" não configurado` });
    }
    if (!link) {
      return res.status(400).json({ erro: "Link/@ do perfil não informado" });
    }
    if (!quantity || Number(quantity) < 1) {
      return res.status(400).json({ erro: "Quantidade inválida" });
    }

    const form = new URLSearchParams();
    form.append("key",      apiKey);
    form.append("action",   "add");
    form.append("service",  serviceId);
    form.append("link",     String(link));
    form.append("quantity", String(quantity));

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
        erro: data.error || "Erro ao criar pedido na Barato Sociais",
        detalhes: data
      });
    }

    return res.status(200).json({
      sucesso:  true,
      serviceId,
      order:    data.order || data.id || null,
      detalhes: data
    });

  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}
