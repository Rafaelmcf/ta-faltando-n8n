// Roda as frases de teste contra o chat publicado do n8n e confere o carrinho de cada uma.
// Uso: node testes/rodar_testes.mjs [URL do chat]
// Padrão: http://localhost:5678/webhook/mercadinho-chat-carrinho/chat
// Cada caso usa uma conversa nova. O carrinho é lido da própria resposta do bot
// (linhas "- 2x Produto R$ ..." depois de "Seu carrinho").

const URL_CHAT = process.argv[2] || 'http://localhost:5678/webhook/mercadinho-chat-carrinho/chat';

// [mensagens, carrinho esperado { 'nome do produto': quantidade }, texto que precisa aparecer na resposta]
const CASOS = [
  ['2 coca e um miojo de tomate', { 'Coca-Cola lata': 2, 'Lámen sabor tomate': 1 }],
  ['me vê um bombril e um detergente', { 'Esponja de aço': 1, 'Detergente líquido neutro': 1 }],
  ['quero 3 guaraná', { 'Guaraná Antarctica lata': 3 }],
  ['uma coca grande', { 'Coca-Cola 2 litros': 1 }],
  ['salgadinho queijo nacho', { 'Doritos Queijo Nacho': 1 }],
  ['pasta de dente e papel higiênico', { 'Creme dental': 1, 'Papel higiênico folha dupla': 1 }],
  ['uma dúzia de ovos', { 'Ovos brancos': 1 }],
  ['danone', { 'Iogurte de morango': 1 }],
  ['toddy', { 'Achocolatado em pó': 1 }],
  ['nescau', {}, 'Achocolatado'],
  ['1kg de arroz e um feijão', { 'Arroz branco tipo 1': 1, 'Feijão carioca': 1 }],
  ['pão de forma e manteiga', { 'Pão de forma tradicional': 1, 'Manteiga com sal': 1 }],
  ['duas breja', {}, '18 anos'],
  ['ruffles e amendoim japonês', { 'Batata Ruffles Original': 1, 'Amendoim japonês': 1 }],
  ['nutella', { 'Creme de avelã Nutella': 1 }],
  ['um pote de sorvete napolitano', { 'Sorvete napolitano': 1 }],
  ['pipoca de micro-ondas, 2', { 'Pipoca de micro-ondas manteiga': 2 }],
  ['6 leite de caixinha', { 'Leite integral': 6 }],
  ['azeite e sal', { 'Azeite extravirgem': 1, 'Sal refinado': 1 }],
  ['carne moída e um molho de tomate', { 'Carne moída patinho': 1, 'Molho de tomate tradicional': 1 }],
  ['oi, quero 2 guaraná e uma ruffles', { 'Guaraná Antarctica lata': 2, 'Batata Ruffles Original': 1 }],
  ['suco de laranja', { 'Suco de laranja integral': 1 }],
  ['uma água', { 'Água mineral sem gás': 1 }],
  ['bolacha recheada', { 'Biscoito recheado chocolate': 1 }],
  ['picanha', {}, 'Não temos'],
  [['2 coca', 'tira uma coca'], { 'Coca-Cola lata': 1 }],
  [['coca', 'muda pra 4'], { 'Coca-Cola lata': 4 }],
  ['quero manjericão', {}, 'orégano'],
  ['tempero verde', {}, 'O que muda'],
  ['fermento', {}, 'não vou sugerir'],
  ['creme de leite fresco', {}, 'chantilly'],
  ['parmesão em peça', {}, 'ralado'],
  ['vinho tinto seco', {}, 'adocicado'],
  [['nescau', 'pode ser'], { 'Achocolatado em pó': 1 }],
  ['uma coca zero', {}, 'Guaraná Antarctica Zero'],
  ['2 guaraná zero', { 'Guaraná Antarctica Zero lata': 2 }],
];

const lerCarrinho = (texto) => {
  const parte = texto.split('Seu carrinho')[1];
  if (!parte) return {};
  const itens = {};
  for (const m of parte.matchAll(/^- (\d+)x (.+?) R\$/gm)) itens[m[2].trim()] = Number(m[1]);
  return itens;
};
const igual = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

const tempos = [];
let certos = 0;
const base = 'teste-' + Date.now();
for (const [i, [msgs, esperado, texto]] of CASOS.entries()) {
  const sessao = `${base}-${i}`;
  let resposta = '';
  let carrinho = {};
  for (const msg of [].concat(msgs)) {
    const t0 = Date.now();
    const r = await fetch(URL_CHAT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId: sessao, chatInput: msg }),
    });
    resposta = (await r.json()).output || '';
    tempos.push(Date.now() - t0);
    // o carrinho só aparece quando muda; guarda o último que apareceu
    const c = lerCarrinho(resposta);
    if (Object.keys(c).length) carrinho = c;
  }
  const ok = igual(carrinho, esperado) && (!texto || resposta.toLowerCase().includes(texto.toLowerCase()));
  if (ok) certos++;
  console.log(`${ok ? 'OK  ' : 'ERRO'} | ${[].concat(msgs).join(' / ')}${ok ? '' : `\n       esperado ${JSON.stringify(esperado)}, veio ${JSON.stringify(carrinho)}\n       resposta: ${resposta.replace(/\n+/g, ' ').slice(0, 200)}`}`);
}

tempos.sort((a, b) => a - b);
const pct = (p) => tempos[Math.min(tempos.length - 1, Math.floor(tempos.length * p))];
console.log(`\nAcertos: ${certos} de ${CASOS.length} (${Math.round((certos / CASOS.length) * 100)}%)`);
console.log(`Tempo por mensagem: mediana ${(pct(0.5) / 1000).toFixed(1)} s, 95% abaixo de ${(pct(0.95) / 1000).toFixed(1)} s, máximo ${(tempos.at(-1) / 1000).toFixed(1)} s`);
