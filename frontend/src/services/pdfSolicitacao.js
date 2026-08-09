import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
