import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

function formatarData(data) {
  if (!data) return '-';
  const d = typeof data === 'string' ? new Date(`${data}T00:00:00`) : data;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Calcula a data prevista do resultado a partir do texto livre de
 * "prazo de liberacao do resultado" do exame (ex: "3 dias uteis", "24 horas").
 * Se nao conseguir identificar um numero de dias no texto, devolve null
 * (o PDF mostra "A definir" em vez de arriscar uma data errada).
 */
export function calcularDataPrevisao(prazoTexto, dataBase) {
  if (!prazoTexto) return null;

  const numeros = prazoTexto.match(/\d+/);
  if (!numeros) return null;

  let dias = parseInt(numeros[0], 10);
  const textoLower = prazoTexto.toLowerCase();

  if (textoLower.includes('hora')) {
    dias = Math.max(1, Math.ceil(dias / 24));
  }

  const diasUteis = textoLower.includes('util') || textoLower.includes('útil');

  const data = new Date(dataBase);
  let adicionados = 0;
  while (adicionados < dias) {
    data.setDate(data.getDate() + 1);
    if (diasUteis) {
      const diaSemana = data.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;
    }
    adicionados++;
  }
  return data;
}

export function gerarPdfSolicitacao({ paciente, exames, dataSolicitacao }) {
  const doc = new jsPDF();
  const dataBase = dataSolicitacao || new Date();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NexLab', 14, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de solicitacao de exames', 14, 25);

  doc.setDrawColor(200);
  doc.line(14, 29, 196, 29);

  let y = 38;
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do paciente', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 7;

  const linhasPaciente = [
    [`Codigo: ${paciente.codigo}`, `Nome: ${paciente.nome}`],
    [`CPF: ${paciente.cpf}`, `Nascimento: ${formatarData(paciente.data_nascimento)}`],
    [`Convenio: ${paciente.convenio || 'Particular'}`, `Cartao SUS: ${paciente.cartao_sus || '-'}`],
    [`Celular: ${paciente.celular || '-'}`, `Medico solicitante (CRM): ${paciente.crm_medico_solicitante || '-'}`],
  ];

  linhasPaciente.forEach(([esquerda, direita]) => {
    doc.text(esquerda, 14, y);
    doc.text(direita, 105, y);
    y += 6;
  });

  y += 2;
  doc.text(`Data da solicitacao: ${formatarData(dataBase)}`, 14, y);
  y += 8;

  const linhas = exames.map((exame) => {
    const previsao = calcularDataPrevisao(exame.prazo_liberacao_resultado, dataBase);
    return [
      exame.nome,
      exame.sigla || '-',
      exame.setor_responsavel || '-',
      previsao ? formatarData(previsao) : 'A definir',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Exame', 'Sigla', 'Setor', 'Previsao do resultado']],
    body: linhas,
    headStyles: { fillColor: [0, 87, 224] },
    styles: { fontSize: 9 },
  });

  const finalY = doc.lastAutoTable.finalY || y;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    'As datas de previsao sao estimativas calculadas a partir do prazo informado para cada exame.',
    14,
    finalY + 10,
  );

  doc.save(`solicitacao-${paciente.codigo}.pdf`);
}

/**
 * Agrupa os exames por tubo de coleta. Quando o exame ja tem um tubo
 * cadastrado (tela "Gerenciar Exames"), usa a cor dele -- essa e a
 * fonte confiavel. Quando nao tem, agrupa pelo setor responsavel e
 * marca a cor como "A confirmar" em vez de arriscar um palpite errado.
 */
function agruparExamesPorTubo(exames) {
  const grupos = new Map();

  exames.forEach((exame) => {
    const chave = exame.tubo_cor
      ? `tubo:${exame.tubo_cor.toLowerCase()}`
      : `setor:${(exame.setor_responsavel || 'geral').toLowerCase()}`;

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        corTampa: exame.tubo_cor || null,
        setor: exame.setor_responsavel || null,
        amostra: exame.material_nome || null,
        exames: [],
      });
    }

    const grupo = grupos.get(chave);
    grupo.exames.push(exame);
    if (!grupo.amostra && exame.material_nome) grupo.amostra = exame.material_nome;
  });

  return Array.from(grupos.values());
}

function abreviarAmostra(texto) {
  if (!texto) return 'AMOSTRA';
  const semAcento = texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const somenteLetrasNumeros = semAcento.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return somenteLetrasNumeros.slice(0, 12) || 'AMOSTRA';
}

/**
 * Gera a imagem (PNG em base64) de um codigo de barras Code128 com o
 * texto informado, para o aparelho do setor ler o codigo do paciente
 * e a amostra direto do tubo.
 */
function gerarImagemBarcode(valor) {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, valor, {
    format: 'CODE128',
    displayValue: true,
    fontSize: 16,
    textMargin: 2,
    height: 36,
    width: 1.6,
    margin: 4,
  });
  return {
    dataUrl: canvas.toDataURL('image/png'),
    largura: canvas.width,
    altura: canvas.height,
  };
}

function ajustarTamanhoImagem(larguraNativa, alturaNativa, larguraMax, alturaMax) {
  const escala = Math.min(larguraMax / larguraNativa, alturaMax / alturaNativa);
  return { largura: larguraNativa * escala, altura: alturaNativa * escala };
}

export function gerarEtiquetasTubos({ paciente, exames }) {
  const grupos = agruparExamesPorTubo(exames);
  const doc = new jsPDF({ unit: 'mm', format: [50, 25] });
  const largura = 46;

  grupos.forEach((grupo, indice) => {
    if (indice > 0) doc.addPage([50, 25]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    const linhasNome = doc.splitTextToSize(paciente.nome, largura).slice(0, 2);

    let y = 3.2;
    linhasNome.forEach((linha) => {
      doc.text(linha, 2, y);
      y += 2.8;
    });

    y += 0.6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`Nasc: ${formatarData(paciente.data_nascimento)}`, 2, y); y += 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.3);
    doc.text(`Tubo: ${grupo.corTampa || 'A confirmar'}`, 2, y); y += 1.4;

    const valorBarcode = `${paciente.codigo}-${abreviarAmostra(grupo.amostra || grupo.setor)}`;
    const barcode = gerarImagemBarcode(valorBarcode);
    const alturaDisponivel = 24.5 - y;
    const tamanho = ajustarTamanhoImagem(barcode.largura, barcode.altura, largura, alturaDisponivel);
    doc.addImage(barcode.dataUrl, 'PNG', 2, y, tamanho.largura, tamanho.altura);
  });

  doc.save(`etiquetas-${paciente.codigo}.pdf`);

  return grupos;
}
