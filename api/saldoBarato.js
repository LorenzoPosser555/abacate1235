export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const apiKey = process.env.BARATO_SOCIAIS_API_KEY;
    const apiUrl = process.env.BARATO_SOCIAIS_API_URL || "https://baratosociais.com/api/v2";

    if (!apiKey) return res.status(500).json({ erro: "BARATO_SOCIAIS_API_KEY não configurada" });

    const form = new URLSearchParams();
    form.append("key",    apiKey);
    form.append("action", "balance");

    const resposta = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });

    const texto = await resposta.text();
    let data;
    try { data = JSON.parse(texto); }
    catch { data = { raw: texto }; }

    // Retorna o saldo em reais
    const saldo = parseFloat(data.balance || data.Balance || "0");

    return res.status(200).json({ sucesso: true, saldo });

  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}
