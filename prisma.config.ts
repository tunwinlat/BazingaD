import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file manually
config({ path: resolve(process.cwd(), '.env') });

export default defineConfig({
  schema: './prisma/schema.prisma',
});
