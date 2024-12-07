import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../data-source";
import { User } from "../../../entities";
import { AuthController } from "../../../controllers/authController";
import { ErrorFactory } from "../../../utility/errorFactory";
import { Repository, DeleteResult } from "typeorm";

jest.mock("../../../data-source", () => ({
    __esModule: true,
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

jest.mock("../../../utility/errorFactory", () => ({
    __esModule: true,
    ErrorFactory: {
        notFound: jest.fn(),
    },
}));

describe("DeleteUserController - Unit Tests", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    let userRepo: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        req = {
            params: { userId: "1" },
        } as Partial<Request>;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();

        userRepo = {
            delete: jest.fn(),
        } as unknown as jest.Mocked<Repository<User>>;

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should call next with notFound error if no user was deleted", async () => {
        userRepo.delete.mockResolvedValueOnce({ affected: 0 } as DeleteResult);
        
        await AuthController.delete(req as Request, res as Response, next);
        expect(userRepo.delete).toHaveBeenCalledWith({ id: 1 });
        expect(next).toHaveBeenCalledWith(ErrorFactory.notFound([], "User cant be found"));
    });

    it("Should delete the user and return 200", async () => {
        userRepo.delete.mockResolvedValueOnce({ affected: 1 } as DeleteResult);
        
        await AuthController.delete(req as Request, res as Response, next);
        expect(userRepo.delete).toHaveBeenCalledWith({ id: 1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: "User deleted successfully",
        });
        
        expect(next).not.toHaveBeenCalled();
    });
});
