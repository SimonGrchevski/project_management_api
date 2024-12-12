import { Request, Response, NextFunction } from "express";
import {User} from "../../../entities";
import {jest} from "@jest/globals";
import {AppDataSource} from "../../../data-source";
import {AuthController} from "../../../controllers/authController";
import {ErrorFactory} from "../../../utility/errorFactory";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {Repository} from "typeorm";
import {validationResult} from "express-validator";
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
        internal: jest.fn(),
        unauthorized: jest.fn(),
        badRequest: jest.fn(),
    }
}))

jest.mock("bcrypt");

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
    verify: jest.fn(),
}));

jest.mock("express-validator", () => ({
    validationResult: jest.fn(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
    })),
}));

describe("Unit | Auth - Login", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let userRepo: jest.Mocked<Repository<User>>;
    let mockQueryBuilder: any;
    
    beforeAll(() => {
        req = {
            body:{ ...testUser},
        }
        
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
        } as Partial<Response>;
        
        next = jest.fn();

        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        };

        userRepo = {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        } as unknown as jest.Mocked<Repository<User>>;
        
        (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo);
        jest.spyOn(AppDataSource, "getRepository").mockReturnValue(userRepo);

        (ErrorFactory.unauthorized as jest.Mock).mockReturnValue(new Error("Unauthorized error"));
        (ErrorFactory.notFound as jest.Mock).mockReturnValue(new Error("Not found error"));
        (ErrorFactory.badRequest as jest.Mock).mockReturnValue(new Error("Not found error"));

    })
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should return 404 if no user is found", async () => {
        mockQueryBuilder.getOne.mockResolvedValueOnce(null);

        await AuthController.login(req as Request, res as Response, next);

        expect(userRepo.createQueryBuilder).toHaveBeenCalledWith("user");
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
            "LOWER(user.username) = LOWER(:username)",
            { username: "testuser" }
        );
        expect(ErrorFactory.notFound).toHaveBeenCalled();
    });
    
    it("Should return 401 for invalid password", async () => {
        mockQueryBuilder.getOne.mockResolvedValueOnce(testUser as User);
        jest.spyOn(bcrypt, "compare").mockImplementation(() => {
            return Promise.resolve(false);
        });
        
        await AuthController.login(req as Request, res as Response, next);

        expect(userRepo.createQueryBuilder).toHaveBeenCalledWith("user");
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
            "LOWER(user.username) = LOWER(:username)",
            { username: "testuser" }
        );
        expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        
        expect(bcrypt.compare).toHaveBeenCalledWith(
            testUser.password,
            req.body.password
        );

        expect(ErrorFactory.unauthorized).toHaveBeenCalled();
    });
    
    it("Should return 400 for validation error", async () => {
        (validationResult as unknown as jest.Mock).mockImplementationOnce(() => ({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{msg:"Invalid input"}]),  
        }))
        
        await AuthController.login(req as Request, res as Response, next);
        
        expect(validationResult).toHaveBeenCalledWith(req);
        expect(ErrorFactory.badRequest).toHaveBeenCalled();
    });
    
    it("Should return 200 with token on successfull login", async () => {
        mockQueryBuilder.getOne.mockResolvedValueOnce({...testUser, id:1} as User);
        
        jest.spyOn(bcrypt, "compare").mockImplementation(() => {
            return Promise.resolve(true);
        });
        
        (jwt.sign as jest.Mock).mockImplementationOnce(async (): Promise<string> => {
            return Promise.resolve("validToken");
        })
        
        await AuthController.login(req as Request, res as Response, next);
        
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
            "LOWER(user.username) = LOWER(:username)",
            { username: testUser.username.toLowerCase() }
        );
        
        expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        expect(bcrypt.compare).toHaveBeenCalledWith(
            testUser.password,
            req.body.password
        );
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                id: 1,
                username: testUser.username.toLowerCase(),
                aud: process.env.AUD,
                iss: process.env.ISS,
            },
            process.env.SECRET_KEY,
            { expiresIn: "1h", algorithm: "HS512" }
        );
        
        expect(res.cookie).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it("Should return 500 for unexpected error", async () => {
        mockQueryBuilder.getOne.mockRejectedValueOnce(new Error("Unexpected error"));
        
        await AuthController.login(req as Request, res as Response, next);
        
        expect(mockQueryBuilder.getOne).toHaveBeenCalled();
        expect(ErrorFactory.internal).toHaveBeenCalled();
    })
})