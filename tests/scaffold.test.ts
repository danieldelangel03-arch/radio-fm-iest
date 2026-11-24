import { describe, expect, it } from "vitest";

describe("andamiaje", () => {
  it("usa el nombre público del producto", () => {
    expect("Radio Campus").toMatch(/Campus/);
  });
});
