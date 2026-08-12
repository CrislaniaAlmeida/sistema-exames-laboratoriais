/**
 * Extrai uma mensagem de erro exibivel a partir de uma resposta de API.
 *
 * O FastAPI devolve o campo "detail" de dois jeitos bem diferentes:
 *   - string, para erros de negocio levantados com HTTPException
 *     (ex: "Ja existe um paciente cadastrado com esse CPF.")
 *   - lista de objetos {loc, msg, type, ...}, para erro de validacao (422)
 *     do Pydantic (ex: campo obrigatorio vazio, CPF invalido).
 *
 * Renderizar esse segundo formato direto como texto quebra o React (ele
 * nao sabe exibir um objeto como filho). Esta funcao sempre devolve uma
 * string pronta para mostrar na tela.
 */
export function extrairMensagemErro(erro, mensagemPadrao = 'Nao foi possivel concluir a acao.') {
  const detail = erro?.response?.data?.detail;

  if (!detail) return mensagemPadrao;
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const mensagens = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return null;
        const campo = Array.isArray(item.loc)
          ? item.loc.filter((parte) => parte !== 'body').join('.')
          : null;
        return campo ? `${campo}: ${item.msg}` : item.msg;
      })
      .filter(Boolean);
    return mensagens.length ? mensagens.join(' | ') : mensagemPadrao;
  }

  return mensagemPadrao;
}
