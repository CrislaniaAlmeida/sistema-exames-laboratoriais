import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import './PacientesGerenciar.css';

const PACIENTE_VAZIO = {
  nome: '', nome_social: '', cpf: '', rg: '', data_nascimento: '', sexo: '',
  nacionalidade: '', naturalidade: '', nome_mae: '',
  celular: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  cartao_sus: '', convenio: '', carteira_convenio: '', crm_medico_solicitante: '',
  toma_medicacao: false, medicamentos: [], observacoes_clinicas: '',
};

const MAXIMO_MEDICAMENTOS = 6;

const iconesSecao = {
  pessoais: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
  ),
  contato: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
  ),
  endereco: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  saude: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>
  ),
};

const iconeEditar = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const iconeExcluir = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
);
const iconeExames = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2v6.34a2 2 0 0 1-.4 1.2L4 16a2 2 0 0 0 1.6 3.2h12.8A2 2 0 0 0 20 16l-4.6-6.46a2 2 0 0 1-.4-1.2V2" /><path d="M8.5 2h7" /></svg>
);
const iconeBusca = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
);
const iconePaciente = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
);

function PacientesGerenciar() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [termoFiltro, setTermoFiltro] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(PACIENTE_VAZIO);

  const [medicamentosPopupAberto, setMedicamentosPopupAberto] = useState(false);
  const [medicamentosTemp, setMedicamentosTemp] = useState(['']);

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarPacientes() {
    setCarregando(true);
    try {
      const resposta = await api.get('/pacientes/');
      setPacientes(resposta.data);
    } catch {
      setErro('Nao foi possivel carregar os pacientes.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPacientes();
  }, []);

  const buscaAtiva = termoFiltro.trim().length > 0;

  const pacientesFiltrados = !buscaAtiva ? [] : pacientes.filter((p) => {
    const termo = termoFiltro.trim().toLowerCase();
    return (
      p.nome.toLowerCase().includes(termo) ||
      p.cpf.includes(termo) ||
      p.codigo.toLowerCase().includes(termo)
    );
  });

  function abrirNovo() {
    setForm(PACIENTE_VAZIO);
    setEditandoId(null);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function abrirEdicao(paciente) {
    setForm({
      ...PACIENTE_VAZIO,
      ...paciente,
      data_nascimento: paciente.data_nascimento || '',
    });
    setEditandoId(paciente.id);
    setFormAberto(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
    setForm(PACIENTE_VAZIO);
  }

  function handleChange(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleCepBlur() {
    const cepLimpo = (form.cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();
      if (!dados.erro) {
        setForm((atual) => ({
          ...atual,
          logradouro: dados.logradouro || atual.logradouro,
          bairro: dados.bairro || atual.bairro,
          cidade: dados.localidade || atual.cidade,
          estado: dados.uf || atual.estado,
        }));
      }
    } catch {
      // se o servico dos correios falhar, o recepcionista preenche a mao
    } finally {
      setBuscandoCep(false);
    }
  }

  function handleTomaMedicacao(valor) {
    if (valor) {
      setForm((atual) => ({ ...atual, toma_medicacao: true }));
      setMedicamentosTemp(form.medicamentos.length ? [...form.medicamentos] : ['']);
      setMedicamentosPopupAberto(true);
    } else {
      setForm((atual) => ({ ...atual, toma_medicacao: false, medicamentos: [] }));
    }
  }

  function abrirEdicaoMedicamentos() {
    setMedicamentosTemp(form.medicamentos.length ? [...form.medicamentos] : ['']);
    setMedicamentosPopupAberto(true);
  }

  function alterarLinhaMedicamento(indice, valor) {
    setMedicamentosTemp((atual) => atual.map((m, i) => (i === indice ? valor : m)));
  }

  function adicionarLinhaMedicamento() {
    if (medicamentosTemp.length < MAXIMO_MEDICAMENTOS) {
      setMedicamentosTemp((atual) => [...atual, '']);
    }
  }

  function removerLinhaMedicamento(indice) {
    setMedicamentosTemp((atual) => atual.filter((_, i) => i !== indice));
  }

  function salvarMedicamentos() {
    const lista = medicamentosTemp.map((m) => m.trim()).filter(Boolean);
    setForm((atual) => ({ ...atual, toma_medicacao: true, medicamentos: lista }));
    setMedicamentosPopupAberto(false);
  }

  function cancelarMedicamentos() {
    setMedicamentosPopupAberto(false);
    if (form.medicamentos.length === 0) {
      setForm((atual) => ({ ...atual, toma_medicacao: false }));
    }
  }

  function montarPayload() {
    const payload = { ...form };
    Object.keys(payload).forEach((campo) => {
      if (payload[campo] === '') payload[campo] = null;
    });
    return payload;
  }

  async function handleSalvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    const payload = montarPayload();

    try {
      if (editandoId) {
        await api.put(`/pacientes/${editandoId}`, payload);
        setMensagem('Paciente atualizado com sucesso.');
      } else {
        const resposta = await api.post('/pacientes/', payload);
        setEditandoId(resposta.data.id);
        setForm((atual) => ({ ...atual, codigo: resposta.data.codigo }));
        setMensagem(
          `Paciente cadastrado com sucesso. Codigo gerado: ${resposta.data.codigo}. ` +
          `Agora voce pode cadastrar os exames solicitados.`
        );
      }
      carregarPacientes();
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.response?.data?.detail ||
        'Nao foi possivel salvar o paciente. Verifique os campos.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(paciente) {
    const confirmar = window.confirm(`Excluir o cadastro de "${paciente.nome}"?`);
    if (!confirmar) return;

    try {
      await api.delete(`/pacientes/${paciente.id}`);
      carregarPacientes();
    } catch (erroRequisicao) {
      setErro(erroRequisicao.response?.data?.detail || 'Nao foi possivel excluir o paciente.');
    }
  }

  return (
    <Layout>
      <div className="gerenciar gerenciar-pacientes">
        <Link to="/exames" className="gerenciar-voltar-topo">← Voltar para o dashboard</Link>

        <div className="gerenciar-cabecalho">
          <h1>Gerenciar pacientes</h1>
          <p>Cadastre os dados do paciente para atendimento e coleta.</p>
        </div>

        <div className="paciente-banner paciente-banner-lista">
          <span className="paciente-banner-legenda">Coleta e identificacao de amostras com rastreabilidade total</span>
        </div>

        {erro && <p className="gerenciar-erro">{erro}</p>}
        {mensagem && <p className="gerenciar-mensagem">{mensagem}</p>}

        {!formAberto && (
          <button className="gerenciar-novo" onClick={abrirNovo}>
            + Novo paciente
          </button>
        )}

        {formAberto && (
          <form className="gerenciar-form" onSubmit={handleSalvar} autoComplete="off">
            <h2>{editandoId ? `Editar paciente ${form.codigo || ''}` : 'Novo paciente'}</h2>

            <h3 className="paciente-secao-titulo"><span className="paciente-secao-icone">{iconesSecao.pessoais}</span>Dados pessoais</h3>
            <div className="form-grid">
              <label>
                Nome *
                <input type="text" required autoComplete="off" value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} />
              </label>
              <label>
                Nome social
                <input type="text" autoComplete="off" value={form.nome_social} onChange={(e) => handleChange('nome_social', e.target.value)} />
              </label>
              <label>
                CPF *
                <input type="text" required autoComplete="off" value={form.cpf} onChange={(e) => handleChange('cpf', e.target.value)} placeholder="000.000.000-00" />
              </label>
              <label>
                RG
                <input type="text" autoComplete="off" value={form.rg} onChange={(e) => handleChange('rg', e.target.value)} />
              </label>
              <label>
                Data de nascimento *
                <input type="date" required value={form.data_nascimento} onChange={(e) => handleChange('data_nascimento', e.target.value)} />
              </label>
              <label>
                Sexo
                <select value={form.sexo} onChange={(e) => handleChange('sexo', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </label>
              <label>
                Nacionalidade
                <input type="text" autoComplete="off" value={form.nacionalidade} onChange={(e) => handleChange('nacionalidade', e.target.value)} placeholder="Brasileira" />
              </label>
              <label>
                Naturalidade
                <input type="text" autoComplete="off" value={form.naturalidade} onChange={(e) => handleChange('naturalidade', e.target.value)} placeholder="Cidade de nascimento" />
              </label>
              <label>
                Nome da mae
                <input type="text" autoComplete="off" value={form.nome_mae} onChange={(e) => handleChange('nome_mae', e.target.value)} />
              </label>
            </div>

            <h3 className="paciente-secao-titulo"><span className="paciente-secao-icone">{iconesSecao.contato}</span>Contato</h3>
            <div className="form-grid">
              <label>
                Celular
                <input type="text" autoComplete="off" value={form.celular} onChange={(e) => handleChange('celular', e.target.value)} placeholder="(00) 00000-0000" />
              </label>
              <label>
                Telefone
                <input type="text" autoComplete="off" value={form.telefone} onChange={(e) => handleChange('telefone', e.target.value)} placeholder="(00) 0000-0000" />
              </label>
              <label>
                Email
                <input type="email" autoComplete="off" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </label>
            </div>

            <h3 className="paciente-secao-titulo"><span className="paciente-secao-icone">{iconesSecao.endereco}</span>Endereco</h3>
            <div className="form-grid">
              <label>
                CEP
                <input
                  type="text"
                  autoComplete="off"
                  value={form.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </label>
              <label className="form-full">
                Logradouro {buscandoCep && <span className="paciente-buscando-cep">buscando endereco...</span>}
                <input type="text" autoComplete="off" value={form.logradouro} onChange={(e) => handleChange('logradouro', e.target.value)} />
              </label>
              <label>
                Numero
                <input type="text" autoComplete="off" value={form.numero} onChange={(e) => handleChange('numero', e.target.value)} />
              </label>
              <label>
                Complemento
                <input type="text" autoComplete="off" value={form.complemento} onChange={(e) => handleChange('complemento', e.target.value)} placeholder="Apto, bloco, sala..." />
              </label>
              <label>
                Bairro
                <input type="text" autoComplete="off" value={form.bairro} onChange={(e) => handleChange('bairro', e.target.value)} />
              </label>
              <label>
                Cidade
                <input type="text" autoComplete="off" value={form.cidade} onChange={(e) => handleChange('cidade', e.target.value)} />
              </label>
              <label>
                Estado
                <input type="text" autoComplete="off" maxLength={2} value={form.estado} onChange={(e) => handleChange('estado', e.target.value.toUpperCase())} placeholder="UF" />
              </label>
            </div>

            <h3 className="paciente-secao-titulo"><span className="paciente-secao-icone">{iconesSecao.saude}</span>Convenio e saude</h3>
            <div className="form-grid">
              <label>
                Cartao do SUS
                <input type="text" autoComplete="off" value={form.cartao_sus} onChange={(e) => handleChange('cartao_sus', e.target.value)} />
              </label>
              <label>
                Convenio
                <input type="text" autoComplete="off" value={form.convenio} onChange={(e) => handleChange('convenio', e.target.value)} placeholder="Particular, se nao houver" />
              </label>
              <label>
                Carteira do plano de saude
                <input type="text" autoComplete="off" value={form.carteira_convenio} onChange={(e) => handleChange('carteira_convenio', e.target.value)} />
              </label>
              <label>
                CRM do medico solicitante
                <input type="text" autoComplete="off" value={form.crm_medico_solicitante} onChange={(e) => handleChange('crm_medico_solicitante', e.target.value)} />
              </label>
            </div>

            <div className="paciente-medicacao">
              <span className="paciente-medicacao-titulo">Toma medicacao?</span>
              <div className="paciente-medicacao-opcoes">
                <label className="paciente-radio">
                  <input type="radio" name="toma_medicacao" checked={form.toma_medicacao === true} onChange={() => handleTomaMedicacao(true)} />
                  Sim
                </label>
                <label className="paciente-radio">
                  <input type="radio" name="toma_medicacao" checked={form.toma_medicacao === false} onChange={() => handleTomaMedicacao(false)} />
                  Nao
                </label>
              </div>

              {form.toma_medicacao && (
                <div className="paciente-medicamentos-resumo">
                  {form.medicamentos.length > 0 ? (
                    <span>{form.medicamentos.join(', ')}</span>
                  ) : (
                    <span className="paciente-medicamentos-vazio">Nenhum medicamento informado</span>
                  )}
                  <button type="button" onClick={abrirEdicaoMedicamentos}>Editar lista</button>
                </div>
              )}
            </div>

            <label className="form-full">
              Observacoes clinicas relevantes
              <textarea
                rows={3}
                value={form.observacoes_clinicas}
                onChange={(e) => handleChange('observacoes_clinicas', e.target.value)}
                placeholder="Alergias, condicoes relevantes, restricoes..."
              />
            </label>

            <div className="form-acoes">
              <button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar dados'}
              </button>
              <button
                type="button"
                className="paciente-concluir"
                disabled={!editandoId}
                title={!editandoId ? 'Salve os dados do paciente primeiro' : ''}
                onClick={() => navigate(`/pacientes/${editandoId}/exames`)}
              >
                Cadastrar exames
              </button>
              <button type="button" className="form-cancelar" onClick={fecharForm}>
                {editandoId ? 'Fechar' : 'Cancelar'}
              </button>
            </div>
          </form>
        )}

        {!formAberto && (
          <>
            <div className="paciente-busca-grupo">
              <span className="paciente-busca-icone">{iconeBusca}</span>
              <input
                type="text"
                className="paciente-busca"
                placeholder="Buscar paciente por nome, CPF ou codigo..."
                value={termoFiltro}
                onChange={(e) => setTermoFiltro(e.target.value)}
              />
            </div>

            {!buscaAtiva ? (
              <div className="paciente-estado-vazio">
                <span className="paciente-estado-vazio-icone">{iconePaciente}</span>
                <p>Digite o nome, CPF ou codigo para localizar um paciente ja cadastrado.</p>
              </div>
            ) : carregando ? (
              <p>Carregando pacientes...</p>
            ) : pacientesFiltrados.length === 0 ? (
              <div className="paciente-estado-vazio">
                <span className="paciente-estado-vazio-icone">{iconePaciente}</span>
                <p>Nenhum paciente encontrado para essa busca.</p>
              </div>
            ) : (
              <table className="gerenciar-tabela">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Nascimento</th>
                    <th>Celular</th>
                    <th>Convenio</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientesFiltrados.map((paciente) => (
                    <tr key={paciente.id}>
                      <td className="paciente-codigo">{paciente.codigo}</td>
                      <td>{paciente.nome}</td>
                      <td>{paciente.cpf}</td>
                      <td>{paciente.data_nascimento?.split('-').reverse().join('/')}</td>
                      <td>{paciente.celular || '-'}</td>
                      <td>{paciente.convenio || '-'}</td>
                      <td className="gerenciar-acoes">
                        <button onClick={() => abrirEdicao(paciente)}>{iconeEditar}Editar</button>
                        <button onClick={() => navigate(`/pacientes/${paciente.id}/exames`)}>{iconeExames}Exames</button>
                        <button className="btn-excluir" onClick={() => handleExcluir(paciente)}>{iconeExcluir}Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {medicamentosPopupAberto && (
          <div className="paciente-modal-fundo" onClick={cancelarMedicamentos}>
            <div className="paciente-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Medicamentos em uso</h3>
              <p className="paciente-modal-ajuda">Liste até {MAXIMO_MEDICAMENTOS} medicamentos que o paciente toma atualmente.</p>

              {medicamentosTemp.map((medicamento, indice) => (
                <div className="paciente-modal-linha" key={indice}>
                  <input
                    type="text"
                    autoComplete="off"
                    value={medicamento}
                    onChange={(e) => alterarLinhaMedicamento(indice, e.target.value)}
                    placeholder={`Medicamento ${indice + 1}`}
                  />
                  {medicamentosTemp.length > 1 && (
                    <button type="button" className="paciente-modal-remover" onClick={() => removerLinhaMedicamento(indice)}>
                      ×
                    </button>
                  )}
                </div>
              ))}

              {medicamentosTemp.length < MAXIMO_MEDICAMENTOS && (
                <button type="button" className="paciente-modal-adicionar" onClick={adicionarLinhaMedicamento}>
                  + Adicionar linha
                </button>
              )}

              <div className="form-acoes">
                <button type="button" onClick={salvarMedicamentos}>Salvar</button>
                <button type="button" className="form-cancelar" onClick={cancelarMedicamentos}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default PacientesGerenciar;
