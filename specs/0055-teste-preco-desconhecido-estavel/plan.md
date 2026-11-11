# Plano

O teste de integração em `frontend/src/App.test.tsx` abre a rota diretamente com sessão, detalhe e histórico simulados na fronteira HTTP. O teste anterior inicia a espera pelo título antes de o React aplicar o resultado de detalhe e histórico. Uma pausa temporária na leitura do histórico reproduz o sintoma e permite comparar a mesma condição antes e depois da correção.

Renderizar a rota dentro de `act` para aguardar as atualizações das respostas simuladas. Após a renderização iniciar a importação do gráfico, aguardar sua conclusão em outro `act`. Asserções síncronas verificam o título, o preço indisponível, o histórico vazio e a ausência de zero. Esse ajuste mantém o mesmo contrato e não exige mudança de estado, temporizador ou código de produção.

Rodar cinco suítes completas consecutivas, lint e `build:check`. A reprodução controlada verifica a dependência do prazo da consulta, sem atribuir uma ordem exata de execução à falha histórica.
