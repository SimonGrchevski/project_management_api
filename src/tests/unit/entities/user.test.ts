import { User } from "../../../entities";
import {Express} from "express";
import {AppDataSource} from "../../../data-source";
import TestApp from "../../utility/testApp";
import {Repository} from "typeorm";
import {testUser} from "../../utility/utility";

describe("User unit tests", () => {
    
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let userRepo: Repository<User>;
    
    beforeEach(async() => {
        const appWithDataSource = await TestApp.getInstance();
        await TestApp.cleanData();

        expressApp = appWithDataSource.app;
        dataSource = appWithDataSource.dataSource;
        userRepo = dataSource.getRepository(User);
    })
    beforeEach(() => {})
    
    it("Should create a new user", async() =>{
        const user = userRepo.create(testUser)
        const savedUser = await userRepo.save(user);
        expect(savedUser).not.toBeNull();
        expect(savedUser.username).toEqual("testuser");
        expect(savedUser.email).toEqual("testemail@email.com");
    })
    
    it("Should retrieve user by id", async() =>{
        const user = await userRepo.save(testUser);
        
        const foundUser = await userRepo.findOneBy({id: user.id})
        expect(foundUser).toBeDefined();
        expect(foundUser?.username).toEqual("testuser");
    })
    
    it("Should update a user", async() =>{
        const user = await userRepo.save(testUser);
        user.username = "newUsername";
        
        await userRepo.save(user);
        expect(user.username).toEqual("newUsername");
    })
    
    it("Should'nt allow duplicate usernames", async() =>{
        await userRepo.save(testUser);
        await expect( userRepo.save({
            username: testUser.username,
            email: "otheruser@test.com",
            password: "1As@er09D",
        })).rejects.toThrow();
    })
    
    it("Shouldnt allow duplicate emails", async() =>{
        await userRepo.save(testUser);
        await expect( userRepo.save({
            username: "Johnson",
            email: testUser.email,
            password: "1As@er09D",
        })).rejects.toThrow();
    })
});
