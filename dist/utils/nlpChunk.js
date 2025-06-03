"use strict";
// nlpChunk.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.processText = processText;
/**
 * Splits input text into contextually balanced sections, preserving natural
 * paragraph breaks when possible and ensuring more meaningful content division.
 */
function processText(text, sectionCount = 9) {
    // 1. Preserve original paragraph structure while cleaning up excessive whitespace
    const cleanText = text.replace(/\n{3,}/g, "\n\n").trim();
    // 2. Split by paragraphs first (for natural content breaks)
    const paragraphs = cleanText
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 0);
    // 3. If we have enough paragraphs, use them as our primary units
    if (paragraphs.length >= sectionCount) {
        return distributeContentUnits(paragraphs, sectionCount);
    }
    // 4. If not enough paragraphs, try stanzas (groups of lines)
    const stanzas = cleanText
        .split(/\n\n+/)
        .map((stanza) => stanza.trim())
        .filter((stanza) => stanza.length > 0);
    if (stanzas.length >= sectionCount) {
        return distributeContentUnits(stanzas, sectionCount);
    }
    // 5. If not enough stanzas, try individual lines
    const lines = cleanText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (lines.length >= sectionCount) {
        return distributeContentUnits(lines, sectionCount);
    }
    // 6. If not enough lines, try sentences
    const allText = cleanText.replace(/\n+/g, " ");
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = allText.match(sentenceRegex) || [];
    const sentences = matches.map((s) => s.trim()).filter((s) => s.length > 0);
    if (sentences.length >= sectionCount) {
        return distributeContentUnits(sentences, sectionCount);
    }
    // 7. If all else fails, use a character-based approach to ensure 9 sections
    return distributeTextByCharacters(cleanText, sectionCount);
}
/**
 * Helper function to distribute content units evenly across sections
 */
function distributeContentUnits(units, sectionCount) {
    // Calculate number of units per section
    const totalUnits = units.length;
    const unitsPerSection = Math.max(1, Math.floor(totalUnits / sectionCount));
    let remainingUnits = totalUnits % sectionCount;
    const result = {};
    let currentIndex = 0;
    for (let i = 0; i < sectionCount; i++) {
        // Calculate how many units this section should have
        let unitsForThisSection = unitsPerSection;
        // Distribute remaining units evenly
        if (remainingUnits > 0) {
            unitsForThisSection++;
            remainingUnits--;
        }
        // Handle the case where we might run out of units
        if (currentIndex >= totalUnits) {
            // Reuse content from the beginning if we run out
            result[`section_${i + 1}`] =
                result[`section_${(i % (currentIndex / unitsPerSection)) + 1}`] ||
                    `Section ${i + 1}`;
            continue;
        }
        // Get the units for this section
        const sectionUnits = units.slice(currentIndex, Math.min(currentIndex + unitsForThisSection, totalUnits));
        currentIndex += unitsForThisSection;
        // Join the units for this section (preserving original spacing)
        result[`section_${i + 1}`] = sectionUnits.join(" ");
    }
    return result;
}
/**
 * Last resort function to distribute text by characters when we don't have enough natural breaks
 */
function distributeTextByCharacters(text, sectionCount) {
    const cleanText = text.replace(/\s+/g, " ").trim();
    const totalLength = cleanText.length;
    const charsPerSection = Math.floor(totalLength / sectionCount);
    const result = {};
    for (let i = 0; i < sectionCount; i++) {
        const startPos = i * charsPerSection;
        const endPos = i === sectionCount - 1 ? totalLength : (i + 1) * charsPerSection;
        // Find a good break point (space) near the calculated position
        let adjustedEndPos = endPos;
        if (i < sectionCount - 1 && endPos < totalLength) {
            // Look for a space within 20 characters of the calculated position
            for (let j = 0; j < 20; j++) {
                if (endPos + j < totalLength && cleanText[endPos + j] === " ") {
                    adjustedEndPos = endPos + j;
                    break;
                }
                if (endPos - j > startPos && cleanText[endPos - j] === " ") {
                    adjustedEndPos = endPos - j;
                    break;
                }
            }
        }
        result[`section_${i + 1}`] = cleanText
            .substring(startPos, adjustedEndPos)
            .trim();
    }
    return result;
}
