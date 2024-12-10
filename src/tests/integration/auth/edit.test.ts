import  request from "supertest";
import TestApp from "../../utility/testApp";
import { AppDataSource } from "../../../data-source";
import { Express } from "express";
import {
    registerUser,
    logUser,
    testUser,
} from "../../utility/utility"
import {rateLimiterManager} from "../../../middlewares";

describe("Integration | Auth - Edit", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let token: string;

    beforeAll( async () => {

        const appWithData = await TestApp.getInstance();
        await TestApp.cleanData();
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;
    })

    afterAll( async() => {
        await TestApp.cleanup();
    });

    beforeEach( async() => {
        await registerUser(expressApp,testUser);
        const loginResponse = await logUser(expressApp,testUser);
        token = loginResponse.headers["set-cookie"][0]
        .split(";")[0]
        .split("=")[1];
        rateLimiterManager.resetAllKeys();
    })

    afterEach(async () => {
        await TestApp.cleanData();
    });


    describe("Successfull update", () => {
        
        it("Should update the username successfully", async() => {
            const response  = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({username:"newusername",id:1});
            
            expect( response.status).toBe(200);
            expect(response.body.user.username).toBe("newusername");
        })

        it("Should update the email successfully", async() => {
            const response  = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({ email: "newemail@gmail.com", id:1});

            expect( response.status).toBe(200);
            expect(response.body.user.email).toBe("newemail@gmail.com");
        })

         it("Should update the password successfully", async() => {
            const response  = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({ password: "Mynewp@ssw0rd1", id:1});

            expect( response.status).toBe(200);
            expect(response.body.msg).toBe("User updated successfully");
         })

        it("should succeed updating username and password", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({username:"rateteruu" , password:"bestPas@word2",id:1});

            expect(response.status).toBe(200);
            expect(response.body.user.username).toBe("rateteruu");
        })

        it("should succeed updating username and email", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({username:"rateteruu" , email:"best@email.com", id:1});

            expect(response.status).toBe(200);
            expect(response.body.user.username).toBe("rateteruu");
        })

        it("should succeed updating email and password", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({password:"beSt2@password" , email:"best@email.com", id:1});

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe("best@email.com");
        })
    });

    describe("Validation", () => {

        it("shouldnt fail because of empty fields", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({});
            expect(response.status).toBe(403);
        })

        it("should fail because of email is empty", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({email: "",id:1});
            expect(response.status).toBe(400);
        })

        it("should fail because of password is empty", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({ password: "", id:1});
            expect(response.status).toBe(400);
        })

        it("should fail because of username is using special characters", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({...testUser, username: "testUs@er!", id:1});
            expect(response.status).toBe(400);
        })

        it("Should fail with multiple invalid fields", async () => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({
                    username: "user@invalid",
                    email: "invalidemail",
                });
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ msg: "Invalid email format" }),
                ])
            );
        });

        it("should fail because of username is too long - header too large", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({...testUser, username: 'a'.repeat(1000000), id:1});
            expect(response.status).toBe(413);
        })

        it("Should fail because password is too short", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({ password:"123", id:1});

            expect(response.status).toBe(400);
            expect.objectContaining({
                msg: "Invalid credentials",
                path: "password",
            });
        })

        it("Should fail because password is without digit", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({password:"mypassword", id:1});

            expect(response.status).toBe(400);
            expect.objectContaining({
                msg: "Invalid credentials",
                path: "password",
            });
        })

        it("Should fail because password is without uppercase letter", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({password:"mypassword123", id:1});

            expect(response.status).toBe(400);
            expect.objectContaining({
                msg: "Invalid credentials",
                path: "password",
            });
        })

        it("Should fail because email is invalid", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({ email:"invalidemail", id:1});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ msg: "Invalid email format"}),
                ])
            );
        })

        it("Should fail username is taken", async () => {
            await registerUser(expressApp, {
                username: "greatWarrior",
                password: "Gre@testPassword1",
                email: "great@email.com"
            });

            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({username:"greatWarrior", id:1});

            expect(response.status).toBe(400);
        })

        it("Should fail email is already used", async () => {
            const res = await registerUser(expressApp, {
                username: "greatWarrior",
                password: "Gre@testPassword1",
                email: "great@email.com"
            });

            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({email:"great@email.com", id:2});

            expect(response.status).toBe(403);
        })

        it("should trim the username", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({username:`     ${testUser.username}   `, id:1});
            expect(response.status).toBe(200);
            expect(response.body.user.username).toBe(testUser.username);
        })

        it("should trim the email", async() => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=${token}`])
                .send({email:`     ${testUser.email}   `,id:1});

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe(testUser.email);
        })
    })

    describe("Edge cases", () => {
        it("Should reject an invalid token", async () => {
            const response = await request(expressApp)
                .put("/auth/edit")
                .set("Cookie", [`token=invalid.token.here`])
                .send({ username: "newUsername" ,id:1});
            
            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Invalid token");
        });
    })
})
