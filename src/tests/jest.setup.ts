beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.SECRET_KEY = "someSecretKey";
});

afterAll(() => {
    jest.restoreAllMocks();
});
