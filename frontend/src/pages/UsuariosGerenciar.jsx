import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './UsuariosGerenciar.css';

const USUARIO_VAZIO = { nome: '', email: '', senha: '', perfil: 'recepcao', permissoes: [] };

const PERFIS_OPCOES = [
  { valor: 'admin', label: 'Administrador' },
  { valor: 'recepcao', label: 'Recepcao / Coletador' },
  { valor: 'bioquimico', label: 'Bioquimico' },
  { valor: 'usuario', label: 'Outro' },
];

const PERFIS_LABEL = Object.fromEntries(PERFIS_OPCOES.map((p) => [p.valor, p.label]));

const PERMISSOES_OPCOES = [
  { chave: 'pacientes_gerenciar', label: 'Cadastrar Pacientes' },
  { chave: 'exames_gerenciar', label: 'Gerenciar Exames' },
  { chave: 'tubos_gerenciar', label: 'Gerenciar Tubos' },
  { chave: 'laboratorios_gerenciar', label: 'Gerenciar Laboratorios' },
];

const PERMISSOES_LABEL = Object.fromEntries(PERMISSOES_OPCOES.map((p) => [p.chave, p.label]));

const PERMISSOES_PADRAO_POR_CARGO = {
  recepcao: ['pacientes_gerenciar'],
  bioquimico: ['exames_gerenciar', 'tubos_gerenciar'],
};

const iconeEditar = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const iconeExcluir = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);
const iconePower = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v10" /><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /></svg>
);
const iconeUsuario = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

function UsuariosGerenciar() {
  const { usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(USUARIO_VAZIO);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarUsuarios() {
    setCarregando(true);
    try {
      const resposta = await api.get('/usuarios/');
      setUsuarios(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar os usuarios.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function abrirNovo() {
    setForm(USUARIO_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEdicao(usuarioEditado) {
    setForm({
      nome: usuarioEditado.nome || '',
      email: usuarioEditado.email || '',
      senha: '',
      perfil: usuarioEditado.perfil || 'recepcao',
      permissoes: usuarioEditado.permissoes || [],
    });
    setEditandoId(usuarioEditado.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(USUARIO_VAZIO);
  }

  function handleChange(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleMudarCargo(novoPerfil) {
    setForm((atual) => {
      if (atual.permissoes.length > 0) {
        return { ...atual, perfil: novoPerfil };
      }
      const permissoesPadrao = PERMISSOES_PADRAO_POR_CARGO[novoPerfil] || [];
      return { ...atual, perfil: novoPerfil, permissoes: permissoesPadrao };
    });
  }

  function alternarPermissao(chave) {
    setForm((atual) => {
      const jaTem = atual.permissoes.includes(chave);
      const novasPermissoes = jaTem
        ? atual.permissoes.filter((p) => p !== chave)
        : [...atual.permissoes, chave];
      return { ...atual, permissoes: novasPermissoes };
    });
  }

  async function handleSalvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    const payload = {
      nome: form.nome,
      email: form.email,
      perfil: form.perfil,
      permissoes: form.perfil === 'admin' ? [] : form.permissoes,
    };
    if (form.senha) payload.senha = form.senha;

    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, payload);
        setMensagem('Usuario atualizado com sucesso.');
      } else {
        if (!form.senha) {
          setErro('Informe uma senha para o novo usuario.');
          setSalvando(false);
          return;
        }
        await api.post('/usuarios/', payload);
        setMensagem('Usuario cadastrado com sucesso.');
      }
      fecharForm();
      carregarUsuarios();
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.response?.data?.detail ||
        'Nao foi possivel salvar o usuario. Verifique os campos.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(usuarioLinha) {
    try {
      await api.put(`/usuarios/${usuarioLinha.id}`, { ativo: !usuarioLinha.ativo });
      carregarUsuarios();
    } catch {
      setErro('Nao foi possivel alterar o status do usuario.');
    }
  }

  async function handleExcluir(usuarioLinha) {
    const confirmar = window.confirm(`Excluir o usuario "${usuarioLinha.nome}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/${usuarioLinha.id}`);
      carregarUsuarios();
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.response?.data?.detail ||
        'Nao foi possivel excluir o usuario.'
      );
    }
  }

  return (
    <Layout>
      <div className="gerenciar">
        <Link to="/exames" className="gerenciar-voltar-topo">← Voltar para o dashboard</Link>

        <div className="gerenciar-cabecalho">
          <h1>Gerenciar usuarios</h1>
          <p>Cadastre usuarios e defina o que cada cargo pode acessar no sistema.</p>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        {!formAberto && (
          <button className="gerenciar-novo" onClick={abrirNovo}>
            + Novo usuario
          </button>
        )}

        {formAberto && (
          <form className="gerenciar-form" onSubmit={handleSalvar} autoComplete="off">
            <h2><span className="usuarios-secao-icone">{iconeUsuario}</span>{editandoId ? 'Editar usuario' : 'Novo usuario'}</h2>

            <div className="form-grid">
              <label>
                Nome *
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Nome completo"
                />
              </label>

              <label>
                Email *
                <input
                  type="email"
                  required
                  autoComplete="off"
                  name="novo-usuario-email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </label>

              <label>
                {editandoId ? 'Nova senha temporaria' : 'Senha temporaria *'}
                <input
                  type="password"
                  required={!editandoId}
                  autoComplete="new-password"
                  name="novo-usuario-senha"
                  value={form.senha}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  placeholder={editandoId ? 'Deixe em branco para nao alterar' : 'Senha de acesso'}
                />
              </label>

              <label>
                Cargo *
                <select value={form.perfil} onChange={(e) => handleMudarCargo(e.target.value)}>
                  {PERFIS_OPCOES.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {form.perfil === 'admin' ? (
              <p className="usuarios-permissoes-aviso">
                Administradores tem acesso total a todas as telas do sistema.
              </p>
            ) : (
              <div className="usuarios-permissoes">
                <span className="usuarios-permissoes-titulo">Permissoes de acesso</span>
                <div className="usuarios-permissoes-grid">
                  {PERMISSOES_OPCOES.map((opcao) => (
                    <label key={opcao.chave} className="usuarios-permissao-item">
                      <input
                        type="checkbox"
                        checked={form.permissoes.includes(opcao.chave)}
                        onChange={() => alternarPermissao(opcao.chave)}
                      />
                      {opcao.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="form-acoes">
              <button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="form-cancelar" onClick={fecharForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {carregando ? (
          <p>Carregando usuarios...</p>
        ) : (
          <table className="gerenciar-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Permissoes</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuarioLinha) => (
                <tr key={usuarioLinha.id}>
                  <td>{usuarioLinha.nome}</td>
                  <td>{usuarioLinha.email}</td>
                  <td>{PERFIS_LABEL[usuarioLinha.perfil] || usuarioLinha.perfil}</td>
                  <td>
                    {usuarioLinha.perfil === 'admin' ? (
                      <span className="tag tag-ativo">Acesso total</span>
                    ) : usuarioLinha.permissoes?.length ? (
                      <div className="usuarios-badges">
                        {usuarioLinha.permissoes.map((chave) => (
                          <span key={chave} className="usuarios-badge">
                            {PERMISSOES_LABEL[chave] || chave}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="usuarios-badge usuarios-badge-vazio">Somente consulta</span>
                    )}
                  </td>
                  <td>
                    <span className={`tag ${usuarioLinha.ativo ? 'tag-ativo' : 'tag-inativo'}`}>
                      {usuarioLinha.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {usuarioLinha.deve_trocar_senha && (
                      <span className="tag tag-inativo" style={{ marginLeft: 6 }}>
                        Senha temporaria
                      </span>
                    )}
                  </td>
                  <td className="gerenciar-acoes">
                    <button onClick={() => abrirEdicao(usuarioLinha)}>{iconeEditar}Editar</button>
                    <button onClick={() => alternarAtivo(usuarioLinha)}>
                      {iconePower}{usuarioLinha.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    {usuarioLinha.id !== usuarioLogado?.id && (
                      <button className="btn-excluir" onClick={() => handleExcluir(usuarioLinha)}>
                        {iconeExcluir}Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default UsuariosGerenciar;
