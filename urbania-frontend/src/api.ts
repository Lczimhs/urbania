import axios from 'axios';

export const api = axios.create({
  // Em desenvolvimento, "/api" é repassado pelo Vite para o backend (ver vite.config.ts)
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Inicialização automática das informações do computador/usuário do SO
export const initDeviceInfo = async () => {
  try {
    const savedDev = localStorage.getItem('urbania_device_name');
    if (!savedDev || /lucas/i.test(savedDev) || /srv-/i.test(savedDev) || /root/i.test(savedDev)) {
      localStorage.setItem('urbania_device_name', 'Pc-GM');
      localStorage.setItem('urbania_os_user', 'GM');
    }

    const res = await api.get('/device-info');
    if (res.data?.computerName && !res.data.computerName.startsWith('Pc-srv-') && !res.data.computerName.startsWith('Pc-root')) {
      localStorage.setItem('urbania_device_name', res.data.computerName);
    }
    if (res.data?.osUser && res.data.osUser !== 'root' && !res.data.osUser.startsWith('srv-')) {
      localStorage.setItem('urbania_os_user', res.data.osUser);
    }
    return res.data;
  } catch (err) {
    return {
      osUser: 'GM',
      computerName: 'Pc-GM',
    };
  }
};

// Executa na inicialização do bundle
initDeviceInfo().catch(() => {});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('urbania_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  let device = localStorage.getItem('urbania_device_name');
  if (!device || /lucas/i.test(device) || /srv-/i.test(device) || /root/i.test(device)) {
    device = 'Pc-GM';
    localStorage.setItem('urbania_device_name', 'Pc-GM');
  }
  config.headers['X-Client-Device'] = device;

  let osUser = localStorage.getItem('urbania_os_user');
  if (!osUser || /lucas/i.test(osUser) || /srv-/i.test(osUser) || /root/i.test(osUser)) {
    osUser = 'GM';
    localStorage.setItem('urbania_os_user', 'GM');
  }
  config.headers['X-Client-User'] = osUser;

  return config;
});

// Usuário não identificado: avisa o AuthProvider, que encerra a sessão e volta ao login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('urbania:sessao-expirada'));
    }
    return Promise.reject(err);
  },
);

