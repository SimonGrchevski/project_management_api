import {Express } from 'express';
import {AppDataSource} from "../../../data-source";
import TestApp from "../../utility/testApp";
import {Repository} from "typeorm";
import {User} from "../../../entities";
import {testUser} from "../../utility/utility";

describe('Integration | User', () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let userRepo:Repository<User>
    
    beforeAll(async () => {
        const appWithData = await TestApp.getInstance();
        await TestApp.cleanData();
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;
    })
    
    beforeEach(async () => {
        await TestApp.cleanData();
        userRepo = dataSource.getRepository(User);
    })
    
    afterAll(async () => {
        await TestApp.cleanData();
        await TestApp.cleanup();
    })
    
    it("Should register a new user successfully", async () => {
        const newUser = userRepo.create(testUser);
        const savedUser = await userRepo.save(newUser);
        
        expect(savedUser.id).toBeDefined();
        expect(savedUser.username).toBe("testuser");
        expect(savedUser.email).toBe("testemail@email.com");
    })
    
    it("Should read the user successfully", async () => {
        const user = await userRepo.save(testUser);
        const savedUser = await userRepo.save(user);
        expect(savedUser).not.toBeNull();
        
        const found = await userRepo.findOneBy({username: testUser.username});
        expect(found).toBeDefined();
        expect(savedUser?.email).toEqual("testemail@email.com");
    })
    
    it("Should update the user successfully", async () => {
        const user = await userRepo.save(testUser);
        const savedUser = await userRepo.save(user);
        expect(savedUser).not.toBeNull();
        
        savedUser.username = "anotherusername";
        await userRepo.save(user);
        expect(savedUser?.username).toEqual("anotherusername");
    })
    
    // it.only("Should reject already registered username", async () => {
    //     await userRepo.save(testUser);
    //     await expect( userRepo.save({
    //         username: "testuser",
    //         email:"anotheruser@mail.com",
    //         password: "1@3A5a65",
    //     })).rejects.toThrow(
    //         "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.username"
    //     );
    // })
    
    it("Should reject already registered email", async () => {
        const user = await userRepo.save(testUser);
        await expect( userRepo.save({
            username: "anotheruser@mail.com",
            email: "testemail@email.com",
            password: "1@3A5a65",
        })).rejects.toThrow(
            "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.email"
        )
    })
    
    it("Should set the default role properly", async () => {
        const user = await userRepo.save(testUser);
        
        expect(user).toBeDefined();
        expect(user.role).toEqual("Viewer");
    })
    
    it("Should reject an empty password", async () => {
        await expect( userRepo.save({
            ...testUser,
            password:undefined
        })).rejects.toThrow("SQLITE_CONSTRAINT: NOT NULL constraint failed: user.password");
    })
})