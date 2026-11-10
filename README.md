# Tá Faltando? Mercadinho de última hora que entende o jeito que a gente fala

Faltou alguma coisa em casa e o mercado já fechou. Hoje a pessoa abre um app de entrega, escolhe a loja, procura cada produto, compara marcas e só então paga. Para três itens são uns dez toques.

Este projeto testa outra ideia: uma conversa e nenhuma escolha. O cliente escreve do jeito dele, "2 coca e um miojo de tomate", e o atendente monta o carrinho sozinho, fala o total e manda o Pix. Ele também aceita o link de uma receita: lê os ingredientes, coloca no carrinho os principais, lembra do que a pessoa provavelmente já tem em casa e avisa o que está faltando no mercado.

Quando o produto não existe, ele não inventa. Se o cliente pede manjericão e o mercado só tem orégano, ele oferece a troca, explica o que muda no prato e só coloca no carrinho se o cliente aceitar. Bebida alcoólica só entra depois de confirmar que a pessoa tem 18 anos. Pagamento confirmado vira pedido gravado, com os itens e o número de mensagens que o cliente precisou mandar até pagar.

O mercado é fictício e roda em modo demonstração, com Pix de teste e tudo em planos gratuitos.

![Receita por link: o carrinho montado a partir de uma receita do TudoGostoso](docs/prints/20_chat_receita_por_link_bolonhesa.png)

## O que eu testei

Escrevi 35 pedidos como as pessoas escrevem de verdade: apelido ("bombril", "breja", "danone"), quantidade por extenso ("uma dúzia de ovos"), produto que não existe ("picanha"), marca que não tem ("nescau") e correções no meio da conversa ("tira uma coca", "muda pra 4"). Para cada um anotei antes qual carrinho era o certo e conferi o carrinho que o sistema montou.

A primeira rodada achou dois erros que poderiam dar problema de verdade:

- "uma dúzia de ovos" virava 12 bandejas de ovos, um carrinho de R$ 166,80. A IA contava ovos e o catálogo vende bandeja. Corrigi a regra de quantidade, que agora é sempre na unidade de venda.
- "uma coca zero" virava Coca-Cola comum, sem avisar. Para quem tem diabetes, isso é grave. Agora existe uma trava no código: quem pede zero recebe primeiro as opções zero que existem e, depois, o mesmo sabor comum com o aviso de que tem açúcar. Na mesma conversa o bot lembra que o cliente prefere zero.

Na segunda rodada sobrou um erro: "vinho tinto seco" entrava direto como vinho suave. Coloquei uma segunda trava, que confere a resposta da IA contra a tabela de trocas, e repeti o teste até ele virar pergunta.

| O que foi medido | Resultado |
|---|---|
| Pedidos com o carrinho certo (2ª rodada) | 34 de 35 (97%); o que errou foi corrigido e testado de novo |
| Produto inventado pela IA | nenhum (o código descarta qualquer código de produto que não exista) |
| Troca colocada no carrinho sem o cliente aceitar | nenhuma depois das travas |
| Tempo de resposta com IA | 5,3 s na mediana, 14,6 s nos 5% mais lentos |
| Tempo de resposta sem IA (menu, carrinho, fechar) | menos de 1 s |
| Receita por link | ingredientes lidos direto da página em 1 mensagem |
| Mensagens até pagar | 3 (pedido, "fechar", "paguei") |
| Erros de execução registrados | 0 em 95 mensagens |

A IA só faz uma coisa: entender o texto. Preço, total, estoque, idade e Pix são regras fixas no código. Cada mensagem fica registrada numa tabela, com o tempo de resposta e se usou IA ou não, e é dela que saem os números acima.

Passei 15 anos gerenciando operação de comida que funciona de madrugada. Conheço o cliente que liga às 23h porque faltou o molho do macarrão. Este projeto é para ele.

---

## Como funciona por dentro

### Stack

| Camada | Ferramenta |
|---|---|
| Conversa | Chat do n8n (canal plugável; o WhatsApp da Meta ficou bloqueado na criação da conta, veja abaixo) |
| Orquestração | n8n Community, self-hosted em Docker |
| IA | Google Gemini `gemini-3.5-flash-lite` via nó LangChain do n8n, temperatura 0,1 (plano gratuito) |
| Banco | Airtable: Catálogo (43 produtos), Substituições (24 trocas com fonte), Aprendizados (apelidos novos), Pedidos, Itens do pedido, Eventos |
| Pagamento | Asaas Sandbox: cobrança Pix, copia e cola e consulta de status |
| Receita | Página baixada pelo n8n; ingredientes lidos do JSON-LD `recipeIngredient` |

### O fluxo

![Fluxo completo no n8n, 32 nós](docs/prints/23_n8n_fluxo_completo_32_nos.png)

```mermaid
flowchart LR
    A[Mensagem no chat] --> B{Catálogo em cache?}
    B -- não --> C[Airtable: catálogo + trocas aprovadas] --> D
    B -- sim --> D[Entender mensagem]
    D --> E{Link de receita?}
    E -- sim --> F[Baixar página e ler ingredientes] --> G
    E -- não --> H{Precisa de IA?}
    H -- sim --> G[Gemini devolve JSON]
    G --> I[Aplicar no carrinho com travas]
    H -- não --> J[Resposta pronta: menu, carrinho, fechar]
    I --> K{Fechar?}
    J --> K
    K -- sim --> L[Asaas: cobrança Pix]
    K -- paguei --> M[Asaas: consultar status] --> N[Airtable: gravar pedido e itens]
    L --> O[Registrar evento]
    M --> O
    K -- resposta --> O
    O --> P[Responder o cliente]
```

### Decisões que importam

**A IA entende, o código decide.** O Gemini recebe o catálogo, o carrinho e a última mensagem do atendente, e só pode devolver um JSON com operações (adicionar, remover, definir), dúvidas e o que não temos. Quem calcula preço, confere estoque e monta a resposta é um nó de código. Código de produto que não existe no catálogo é descartado.

**Atalho não gasta IA.** "oi", "menu", número de categoria, "carrinho", "fechar" e "paguei" são respondidos por regra, em menos de 1 segundo. A IA só entra quando é pedido em texto livre ou link.

**Troca só com fonte.** As 24 trocas da tabela Substituições foram montadas a partir de guias de culinária (Purdue Extension, TudoGostoso, Band Receitas, Vitat), com o que muda no prato e um nível de risco. O texto "o que muda" vem da tabela, nunca da IA. Ingrediente estrutural, como fermento, farinha e gelatina, tem risco alto: o sistema avisa que falta e não sugere troca. Uma troca nova só vale depois de aprovada.

**Receita em três grupos.** O link é baixado e os ingredientes saem dos dados estruturados da página. Os principais (massa, carne, molho) vão para o carrinho. Os básicos (sal, alho, cebola) aparecem como "talvez você já tenha em casa". O que o mercado não tem vem numa lista. Se o site bloquear o acesso, o sistema monta pelo nome do prato no link e avisa.

**Aprende apelido novo, com trava contra trote.** Quando o cliente chama um produto de um jeito que não está no catálogo ("refrigerante de cola") e a IA acerta, o termo fica guardado como candidato. Ele só é gravado depois que o cliente paga, porque pagar é a prova de que a IA entendeu certo. Na tabela Aprendizados, o termo vira oficial quando 2 clientes diferentes pagaram com ele, ou quando o dono muda o status para "Oficial". Se o dono marcar "Rejeitado", o termo nunca mais volta. O apelido oficial passa a valer na hora, na próxima mensagem de qualquer cliente, sem treinar modelo nenhum: ele entra na lista "Como o povo chama" que vai junto com o catálogo para a IA.

**"Me dá uma ideia" sem gastar IA.** Quem não sabe o que pedir recebe 2 perguntas (pra quê e pra quantas pessoas) e 3 combos com preço, montados por regra só com o que tem em estoque. A quantidade acompanha o número de pessoas, e quem já disse que prefere zero recebe refrigerante zero no combo. Responder 1, 2 ou 3 coloca tudo no carrinho. Se no meio o cliente pede outra coisa ("2 coca"), o bot sai da sugestão e atende o pedido.

![Me dá uma ideia](docs/prints/24_chat_me_da_uma_ideia_3_combos.jpg)

**+18 e Pix sem duplicar.** Bebida alcoólica fica em espera até o "sim". Se o cliente manda "fechar" de novo com o mesmo valor, recebe o mesmo Pix, sem criar outra cobrança.

**Medir tudo.** Cada mensagem gera uma linha na tabela Eventos com a mensagem, a resposta, o tempo, se usou IA, a intenção e erro. Se o Airtable falhar, a resposta ao cliente sai do mesmo jeito.

![Tabela Eventos no Airtable](docs/prints/22_airtable_eventos_cada_mensagem.jpg)

### Telas

| | |
|---|---|
| ![Troca](docs/prints/21_chat_troca_manjericao_oregano_aceita.png) | ![+18](docs/prints/13_chat_carrinho_ia_maior18.jpg) |
| Troca de manjericão por orégano, explicando o que muda | Confirmação de idade antes da cerveja |
| ![Pix](docs/prints/14_chat_fechar_gera_pix.jpg) | ![Pago](docs/prints/16_chat_paguei_pagamento_confirmado.jpg) |
| "fechar" gera o Pix copia e cola (dados pessoais borrados) | "paguei" confere no Asaas e confirma |
| ![Pedido](docs/prints/19_airtable_pedido_pago.jpg) | ![Itens](docs/prints/18_airtable_itens_do_pedido_gravados.jpg) |
| Pedido gravado como pago | Itens ligados ao pedido e ao catálogo |

### Por que não está no WhatsApp

O plano era WhatsApp Cloud API. Na hora de ligar o número de teste, a Meta bloqueou a conta com "Falha na integração: você foi impedido temporariamente", três vezes no mesmo dia ([print](docs/prints/11_meta_bloqueio_temporario_05-11.jpg)). Em vez de parar, troquei a porta de entrada pelo chat do n8n. O resto do fluxo não depende do canal: para ligar WhatsApp ou Telegram, basta trocar o primeiro nó e o último.

### Limites e próximos passos

- O tempo com IA passa de 10 s em cerca de 1 a cada 4 mensagens, por causa da fila do plano gratuito do Gemini. Próximo passo: avisar "um instante" depois de 3 s e testar um modelo pago para comparar.
- Os testes foram feitos por mim, com frases que eu escrevi. O próximo teste é com pessoas de verdade.
- Ainda não implementado: áudio, foto da lista escrita à mão e painel do dono.

### Como rodar

1. Suba o n8n com Docker e importe `workflow/atendimento_carrinho_ia.json`.
2. Crie as credenciais: Google Gemini, Airtable (token pessoal) e Asaas Sandbox (cabeçalho `access_token`).
3. Monte a base no Airtable com `testes/catalogo.csv` e as tabelas citadas acima, e troque os IDs de base e tabela nos nós.
4. Publique o fluxo e abra a URL pública do chat.

As frases de teste e o gabarito estão em [`testes/frases_de_teste.md`](testes/frases_de_teste.md). Para repetir o teste no seu n8n, rode `node testes/rodar_testes.mjs` (Node 18 ou mais novo): ele manda os 38 casos, cada uma numa conversa nova, confere o carrinho e mostra o acerto e o tempo.
