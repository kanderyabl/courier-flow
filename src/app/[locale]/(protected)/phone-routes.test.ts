import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangePhonePage from "./change-phone/page";
import VerifyPhonePage from "./verify-phone/page";

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

type PhonePage = (props: {
  params: Promise<{
    locale: string;
  }>;
}) => Promise<void>;

const phonePages: Array<[string, PhonePage]> = [
  ["change phone", ChangePhonePage],
  ["verify phone", VerifyPhonePage],
];

describe.each(phonePages)("%s route", (_name, page) => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it.each(["en", "uk"])(
    "redirects the %s locale to the protected home page",
    async (locale) => {
      await expect(
        page({
          params: Promise.resolve({ locale }),
        }),
      ).rejects.toThrow(`NEXT_REDIRECT:/${locale}`);

      expect(redirectMock).toHaveBeenCalledOnce();
      expect(redirectMock).toHaveBeenCalledWith(`/${locale}`);
    },
  );
});
