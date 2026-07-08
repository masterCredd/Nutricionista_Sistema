# Prompt 6 — Geração e histórico de planos alimentares

Agora vamos implementar a funcionalidade de geração de plano alimentar com IA. Esta funcionalidade está no perfil do paciente, na seção "Planos Alimentares".

## Fluxo completo

1. A nutricionista clica no botão "Gerar Plano Alimentar" no perfil do paciente
2. O sistema exibe um loading indicando que o plano está sendo gerado
3. O sistema lê automaticamente todos os dados do perfil do paciente no Supabase
4. O sistema chama a Serverless Function `/api/gerar-plano` que por sua vez chama a API da Anthropic
5. O plano gerado é exibido na tela para revisão
6. A nutricionista pode editar qualquer opção diretamente na tela
7. Ao clicar em "Salvar Plano", o plano é salvo no Supabase vinculado ao paciente com a data de geração

## Serverless Function — `/api/gerar-plano`

Criar o arquivo `/api/gerar-plano.js` no projeto. Essa função deve:
- Receber os dados do paciente via POST
- Usar a variável de ambiente `ANTHROPIC_API_KEY` para autenticar na API da Anthropic
- Montar o prompt com os dados do paciente
- Chamar a API da Anthropic e retornar o plano gerado em formato JSON

## Prompt da IA — dentro da Serverless Function

O prompt enviado para a API da Anthropic deve seguir este modelo:

"Você é um assistente especializado em nutrição. Com base nos dados do paciente abaixo, gere um plano alimentar semanal completo e personalizado.

Dados do paciente:
- Nome: {nome}
- Idade: {idade}
- Peso: {peso}kg
- Altura: {altura}cm
- IMC: {imc}
- Objetivo: {objetivos}
- Nível de atividade física: {nivel_atividade}
- Patologias: {patologias}
- Restrições alimentares: {restricoes_alimentares}
- Alergias: {alergias}
- Refeições por dia: {refeicoes_por_dia}
- Horário que acorda: {horario_acorda}
- Horário que dorme: {horario_dorme}
- Suplementos em uso: {suplementos}

Para cada uma das 5 refeições abaixo, gere exatamente 5 opções de refeição. As opções devem respeitar todas as restrições, alergias e o objetivo do paciente.

Refeições: Café da manhã, Lanche da manhã, Almoço, Lanche da tarde, Jantar.

Retorne APENAS um JSON válido, sem texto adicional, neste formato exato:
{
  'cafe_da_manha': ['opção 1', 'opção 2', 'opção 3', 'opção 4', 'opção 5'],
  'lanche_da_manha': ['opção 1', 'opção 2', 'opção 3', 'opção 4', 'opção 5'],
  'almoco': ['opção 1', 'opção 2', 'opção 3', 'opção 4', 'opção 5'],
  'lanche_da_tarde': ['opção 1', 'opção 2', 'opção 3', 'opção 4', 'opção 5'],
  'jantar': ['opção 1', 'opção 2', 'opção 3', 'opção 4', 'opção 5']
}"

## Exibição do plano gerado

O plano deve ser exibido em cards separados por refeição, na seguinte estrutura:

- ☀️ Café da manhã — 5 opções listadas, cada uma editável
- 🍎 Lanche da manhã — 5 opções listadas, cada uma editável
- 🥗 Almoço — 5 opções listadas, cada uma editável
- 🍊 Lanche da tarde — 5 opções listadas, cada uma editável
- 🌙 Jantar — 5 opções listadas, cada uma editável

Cada opção deve ter um campo de texto editável para que a nutricionista possa ajustar antes de salvar.

## Salvamento no Supabase

- O plano é salvo na tabela `planos_alimentares` vinculado ao paciente via `paciente_id`
- O campo `conteudo` recebe o JSON completo do plano
- Após salvar, exibir mensagem de sucesso e atualizar o histórico de planos do paciente

## Histórico de planos

- Exibir todos os planos salvos em ordem cronológica decrescente (mais recente primeiro)
- Cada plano exibe a data de geração
- Ao clicar em um plano do histórico, exibir o conteúdo completo nos mesmos cards de refeição

## Regras importantes
- Usar o modelo `claude-sonnet-4-20250514` na chamada da API da Anthropic
- Nunca expor a `ANTHROPIC_API_KEY` no frontend — ela deve ser usada apenas na Serverless Function
- Exibir mensagem de erro amigável caso a geração falhe
- O botão "Salvar Plano" só deve aparecer após o plano ser gerado

## Design
- Seguir o mesmo padrão visual do sistema (verde e branco)
- Cards de refeição com ícone, título e lista de opções
- Botão "Gerar Plano Alimentar" em destaque no topo da seção
- Botão "Salvar Plano" visível abaixo dos cards após a geração
