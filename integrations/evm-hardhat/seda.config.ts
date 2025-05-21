export interface SedaConfig {
  coreAddress: string;
}

export const networkConfigs: { [network: string]: SedaConfig } = {
  baseSepolia: {
    // Proxy Core Address (SEDA testnet)
    coreAddress: '0xF631860f3Cb423aA14d06305083e4887e612A7f5',
  },
};
