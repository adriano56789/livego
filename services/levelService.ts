// A simple non-linear progression.
// The amount of XP needed for the next level increases.

const LEVEL_MILESTONES = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 400 },
  { level: 4, xp: 900 },
  { level: 5, xp: 1600 },
  { level: 6, xp: 2500 },
  { level: 7, xp: 4400 },
  { level: 8, xp: 6500 },
  { level: 9, xp: 8800 },
  { level: 10, xp: 11300 },
  { level: 20, xp: 20000 },
  { level: 30, xp: 35000 },
  { level: 40, xp: 55000 },
  { level: 50, xp: 80000 },
  { level: 60, xp: 110000 },
  { level: 70, xp: 150000 },
  { level: 80, xp: 200000 },
  { level: 90, xp: 260000 },
  { level: 100, xp: 330000 },
  { level: 150, xp: 500000 },
  { level: 200, xp: 750000 },
  { level: 300, xp: 1200000 },
  { level: 500, xp: 2500000 },
  { level: 1000, xp: 7000000 },
];


/**
 * Calculates a user's level based on their total XP using linear interpolation between milestones.
 * @param {number} xp The total experience points of the user.
 * @returns {number} The calculated level.
 */
export const calculateLevelFromXp = (xp: number): number => {
  if (xp <= LEVEL_MILESTONES[0].xp) return 1;

  for (let i = 0; i < LEVEL_MILESTONES.length; i++) {
    const currentMilestone = LEVEL_MILESTONES[i];
    const nextMilestone = LEVEL_MILESTONES[i + 1];

    if (xp >= currentMilestone.xp && (!nextMilestone || xp < nextMilestone.xp)) {
      if (!nextMilestone) {
        // User XP is beyond the highest defined milestone
        return currentMilestone.level;
      }
      
      const xpRange = nextMilestone.xp - currentMilestone.xp;
      const levelRange = nextMilestone.level - currentMilestone.level;
      const xpIntoRange = xp - currentMilestone.xp;
      
      if (xpRange === 0) return currentMilestone.level;

      const levelsGained = Math.floor((xpIntoRange / xpRange) * levelRange);
      return currentMilestone.level + levelsGained;
    }
  }

  return 1;
};

/**
 * Gets the total XP required to reach the beginning of a specific level.
 * @param {number} level The target level.
 * @returns {number} The total XP needed to start that level.
 */
export const getXpForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  // Find the milestone just before or at the target level
  let startMilestone = LEVEL_MILESTONES[0];
  for (let i = LEVEL_MILESTONES.length - 1; i >= 0; i--) {
    if (level >= LEVEL_MILESTONES[i].level) {
        startMilestone = LEVEL_MILESTONES[i];
        break;
    }
  }

  const nextMilestoneIndex = LEVEL_MILESTONES.findIndex(m => m.level > startMilestone.level);
  const endMilestone = nextMilestoneIndex !== -1 ? LEVEL_MILESTONES[nextMilestoneIndex] : null;

  if (!endMilestone || level === startMilestone.level) {
      return startMilestone.xp;
  }
  
  // Interpolate to find the XP requirement for the exact level
  const xpRange = endMilestone.xp - startMilestone.xp;
  const levelRange = endMilestone.level - startMilestone.level;
  const levelsPastStart = level - startMilestone.level;

  if (levelRange === 0) return startMilestone.xp;

  return startMilestone.xp + Math.floor((levelsPastStart / levelRange) * xpRange);
};
