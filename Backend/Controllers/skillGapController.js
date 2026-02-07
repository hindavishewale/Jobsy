const getSkillGapRoadmap = (candidateSkills, requiredSkills) => {
  const missingSkills = requiredSkills.filter(
    skill => !candidateSkills.includes(skill)
  );

  const readiness =
    ((requiredSkills.length - missingSkills.length) /
      requiredSkills.length) * 100;

  return {
    readiness: Math.round(readiness),
    missingSkills,
    roadmap: missingSkills.map(skill => ({
      skill,
      resources: [
        `Learn ${skill} basics`,
        `Build mini project using ${skill}`,
        `Take quiz on ${skill}`
      ]
    }))
  };
};

module.exports = getSkillGapRoadmap;
