import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

const CATEGORIAS_ALIMENTOS: Record<string, string[]> = {
  proteinas: [
    "Frango grelhado", "Peixe assado", "Ovos mexidos", "Carne moída magra",
    "Atum", "Filé de frango", "Salmão grelhado", "Patinho moído",
    "Peito de peru", "Omelete", "Tilápia assada", "Coxa de frango sem pele",
  ],
  carboidratos: [
    "Arroz integral", "Batata doce", "Quinoa", "Macarrão integral",
    "Purê de batata", "Arroz branco", "Batata inglesa", "Inhame",
    "Mandioca", "Cuscuz", "Aveia", "Pão integral",
  ],
  leguminosas: [
    "Feijão preto", "Feijão carioca", "Lentilha", "Grão de bico",
    "Ervilha", "Soja", "Feijão branco",
  ],
  verduras: [
    "Brócolis", "Couve-flor", "Espinafre refogado", "Abobrinha",
    "Vagem", "Couve", "Rúcula", "Alface", "Agrião", "Escarola",
  ],
  legumes: [
    "Cenoura cozida", "Beterraba", "Chuchu", "Abóbora",
    "Berinjela", "Pimentão", "Tomate", "Pepino",
  ],
  frutas: [
    "Banana", "Maçã", "Pera", "Uva", "Laranja", "Mamão",
    "Melancia", "Melão", "Abacaxi", "Kiwi", "Manga", "Morango",
  ],
  laticinios: [
    "Iogurte natural", "Queijo branco", "Leite desnatado", "Ricota",
    "Cottage", "Leite vegetal", "Queijo minas",
  ],
  gorduras_boas: [
    "Azeite de oliva", "Abacate", "Castanhas", "Amêndoas",
    "Pasta de amendoim", "Sementes de chia", "Linhaça", "Nozes",
  ],
  bebidas: [
    "Água", "Chá verde", "Chá de camomila", "Água de coco",
    "Suco natural", "Chá de hortelã", "Café sem açúcar",
  ],
};

function removerAlimentosProibidos(
  lista: string[],
  restricoes: string[],
  alergias: string[],
): string[] {
  const proibido = [...(restricoes || []), ...(alergias || [])].map((p) =>
    p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
  return lista.filter((item) => {
    const itemNorm = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return !proibido.some((p) => itemNorm.includes(p));
  });
}

function selecionarAleatorio(lista: string[], quantidade: number): string[] {
  const shuffled = [...lista].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quantidade);
}

function gerarPlano(paciente: Record<string, any>) {
  const restricoes = paciente.restricoes_alimentares || [];
  const alergias = paciente.alergias || [];
  const objetivo = (paciente.objetivos?.[0] || paciente.objetivo_texto || "").toLowerCase();

  const proteinas = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.proteinas, restricoes, alergias);
  const carboidratos = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.carboidratos, restricoes, alergias);
  const leguminosas = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.leguminosas, restricoes, alergias);
  const verduras = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.verduras, restricoes, alergias);
  const legumes = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.legumes, restricoes, alergias);
  const frutas = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.frutas, restricoes, alergias);
  const laticinios = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.laticinios, restricoes, alergias);
  const gorduras_boas = removerAlimentosProibidos(CATEGORIAS_ALIMENTOS.gorduras_boas, restricoes, alergias);

  const temRestricaoProteinaAnimal = restricoes.some((r: string) =>
    /vegan|vegetariano|sem carne/i.test(r)
  );

  const emagrecer = /emagrecer|perda de peso|perder peso|redução de peso|reduzir peso/i.test(objetivo);
  const ganhar = /hipertrofia|ganho de massa|ganhar massa|aumentar peso|bulking/i.test(objetivo);

  function porcaoProteina(): string {
    const opcoes = proteinas.length > 0 ? proteinas : ["Ovo", "Frango"];
    if (emagrecer) return selecionarAleatorio(opcoes.filter((p) => !/carne moída|patinho/i.test(p) || true), 1)[0];
    return selecionarAleatorio(opcoes, 1)[0];
  }

  function porcaoCarb(): string {
    const opcoes = emagrecer
      ? carboidratos.filter((c) => /integral|quinoa|aveia|batata doce/i.test(c))
      : carboidratos;
    return opcoes.length > 0 ? selecionarAleatorio(opcoes, 1)[0] : "Arroz integral";
  }

  function cafeDaManha(): string[] {
    const opcoes: string[] = [];
    const base = emagrecer
      ? [...laticinios, ...frutas, ...gorduras_boas]
      : [...laticinios, ...frutas, ...carboidratos, ...gorduras_boas];

    if (laticinios.length > 0) opcoes.push(`${selecionarAleatorio(laticinios, 1)[0]} + ${selecionarAleatorio(frutas, 1)[0]}`);
    if (frutas.length > 0) opcoes.push(`Vitamina de ${selecionarAleatorio(frutas, 1)[0]} com ${selecionarAleatorio(laticinios.length > 0 ? laticinios : ["leite vegetal"], 1)[0]}`);
    if (carboidratos.length > 0) opcoes.push(`${selecionarAleatorio(carboidratos.filter(c => /pão|aveia|cuscuz/i.test(c)), 1)[0] || carboidratos[0]} + ${selecionarAleatorio(frutas, 1)[0]}`);
    if (proteinas.length > 0) opcoes.push(`Omelete de ${selecionarAleatorio(verduras.length > 0 ? verduras : ["espinafre"], 1)[0]} + ${selecionarAleatorio(frutas, 1)[0]}`);

    if (temRestricaoProteinaAnimal) {
      return selecionarAleatorio([
        `Pão integral com pasta de ${selecionarAleatorio(gorduras_boas.filter(g => /amendoim|castanha/i.test(g)), 1)[0] || "amendoim"} + ${selecionarAleatorio(frutas, 1)[0]}`,
        `Vitamina de ${selecionarAleatorio(frutas, 1)[0]} com leite vegetal`,
        ...(opcoes.length > 0 ? opcoes : ["Frutas da estação + aveia"]),
      ], 5);
    }

    return opcoes.length >= 5 ? selecionarAleatorio(opcoes, 5) : [
      ...opcoes,
      ...Array.from({ length: 5 - opcoes.length }, () =>
        `${selecionarAleatorio(frutas.length > 0 ? frutas : ["Banana"], 1)[0]} + ${selecionarAleatorio(proteinas.length > 0 ? proteinas : ["Ovos"], 1)[0]}`
      ),
    ];
  }

  function almoco(): string[] {
    const opcoes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const proteina = porcaoProteina();
      const carb = porcaoCarb();
      const verdura = selecionarAleatorio([...verduras, ...legumes], 1)[0] || "Salada verde";
      const legume = leguminosas.length > 0 && !emagrecer
        ? ` + ${selecionarAleatorio(leguminosas, 1)[0]}`
        : "";
      const gordura = gorduras_boas.length > 0
        ? ` com ${selecionarAleatorio(gorduras_boas, 1)[0]}`
        : "";
      opcoes.push(`${proteina} + ${carb} + ${verdura}${legume}${gordura}`);
    }
    return opcoes;
  }

  function jantar(): string[] {
    const opcoes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const proteina = porcaoProteina();
      const verdura = selecionarAleatorio([...verduras, ...legumes], 2).join(" + ") || "Salada";
      const carb = ganhar ? ` + ${porcaoCarb()}` : "";
      opcoes.push(emagrecer
        ? `${proteina} + ${verdura}`
        : `${proteina} + ${verdura}${carb}`
      );
    }
    return opcoes;
  }

  function lanche(): string[] {
    const opcoes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const fruta = selecionarAleatorio(frutas, 1)[0] || "Maçã";
      const extra = emagrecer
        ? (gorduras_boas.length > 0 ? ` + ${selecionarAleatorio(gorduras_boas, 1)[0]}` : "")
        : (laticinios.length > 0 ? ` + ${selecionarAleatorio(laticinios, 1)[0]}` : " + Aveia");
      opcoes.push(`${fruta}${extra}`);
    }
    return opcoes;
  }

  return {
    cafe_da_manha: cafeDaManha(),
    lanche_da_manha: lanche(),
    almoco: almoco(),
    lanche_da_tarde: lanche(),
    jantar: jantar(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  try {
    const paciente = await req.json();

    if (!paciente || Object.keys(paciente).length === 0) {
      return new Response(
        JSON.stringify({ erro: "Dados do paciente não enviados." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } },
      );
    }

    const plano = gerarPlano(paciente);

    return new Response(JSON.stringify(plano), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return new Response(
      JSON.stringify({ erro: "Erro interno do servidor." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
});