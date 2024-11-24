import request from "supertest";
import app from "../app";

describe("Auth API", () => {
    it("Should register a new user successfully", async() => {
        const response = await request(app)
        .post("/auth/register");
        // .send()


        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual( {
            msg:"All is good"
        });
    });
})