# Plano

O CI registrou e-mail vazio ao submeter. Ao montar o login, a aplicação agenda o foco no título com requestAnimationFrame. Essa transferência pode interromper a digitação simulada, que envia as teclas ao elemento ativo e cede a execução entre elas.

Em frontend/src/research.test.tsx, preencher as credenciais com eventos de mudança nos campos identificados pelos rótulos e acionar o botão Entrar. Preservar a confirmação da segunda conta e a asserção do rascunho vazio ao restaurar o histórico. Aguardar por mais tempo o botão da conta não corrige um envio bloqueado pela validação. Os testes dedicados do formulário continuam cobrindo suas interações.
