import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '../config/env';

/**
 * Hook customizado para gerenciar dados em tempo real
 * @param {string} deviceId - ID do dispositivo
 * @param {number} interval - Intervalo de atualização em ms (padrão: 5000)
 * @param {string} baseUrl - URL base da API (padrão: build-time VITE_API_URL ou dev)
 * @param {boolean} autoRefresh - Se deve fazer polling automático (padrão: true)
 */
export const useRealtimeData = (deviceId, interval = 5000, baseUrl = getApiBaseUrl(), autoRefresh = true) => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Função para buscar dados mais recentes
  const fetchLatestData = useCallback(async () => {
    if (!deviceId) return;

    try {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const response = await fetch(`${baseUrl}/api/latest/${deviceId}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Se for 404, pode ser que não há dados ainda (não é erro de conexão)
        if (response.status === 404) {
          const errorData = await response.json();
          if (errorData.error === 'Nenhum dado encontrado') {
            setData(null);
            setError(null);
            setIsConnected(true); // Servidor está funcionando, só não há dados
            return;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const latestData = await response.json();
      setData(latestData);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao buscar dados:', err);
        setError(err.message);
        setIsConnected(false);
      }
    }
  }, [deviceId, baseUrl]);

  // Função para buscar histórico
  const fetchHistory = useCallback(async (limit = 20) => {
    if (!deviceId) return;

    try {
      const response = await fetch(`${baseUrl}/api/history/${deviceId}?limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const historyData = await response.json();
      // Se for um array vazio, não é erro - só não há dados históricos
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError(err.message);
    }
  }, [deviceId, baseUrl]);

  // Função para buscar estatísticas
  const fetchStats = useCallback(async () => {
    if (!deviceId) return;

    try {
      const response = await fetch(`${baseUrl}/api/stats/${deviceId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      throw err;
    }
  }, [deviceId, baseUrl]);

  // Função para buscar todos os dados
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLatestData(),
        fetchHistory(),
      ]);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchLatestData, fetchHistory]);

  /** Cada ciclo de poll atualiza último valor e histórico (gráfico acompanha o mesmo ritmo). */
  const pollTick = useCallback(async () => {
    await fetchLatestData();
    await fetchHistory();
  }, [fetchLatestData, fetchHistory]);

  // Inicializar polling
  useEffect(() => {
    if (!deviceId) return;

    // Buscar dados iniciais
    fetchAllData();

    // Polling: latest + history para manter gráfico alinhado aos cartões
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        pollTick();
      }, interval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [deviceId, interval, autoRefresh, fetchAllData, pollTick]);

  // Função para atualizar manualmente
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Função para parar/pausar polling
  const pausePolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Função para retomar polling
  const resumePolling = useCallback(() => {
    if (!intervalRef.current && deviceId) {
      intervalRef.current = setInterval(() => {
        pollTick();
      }, interval);
    }
  }, [deviceId, interval, pollTick]);

  return {
    data,
    history,
    loading,
    error,
    isConnected,
    refresh,
    pausePolling,
    resumePolling,
    fetchStats,
  };
};
