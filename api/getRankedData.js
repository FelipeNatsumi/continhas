export default async function handler(req, res) {
  const { gameName, tagLine } = req.query;

  if (!gameName || !tagLine) {
    return res.status(400).json({ error: "gameName e tagLine são obrigatórios." });
  }

  const RIOT_API_KEY = process.env.RIOT_API_KEY;

  try {
    // 1. Buscar o PUUID pelo gameName + tagLine
    const r1 = await fetch(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
    if (!r1.ok) throw new Error("PUUID não encontrado");
    const { puuid } = await r1.json();

    // 2. Buscar os dados de ranked diretamente pelo PUUID
    const r2 = await fetch(`https://br1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
    });
    if (!r2.ok) throw new Error("Dados de elo não encontrados");
    const rankedData = await r2.json();

    return res.status(200).json({ rankedData });
  } catch (err) {
    console.error("Erro interno na API:", err);
    return res.status(500).json({ error: err.message });
  }
}
