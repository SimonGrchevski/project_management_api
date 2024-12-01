import rateLimit from "express-rate-limit";
import createRateLimiterManager from "../../../middlewares/rateLimiterManager";

jest.mock("express-rate-limit")

let keyGenerator: (req: Request) => string;

(rateLimit as jest.Mock).mockImplementation((o) => {
    keyGenerator = o.keyGenerator;
    return jest.fn();
})

describe("RateLimitManager", () => {
    describe("Key generation", () => {

        it("should use x-forwarded-for if available", () => {
            const mockReq = {
                headers: { "x-forwarded-for": "192.168.1.1" },
                ip: "127.0.0.1",
            } as unknown as Request;

            createRateLimiterManager();

            const key = keyGenerator(mockReq);
            expect(key).toBe("192.168.1.1");
        })

        it("Should fallback to req.ip if x-forwarded-for is missing", () => {
            const mockReq = {
                headers: {},
                ip: "127.0.0.1"
            } as unknown as Request
            
            const key = keyGenerator(mockReq);
            expect(key).toBe("127.0.0.1");
        })

        it("Should fallback to unknown when x-forwarded-for and req.ip is missing", () => {
            const mockReq = {
                headers: {},
                ip: undefined
            } as unknown as Request

            const key = keyGenerator(mockReq);
            expect(key).toBe("unknown");
        })
    })

    describe("Key management", () => {

        let mockResetKey: jest.Mock;

        beforeEach(() => {
            mockResetKey = jest.fn();
            (rateLimit as jest.Mock).mockReturnValue({
                resetKey: mockResetKey,
            });
        })


        it("Should add a key using addKey", () => {
            const { addKey, getUsedKeys } = createRateLimiterManager();

            addKey("testkey");
            expect(getUsedKeys()).toContain("testkey");
        })

        it("Should reset specific key using resetkey", () => {
            const{ resetKey, addKey, getUsedKeys } = createRateLimiterManager();

            addKey("testkey");
            resetKey("testkey");

            expect(mockResetKey).toHaveBeenCalledWith("testkey");
            expect(getUsedKeys()).not.toContain("testkey");
        })

        it("should reset all keys using resetAllKeys", () => {
            const { addKey, resetAllKeys, getUsedKeys} = createRateLimiterManager();

            addKey("testkey1")
            addKey("testkey2")
            resetAllKeys();

            expect(mockResetKey).toHaveBeenCalledWith("testkey1");
            expect(mockResetKey).toHaveBeenCalledWith("testkey2");
            expect(getUsedKeys()).toEqual([]);
        })

        it("Should return all keys using getUsedKeys", () => {

            const {addKey, getUsedKeys} = createRateLimiterManager();
            addKey("testkey1");
            addKey("testkey2");

            expect(getUsedKeys()).toEqual(["testkey1", "testkey2"]);

        })
    })
});

