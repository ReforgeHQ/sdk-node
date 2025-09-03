import { jest } from "@jest/globals";
import {
  fetchWithCache,
  clearFetchCache,
  type ApiClient,
  type InternalFetchArgs,
} from "../apiClient";
import type { FetchResult } from "../types";

const cachedResponseObject = { key: "value" };

describe("fetchWithCache", () => {
  let fetchMock: jest.MockedFunction<(args: InternalFetchArgs) => FetchResult>;
  let mockApiClient: ApiClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.now());
    clearFetchCache();
    fetchMock = jest.fn() as jest.MockedFunction<
      (args: InternalFetchArgs) => FetchResult
    >;
    mockApiClient = { fetch: fetchMock } satisfies ApiClient;
  });
  afterEach(() => {
    fetchMock.mockClear();
  });

  test("calls fetch and returns the response", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => cachedResponseObject,
      headers: new Headers(),
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    const response = await fetchWithCache(mockApiClient, args);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: args.source,
        path: args.path,
        options: expect.objectContaining(args.options),
      })
    );
    expect(response.status).toBe(200);
  });

  test("properly parses max-age for cache expiration", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => cachedResponseObject,
      headers: new Headers({ "Cache-Control": "max-age=600" }), // ✅ Cached for 600 seconds
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    await fetchWithCache(mockApiClient, args); // ✅ First request stores response in cache

    // Simulate time passing below max-age
    jest.setSystemTime(Date.now() + 5 * 60 * 1000); // 5 minutes later (still within max-age)

    fetchMock.mockClear(); // ✅ Clear call history before second request

    const responseResult = await fetchWithCache(mockApiClient, args);

    // ✅ Ensure fetchMock was NOT called again
    expect(fetchMock).not.toHaveBeenCalled();

    // ✅ Ensure the response comes from cache
    const json = await responseResult.json();
    expect(json).toEqual(cachedResponseObject);
  });

  test("respects Cache-Control: no-store (does not cache response)", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => cachedResponseObject,
      headers: new Headers({ "Cache-Control": "no-store" }),
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    await fetchWithCache(mockApiClient, args);

    fetchMock.mockClear();

    // Second request should NOT use cache and should call API again
    await fetchWithCache(mockApiClient, args);

    expect(fetchMock).toHaveBeenCalledTimes(1); // API should be called again
  });

  test("respects Cache-Control: must-revalidate (forces revalidation)", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => cachedResponseObject,
      headers: new Headers({
        "Cache-Control": "must-revalidate",
        ETag: '"abc123"',
      }),
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    await fetchWithCache(mockApiClient, args);

    // Mock a revalidation request
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { another: "cached" } }),
      headers: new Headers({ ETag: '"abc123"' }),
    });

    const response = await fetchWithCache(mockApiClient, args);

    expect(fetchMock).toHaveBeenCalledTimes(2); // Should call API again
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ data: { another: "cached" } }); // Should return updated data
  });

  test("evicts expired cache entries after max-age", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => cachedResponseObject,
      headers: new Headers({ "Cache-Control": "max-age=600" }),
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    await fetchWithCache(mockApiClient, args);

    // Simulate time passing beyond max-age (expired)
    jest.setSystemTime(Date.now() + 700 * 1000); // 700 sec > 600 sec (expired)

    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ data: { another: "cached" } }),
      headers: new Headers({ ETag: '"abc123"' }),
    });

    const response = await fetchWithCache(mockApiClient, args);

    expect(fetchMock).toHaveBeenCalledTimes(2); // Should re-fetch
    const json = await response.json();
    expect(json).toEqual({ data: { another: "cached" } }); // New data should be returned
  });

  test("respects Cache-Control: no-cache (forces revalidation but can use cached data)", async () => {
    const cachedData = cachedResponseObject;

    // First fetch: returns 200 OK and caches the result
    fetchMock.mockResolvedValueOnce({
      status: 200,
      json: async () => cachedData,
      headers: new Headers({ ETag: '"abc123"', "Cache-Control": "no-cache" }),
    });

    const args: InternalFetchArgs = {
      source: "https://example.com",
      path: "/config",
      options: {},
    };

    await fetchWithCache(mockApiClient, args);

    // Clear mock call history before second request
    fetchMock.mockClear();

    // Second request: should send `If-None-Match`, and the server responds with 304
    fetchMock.mockResolvedValueOnce({
      status: 304,
      json: async () => ({ data: "not-used" }), // This should not be used
      headers: new Headers({ ETag: '"abc123"' }),
    });

    const response = await fetchWithCache(mockApiClient, args);

    // ✅ Ensure fetchMock was called again (revalidation required)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: args.source,
        path: args.path,
        options: expect.objectContaining({
          headers: expect.objectContaining({
            "If-None-Match": '"abc123"',
          }),
        }),
      })
    );

    // ✅ Ensure response contains cached data
    expect(response.status).toBe(200);

    // 🔥 Ensure cached `json()` is used
    const json = await response.json();
    expect(json).toEqual(cachedResponseObject); // Should return cached data
  });
});
