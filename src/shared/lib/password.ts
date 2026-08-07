import "server-only";

import { hash, verify, type Options } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} satisfies Options;

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$JmaAvNyUrt7/VkJAiFYbPw$jWexWAIAWl6fSJU6U5DoUlGJozODwn5xok6QHXFKzGU";

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return verify(passwordHash, password);
}

export function verifyPasswordOrDummy(
  password: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  return verify(passwordHash ?? DUMMY_PASSWORD_HASH, password);
}
