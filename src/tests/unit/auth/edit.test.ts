import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../data-source";
import { User } from "../../../entities";
import { AuthController } from "../../../controllers/authController";
import { ErrorFactory } from "../../../utility/errorFactory";
import {Repository} from "typeorm";
import {testUser} from "../../utility/utility";

jest.mock("../../../data-source", () => ({
   __esModule: true,
   AppDataSource: {
       getRepository: jest.fn(),
   } 
}));

jest.mock("../../../utility/errorFactory", () => ({
    __esModule: true,
    ErrorFactory: {
        notFound: jest.fn(),
        badRequest: jest.fn(),
        internal: jest.fn()
    },
}));

describe("Unit | Auth - Edit", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let userRepo: jest.Mocked<Repository<User>>;
    
    beforeEach(() => {
        req = {
            currentUser: { id: 1},
            body: {
            ...testUser
            }
        } as Partial<Request>;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        next = jest.fn();
        userRepo = {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
        }  as unknown as jest.Mocked<Repository<User>>

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo);
        jest.spyOn(AppDataSource, "getRepository").mockReturnValue(userRepo);
        
    })
    
    afterEach(() => {
        jest.clearAllMocks();
    })
    
    it("Should update the user successfully", async () => {
        const updatedUser = {...testUser, username: "newUsername"} as User;
        
        userRepo.findOneBy.mockResolvedValueOnce(testUser as User);
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.save.mockResolvedValueOnce(updatedUser);
        
        await AuthController.edit(req as Request, res as Response, next);
        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1} );
        expect(userRepo.findOne).toHaveBeenCalledWith({ 
            where: 
                {
                    username:testUser.username 
                }
        });
        expect(userRepo.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: "User updated successfully",
            user:{
                email: updatedUser.email,
                username: updatedUser.username,
            },
        })
    })
    
    it("Should return 401 when current user is missing", async () => {
        req = {
            currentUser: null,
            body: {
                ...testUser
            }
        } as Partial<Request>;
        
        await AuthController.edit(req as Request, res as Response, next);
        expect(next).toHaveBeenCalledWith(ErrorFactory.notFound([], "Account cant be found"));
        expect(userRepo.findOne).not.toHaveBeenCalled();
    })
    
    it("Should return 400 when all fields are missing in the body", async () => {
        req = {
            currentUser: {id:1},
            body: {}
        } as Partial<Request>;
        
        await AuthController.edit(req as Request, res as Response, next);
        
        expect(next).toHaveBeenCalledWith(ErrorFactory.badRequest([], "The fields are empty"));
        expect(userRepo.findOneBy).not.toHaveBeenCalled();
    });
    
    it("Should return 400 when username is already taken", async () => {
        req = {
            currentUser: {id:1},
            body: {username: "existingUsername"}
        } as Partial<Request>;
        
        
       const conflictUser = {...testUser, username: "newUsername", id: 2} as User;
       userRepo.findOneBy.mockResolvedValueOnce(testUser as User);
       userRepo.findOne.mockResolvedValueOnce(conflictUser as User);
       
       await AuthController.edit(req as Request, res as Response, next);

        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1} );
        expect(userRepo.findOne).toHaveBeenCalledWith({
            where: { username: "existingUsername" },
        });
        expect(userRepo.save).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(ErrorFactory.badRequest([], "Username already taken"));
        
    });
    
    it("Should return 400 when email is already taken", async () => {
        const conflictingUser = { ...testUser, id: 2 } as User;
        userRepo.findOneBy.mockResolvedValueOnce(testUser as User);
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(conflictingUser);
        
        await AuthController.edit(req as Request, res as Response, next);
        
        expect(next).toHaveBeenCalledWith(ErrorFactory.badRequest([], "Email already in use"));
        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1} );
        expect(userRepo.findOne).toHaveBeenCalledWith({
            where: { email: testUser.email },
        });
        expect(userRepo.save).not.toHaveBeenCalled();
    })
    
    it("Should return 404 when the user is not found", async () => {
        userRepo.findOneBy.mockRejectedValueOnce(null);
        await AuthController.edit(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(ErrorFactory.notFound([], "Account cant be found"));
        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1});
        expect(userRepo.findOne).not.toHaveBeenCalled();
        expect(userRepo.save).not.toHaveBeenCalled();
    })
    
    it("Should return 500 for unexpected error", async () => {
        userRepo.findOneBy.mockRejectedValueOnce(new Error("Unexpected error"));
        await AuthController.edit( req as Request,res as Response, next);
        
        expect(userRepo.findOneBy).toHaveBeenCalledWith({id:1});
        expect(next).toHaveBeenCalledWith(ErrorFactory.internal([], "Internal server error"));
        
        expect(userRepo.findOne).not.toHaveBeenCalled();
        expect(userRepo.save).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    })
})