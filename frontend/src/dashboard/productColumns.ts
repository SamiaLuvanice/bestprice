export const productColumns = ['Produto', 'Último preço', 'Variação', 'Menor preço', 'Situação', 'Última leitura', 'Ações']

/** Estado de uma linha de “Seus produtos”: ocupada em “Atualizar agora” e mensagem da própria linha. */
export type RowState = { busy: boolean; message: string | null }
