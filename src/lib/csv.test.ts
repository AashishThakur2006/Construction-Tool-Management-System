import { describe, expect, it } from "vitest";
// @ts-ignore — plain browser ES module, no type declarations
import { csvCell, toCsv } from "../../public/js/csv.js";

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
  });
  it("neutralises spreadsheet formulas but leaves real numbers alone", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toMatch(/^"'=/);
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell(-250)).toBe("-250");
  });
  it("renders null and undefined as empty", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("joins header and rows with CRLF", () => {
    expect(toCsv(["id", "note"], [["AST-1", "ok"], ["AST-2", null]])).toBe("id,note\r\nAST-1,ok\r\nAST-2,");
  });
});
