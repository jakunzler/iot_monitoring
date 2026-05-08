import { useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

// Importar arquivos de tradução
import ptBR from '../locales/pt-BR.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

const translations = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export const useTranslation = () => {
  const { language } = useAppContext();
  const [t, setT] = useState(() => (key) => key);

  useEffect(() => {
    const currentTranslations = translations[language] || translations['pt-BR'];
    
    const translate = (key) => {
      const keys = key.split('.');
      let value = currentTranslations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Retorna a chave se não encontrar tradução
        }
      }
      
      return value || key;
    };
    
    setT(() => translate);
  }, [language]);

  return { t, language };
};
