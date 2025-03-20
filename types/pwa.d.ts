interface PWAConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
    lang: string;
  };
  web: {
    startUrl: string;
    display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
    orientation: "portrait" | "landscape" | "any";
  };
  icons: {
    favicon: string;
    pwa: {
      "192": string;
      "512": string;
    };
    splash: {
      image: string;
      backgroundColor: string;
      resizeMode: "contain" | "cover" | "stretch";
    };
  };
}

declare module "*/pwa/config.json" {
  const config: PWAConfig;
  export default config;
}