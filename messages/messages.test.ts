import { describe, expect, it } from "vitest";

import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import hi from "./hi.json";
import uk from "./uk.json";
import zh from "./zh.json";

type MessageTree = {
  [key: string]: string | MessageTree;
};

function flattenMessages(
  tree: MessageTree,
  prefix = "",
  flattened: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      flattened[path] = value;
      continue;
    }

    flattenMessages(value, path, flattened);
  }

  return flattened;
}

function extractMessageTokens(message: string): string[] {
  const argumentTokens = Array.from(
    message.matchAll(/\{([A-Za-z][\w]*)/g),
    (match) => `{${match[1]}}`,
  );
  const richTextTokens = Array.from(
    message.matchAll(/<(\/?)([A-Za-z][\w]*)>/g),
    (match) => `<${match[1]}${match[2]}>`,
  );

  return [...new Set([...argumentTokens, ...richTextTokens])].sort();
}

function collectMessageTokens(
  messages: Record<string, string>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [
      key,
      extractMessageTokens(value),
    ]),
  );
}

const referenceMessages = flattenMessages(en);
const referenceKeys = Object.keys(referenceMessages).sort();
const referenceTokens = collectMessageTokens(referenceMessages);

const messageCatalogs = {
  en,
  es,
  fr,
  hi,
  uk,
  zh,
} satisfies Record<string, MessageTree>;

describe.each(Object.entries(messageCatalogs))(
  "%s message catalog",
  (_locale, messages) => {
    const flattenedMessages = flattenMessages(messages);

    it("has exactly the same message keys as English", () => {
      expect(Object.keys(flattenedMessages).sort()).toEqual(referenceKeys);
    });

    it("preserves interpolation and rich-text tokens", () => {
      expect(collectMessageTokens(flattenedMessages)).toEqual(referenceTokens);
    });

    it("does not contain empty messages", () => {
      expect(
        Object.entries(flattenedMessages).filter(
          ([, value]) => value.trim().length === 0,
        ),
      ).toEqual([]);
    });
  },
);
