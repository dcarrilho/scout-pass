import "@testing-library/jest-dom";

process.env.SESSION_SECRET = "test-secret-key-that-is-at-least-32-characters-long!!";
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT;replace;${url};307;` }); }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

beforeEach(() => {
  vi.clearAllMocks();
});
