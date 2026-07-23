import bcrypt from "bcryptjs";

/**
 * Password hashing using bcrypt (pure-JS `bcryptjs` so it runs in any Node
 * runtime without native bindings). Cost factor 12 balances security and
 * latency for interactive logins.
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
