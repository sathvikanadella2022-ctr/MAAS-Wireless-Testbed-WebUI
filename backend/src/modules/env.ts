import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const resolveEnvPath = () => {
    if (process.env.ENV_FILE) {
      return path.resolve(process.cwd(), process.env.ENV_FILE);
    }

    const preferredFiles = process.env.NODE_ENV === 'production'
      ? ['env.production', '.env']
      : ['.env', 'env.production'];

    return preferredFiles
      .map((file) => path.resolve(process.cwd(), file))
      .find((filePath) => fs.existsSync(filePath));
  };

const envPath = resolveEnvPath();
if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}
