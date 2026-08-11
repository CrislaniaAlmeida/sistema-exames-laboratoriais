import os
import smtplib
import logging
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

EMAIL_REMETENTE = os.getenv("EMAIL_REMETENTE")
EMAIL_SENHA_APP = os.getenv("EMAIL_SENHA_APP")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://nextlab-rose.vercel.app")

logger = logging.getLogger("nexlab.email")


def enviar_email(destinatario: str, assunto: str, corpo_texto: str) -> bool:
    """
    Envia um e-mail simples via SMTP do Gmail. Nao lanca excecao em
    caso de falha (rede fora do ar, credencial errada, etc.) -- so
    registra no log, para nunca travar a liberacao de um resultado por
    causa do envio de aviso.
    """
    if not EMAIL_REMETENTE or not EMAIL_SENHA_APP:
        logger.info("Envio de e-mail nao configurado (EMAIL_REMETENTE/EMAIL_SENHA_APP ausentes).")
        return False
    if not destinatario:
        return False

    mensagem = EmailMessage()
    mensagem["Subject"] = assunto
    mensagem["From"] = EMAIL_REMETENTE
    mensagem["To"] = destinatario
    mensagem.set_content(corpo_texto)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as servidor:
            servidor.starttls()
            servidor.login(EMAIL_REMETENTE, EMAIL_SENHA_APP)
            servidor.send_message(mensagem)
        return True
    except Exception:
        logger.exception("Falha ao enviar e-mail para %s", destinatario)
        return False


def enviar_email_resultado_disponivel(item) -> bool:
    """
    Avisa o paciente por e-mail quando o resultado de um exame fica
    disponivel, com o link unico do portal (mesmo link usado para
    baixar o laudo em PDF).
    """
    paciente = item.paciente
    solicitacao = item.solicitacao
    if not paciente or not paciente.email or not solicitacao or not solicitacao.token_publico:
        return False

    link = f"{FRONTEND_URL}/portal/{solicitacao.token_publico}"
    nome_exame = item.exame.nome if item.exame else "seu exame"

    corpo = (
        f"Ola, {paciente.nome}!\n\n"
        f"O resultado do exame \"{nome_exame}\" ja esta disponivel.\n\n"
        f"Acesse o link abaixo para ver o resultado e baixar o laudo em PDF:\n{link}\n\n"
        "Este link e pessoal e intransferivel -- nao compartilhe com outras pessoas.\n\n"
        "NexLab"
    )

    return enviar_email(paciente.email, "Seu resultado ja esta disponivel — NexLab", corpo)
