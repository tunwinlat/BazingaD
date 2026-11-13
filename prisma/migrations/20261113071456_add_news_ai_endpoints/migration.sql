-- Preserve existing MiniMax installations while allowing compatible AI endpoints.
ALTER TABLE "settings" ADD COLUMN "newsApiEndpoint" TEXT NOT NULL DEFAULT 'https://api.minimax.io/v1/chat/completions';
ALTER TABLE "settings" ADD COLUMN "newsApiModel" TEXT NOT NULL DEFAULT 'MiniMax-M3';
ALTER TABLE "settings" ADD COLUMN "newsApiFormat" TEXT NOT NULL DEFAULT 'auto';
