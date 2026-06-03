if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  const { resolve, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const here = dirname(fileURLToPath(import.meta.url));
  config({ path: resolve(here, "../../.env") });
  config({ path: resolve(here, "../.env") });
}