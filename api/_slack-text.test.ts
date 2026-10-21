import { describe, expect, it } from "vitest";
import { slackText } from "./_slack-text.js";

describe("slackText", () => {
  it("neutralises channel pings and link markup", () => {
    expect(slackText("<!channel>")).toBe("&lt;!channel&gt;");
    expect(slackText("<https://evil|x>")).toBe("&lt;https://evil|x&gt;");
  });
  it("truncates before escaping so entities are not cut", () => {
    expect(slackText("&&&&", 2)).toBe("&amp;&amp;…");
  });
});
