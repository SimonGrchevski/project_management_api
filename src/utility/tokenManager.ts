import crypto from "crypto";
import jwt from "jsonwebtoken";

export class TokenManager {
    static generateRandomToken(): string {
      return crypto.randomBytes(32).toString("hex");  
    };
    
    static generateJwtToken(
        payload: object,
        secret: string,
        options: jwt.SignOptions = { 
            expiresIn: "24h",
            algorithm: "HS512"
        }
    ) : string {
        return jwt.sign(payload, secret, options);    
    }
    
    static verifyJwtToken(token: string, secret:string):  jwt.JwtPayload | null {
        try{
            const dec =  jwt.verify(token, secret);
            if( typeof dec === "object")
                return dec as unknown as jwt.JwtPayload;
            
            return null;
        } catch {
            return null;
        }
    }
    
    static generateExpiryDate(hours: number): Date {
        return new Date(Date.now() + hours*60*60*1000);
    }
}