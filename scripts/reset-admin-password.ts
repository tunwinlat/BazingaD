#!/usr/bin/env node

/**
 * Admin Password Reset Script
 *
 * Resets the password for an admin user directly in the database.
 * Useful when you've forgotten your password and don't have email
 * infrastructure configured.
 *
 * Usage:
 *   Local dev:
 *     DATABASE_URL=file:./data/dev.db npx tsx scripts/reset-admin-password.ts
 *   Docker:
 *     docker exec -it bazingad node scripts/reset-admin-password.js
 *
 * Options:
 *   --clear-totp   Also disable TOTP/2FA for the selected user
 *   --help, -h     Show this help message
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

async function readAllStdinLines(): Promise<string[]> {
  const rl = createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines;
}

function createPrompts(lines: string[]) {
  let index = 0;
  return function prompt(question: string): string {
    if (index < lines.length) {
      const answer = lines[index++];
      // In non-TTY mode, echo the answer so the user can see what was provided
      process.stdout.write(`${question}${answer}\n`);
      return answer;
    }
    throw new Error(`Expected more input. Prompt: "${question}"`);
  };
}

function interactivePrompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY) {
      // This path should not be reached when using buffered input,
      // but handle gracefully just in case.
      interactivePrompt(question).then(resolve).catch(reject);
      return;
    }

    stdout.write(question);

    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');

    let password = '';
    let done = false;

    const onData = (ch: string) => {
      if (done) return;

      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          done = true;
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          stdin.removeListener('data', onData);
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          done = true;
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          stdin.removeListener('data', onData);
          process.exit(130);
          break;
        case '\u007f': // Backspace (macOS/Linux)
        case '\u0008': // Ctrl+H (Windows)
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += ch;
          stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const clearTotp = args.includes('--clear-totp');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log('Reset admin password');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/reset-admin-password.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --clear-totp  Also disable TOTP/2FA for the user');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Environment:');
    console.log('  DATABASE_URL  Required. Prisma database connection string.');
    console.log('');
    console.log('Examples:');
    console.log('  DATABASE_URL=file:./data/dev.db npx tsx scripts/reset-admin-password.ts');
    console.log('  DATABASE_URL=file:./data/dev.db npx tsx scripts/reset-admin-password.ts --clear-totp');
    console.log('  docker exec -it bazingad node scripts/reset-admin-password.js');
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set.');
    console.error('');
    console.error('For local development:');
    console.error('  DATABASE_URL=file:./data/dev.db npm run admin:reset-password');
    console.error('');
    console.error('For Docker:');
    console.error('  docker exec -it bazingad node scripts/reset-admin-password.js');
    process.exit(1);
  }

  // In non-TTY mode, buffer all input lines upfront so multiple prompts work correctly.
  const isInteractive = process.stdin.isTTY;
  const bufferedLines = isInteractive ? null : await readAllStdinLines();
  const prompt = isInteractive
    ? interactivePrompt
    : createPrompts(bufferedLines!);

  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, totpEnabled: true },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.error('❌ No users found in the database.');
      console.error('   Use the setup flow at /setup to create an admin user.');
      process.exit(1);
    }

    let selectedUserId: string;

    if (users.length === 1 && isInteractive) {
      const user = users[0];
      console.log(`Found 1 user: ${user.username}`);
      if (user.totpEnabled) {
        console.log('⚠️  TOTP/2FA is enabled for this user.');
      }
      selectedUserId = user.id;
    } else {
      console.log('Found multiple users:');
      users.forEach((user, index) => {
        const totpStatus = user.totpEnabled ? ' (TOTP enabled)' : '';
        console.log(`  ${index + 1}. ${user.username}${totpStatus}`);
      });
      const choice = await prompt('Select user number: ');
      const index = parseInt(choice, 10) - 1;
      if (isNaN(index) || index < 0 || index >= users.length) {
        console.error('❌ Invalid selection.');
        process.exit(1);
      }
      selectedUserId = users[index].id;
    }

    const newPassword = isInteractive
      ? await promptHidden('Enter new password: ')
      : await prompt('Enter new password: ');

    if (!newPassword) {
      console.error('❌ Password cannot be empty.');
      process.exit(1);
    }

    const confirmPassword = isInteractive
      ? await promptHidden('Confirm new password: ')
      : await prompt('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.error('❌ Passwords do not match.');
      process.exit(1);
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      console.error(`❌ ${validationError}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    interface UserUpdateData {
      password: string;
      passwordChangedAt: Date;
      totpSecret?: null;
      totpEnabled?: boolean;
      totpVerified?: boolean;
      recoveryCode?: null;
    }

    const updateData: UserUpdateData = {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    };

    if (clearTotp) {
      updateData.totpSecret = null;
      updateData.totpEnabled = false;
      updateData.totpVerified = false;
      updateData.recoveryCode = null;
    }

    await prisma.user.update({
      where: { id: selectedUserId },
      data: updateData,
    });

    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: selectedUserId },
    });

    console.log('');
    console.log('✅ Password reset successfully!');
    if (clearTotp) {
      console.log('   TOTP/2FA has been disabled.');
    }
    console.log(`   ${deletedSessions.count} session(s) invalidated.`);
    console.log('   The user must log in again with the new password.');
  } catch (error) {
    console.error('');
    console.error('❌ Failed to reset password:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
