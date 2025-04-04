const admin = require("firebase-admin");
const serviceAccount = require("./admsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importData() {
  try {
    // Supermercado
    await db.collection("supermercados").doc("sm001").set({
      nome: "Supermercado São João",
      endereco: "Av. Central, 987 - Bairro Centro, Porto Alegre - RS"
    });

    // Hotspots
    await db.collection("hotspots").doc("hs001").set({
      nome: "Corredor de Frios e Laticínios",
      coordenadas: { x: 3, y: 7 },
      supermercadoId: "sm001"
    });

    await db.collection("hotspots").doc("hs002").set({
      nome: "Corredor de Higiene e Limpeza",
      coordenadas: { x: 5, y: 2 },
      supermercadoId: "sm001"
    });

    // Ofertas
    await db.collection("ofertas").doc("of001").set({
      nomeProduto: "Leite Integral 1L - Marca BomLeite",
      descricao: "Promoção por tempo limitado: leve 3 e pague 2!",
      imagemURL: "https://example.com/imagens/leite-bomleite.jpg",
      preco: 4.49,
      categoria: "laticínios",
      dataInicio: admin.firestore.Timestamp.fromDate(new Date("2025-04-01")),
      dataFim: admin.firestore.Timestamp.fromDate(new Date("2025-04-07")),
      hotspotId: "hs001",
      supermercadoId: "sm001"
    });

    await db.collection("ofertas").doc("of002").set({
      nomeProduto: "Sabão em Pó Omo 2kg",
      descricao: "Desconto exclusivo! Apenas R$17,99 esta semana.",
      imagemURL: "https://example.com/imagens/sabao-omo.jpg",
      preco: 17.99,
      categoria: "limpeza",
      dataInicio: admin.firestore.Timestamp.fromDate(new Date("2025-04-01")),
      dataFim: admin.firestore.Timestamp.fromDate(new Date("2025-04-07")),
      hotspotId: "hs002",
      supermercadoId: "sm001"
    });

    // Carrinho
    await db.collection("carrinhos").doc("carrinho001").set({
      tabletId: "tb001",
      localizacaoAtual: "hs001",
      ofertasExibidas: ["of001", "of002"],
      tempoDeSessao: 12
    });

    console.log("Dados importados com sucesso!");
  } catch (error) {
    console.error("Erro ao importar dados:", error);
  }
}

importData();
