import { afterEach, describe, expect, it, vi } from "vitest";
import { importWithRetry, reloadOnce } from "./chunk-retry";

const reload = vi.fn();

afterEach(() => {
  sessionStorage.clear();
  reload.mockReset();
  vi.unstubAllGlobals();
});

function stubReload() {
  vi.stubGlobal("location", { ...window.location, reload });
}

describe("importWithRetry", () => {
  it("returns the module after a failed first attempt", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("503")).mockResolvedValue("ok");
    await expect(importWithRetry(load, 3, 0)).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("reloads once when every attempt fails", async () => {
    stubReload();
    const load = vi.fn().mockRejectedValue(new Error("503"));
    const pending = importWithRetry(load, 2, 0);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(load).toHaveBeenCalledTimes(2);
    void pending;
  });

  it("throws instead of reloading again within a minute", async () => {
    stubReload();
    sessionStorage.setItem("chunk-reload-at", String(Date.now()));
    await expect(importWithRetry(() => Promise.reject(new Error("503")), 2, 0)).rejects.toThrow("503");
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("reloadOnce", () => {
  it("reloads, then refuses a second time", () => {
    stubReload();
    expect(reloadOnce()).toBe(true);
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
