function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonSafe(resposta) {
  const texto = await resposta.text();
  try { return texto ? JSON.parse(texto) : {}; }
  catch { return { error: texto || "Resposta inválida da AbacatePay" }; }
}

function errorMessage(data) {
  return data?.error?.message || data?.error || data?.message || "Erro ao verificar PIX";
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

    const data = await readJsonSafe(resposta);

    if (!resposta.ok || data.error) {
      return res.status(resposta.status || 400).json({
        erro: errorMessage(data),
        detalhes: data
      });
    }

    const pix = data.data || {};
    const status = String(pix.status || "PENDING").toUpperCase();

    return res.status(200).json({
      sucesso: true,
      id: pix.id || String(id),
      status,
      pago: status === "PAID",
      expiresAt: pix.expiresAt || null
    });
  } catch (error) {
    console.error("verificarPix error:", error);
    return res.status(500).json({ erro: error.message || "Erro interno ao verificar PIX" });
  }
}
