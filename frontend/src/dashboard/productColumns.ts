export const productColumns = ['Produto', 'Preço atual', 'Variação', 'Menor preço', 'Disponibilidade', 'Preço observado', 'Ações']

/** Estado de uma linha de “Seus produtos”: ocupada em “Atualizar agora” e mensagem da própria linha. */
export type RowState = { busy: boolean; message: string | null }
