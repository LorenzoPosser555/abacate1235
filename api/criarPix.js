import { randomUUID } from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ erro: "ABACATEPAY_API_KEY não configurada no Vercel" });
    }

    const { valor, descricao, referencia, uid, email, nome } = req.body || {};
    const amount = Math.round(Number(valor) * 100);

    if (!amount || amount < 100) {
      return res.status(400).json({ erro: "Valor mínimo: R$ 1,00" });
    }

    const externalId = String(referencia || randomUUID());

    // Body exato conforme doc AbacatePay v2
    // customer só com taxId (CPF/CNPJ) — email sozinho não é aceito
    const body = {
      method: "PIX",
      data: {
        amount,
        expiresIn: 3600,
        description: descricao || "Adicionar saldo SocialBoost",
        externalId,
        metadata: {
          uid: uid || null,
          email: email || null,
          valor: Number(valor)
        }
      }
    };

    const resposta = await fetch("https://api.abacatepay.com/v2/transparents/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const texto = await resposta.text();
    console.log("AbacatePay status:", resposta.status);
    console.log("AbacatePay resposta:", texto);

    let data = {};
    try { data = texto ? JSON.parse(texto) : {}; }
    catch { data = { error: texto || "Resposta inválida da AbacatePay" }; }

    if (!resposta.ok || data.error) {
      const msg = data?.error?.message || data?.error || data?.message || "Erro ao gerar PIX";
      return res.status(resposta.status || 400).json({ erro: msg, detalhes: data });
    }

    // Resposta AbacatePay v2: { data: { id, brCode, brCodeBase64, status, ... }, success: true }
    const pix      = data.data || {};
    const qrCode   = pix.brCode       || "";
    const qrBase64 = pix.brCodeBase64 || "";

    if (!pix.id || !qrCode) {
      return res.status(502).json({
        erro: "AbacatePay respondeu sem dados do PIX",
        detalhes: data
      });
    }

    return res.status(200).json({
      sucesso:        true,
      id:             pix.id,
      status:         pix.status || "PENDING",
      valorCentavos:  pix.amount || amount,
      qr_code:        qrCode,
      qr_code_base64: qrBase64,
      expiresAt:      pix.expiresAt || null
    });

  } catch (error) {
    console.error("criarPix error:", error);
    return res.status(500).json({ erro: error.message || "Erro interno ao gerar PIX" });
  }
}
