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
import {TokenManager} from "../../../utility/tokenManager";

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

jest.mock("../../../utility/tokenManager", () => ({
   __esModule: true,
   TokenManager: {
      generateJwtToken: jest.fn(),
      generateExpiryDate: jest.fn(),
   }
}))

describe("Unit | Auth - Register", () => {
   let req: Partial<Request>;
   let res: Partial<Response>;
   let next: jest.Mock;
   let userRepo: jest.Mocked<Repository<User>>;
   let mockQueryBuilder: any;
   let verificationToken: string;
   let verificationTokenExpires:Date
   let hashedPassword: string;
   
   beforeAll( async () => {
      verificationToken = "mockVerificaiTontoken";
      verificationTokenExpires = new Date(Date.now() + 24 * 60 *60 * 1000);
      hashedPassword = "H@sh3dpAssword";
      //
      req = {
         body: {...testUser, verificationToken, verificationTokenExpires},
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
   
   it("Should register a new user and generate a verification token", async () => {
      const expiryDate = Date.now();
      (TokenManager.generateJwtToken as jest.Mock).mockReturnValueOnce(verificationToken);
      (TokenManager.generateExpiryDate as jest.Mock).mockReturnValueOnce(expiryDate)
      // 
      req = {
        body: {...testUser, email:"organizeyu@yahoo.com", verificationToken, verificationTokenExpires}, 
      }
      //
      await AuthController.register(req as Request, res as Response, next);
      // Uncomment after the email sending feautre is done and its mocked
      
      // expect(validationResult).toHaveBeenCalledWith(req);
      // expect(TokenManager.generateJwtToken).toHaveBeenCalledWith(
      //     {email: testUser.email},
      //     expect.any(String),
      //     expect.objectContaining({expiresIn: "24h"})
      // );
      // expect(userRepo.create).toHaveBeenCalledWith({
      //    username: testUser.username,
      //    email: testUser.email,
      //    password: hashedPassword,
      //    role: undefined,
      //    verificationToken,
      //    verificationTokenExpires:expiryDate
      // });
      //
      // expect(userRepo.create).toHaveBeenCalled();
      // expect(res.status).toHaveBeenCalledWith(201);
   });
   
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
