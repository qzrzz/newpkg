import { hi } from "../src"

test("hi function works", () => {
    expect(hi("Tester")).toBe("Hello, Tester!")
})
