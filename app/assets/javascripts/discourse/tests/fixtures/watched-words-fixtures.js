export default {
  "/admin/customize/watched_words.json": {
    actions: ["block", "censor", "require_approval", "flag"],
    words: [
      { id: 1, word: "liquorice", action: "block" },
      { id: 2, word: "anise", action: "block" },
      { id: 3, word: "pyramid", action: "flag" },
      { id: 4, word: "scheme", action: "flag" },
      { id: 5, word: "coupon", action: "require_approval" },
      { id: 6, word: '<img src="x">', action: "block" }
    ],
    compiled_regular_expressions: {}
  }
};
