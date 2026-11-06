# Plano — 0036

1. Investigar primeiro a importação pública por clipboard e Ctrl+V no documento
   autorizado. Pequeno HTML inline com layer-name e texto editável comprova a
   integração antes do gerador. Nenhum endpoint interno é chamado.
2. Gerar referência usando React/Vite reais em contexto local isolado, com API
   simulada apenas para sessão demonstrativa e pesquisas vazias; sem acesso ao
   backend/contas. Renderizar /app/dashboard e resolver CSS computado por viewport.
3. Serializar clone visual para HTML inline, com assets reais incorporados quando
   suportados e sem scripts/eventos/URLs de sessão. Registrar conversões e hashes.
4. Papel de clipboard: escrita explícita do HTML gerado por mecanismo público do
   Windows; não ler conteúdo anterior. Playwright ativa Move, limpa seleção e
   executa a ação pública Paste. Confirmar IDs no DOM/camadas e testar edição real.
5. sync --screen dashboard [--viewport desktop|tablet|mobile] usa o lock existente,
   manifesto local persistente com estado pending antes da importação e synced
   somente após validação. Pending/failed bloqueia retry cego; nome reservado e
   fingerprint do DOM detectam alteração manual. Conteúdo igual valida e reutiliza;
   conteúdo diferente exige --new-version, preservando a tela anterior.
6. Manter CLI/API antigas, relatórios locais ignorados, testes Node e opt-in live.
   Falha HTML é reportada, sem desenhar centenas de elementos automaticamente;
   ferramentas visuais existentes permanecem alternativa explícita.

Documentação pública consultada: https://paper.design/docs/paste/html
(somente estilos inline; layer-name é suportado; imagens e estilos têm limites).
Verificação inclui screenshots do HTML de referência e canvas e edição de texto
sentinela com restauração. Limitação de clipboard, assets ou fidelidade bloqueia
verified da capacidade correspondente; não é convertida em sucesso por clique.
