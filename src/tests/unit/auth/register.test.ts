import {Request, Response} from "express";
import {validationResult} from "express-validator";
import {AppDataSource} from "../../../data-source";
import {ErrorFactory} from "../../../utility/errorFactory";
import bcrypt from "bcrypt";
import {jest} from "@jest/globals";
import {Repository} from "typeorm";
import {User} from "../../../entities";
import {testUser} from "../../utility/utility";
import {AuthController} from "../../../controllers/authController";

jest.mock("../../../data-source", () => ({
   __esModule: true,
   AppDataSource: {
      getRepository: jest.fn()
   }
}))

jest.mock("../../../utility/errorFactory", () => ({
   __esModule: true,
   ErrorFactory: {
      notFound: jest.fn(),
      internal: jest.fn(),
      badRequest: jest.fn(),
   }
}))

jest.mock("bcrypt", () => ({
   hash: jest.fn(),
}));

jest.mock("express-validator", () => ({
   validationResult: jest.fn(() => ({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
   }))
}))

describe("Unit | Auth - Register", () => {
   let req: Partial<Request>;
   let res: Partial<Response>;
   let next: jest.Mock;
   let userRepo: jest.Mocked<Repository<User>>;
   let mockQueryBuilder: any;
   
   beforeAll( async () => {
      req = {
         body: {...testUser},
      };
      
      res = {
         status: jest.fn().mockReturnThis(),
         json: jest.fn()
      } as unknown as Response;
      
      next = jest.fn();
      
      mockQueryBuilder = {
         where: jest.fn().mockReturnThis(),
         getOne: jest.fn()
      };
      
      userRepo = {
         createQueryBuilder: jest.fn(() => mockQueryBuilder),
         create: jest.fn(),
         save: jest.fn(),
      } as unknown as jest.Mocked<Repository<User>>;
      
      (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo);
      jest.spyOn(AppDataSource, "getRepository").mockReturnValue(userRepo);

      (bcrypt.hash as jest.Mock).mockImplementation(() => Promise.resolve("H@sh3dpAssword"));

      (ErrorFactory.notFound as jest.Mock).mockReturnValue(new Error("Not found error"));
      (ErrorFactory.badRequest as jest.Mock).mockReturnValue(new Error("Bad request"));
   });
   
   afterEach(() => {
      jest.clearAllMocks();
   })
   
   it("Should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValueOnce({
         isEmpty: jest.fn().mockReturnValue(false),
         array: jest.fn().mockReturnValue([{msg: "Invalid input"}]),
      });
      
      await AuthController.register(req as Request, res as Response, next);
      expect(ErrorFactory.badRequest).toHaveBeenCalled();
      expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
   });
   
   it("Should fail if username or email already exists", async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(testUser);
      
      await AuthController.register(req as Request, res as Response, next);
      
      expect(userRepo.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          "LOWER(user.username) = :username OR LOWER(user.email) = :email",
          { 
             username: testUser.username,
             email: testUser.email,
          } 
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalledWith();
      expect(ErrorFactory.badRequest).toHaveBeenCalled();
      expect(userRepo.create).not.toHaveBeenCalled();
   });
   
   it("Should register new user successfully", async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);
      const hashedPassword = "H@sh3dpAssword";
      userRepo.create.mockReturnValueOnce({...testUser, password: hashedPassword} as unknown as User);
      userRepo.save.mockResolvedValue({...testUser, password: hashedPassword, id:1 }as unknown as User);
      
      await AuthController.register(req as Request, res as Response, next);

      expect(userRepo.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          "LOWER(user.username) = :username OR LOWER(user.email) = :email",
          { 
             username: testUser.username,
             email: testUser.email
          }
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(ErrorFactory.badRequest);
      expect(bcrypt.hash).toHaveBeenCalled()
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
   })
   
   it("Should handle unexpected error", async () => {
      mockQueryBuilder.getOne
          .mockImplementation(() => {
             throw new Error("Unexpected error")
          });
      
      await AuthController.register(req as Request, res as Response, next);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(ErrorFactory.internal).toHaveBeenCalled();
   })
});
