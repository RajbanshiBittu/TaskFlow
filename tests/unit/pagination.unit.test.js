import { describe, expect, it } from "vitest";

import { paginationResponse, parsePagination } from "../../src/utils/pagination.js";

describe("pagination", () => {
    it("uses page 1 and limit 20 by default", () => {
        expect(parsePagination()).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
    });

    it("calculates offsets for custom pages and limits", () => {
        expect(parsePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20, take: 10 });
    });

    it("accepts the maximum limit and rejects invalid values", () => {
        expect(parsePagination({ page: 1, limit: 100 }).limit).toBe(100);
        expect(() => parsePagination({ page: 0, limit: 20 })).toThrow();
        expect(() => parsePagination({ page: 1, limit: 101 })).toThrow();
        expect(() => parsePagination({ page: 1, limit: 1.5 })).toThrow();
    });

    it("returns the required response structure", () => {
        expect(paginationResponse({ data: [], total: 0, page: 1, limit: 20 })).toEqual({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
        });
    });
});
