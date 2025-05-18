const fs = require("fs");
const path = require("path");

// The content to replace with
const content = {
  title: "Break",
  section1:
    "Do you think I can have one more kiss? I'll find closure on your lips, and then I'll go. Maybe also one more breakfast, one more lunch, and one more dinner.",
  section1_image_url:
    "https://images.stockcake.com/public/7/7/7/777883a2-b6b1-4e38-bfec-40f91cb1deca_large/sunrise-beach-yoga-stockcake.jpg",
  section2:
    "I'll be full and happy and we can part. But in between meals, maybe we can lie in bed one more time.",
  section2_image_url:
    "https://images.stockcake.com/public/2/0/1/201e0346-aabf-4810-81df-8da6936c3c2f_large/dreamy-morning-bedroom-stockcake.jpg",
  section3:
    'One more prolonged moment where time suspends indefinitely as I rest my head on your chest. My hope is if we add up the "one mores" they will equal a lifetime and I\'ll never have to get to the part where I let you go.',
  section3_image_url:
    "https://images.stockcake.com/public/3/8/6/386fbe63-2fc2-492a-a8ca-6540f0cba7cf_large/soldiers-sharing-stories-stockcake.jpg",
  section4: "But that's not real is it. There are no more one mores.",
  section4_image_url:
    "https://images.stockcake.com/public/a/7/2/a729a276-1a53-4be1-93a8-34b0b2df8587_large/dimly-lit-chandelier-stockcake.jpg",
  section5:
    "I met you when everything was new and exciting, and the possibilities of the world seem endless. And they still are...",
  section5_image_url:
    "https://images.stockcake.com/public/9/9/2/992f8b2c-5152-4f1a-a1e6-14e28cd9518d_large/architect-at-sunset-stockcake.jpg",
  section6:
    "for you, for me, but not for us. Somewhere between then and now, here and there, I guess we didn't just grow apart, we grew up.",
  section6_image_url:
    "https://images.stockcake.com/public/a/2/1/a2162911-41bb-4078-b47b-28624b6fd09d_large/seasonal-trees-row-stockcake.jpg",
  section7:
    "When something breaks, if the pieces are large enough, you can fix it. Unfortunately sometimes things don't break, they shatter.",
  section7_image_url:
    "https://images.stockcake.com/public/6/0/a/60ab1cf5-5cc3-47e0-b920-dbeadeaf6b0a_large/broken-pottery-pieces-stockcake.jpg",
  section8:
    "But when you let the light in, shattered glass will glitter. And in those moments when the pieces of what we were catch the sun, I'll remember just how beautiful it was.",
  section8_image_url:
    "https://images.stockcake.com/public/7/5/6/756aa40d-3c5d-4120-b7e3-afec662af701_large/illuminated-stained-glass-stockcake.jpg",
  section9: "Just how beautiful it'll always be. Because it was US.",
  section9_image_url:
    "https://images.stockcake.com/public/e/f/0/ef0b1cea-fc6a-416e-8a0a-333c34b9055a_large/memories-across-generations-stockcake.jpg",
  section10: "And we were magic. Forever.",
  section10_image_url:
    "https://images.stockcake.com/public/9/6/1/961d2ccc-2ad3-456b-885d-3dc44d2f9d49_large/cosmic-love-embrace-stockcake.jpg",
};

// Read the template HTML file
try {
  let htmlTemplate = fs.readFileSync("template.html", "utf8");

  // Fix the HTML structure first - there are some extra or misplaced closing tags
  // Fix section 4 structure
  htmlTemplate = htmlTemplate.replace(
    /<section class="section-4">[\s\S]*?<\/section>/,
    `<section class="section-4">
          <div class="parallax-bg" id="bg-4"></div>
          <div class="bg-overlay"></div>
          <div class="quote quote-4">
            <div class="line"></div>
          </div>
        </section>`
  );

  // Fix section 6 structure
  htmlTemplate = htmlTemplate.replace(
    /<section class="section-6">[\s\S]*?<\/section>/,
    `<section class="section-6">
          <div class="parallax-bg" id="bg-6"></div>
          <div class="bg-overlay"></div>
          <div class="quote quote-6">
            <div class="line"></div>
          </div>
        </section>`
  );

  // Fix section 8 structure
  htmlTemplate = htmlTemplate.replace(
    /<section class="section-8">[\s\S]*?<\/section>/,
    `<section class="section-8">
          <div class="parallax-bg" id="bg-8"></div>
          <div class="bg-overlay"></div>
          <div class="quote quote-8">
            <div class="line"></div>
          </div>
        </section>`
  );

  // Replace the title
  htmlTemplate = htmlTemplate.replace(/\[title\]/g, content.title);

  // Update the background images in the JavaScript section
  const backgroundImagesScript = `
        // Set background images
        const backgroundImages = {
          "bg-1": "${content.section1_image_url}",
          "bg-2": "${content.section2_image_url}",
          "bg-3": "${content.section3_image_url}",
          "bg-4": "${content.section4_image_url}",
          "bg-5": "${content.section5_image_url}",
          "bg-6": "${content.section6_image_url}",
          "bg-7": "${content.section7_image_url}",
          "bg-8": "${content.section8_image_url}",
          "bg-9": "${content.section9_image_url}",
          "bg-10": "${content.section10_image_url}",
        };`;

  // Replace the existing background images object in the JavaScript
  htmlTemplate = htmlTemplate.replace(
    /\/\/ Set background images[\s\S]*?};/,
    backgroundImagesScript
  );

  // Add content to the quotes for each section
  for (let i = 1; i <= 10; i++) {
    const sectionKey = `section${i}`;
    const quoteContent = content[sectionKey];

    if (quoteContent) {
      // Find the line div for this section and replace content
      const lineSelector = new RegExp(
        `<div class="quote quote-${i}">\\s*<div class="line">.*?<\\/div>`,
        "s"
      );
      const replacement = `<div class="quote quote-${i}">\n            <div class="line">${quoteContent}</div>`;

      htmlTemplate = htmlTemplate.replace(lineSelector, replacement);
    }
  }

  // Write the modified HTML to a new file
  fs.writeFileSync("index.html", htmlTemplate);
  console.log("Successfully created index.html with updated content!");
} catch (error) {
  console.error("Error processing the template:", error);
}
