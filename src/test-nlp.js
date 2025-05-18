const { processText } = require("../dist/utils/nlpChunk");

// Sample lyrics from "Paris in the Rain"
const text = `All I know is, we could go anywhere. We could do anything, girl, whatever the mood we're in.
Yeah, all I know is gettin' lost late at night, under stars.
Findin' love standin' right where we are.
Your lips, they pull me in the moment.
You and I alone, and people may be watching.
I don't mind, 'cause anywhere with you feels right.
Anywhere with you feels like Paris in the rain.
Paris in the rain.

We don't need a fancy town.
Or bottles that we can't pronounce.
'Cause anywhere, babe, is like Paris in the rain.
When I'm with you.
When I'm with you.
Paris in the rain.
Paris in the rain.

I look at you now and I want this forever.
I might not deserve it, but there's nothing better.
Don't know how I ever did it all without you.
My heart is about to, about to jump out of my chest.
Feelings, they come and they go — that they do.
Feelings, they come and they go — not with you.

Late nights and the street lights.
And the people — look at me, girl.
And the whole world could stop.
Anywhere with you feels right.
Anywhere with you feels like Paris in the rain.
Paris in the rain.

We don't need a fancy town.
Or bottles that we can't pronounce.
'Cause anywhere, babe, is like Paris in the rain.
When I'm with you.
When I'm with you.
Paris in the rain.
Paris in the rain.

Girl, when I'm not with you, all I do is miss you.
So come and set the mood right, underneath the moonlight.
Days in Paris, nights in Paris.
Paint you with my eyes closed.
Wonder where the time goes.
Yeah, isn't it obvious?
Isn't it obvious?
Come and set the mood right, underneath the moonlight.

Anywhere with you feels right.
Anywhere with you feels like Paris in the rain.
Paris in the rain.

Walking down an empty street.
Puddles underneath our feet.`;

// Process the text into 10 sections
const result = processText(text);

// Print the result
console.log("NLP Sections:");
console.log(JSON.stringify(result, null, 2));

// Check if all 10 sections have content
let emptySections = 0;
for (let i = 1; i <= 10; i++) {
  const sectionKey = `section_${i}`;
  if (!result[sectionKey] || result[sectionKey].trim() === "") {
    emptySections++;
    console.log(`Section ${i} is empty!`);
  }
}

console.log(`\nSummary: ${emptySections} empty sections out of 10`);
console.log(
  `Content distribution: ${10 - emptySections} sections have content`
);
