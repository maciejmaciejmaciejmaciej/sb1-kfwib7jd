declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_WOOCOMMERCE_URL: string;
      EXPO_PUBLIC_WOOCOMMERCE_KEY: string;
      EXPO_PUBLIC_WOOCOMMERCE_SECRET: string;
      EXPO_PUBLIC_MAKE_WEBHOOK_URL: string;
    }
  }
}

export {};