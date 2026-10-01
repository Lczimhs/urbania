import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';

export type Config = Record<string, any>;

// Valores usados enquanto a imobiliária ainda não salvou as próprias configurações
export const CONFIG_PADRAO: Config = {
  nomeFantasia: 'Urbânia',
  taxaAdministracao: 10,
  comissaoVenda: 6,
  multaAtraso: 10,
  jurosDia: 0.033,
  diaVencimento: 10,
  indiceReajuste: 'IGP-M',
  prazoRepasse: 5,
};

const ConfigContext = createContext<{ config: Config; loading: boolean; salvar: (c: Config) => Promise<void> }>({
  config: CONFIG_PADRAO, loading: false, salvar: async () => {},
});

// Configurações da imobiliária: um único registro na tabela "configuracoes"
export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/configuracoes')
      .then(r => { if (r.data[0]) setConfig({ ...CONFIG_PADRAO, ...r.data[0] }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const salvar = useCallback(async (c: Config) => {
    const data = { ...c };
    delete data.id;
    const res = config.id ? await api.put(`/configuracoes/${config.id}`, data) : await api.post('/configuracoes', data);
    setConfig({ ...CONFIG_PADRAO, ...c, id: res.data.id });
  }, [config.id]);

  return <ConfigContext.Provider value={{ config, loading, salvar }}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
