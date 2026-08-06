export interface InterviewAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface BusinessProfile {
  name: string;
  description: string;
  sells: string;
  targetCustomer: string;
  uniqueValue: string;
  location: string;
  goal: string;
  summary: string;
}

export type PromotionRisk = "low" | "medium" | "high";

export interface SubredditRecommendation {
  name: string;
  subscribersEstimate: string;
  whyItMatches: string;
  audienceFit: number; // 0-100
  promotionRisk: PromotionRisk;
  linksTypicallyAllowed: boolean;
  notes: string;
}

export type PostStrategyType = "founder_story" | "educational" | "question_discussion";

export interface PostStrategy {
  type: PostStrategyType;
  label: string;
  title: string;
  body: string;
  whyItFits: string;
  engagementScore: number; // 0-100
  removalRisk: PromotionRisk;
}

export interface RuleCheckResult {
  passesBasicChecks: boolean;
  excessiveSelfPromotion: boolean;
  toneMatchesSubreddit: boolean;
  titleFollowsConventions: boolean;
  warnings: string[];
  overallRisk: PromotionRisk;
}

export interface SubredditRulesPayload {
  subreddit: string;
  title: string;
  publicDescription: string;
  rulesText: string;
  submissionType: string;
}
