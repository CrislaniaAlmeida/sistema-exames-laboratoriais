import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import './PacientesGerenciar.css';

const PACIENTE_VAZIO = {
  nome: '', nome_social: '', cpf: '', rg: '', data_nascimento: '', sexo: '',
  nacionalidade: '', naturalidade: '', nome_mae: '',
  celular: '', telefone: '', email: '',
  cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
  cartao_sus: '', convenio: '', carteira_convenio: '', crm_medico_solicitante: '',
  toma_medicacao: false, medicamentos: [], observacoes_clinicas: '',
};

const MAXIMO_MEDICAMENTOS = 6;

function PacientesGerenciar() {
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

  const pacientesFiltrados = pacientes.filter((p) => {
    if (!termoFiltro.trim()) return true;
    const termo = termoFiltro.toLowerCase();
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
        setMensagem(`Paciente cadastrado com sucesso. Codigo gerado: ${resposta.data.codigo}`);
      }
      fecharForm();
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

            <h3 className="paciente-secao-titulo">Dados pessoais</h3>
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

            <h3 className="paciente-secao-titulo">Contato</h3>
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

            <h3 className="paciente-secao-titulo">Endereco</h3>
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

            <h3 className="paciente-secao-titulo">Convenio e saude</h3>
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
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="form-cancelar" onClick={fecharForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!formAberto && (
          <input
            type="text"
            className="paciente-busca"
            placeholder="Buscar por nome, CPF ou codigo..."
            value={termoFiltro}
            onChange={(e) => setTermoFiltro(e.target.value)}
          />
        )}

        {carregando ? (
          <p>Carregando pacientes...</p>
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
                    <button onClick={() => abrirEdicao(paciente)}>Editar</button>
                    <button className="btn-excluir" onClick={() => handleExcluir(paciente)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
