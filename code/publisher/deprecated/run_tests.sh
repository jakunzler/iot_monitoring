#!/bin/bash
"""
Script de Execução Rápida para Testes
Executa todos os testes de validação do pino 11 e módulo RM520N-GL
"""

echo "=========================================="
echo "TESTES DE VALIDACAO - PINO 11 + RM520N-GL"
echo "=========================================="

if ! command -v python3 &> /dev/null; then
    echo "Python3 nao encontrado"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f "../../backend/server.py" ]; then
    echo "Execute a partir de code/publisher/deprecated (esperado ../../backend/server.py)"
    exit 1
fi

echo "Ambiente verificado"

run_test() {
    local test_name="$1"
    local script_name="$2"

    echo ""
    echo "--- Executando: $test_name ---"

    if [ -f "$script_name" ]; then
        python3 "$script_name"
        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            echo "OK $test_name"
        else
            echo "Falha $test_name (codigo: $exit_code)"
        fi
    else
        echo "Script nao encontrado: $script_name"
    fi
}

echo ""
echo "Escolha uma opcao:"
echo "1. Teste completo (todos os testes)"
echo "2. Configurar modulo RM520N-GL"
echo "3. Testar pino 11 com RM520N-GL"
echo "4. Testar pino 11 com DHT11"
echo "5. Testar pino 11 com DHT22 + RM520N-GL"
echo "6. Configurar RM520N-GL + DHT22"
echo "7. Validar fluxo completo"
echo "8. Teste fluxo completo com 5G funcionando"
echo "9. Sair"
echo ""

read -p "Digite sua escolha (1-9): " choice

case $choice in
    1)
        echo "Executando todos os testes..."
        run_test "Configuracao RM520N-GL" "configure_rm520n.py"
        run_test "Teste Pino 11 + RM520N-GL" "test_pin11_rm520n.py"
        run_test "Teste Pino 11 + DHT11" "test_pin11_dht11.py"
        run_test "Teste Pino 11 + DHT22 + RM520N-GL" "test_dht22_pin11_rm520n.py"
        run_test "Validacao Fluxo Completo" "validate_complete_flow.py"
        ;;
    2)
        run_test "Configuracao RM520N-GL" "configure_rm520n.py"
        ;;
    3)
        run_test "Teste Pino 11 + RM520N-GL" "test_pin11_rm520n.py"
        ;;
    4)
        run_test "Teste Pino 11 + DHT11" "test_pin11_dht11.py"
        ;;
    5)
        run_test "Teste Pino 11 + DHT22 + RM520N-GL" "test_dht22_pin11_rm520n.py"
        ;;
    6)
        run_test "Configurar RM520N-GL + DHT22" "setup_rm520n_dht22.py"
        ;;
    7)
        run_test "Validacao Fluxo Completo" "validate_complete_flow.py"
        ;;
    8)
        echo "Executando teste de fluxo completo com 5G..."
        run_test "Fluxo completo com 5G" "test_complete_flow_5g.py"
        ;;
    9)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo "Opcao invalida"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "TESTES CONCLUIDOS"
echo "=========================================="

if [ -f "/tmp/validation_results.json" ]; then
    echo ""
    echo "Resultados em: /tmp/validation_results.json"
    echo "cat /tmp/validation_results.json | python3 -m json.tool"
fi

echo ""
echo "Documentacao: docs/backend/RM520N-GL_README.md"
