# Uso de dublês

Use fake ou mock para fronteira externa: PostgreSQL em teste rápido, fetch em teste de UI, relógio em regra temporal. Para provar persistência e health, inclua teste separado com PostgreSQL real. Não simule toda a aplicação nem verifique apenas ordem de chamadas internas. Teste a resposta HTTP e o estado visível que o usuário observa.
