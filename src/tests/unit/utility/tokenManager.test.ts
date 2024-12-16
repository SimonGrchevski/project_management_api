import jwt from 'jsonwebtoken';
import {TokenManager} from "../../../utility/tokenManager";

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
    sign: jest.fn(),
}))

describe("Utility | TokenManager", () => {
    const secretKey = 'test-secret-key';
    afterEach(() => {
        jest.restoreAllMocks();
    });
    
    it("Should generate a token with payload and options", async () => {
        
        const payload = {id : 1, email: "test@test.com"};
        const options = {expiresIn: "1h"};
        (jwt.sign as jest.Mock).mockReturnValue("mockedToken");
        
        const token = TokenManager.generateJwtToken(payload,secretKey, options);
        
        expect(jwt.sign).toHaveBeenCalledWith(payload,secretKey, options);
        expect(token).toBe("mockedToken");
    });
    
    it("Should verify a valid token and return its payload", async () => {
        const token = "mockedToken";
        const decPayload = {id : 1, email: "test@test.com"};
        (jwt.verify as jest.Mock).mockReturnValue(decPayload);
        
        const payload = TokenManager.verifyJwtToken(token, secretKey);
        expect(jwt.verify).toHaveBeenCalledWith(token,secretKey);
        expect(payload).toBe(decPayload);
    });
    
    it("Should return null if token verification fails", async () => {
        const token = "invalidToken";
        (jwt.verify as jest.Mock).mockImplementationOnce(()=>{
            throw new jwt.JsonWebTokenError("Invalid token");
        });
        const payload = TokenManager.verifyJwtToken(token, secretKey);
        expect(jwt.verify).toHaveBeenCalledWith(token,secretKey);
        expect(payload).toBe(null);
    });
    
    it("Should generate expiry date correctly", async () => {
        const mockDate = Date.now();
        jest.spyOn(global.Date, 'now').mockReturnValue(mockDate);
        
        const expiryDate = TokenManager.generateExpiryDate(24);
        const expectedDate = new Date(mockDate+24*60*60*1000);
        expect(expiryDate).toEqual(expectedDate);
    });
});
