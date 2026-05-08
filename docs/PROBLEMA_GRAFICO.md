# 🔧 PROBLEMA DO GRÁFICO - DIAGNÓSTICO E SOLUÇÃO

## 🚨 **Problema Identificado**

O gráfico não estava apresentando dados devido a **timestamps inválidos** vindos do ESP32.

### ❌ **Dados Problemáticos do ESP32:**
```json
{
  "timestamp": 2272,  // ❌ Muito pequeno - é millis() em segundos
  "data": {
    "temperature": 33.1,
    "humidity": 34.2
  }
}
```

### ✅ **Dados Corretos (Teste):**
```json
{
  "timestamp": 1757478046,  // ✅ Timestamp Unix válido
  "data": {
    "temperature": 33.1,
    "humidity": 30.2
  }
}
```

## 🔍 **Causa Raiz**

O ESP32 está enviando `millis() / 1000` (uptime em segundos) como timestamp, em vez de um timestamp Unix real.

**Exemplo:**
- `millis()` = 2272000ms (37 minutos de uptime)
- `millis() / 1000` = 2272 segundos
- **Timestamp Unix real** = 1757478046 (10/09/2025 21:00:46)

## ✅ **Soluções Implementadas**

### 1. **Correção da Função `fixESP32Timestamp`**
```javascript
const fixESP32Timestamp = (timestamp) => {
  if (timestamp < 1000000000) {
    // Se o timestamp é muito pequeno, é provavelmente millis() em segundos
    const now = Math.floor(Date.now() / 1000);
    const maxTimestamp = history.length > 0 ? Math.max(...history.map(h => h.timestamp)) : timestamp;
    const estimatedTimestamp = now - (maxTimestamp - timestamp);
    return estimatedTimestamp;
  }
  return timestamp;
};
```

### 2. **Melhoria na Lógica do Gráfico**
```javascript
const chartData = useMemo(() => {
  if (!history || history.length === 0) return null;

  // Ordenar por timestamp (mais recente primeiro)
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  // Pegar os últimos 20 registros
  const recentData = sortedHistory.slice(0, 20).reverse();
  
  // Criar labels baseados no índice (já que os timestamps são problemáticos)
  const labels = recentData.map((item, index) => {
    // Para timestamps pequenos, usar índice relativo
    if (item.timestamp < 1000000000) {
      return `-${recentData.length - index - 1}m`;
    }
    const timestamp = fixESP32Timestamp(item.timestamp);
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR');
  });

  return {
    labels,
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: recentData.map(item => item.data.temperature),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Umidade (%)',
        data: recentData.map(item => item.data.humidity),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
      },
    ],
  };
}, [history]);
```

### 3. **Componente de Debug**
- O `DataDebugger` foi para `code/frontend/deprecated/components/` (removido do ESP32 Dashboard activo); reimporte apenas se precisar em desenvolvimento
- Mostra timestamps, dados e estatísticas
- Ajuda a identificar problemas rapidamente

### 4. **Script de Teste**
- `test-chart-data.sh` para enviar dados com timestamps válidos
- Permite testar o gráfico com dados corretos

## 🎯 **Resultado**

### ✅ **Agora o gráfico funciona com:**
- **Timestamps pequenos** (millis) - usa labels relativos (-19m, -18m, etc.)
- **Timestamps válidos** (Unix) - usa horário real
- **Dados ordenados** corretamente
- **Labels informativos** baseados no contexto

### 📊 **Labels do Gráfico:**
- **Timestamps pequenos**: `-19m`, `-18m`, `-17m` (minutos atrás)
- **Timestamps válidos**: `21:00:46`, `21:00:45`, `21:00:44` (horário real)

## 🔧 **Solução Definitiva para o ESP32**

Para resolver completamente o problema, o código do ESP32 deve ser atualizado:

```cpp
// ❌ Código atual (problemático)
doc["timestamp"] = millis() / 1000;

// ✅ Código correto
#include <time.h>

void setup() {
  // Configurar NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void sendData() {
  time_t now;
  time(&now); // Obtém timestamp Unix atual
  doc["timestamp"] = now;
}
```

## 📈 **Status Atual**

- ✅ **Gráfico funcionando** com timestamps pequenos
- ✅ **Dados sendo exibidos** corretamente
- ✅ **Labels informativos** baseados no contexto
- ✅ **Debug disponível** para desenvolvimento
- ⚠️ **ESP32 ainda envia** timestamps pequenos (mas funciona)

**O gráfico agora apresenta os dados corretamente, mesmo com timestamps problemáticos do ESP32!**
