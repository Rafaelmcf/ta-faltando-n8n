# Frases de teste e gabarito

Cada frase foi enviada numa conversa nova, direto na URL do chat (POST com `sendMessage`). Depois conferi o carrinho guardado pelo n8n contra o gabarito. Nos casos sem carrinho, conferi se a resposta trazia o aviso certo.

Testado em 10/11/2026, com `gemini-3.5-flash-lite`, temperatura 0,1.

| # | Frase do cliente | Carrinho certo | 1ª rodada | 2ª rodada |
|---|---|---|---|---|
| 1 | 2 coca e um miojo de tomate | 2 Coca-Cola lata, 1 lámen tomate | ok | ok |
| 2 | me vê um bombril e um detergente | 1 esponja de aço, 1 detergente | ok | ok |
| 3 | quero 3 guaraná | 3 Guaraná lata | ok | ok |
| 4 | uma coca grande | 1 Coca-Cola 2 L | ok | ok |
| 5 | salgadinho queijo nacho | 1 Doritos | ok | ok |
| 6 | pasta de dente e papel higiênico | 1 creme dental, 1 papel higiênico | ok | ok |
| 7 | uma dúzia de ovos | 1 bandeja de 12 | **errou: 12 bandejas** | ok |
| 8 | danone | 1 iogurte | ok | ok |
| 9 | toddy | 1 achocolatado | ok | ok |
| 10 | nescau | vazio, oferece achocolatado de outra marca | ok | ok |
| 11 | 1kg de arroz e um feijão | 1 arroz, 1 feijão | ok | ok |
| 12 | pão de forma e manteiga | 1 pão de forma, 1 manteiga | ok | ok |
| 13 | duas breja | vazio, pergunta se tem 18 anos | ok | ok |
| 14 | ruffles e amendoim japonês | 1 Ruffles, 1 amendoim | ok | ok |
| 15 | nutella | 1 Nutella | ok | ok |
| 16 | um pote de sorvete napolitano | 1 sorvete | ok | ok |
| 17 | pipoca de micro-ondas, 2 | 2 pipocas | ok | ok |
| 18 | 6 leite de caixinha | 6 leites | ok | ok |
| 19 | azeite e sal | 1 azeite, 1 sal | ok | ok |
| 20 | carne moída e um molho de tomate | 1 carne moída, 1 molho | ok | ok |
| 21 | oi, quero 2 guaraná e uma ruffles | 2 Guaraná, 1 Ruffles | ok | ok |
| 22 | suco de laranja | 1 suco | ok | ok |
| 23 | uma água | 1 água | ok | ok |
| 24 | bolacha recheada | 1 biscoito recheado | ok | ok |
| 25 | picanha | vazio, "não temos" | ok | ok |
| 26 | 2 coca / tira uma coca | 1 Coca-Cola lata | ok | ok |
| 27 | coca / muda pra 4 | 4 Coca-Cola lata | ok | ok |
| 28 | uma coca zero | vazio, oferece a comum avisando do açúcar | **errou: pôs a comum calado** | ok |
| 29 | quero manjericão | vazio, oferece orégano e explica | (sem trocas aprovadas) | ok |
| 30 | tempero verde | vazio, oferece orégano e explica | (sem trocas aprovadas) | ok |
| 31 | fermento | vazio, avisa que não tem troca segura | (sem trocas aprovadas) | ok |
| 32 | creme de leite fresco | vazio, oferece creme de leite de caixinha | (sem trocas aprovadas) | ok |
| 33 | parmesão em peça | vazio, oferece parmesão ralado | (sem trocas aprovadas) | ok |
| 34 | vinho tinto seco | vazio, oferece o suave e explica | não testado | **errou: pôs o suave direto** (corrigido e testado de novo: ok) |
| 35 | nescau / pode ser | 1 achocolatado | não testado | ok |

**2ª rodada:** 34 de 35 certas. Tempo medido do lado do cliente, em 38 mensagens: média 6,5 s, mediana 5,3 s, 5% mais lentos acima de 14,6 s, máximo 15,0 s.

**Receita por link:** `https://www.tudogostoso.com.br/receita/92066-macarrao-a-bolonhesa.html` teve 11 ingredientes lidos do JSON-LD. Foram para o carrinho espaguete, carne moída e molho de tomate. Sal, alho, cebola e orégano apareceram como "talvez você já tenha em casa". Salsicha, caldo de carne, mussarela e pimentão vieram em "não temos". Com um site que não abre, o sistema montou o carrinho pelo nome do prato no link e avisou.

**Ajuste de 10/11 à tarde:** o Rafael testou "guaraná zero" e o sistema oferecia Coca-Cola, porque a IA reaproveitou a troca da Coca Zero. Agora o código confere se a troca escolhida pela IA é mesmo do produto que o cliente pediu. Se não for, ele só avisa que não tem.

| # | Frase do cliente | Certo | Antes | Depois |
|---|---|---|---|---|
| 36 | 2 guaraná zero e 1 coca | 1 Coca-Cola lata, avisa que não tem guaraná zero | oferecia Coca-Cola no lugar do guaraná | ok |

**Regra do refrigerante zero (sugestão do Rafael, 10/11):** quem pede zero costuma querer continuar sem açúcar. Agora, se não tem a versão zero pedida, o bot oferece primeiro os outros refrigerantes zero e depois o mesmo sabor comum, avisando que tem açúcar. Na mesma conversa, ele lembra que o cliente prefere zero. Para testar, o catálogo ganhou o Guaraná Antarctica Zero.

| # | Frase do cliente | Certo | Resultado |
|---|---|---|---|
| 37 | uma coca zero | oferece Guaraná Zero e, como segunda opção, Coca comum com aviso de açúcar | ok |
| 38 | 2 guaraná zero | 2 Guaraná Zero no carrinho | ok |
| 39 | uma coca zero / e um guaraná | entende que é o Guaraná Zero (perfil da conversa) | ok |
| 40 | um guaraná (conversa nova) | Guaraná comum | ok |

**Aprender apelido novo (10/11):** "refrigerante de cola" não está nos apelidos da Coca-Cola lata ("refri de cola" está). Teste com pagamento de verdade no Pix de teste, cada cliente numa conversa nova.

| # | Passo | Certo | Resultado |
|---|---|---|---|
| 41 | Cliente A: "2 refrigerante de cola", fechar, paguei | 2 Coca-Cola lata; linha nova em Aprendizados com status Candidato e 1 confirmação | ok |
| 42 | Cliente B: "um refrigerante de cola", fechar, paguei | a mesma linha passa para Oficial, com 2 confirmações e os 2 clientes | ok |
| 43 | Cliente C: "3 refrigerante de cola" | 3 Coca-Cola lata, já usando o apelido oficial | ok |

**Me dá uma ideia (10/11):** sem IA, tudo por regra.

| # | Conversa | Certo | Resultado |
|---|---|---|---|
| 44 | me dá uma ideia / 1 / 2 / 1 | pergunta pra quê, pergunta pra quantos, mostra 3 combos de jantar pra 2 e põe a bolonhesa no carrinho | ok, menos de 2 s por mensagem |
| 45 | me dá uma ideia / 3 / 4 / 2 | 3 combos de petisco pra 4, põe o Petisco salgado (R$ 73,90) | ok |
| 46 | me dá uma ideia / 2 coca | sai da sugestão e põe 2 Coca-Cola lata | ok |
| 47 | coca zero antes, depois "ideia pra um lanche pra 3 pessoas" | combos já vêm com Guaraná Zero no lugar da Coca | ok (teste do código) |
