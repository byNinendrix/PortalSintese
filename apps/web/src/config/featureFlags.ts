const useMocksEnv = import.meta.env.VITE_USE_MOCKS;

export const USE_MOCKS = useMocksEnv ? useMocksEnv === "true" : true;

