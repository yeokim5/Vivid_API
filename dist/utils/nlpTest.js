"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nlpChunk_1 = require("./nlpChunk");
const content = `
A whisper drifts through morning air, A promise light and thin, Of chances caught in silent flight, Of dreams about to begin. The sky wears hues of something new, The sun peeks through the trees, And time, like tides, pulls at the heart With quiet urgencies. No need to chase the distant past, Nor fear what’s yet to show— The moment waits with open hands, So walk the winds of now.
`;
const result = (0, nlpChunk_1.processText)(content, 9);
console.log(result);
