// nlpChunk.ts

/**
 * Splits input text into contextually balanced sections, preserving natural
 * paragraph breaks when possible and ensuring more meaningful content division.
 */

export function processText(
  text: string,
  sectionCount: number = 9
): Record<string, string> {
  // 1. Clean up excessive whitespace while preserving structure
  const cleanText = text.replace(/\n{3,}/g, "\n\n").trim();

  // 2. Try paragraphs first for natural divisions
  const paragraphs = cleanText
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  if (paragraphs.length >= sectionCount) {
    return distributeContentUnits(paragraphs, sectionCount);
  }

  // 3. Extract sentences and create meaningful groups
  const sentences = extractSentences(cleanText);
  
  if (sentences.length >= sectionCount) {
    return distributeContentUnits(sentences, sectionCount);
  }

  // 4. If we have fewer sentences than sections needed, group by semantic chunks
  return createSemanticChunks(cleanText, sectionCount);
}

/**
 * Extract sentences using improved regex
 */
function extractSentences(text: string): string[] {
  // Normalize text but preserve sentence structure
  const normalizedText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  
  // Split on sentence endings, being more careful about what constitutes a sentence
  const sentences = normalizedText.split(/(?<=\.|\!|\?)\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  
  return sentences;
}

/**
 * Create semantic chunks by identifying natural thought boundaries
 */
function createSemanticChunks(
  text: string,
  sectionCount: number
): Record<string, string> {
  const normalizedText = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  
  // Find all meaningful break points in the text
  const breakPoints = findMeaningfulBreaks(normalizedText);
  
  // If we don't have enough natural breaks, create them
  if (breakPoints.length < sectionCount - 1) {
    return createBalancedSemanticSections(normalizedText, sectionCount);
  }
  
  // Select the best break points to create the desired number of sections
  const selectedBreaks = selectOptimalBreaks(breakPoints, sectionCount - 1);
  
  return createSектionsFromBreaks(normalizedText, selectedBreaks);
}

/**
 * Find meaningful break points in the text
 */
function findMeaningfulBreaks(text: string): number[] {
  const breaks: number[] = [];
  
  // 1. Sentence endings (highest priority)
  const sentenceRegex = /[.!?]\s+/g;
  let match;
  while ((match = sentenceRegex.exec(text)) !== null) {
    breaks.push(match.index + match[0].length);
  }
  
  // 2. Strong transitional phrases
  const transitionRegex = /\b(however|therefore|moreover|furthermore|nevertheless|meanwhile|consequently|in addition|on the other hand|for example|in contrast)\s+/gi;
  transitionRegex.lastIndex = 0;
  while ((match = transitionRegex.exec(text)) !== null) {
    breaks.push(match.index);
  }
  
  // 3. After certain conjunctions that introduce new ideas
  const conjunctionRegex = /\b(and|but)\s+(?=[A-Z])/g;
  conjunctionRegex.lastIndex = 0;
  while ((match = conjunctionRegex.exec(text)) !== null) {
    breaks.push(match.index + match[0].length);
  }
  
  // Remove duplicates and sort
  return [...new Set(breaks)].sort((a, b) => a - b);
}

/**
 * Create balanced sections when we don't have enough natural breaks
 */
function createBalancedSemanticSections(
  text: string,
  sectionCount: number
): Record<string, string> {
  const words = text.split(/\s+/);
  const totalWords = words.length;
  const baseWordsPerSection = Math.ceil(totalWords / sectionCount);
  
  const result: Record<string, string> = {};
  let currentWordIndex = 0;
  
  for (let i = 0; i < sectionCount; i++) {
    const remainingWords = totalWords - currentWordIndex;
    const remainingSections = sectionCount - i;
    const wordsForThisSection = Math.ceil(remainingWords / remainingSections);
    
    let endIdx = Math.min(currentWordIndex + wordsForThisSection, totalWords);
    
    // For sections that aren't the last one, try to end at a better boundary
    if (i < sectionCount - 1 && endIdx < totalWords) {
      // Look ahead a few words for a sentence ending
      for (let j = 0; j < Math.min(5, totalWords - endIdx); j++) {
        const word = words[endIdx + j];
        if (word && /[.!?]$/.test(word)) {
          endIdx = endIdx + j + 1;
          break;
        }
      }
      
      // If no sentence ending, look for other natural breaks
      if (endIdx === currentWordIndex + wordsForThisSection) {
        for (let j = 0; j < Math.min(3, totalWords - endIdx); j++) {
          const word = words[endIdx + j];
          if (word && /^(and|but|however|therefore)$/i.test(word)) {
            endIdx = endIdx + j;
            break;
          }
        }
      }
    }
    
    const sectionWords = words.slice(currentWordIndex, endIdx);
    result[`section_${i + 1}`] = sectionWords.join(' ');
    
    currentWordIndex = endIdx;
  }
  
  return result;
}

/**
 * Select optimal break points to create desired number of sections
 */
function selectOptimalBreaks(breakPoints: number[], numBreaksNeeded: number): number[] {
  if (breakPoints.length <= numBreaksNeeded) {
    return breakPoints;
  }
  
  // Select breaks that create the most evenly distributed sections
  const selected: number[] = [];
  const interval = breakPoints.length / numBreaksNeeded;
  
  for (let i = 0; i < numBreaksNeeded; i++) {
    const idealIndex = Math.round(i * interval);
    const actualIndex = Math.min(idealIndex, breakPoints.length - 1);
    selected.push(breakPoints[actualIndex]);
  }
  
  return selected;
}

/**
 * Create sections from selected break points
 */
function createSектionsFromBreaks(text: string, breakPoints: number[]): Record<string, string> {
  const result: Record<string, string> = {};
  const allBreaks = [0, ...breakPoints, text.length];
  
  for (let i = 0; i < allBreaks.length - 1; i++) {
    const start = allBreaks[i];
    const end = allBreaks[i + 1];
    result[`section_${i + 1}`] = text.substring(start, end).trim();
  }
  
  return result;
}

/**
 * Helper function to distribute content units evenly across sections
 */
function distributeContentUnits(
  units: string[],
  sectionCount: number
): Record<string, string> {
  const totalUnits = units.length;
  const unitsPerSection = Math.floor(totalUnits / sectionCount);
  let extraUnits = totalUnits % sectionCount;

  const result: Record<string, string> = {};
  let currentIndex = 0;

  for (let i = 0; i < sectionCount; i++) {
    // Calculate units for this section
    let unitsForThisSection = unitsPerSection;
    if (extraUnits > 0) {
      unitsForThisSection++;
      extraUnits--;
    }

    // Handle edge case
    if (currentIndex >= totalUnits) {
      result[`section_${i + 1}`] = units[Math.min(currentIndex, totalUnits - 1)] || `Section ${i + 1}`;
      continue;
    }

    // Get units for this section
    const endIndex = Math.min(currentIndex + unitsForThisSection, totalUnits);
    const sectionUnits = units.slice(currentIndex, endIndex);
    currentIndex = endIndex;

    // Join units appropriately
    const joinChar = units[0] && units[0].includes('\n') ? '\n\n' : ' ';
    result[`section_${i + 1}`] = sectionUnits.join(joinChar);
  }

  return result;
}
