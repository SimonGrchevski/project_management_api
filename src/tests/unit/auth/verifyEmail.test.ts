import {Request, Response} from 'express';
import {AuthController} from "../../../controllers/authController";
import {AppDataSource} from "../../../data-source";
import {User} from "../../../entities";
import {jest} from "@jest/globals";
import {ErrorFactory} from "../../../utility/errorFactory";
import {TokenManager} from "../../../utility/tokenManager";
import {Repository} from "typeorm";

jest.mock("../../../data-source", () => ({
    __esModule: true,
    AppDataSource: {
        getRepository: jest.fn(),
    },
}))

jest.mock("../../../utility/tokenManager", () => ({
    __esModule: true,
   TokenManager: {
        verifyToken: jest.fn(),
   }     
}))

jest.mock("../../../utility/errorFactory", () => ({
    __esModule: true,
    ErrorFactory: {
        notFound: jest.fn(),
        internal: jest.fn(),
        badRequest: jest.fn(),
        unauthorized: jest.fn(),
    }
}))


describe("Unit | Auth - verifyEmail", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let userRepo: jest.Mocked<Repository<User>>;
    
    beforeEach( () => {
        req = { body:{ token: "validToken"} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as Partial<Response>;
        
        next = jest.fn();
        
        userRepo = {
            findOneBy: jest.fn(),
            save: jest.fn()
        } as unknown as jest.Mocked<Repository<User>>;

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo);
    })
    
    afterEach( () => {
        jest.clearAllMocks();
    })
    
    it("Should verify email successfully", async () => {
        (TokenManager.verifyJwtToken as jest.Mock).mockReturnValueOnce({
            userId:1,
        });
        
        userRepo.findOneBy.mockResolvedValueOnce({
           id: 1,
           isEmailVerified: false 
        }as User);
        
        await AuthController.verifyEmail(req as Request, res as Response, next);
        expect(TokenManager.verifyJwtToken).toHaveBeenCalledWith("validToken", process.env.JWT_SECRET);
        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1} as User);
        expect(userRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({isEmailVerified: true}),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({msg:"Email verified successfully"});
    });
    
    it("Should return 401 for invalid token", async () => {
        (TokenManager.verifyJwtToken as jest.Mock).mockImplementationOnce( () => {
            throw new Error("Invalid token");
        })
        
        await AuthController.verifyEmail(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(ErrorFactory.notFound);
    })
    
    it("Should return 400 if user is already verified", async () => {
        (TokenManager.verifyJwtToken as jest.Mock).mockReturnValueOnce({
            userId:1,
        })
        
        userRepo.findOneBy.mockResolvedValueOnce({
            id:1,
            isEmailVerified: true,
        }as User);
        
        await AuthController.verifyEmail(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: "User is already verified" })
        );
        
    });
    
    it("Should handle unexpected errrors", async () => {
        (TokenManager.verifyJwtToken as jest.Mock).mockImplementationOnce( () => {
            throw new Error("Unexpected Error");
        });
        
        await AuthController.verifyEmail(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(ErrorFactory.internal);
    })
})