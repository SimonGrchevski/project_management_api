import  request from "supertest";
import { createApp } from "../app";
import { AppDataSource } from "../data-source";
import { Express } from "express";
import {
    registerUser,
    logUser,
    testUser,
    cleanData
} from "./utility/utility"

describe("auth/edit", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let token: string;

    beforeAll( async () => {
        const appWithData = createApp();
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;

        await dataSource.initialize();
        cleanData(dataSource);
    })


    afterAll( async() => {
        if(dataSource.isInitialized) {
            dataSource.destroy();
        }
    });

    beforeEach( async() => {
        cleanData(dataSource);
        await registerUser(expressApp,testUser);
        const loginResponse = await logUser(expressApp,testUser);
        token = loginResponse.headers["set-cookie"][0]
            .split(";")[0]
            .split("=")[1];
    })

    it("Should update the username successfully", async() => {
        const response  = await request(expressApp)
            .put("/auth/edit")
            .set("Cookie", [`token=${token}`])
            .send({username: "newUsername"});

        expect( response.status).toBe(200);
        expect(response.body.user.username).toBe("newUsername");

    })

    it("Should update the email successfully", async() => {
        const response  = await request(expressApp)
            .put("/auth/edit")
            .set("Cookie", [`token=${token}`])
            .send({email: "newemail@gmail.com"});
;
        expect( response.status).toBe(200);
        expect(response.body.user.email).toBe("newemail@gmail.com");

    })

    it("Should update the password successfully", async() => {
        const response  = await request(expressApp)
            .put("/auth/edit")
            .set("Cookie", [`token=${token}`])
            .send({email: "Mynewp@ssw0rd"});

        expect( response.status).toBe(200);
        expect(response.body.user.email).toBe("Mynewp@ssw0rd");

    })
})