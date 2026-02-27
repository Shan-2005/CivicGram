export const analyzeIssueImage = async (base64Image: string) => {
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Randomly generate some mock AI analysis
  const categories = ["Roads", "Garbage", "Water", "Safety", "Power", "Parks", "Other"];
  const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const is_fake = Math.random() > 0.9;
  const trust_score = is_fake ? Math.random() * 0.4 : 0.6 + Math.random() * 0.4;

  return {
    category,
    priority,
    is_fake,
    trust_score,
    title: `Suspected ${category} Issue`,
    description: `This looks like a ${priority.toLowerCase()} priority issue related to ${category.toLowerCase()}. Please inspect further.`
  };
};
