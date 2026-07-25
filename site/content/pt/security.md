+++
title = "Segurança"
description = "Como a Divinci AI protege os seus dados — desidentificação, controle de acesso, registro de auditoria e respostas honestas sobre onde estamos em relação às certificações formais."
template = "legal-document.html"

[extra]
last_updated = "2026-07-25"
+++

A segurança é parte central de como construímos nossos produtos. Esta página
descreve o que é de fato verdade sobre nossa arquitetura e nossas práticas
hoje — não uma lista de marketing. Onde ainda não concluímos algo (uma
auditoria formal, uma certificação), dizemos isso de forma clara, em vez de
dar a entender o contrário.

## Arquitetura preparada para HIPAA

![Arquitetura preparada para HIPAA](/brand/badges/hipaa-ready.svg)

Incorporamos por padrão à plataforma as salvaguardas técnicas que um fluxo de
trabalho sujeito à HIPAA exige:

- **Desidentificação antes do armazenamento ou do processamento por IA.** O
  conteúdo do chat pode ser encaminhado por uma etapa automática de redação de
  PII/PHI (Microsoft Presidio, com um modelo ajustado para texto clínico
  disponível para contextos médicos) antes de tocar nosso banco de dados,
  nossos provedores de IA ou a busca/recuperação — detectando todas as 18
  categorias de identificadores do método Safe Harbor (porto seguro) da HIPAA.
  Essa etapa falha de forma fechada: se a redação não puder ser executada, a
  mensagem é rejeitada em vez de ser armazenada silenciosamente sem redação.
- **Registro de auditoria à prova de adulteração.** O acesso a registros
  sensíveis é gravado em um log encadeado por hash, projetado de modo que as
  entradas não possam ser alteradas silenciosamente depois do fato.
- **Controle de acesso baseado em papéis e no nível do recurso.** Tanto papéis
  válidos em toda a plataforma quanto permissões por recurso determinam quem
  pode ver o quê.
- **Criptografia em trânsito e em repouso**, com criptografia em nível de
  campo disponível para dados sensíveis designados.

**O que isto não é:** uma certificação de conformidade com a HIPAA. Não
existe certificado de HIPAA emitido por órgão governamental — a conformidade
é uma combinação de salvaguardas técnicas (acima), políticas administrativas
por escrito e Acordos de Parceria Comercial assinados (Business Associate
Agreement, BAA) com todo fornecedor presente no caminho dos dados, avaliada
caso a caso para cada relação com um cliente. Se você precisa processar
Informações de Saúde Protegidas (PHI) conosco sob um Acordo de Parceria
Comercial (BAA),
[fale com a gente](https://meetings.hubspot.com/michael-mooring/divinci-ai) —
vamos analisar juntos o que é necessário para o seu caso de uso específico.

## Proteção de dados

### Criptografia

- **Em trânsito**: TLS em toda parte, entre os clientes, nossa borda e nossa
  infraestrutura de origem.
- **Em repouso**: criptografia em nível de provedor no nosso datastore
  principal e no armazenamento de objetos, além de uma camada dedicada de
  criptografia em nível de campo para campos sensíveis designados.
- **Gestão de segredos**: credenciais e chaves de API são gerenciadas por um
  gerenciador de segredos centralizado, e não codificadas no código ou
  armazenadas em configuração em texto simples. A produção está configurada
  para falhar de forma fechada, em vez de recorrer silenciosamente a
  credenciais desatualizadas caso o serviço de segredos fique inacessível.

### Minimização de dados

- A desidentificação (acima) significa que as PII/PHI originais são
  descartadas, e não retidas, onde quer que esse pipeline seja executado — a
  menor pegada possível caso algum sistema posterior venha a ser comprometido.
- Os logs são, por política, apenas de metadados: não gravamos conteúdo de
  mensagens, e-mails ou outros dados pessoais nos logs da aplicação nem nas
  mensagens de erro.

### Controles de acesso

- **Autenticação** via Auth0.
- **Controle de acesso baseado em papéis** (em nível de plataforma) somado a
  **permissões por recurso** (em nível de documento/workspace) — menor
  privilégio por padrão.
- **Revisões trimestrais de acesso e de configuração** dos serviços de
  produção.

## Segurança da aplicação

- **Defesa contra XSS na fronteira de renderização**: o conteúdo gerado por
  usuários e por IA é sanitizado (DOMPurify) em todo lugar onde é renderizado
  como HTML; a injeção de HTML bruto a partir de fontes não confiáveis não é
  permitida.
- **Testes de autorização**: realizamos nossos próprios testes de segurança
  manuais e assistidos por IA contra staging e produção, incluindo sondagens
  autenticadas de autorização/IDOR — o que ainda **não** é um programa
  recorrente de testes de intrusão (pentest) por terceiros, e não vamos
  alegar que temos um enquanto ele não existir.
- **Revisão de dependências e de código**: revisão de código padrão em todas
  as alterações; atualizações de dependências acompanhadas pelo nosso
  ferramental normal de build.

## Disponibilidade e monitoramento

- **Monitoramento sintético** nos endpoints voltados ao cliente, acionando o
  plantão via PagerDuty em minutos após uma indisponibilidade real, e não
  apenas em caso de erros de servidor — verificações que conferem o conteúdo,
  não apenas "retornou 200?".
- **Infraestrutura multirregião** (borda Cloudflare + origem no Google Cloud)
  com backups automatizados no nosso datastore principal.
- Atualmente **não** publicamos um SLA contratual de disponibilidade
  (uptime). Se o seu caso de uso exigir um, pergunte — podemos conversar
  sobre o que é realista para a sua implantação.

## Resposta a incidentes

Mantemos um processo documentado de resposta a incidentes: detecção e
classificação, contenção, uma avaliação honesta sobre se um incidente chega a
constituir uma violação de dados reportável, remediação e um post-mortem sem
culpados que realimenta aquilo que passamos a monitorar. Se você é cliente sob
um Acordo de Parceria Comercial (BAA) conosco, esse acordo especifica nossas
obrigações de notificação a você — aqueles termos prevalecem, não esta página.

Para relatar uma preocupação de segurança ou uma suspeita de vulnerabilidade,
escreva para **security@divinci.ai**. Atualmente **não** mantemos um programa
formal de bug bounty (recompensa por bugs); ainda assim, levamos os relatos a
sério e trabalharemos com você de boa-fé.

## Onde estamos em relação às certificações formais

Sendo diretos sobre isso, já que muitas páginas de segurança não são:

- **HIPAA**: veja "Arquitetura preparada para HIPAA", acima. Se um Acordo de
  Parceria Comercial (BAA) se aplica ou não depende da sua relação
  específica conosco — avaliamos isso por cliente, e não como uma alegação
  genérica.
- **SOC 2**: ainda não iniciada. Está no nosso roteiro; atualizaremos esta
  página quando houver algo real a relatar — não antes.
- **ISO 27001, FedRAMP, PCI DSS**: não possuímos essas certificações. Os
  pagamentos com cartão são processados pela Stripe; a Divinci não armazena
  diretamente dados de portadores de cartão.

Preferimos alegar de menos aqui e ser confiáveis a alegar demais e ter de
voltar atrás.

### Contato

Dúvidas sobre segurança, relatos de vulnerabilidade ou questões de
conformidade para um negócio específico: **security@divinci.ai**
