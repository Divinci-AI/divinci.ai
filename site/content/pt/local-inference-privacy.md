+++
title = "Divinci Local Inference — Política de Privacidade"
description = "Política de privacidade para a extensão Chrome Divinci Local Inference: o que é executado localmente no seu dispositivo e o que, em situações específicas com sessão iniciada, é enviado à Divinci."
template = "page.html"
+++

# Divinci Local Inference — Política de Privacidade

**Última atualização:** Junho de 2026

Esta política aplica-se especificamente à extensão Chrome **Divinci Local
Inference**. Para o website, as aplicações e os serviços da Divinci AI em
geral, consulte a nossa [Política de Privacidade](/pt/privacy-policy/)
principal.

A Divinci Local Inference executa um modelo de IA de pesos abertos (o Gemma 4
da Google) localmente no seu navegador, na sua GPU e — quando opta por
iniciar sessão — liga esse assistente local à sua conta Divinci para
funcionalidades opcionais assistidas pela cloud. Esta política explica
exatamente o que permanece no seu dispositivo e o que, em situações
específicas, é enviado à Divinci.

**Resumo:** Por predefinição, a extensão é apenas local — as suas conversas
com o modelo no dispositivo nunca saem do seu computador. Algumas
funcionalidades opcionais e claramente controladas (iniciar sessão, respostas
com conhecimento da página e chat em modo de conta) enviam dados à Divinci.
Estas são descritas abaixo. Não vendemos os seus dados, não apresentamos
anúncios nem os utilizamos para o rastrear na web.

## 1. O que permanece no seu dispositivo (predefinição)

- **As suas conversas com o modelo Gemma local.** Os prompts e as respostas
  são computados na sua GPU e não são registados, armazenados ou transmitidos
  pela extensão. (Exceções: as duas funcionalidades opcionais nas Secções 3 e
  4.)
- **Os ficheiros do modelo**, colocados em cache no seu navegador após a
  primeira transferência.
- **As suas definições** (modelo selecionado, predefinições de inferência,
  opções de privacidade), armazenadas localmente no seu navegador.

Quando **não tem sessão iniciada**, a extensão **não** envia qualquer
informação de navegação à Divinci.

## 2. Iniciar sessão na Divinci (opcional)

Se clicar em **Iniciar sessão / Registar**, a extensão conclui um início de
sessão OAuth padrão com o fornecedor de identidade da Divinci (Auth0). Em
caso de sucesso, recebemos e armazenamos **no seu dispositivo** um token de
acesso e o seu perfil básico (e-mail, nome e URL do avatar), para que a
extensão possa mostrar com que conta tem sessão iniciada e fazer pedidos
autenticados em seu nome. O token de acesso nunca sai do service worker em
segundo plano da extensão. Pode terminar sessão a qualquer momento a partir
do popup da barra de ferramentas, o que elimina os tokens armazenados.

## 3. Atividade de navegação web (apenas com sessão iniciada **e** com o painel aberto)

Para lhe indicar se a página que está a visualizar está coberta pelo índice
de conhecimento público-web partilhado da Divinci e para fundamentar
respostas nesse índice, a extensão — **apenas quando tem sessão iniciada e
tem o painel lateral da Divinci aberto numa página** — envia o seguinte para
a API da Divinci:

- **O endereço da página**, reduzido apenas à sua origem e caminho. A cadeia
  de consulta e o fragmento (as partes depois de `?` e `#`, que podem conter
  termos de pesquisa, tokens ou identificadores pessoais) são **removidos
  antes do envio**.
- **Uma impressão digital unidirecional (hash) do texto visível da página**,
  utilizada para detetar se o nosso índice está atualizado. **O conteúdo real
  da página não é enviado** — apenas este hash e o endereço reduzido.

Limites importantes:

- Isto acontece **apenas enquanto o painel lateral está aberto** numa página.
  Com o painel fechado, a extensão não envia nada sobre as páginas que
  visita.
- **Os sites sensíveis são totalmente ignorados** — a extensão não envia nada
  relativamente a páginas de início de sessão/conta, sites bancários e
  financeiros, webmail, portais de saúde, endereços locais/privados ou portas
  não padrão.
- É utilizado para consultar e atualizar o índice público-web, **não** para
  construir um perfil seu nem para direcionar publicidade.

O próprio índice partilhado é construído pela Divinci ao rastrear páginas web
**publicamente acessíveis** nos seus próprios servidores; esta extensão não
carrega conteúdo de páginas para o construir.

## 4. Respostas com conhecimento da página e chat em modo de conta (opcional)

- **Respostas com conhecimento da página (fundamentação).** Quando uma página
  está no índice e envia uma mensagem no painel lateral, a extensão envia **a
  sua mensagem e o endereço de página reduzido** à Divinci para obter
  contexto relevante, que é depois fornecido ao modelo local. Portanto, neste
  caso, a sua mensagem de chat sai efetivamente do seu dispositivo. Pode
  desativar isto — ver Secção 5.
- **Chat em modo de conta.** Se ativar *"Utilizar a minha conta Divinci"*
  para o chat, a sua conversa é enviada para os servidores da Divinci (para
  executar modelos e ferramentas alojados no servidor) e armazenada como uma
  transcrição na sua conta, tal como ao conversar em chat.divinci.app.
  Deixar esta opção desativada mantém o chat totalmente local.

## 5. Os seus controlos de privacidade

No popup, em **Definições avançadas → Privacidade**:

- **Obter contexto de página da Divinci** — quando desativado, a extensão
  nunca envia a sua mensagem para respostas com conhecimento da página (a sua
  consulta de chat permanece no seu dispositivo). Predefinição: ativado.
- **Permitir que a Divinci utilize os chats da minha conta** — quando
  desativado, a extensão solicita à Divinci que não utilize os seus chats em
  modo de conta para melhorar os seus serviços. Predefinição: ativado. (Isto
  envia um sinal de exclusão (opt-out) com os seus pedidos; o tratamento
  efetivo é aplicado pelos servidores da Divinci.)

Também pode manter-se **sem sessão iniciada** (totalmente local) ou
**terminar sessão** a qualquer momento para interromper tudo o que está
descrito nas Secções 2 a 4.

## 6. Para onde vão os dados

- **huggingface.co** (e a CDN `cas-bridge.xethub.hf.co`) — para transferir os
  ficheiros do modelo, sujeito à [Política de Privacidade da Hugging
  Face](https://huggingface.co/privacy).
- **Fornecedor de identidade da Divinci** (Auth0) — apenas durante o início
  de sessão.
- **API da Divinci** (`api.divinci.app`) — para as funcionalidades com sessão
  iniciada nas Secções 3 e 4.

## 7. O que **não** fazemos

- **Não** vendemos nem alugamos os seus dados.
- **Não** apresentamos anúncios nem utilizamos os seus dados para publicidade
  ou rastreio entre sites.
- **Não** enviamos o **conteúdo** das páginas que visita (apenas o endereço
  reduzido e um hash unidirecional, conforme a Secção 3).
- **Não** transmitimos nada sobre a sua navegação quando não tem sessão
  iniciada ou quando o painel lateral está fechado.

## 8. Permissões

- **offscreen** — executar o modelo WebGPU.
- **storage** — armazenar localmente as definições e a preferência de modelo
  em cache.
- **identity** — concluir o início de sessão OAuth na sua conta Divinci
  (Secção 2).
- **permissões de anfitrião** (`api.divinci.app` e a origem de início de
  sessão do Auth0) — fazer os pedidos autenticados descritos nas Secções 2 a
  4.
- **content script em todos os sites** — desenhar o painel lateral e, apenas
  enquanto está aberto e tem sessão iniciada, executar a verificação do
  índice de páginas descrita na Secção 3. O script lê o título, o endereço e
  o texto visível da página **localmente** para calcular o hash; não
  transmite o conteúdo da página.
- **externally_connectable** (apenas domínios da Divinci AI) — permitir que o
  chat.divinci.app utilize o modelo local através de uma porta
  `chrome.runtime`.

## 9. Código aberto

A extensão tem licença Apache-2.0; o código-fonte está disponível em
[github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Alterações a esta política

Se alterarmos a forma como a extensão trata os dados, atualizaremos esta
política e incrementaremos a versão da extensão (apresentada no cartão de
`chrome://extensions`).

## 11. Contacto

Dúvidas? Envie um e-mail para [mike@divinci.ai](mailto:mike@divinci.ai).
