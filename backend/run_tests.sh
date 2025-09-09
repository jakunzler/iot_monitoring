#!/bin/bash
"""
Script de Execução Rápida para Testes
Executa todos os testes de validação do pino 11 e módulo RM520N-GL
"""

echo "=========================================="
echo "TESTES DE VALIDAÇÃO - PINO 11 + RM520N-GL"
echo "=========================================="

# Verificar se está no Raspberry Pi
if ! command -v python3 &> /dev/null; then
    echo "✗ Python3 não encontrado"
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "server.py" ]; then
    echo "✗ Execute este script no diretório backend/"
    exit 1
fi

echo "✓ Ambiente verificado"

# Função para executar teste
run_test() {
    local test_name="$1"
    local script_name="$2"
    
    echo ""
    echo "--- Executando: $test_name ---"
    
    if [ -f "$script_name" ]; then
        python3 "$script_name"
        local exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            echo "✓ $test_name concluído com sucesso"
        else
            echo "✗ $test_name falhou (código: $exit_code)"
        fi
    else
        echo "✗ Script $script_name não encontrado"
    fi
}

# Menu de opções
echo ""
echo "Escolha uma opção:"
echo "1. Teste completo (todos os testes)"
echo "2. Configurar módulo RM520N-GL"
echo "3. Testar pino 11 com RM520N-GL"
echo "4. Testar pino 11 com DHT11"
echo "5. Validar fluxo completo"
echo "6. Sair"
echo ""

read -p "Digite sua escolha (1-6): " choice

case $choice in
    1)
        echo "Executando todos os testes..."
        run_test "Configuração RM520N-GL" "configure_rm520n.py"
        run_test "Teste Pino 11 + RM520N-GL" "test_pin11_rm520n.py"
        run_test "Teste Pino 11 + DHT11" "test_pin11_dht11.py"
        run_test "Validação Fluxo Completo" "validate_complete_flow.py"
        ;;
    2)
        run_test "Configuração RM520N-GL" "configure_rm520n.py"
        ;;
    3)
        run_test "Teste Pino 11 + RM520N-GL" "test_pin11_rm520n.py"
        ;;
    4)
        run_test "Teste Pino 11 + DHT11" "test_pin11_dht11.py"
        ;;
    5)
        run_test "Validação Fluxo Completo" "validate_complete_flow.py"
        ;;
    6)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "TESTES CONCLUÍDOS"
echo "=========================================="

# Verificar se há resultados salvos
if [ -f "/tmp/validation_results.json" ]; then
    echo ""
    echo "Resultados detalhados salvos em: /tmp/validation_results.json"
    echo "Para visualizar: cat /tmp/validation_results.json | python3 -m json.tool"
fi

echo ""
echo "Para mais informações, consulte: RM520N-GL_README.md"
