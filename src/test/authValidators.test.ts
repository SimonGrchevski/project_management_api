import { validationResult } from "express-validator";
import { buildValidator } from "../validators/buildValidator";
import express, { Request, Response } from "express";
import request from "supertest";

const app = express();
app.use(express.json());



const validateMiddleware = (validators: any) => async (req: Request, res: Response) => {
    await Promise.all(validators.map((validator: any) => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.status(200).json({ msg: "Valid input" });
};

app.post("/test", (req, res) => {
    const validators = buildValidator(["username", "password","email"], req.query.context as any);
    validateMiddleware(validators)(req, res);
});

describe("auth Validators", () => {
    const testUser = {
        username:"validUsername",
        password: "ValidPass123",
        email: "validemail@email.com"
    }

    describe("Register context", () => {

        it("Should validate username and password and email", async () => {
            const res = await request(app)
                .post(`/test?context=register`)
                .send(testUser);
    
            expect(res.status).toBe(200);
            expect(res.body.msg).toBe("Valid input");
        });

        describe("username", () => {

            it("Should fail for empty username", async () => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser, username:""});
        
                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Username is required" }),
                    ])
                );
            });


            it("Should fail for username with special characters", async () => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser, username:"@#User!"});
        
                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Username must contain only letters and numbers" }),
                    ])
                );
            });

            it("Should fail for excessively long username", async () => {

                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser, username: "a".repeat(256)});

                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "No excessively long inputs allowed" }),
                    ])
                );
            })

        });

        describe("email", () => {
            it("Should fail if the email is invalid", async () => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser, email:"invalid"});

                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Invalid email format"}),
                    ])
                );
            });
        });

        describe("password", () => {

            it("should fail if password is less the 8 characters long", async() => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser,password:"123456"});

                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Password must be at least 8 characters long"}),
                    ])
                );
            });

            it("should fail if password doesnt have at least a single uppercase character", async() => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser,password:"password!@34"});

                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Password must contain at least one uppercase letter"}),
                    ])
                );
            });

            it("Should fail if password doesnt have at least a single number character", async() => {
                const res = await request(app)
                    .post("/test?context=register")
                    .send({...testUser,password:"password!@"});

                expect(res.status).toBe(400);
                expect(res.body.errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ msg: "Password must contain at least one number"}),
                    ])
                );
            });
        });
    })
});