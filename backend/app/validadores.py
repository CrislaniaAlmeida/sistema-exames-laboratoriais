"""Validadores de dados reutilizados pelos schemas Pydantic."""

import re


def validar_cpf(cpf: str) -> str:
    """
    Valida formato e digitos verificadores de um CPF. Aceita com ou sem
    pontuacao (000.000.000-00 ou 00000000000) e devolve so os numeros.
    Levanta ValueError se o CPF for invalido (usado por field_validator).
    """
    numeros = re.sub(r"\D", "", cpf or "")

    if len(numeros) != 11:
        raise ValueError("CPF deve ter 11 digitos.")

    if numeros == numeros[0] * 11:
        raise ValueError("CPF invalido.")

    def calcular_digito(cpf_parcial: str) -> str:
        soma = sum(
            int(digito) * peso
            for digito, peso in zip(cpf_parcial, range(len(cpf_parcial) + 1, 1, -1))
        )
        resto = soma % 11
        return "0" if resto < 2 else str(11 - resto)

    digito1 = calcular_digito(numeros[:9])
    digito2 = calcular_digito(numeros[:9] + digito1)

    if numeros[9:] != digito1 + digito2:
        raise ValueError("CPF invalido.")

    return numeros
