export interface CuratedBoardSource {
  provider: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'smartrecruiters';
  slug: string;
  companyName: string;
  tier: 'tier_1_global' | 'tier_2_india_unicorns' | 'tier_3_growth_startups';
  country: 'global' | 'india' | 'us';
  industry: string;
  workdayHost?: string;
  workdaySiteId?: string;
}

export const CURATED_COMPANY_REGISTRY: CuratedBoardSource[] = [
  // -------------------------------------------------------------------------
  // Tier 1: Global Tech Giants & AI Leaders
  // -------------------------------------------------------------------------
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe', tier: 'tier_1_global', country: 'global', industry: 'Fintech' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic', tier: 'tier_1_global', country: 'us', industry: 'AI / Frontier' },
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel', tier: 'tier_1_global', country: 'global', industry: 'Cloud & Developer Tools' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma', tier: 'tier_1_global', country: 'global', industry: 'Design & Collaboration' },
  { provider: 'greenhouse', slug: 'datadog', companyName: 'Datadog', tier: 'tier_1_global', country: 'global', industry: 'Cloud Observability' },
  { provider: 'greenhouse', slug: 'cloudflare', companyName: 'Cloudflare', tier: 'tier_1_global', country: 'global', industry: 'Security & Edge' },
  { provider: 'greenhouse', slug: 'airbnb', companyName: 'Airbnb', tier: 'tier_1_global', country: 'global', industry: 'Consumer & Travel' },
  { provider: 'greenhouse', slug: 'doordash', companyName: 'DoorDash', tier: 'tier_1_global', country: 'global', industry: 'Logistics & Tech' },
  { provider: 'greenhouse', slug: 'pinterest', companyName: 'Pinterest', tier: 'tier_1_global', country: 'global', industry: 'Social & Discovery' },
  { provider: 'greenhouse', slug: 'snowflake', companyName: 'Snowflake', tier: 'tier_1_global', country: 'global', industry: 'Data Cloud' },
  { provider: 'greenhouse', slug: 'coinbase', companyName: 'Coinbase', tier: 'tier_1_global', country: 'global', industry: 'Crypto & Web3' },
  { provider: 'greenhouse', slug: 'gitlab', companyName: 'GitLab', tier: 'tier_1_global', country: 'global', industry: 'DevOps & Remote' },
  { provider: 'greenhouse', slug: 'twilioservice', companyName: 'Twilio', tier: 'tier_1_global', country: 'global', industry: 'Communications API' },
  { provider: 'greenhouse', slug: 'elastic', companyName: 'Elastic', tier: 'tier_1_global', country: 'global', industry: 'Search & Observability' },
  { provider: 'greenhouse', slug: 'docker', companyName: 'Docker', tier: 'tier_1_global', country: 'global', industry: 'Developer Infrastructure' },
  { provider: 'greenhouse', slug: 'hubspot', companyName: 'HubSpot', tier: 'tier_1_global', country: 'global', industry: 'CRM & Marketing' },
  { provider: 'greenhouse', slug: 'atlassian', companyName: 'Atlassian', tier: 'tier_1_global', country: 'global', industry: 'Collaboration' },
  { provider: 'greenhouse', slug: 'mongodb', companyName: 'MongoDB', tier: 'tier_1_global', country: 'global', industry: 'Database & Cloud' },
  { provider: 'greenhouse', slug: 'palantir', companyName: 'Palantir Technologies', tier: 'tier_1_global', country: 'global', industry: 'Enterprise AI & Defense' },
  { provider: 'greenhouse', slug: 'asana', companyName: 'Asana', tier: 'tier_1_global', country: 'global', industry: 'Work Management' },
  { provider: 'greenhouse', slug: 'robinhood', companyName: 'Robinhood', tier: 'tier_1_global', country: 'us', industry: 'Fintech & Investing' },
  { provider: 'greenhouse', slug: 'plaid', companyName: 'Plaid', tier: 'tier_1_global', country: 'us', industry: 'Financial APIs' },
  { provider: 'greenhouse', slug: 'instacart', companyName: 'Instacart', tier: 'tier_1_global', country: 'us', industry: 'Grocery & Retail Tech' },
  { provider: 'greenhouse', slug: 'chime', companyName: 'Chime', tier: 'tier_1_global', country: 'us', industry: 'Digital Banking' },
  { provider: 'greenhouse', slug: 'gusto', companyName: 'Gusto', tier: 'tier_1_global', country: 'us', industry: 'Payroll & HR' },

  // Lever Tech Tier 1
  { provider: 'lever', slug: 'netflix', companyName: 'Netflix', tier: 'tier_1_global', country: 'global', industry: 'Streaming & Media' },
  { provider: 'lever', slug: 'canva', companyName: 'Canva', tier: 'tier_1_global', country: 'global', industry: 'Design & Visual' },
  { provider: 'lever', slug: 'postman', companyName: 'Postman', tier: 'tier_1_global', country: 'global', industry: 'API Platform' },
  { provider: 'lever', slug: 'retool', companyName: 'Retool', tier: 'tier_1_global', country: 'global', industry: 'Internal Tools' },
  { provider: 'lever', slug: 'scaleai', companyName: 'Scale AI', tier: 'tier_1_global', country: 'us', industry: 'AI Infrastructure' },
  { provider: 'lever', slug: 'spotify', companyName: 'Spotify', tier: 'tier_1_global', country: 'global', industry: 'Audio & Music' },

  // Ashby AI & Frontier Giants
  { provider: 'ashby', slug: 'openai', companyName: 'OpenAI', tier: 'tier_1_global', country: 'us', industry: 'Artificial Intelligence' },
  { provider: 'ashby', slug: 'anysphere', companyName: 'Cursor / Anysphere', tier: 'tier_1_global', country: 'us', industry: 'AI Developer Tools' },
  { provider: 'ashby', slug: 'supabase', companyName: 'Supabase', tier: 'tier_1_global', country: 'global', industry: 'Open Source Database' },
  { provider: 'ashby', slug: 'linear', companyName: 'Linear', tier: 'tier_1_global', country: 'global', industry: 'Project Management' },
  { provider: 'ashby', slug: 'ramp', companyName: 'Ramp', tier: 'tier_1_global', country: 'us', industry: 'Fintech / Spend' },
  { provider: 'ashby', slug: 'brex', companyName: 'Brex', tier: 'tier_1_global', country: 'us', industry: 'Corporate Card / Fintech' },
  { provider: 'ashby', slug: 'perplexity', companyName: 'Perplexity AI', tier: 'tier_1_global', country: 'us', industry: 'AI Search' },
  { provider: 'ashby', slug: 'runway', companyName: 'Runway ML', tier: 'tier_1_global', country: 'us', industry: 'Generative Video AI' },

  // Workday Global Tech Leaders
  { provider: 'workday', slug: 'nvidia', companyName: 'NVIDIA', workdayHost: 'nvidia.wd5.myworkdayjobs.com', workdaySiteId: 'NVIDIAExternalCareerSite', tier: 'tier_1_global', country: 'global', industry: 'Semiconductors & AI' },
  { provider: 'workday', slug: 'salesforce', companyName: 'Salesforce', workdayHost: 'salesforce.wd1.myworkdayjobs.com', workdaySiteId: 'External_Career_Site', tier: 'tier_1_global', country: 'global', industry: 'Cloud CRM' },
  { provider: 'workday', slug: 'cisco', companyName: 'Cisco', workdayHost: 'cisco.wd1.myworkdayjobs.com', workdaySiteId: 'CiscoCareers', tier: 'tier_1_global', country: 'global', industry: 'Networking & Security' },

  // SmartRecruiters Leaders (Verified active public REST endpoints)
  { provider: 'smartrecruiters', slug: 'smartrecruiters', companyName: 'SmartRecruiters', tier: 'tier_1_global', country: 'global', industry: 'HR Tech & SaaS' },
  { provider: 'smartrecruiters', slug: 'redbull', companyName: 'Red Bull', tier: 'tier_1_global', country: 'global', industry: 'Consumer Tech & Media' },
  { provider: 'smartrecruiters', slug: 'colliers', companyName: 'Colliers', tier: 'tier_1_global', country: 'global', industry: 'Enterprise & Real Estate' },

  // -------------------------------------------------------------------------
  // Tier 2: Indian Tech Unicorns & Ecosystem Leaders
  // -------------------------------------------------------------------------
  { provider: 'greenhouse', slug: 'razorpay', companyName: 'Razorpay', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Payments & Banking' },
  { provider: 'greenhouse', slug: 'swiggy', companyName: 'Swiggy', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Quick Commerce & Food' },
  { provider: 'greenhouse', slug: 'zomato', companyName: 'Zomato', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Food Delivery & Blinkit' },
  { provider: 'greenhouse', slug: 'cred', companyName: 'CRED', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Fintech & Rewards' },
  { provider: 'greenhouse', slug: 'meesho', companyName: 'Meesho', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Social E-Commerce' },
  { provider: 'greenhouse', slug: 'browserstack', companyName: 'BrowserStack', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Testing Infrastructure' },
  { provider: 'greenhouse', slug: 'inmobi', companyName: 'InMobi', tier: 'tier_2_india_unicorns', country: 'india', industry: 'AdTech & AI' },
  { provider: 'greenhouse', slug: 'urbancompany', companyName: 'Urban Company', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Home Services' },
  { provider: 'greenhouse', slug: 'delhivery', companyName: 'Delhivery', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Supply Chain & Logistics' },
  { provider: 'greenhouse', slug: 'lenskart', companyName: 'Lenskart', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Omnichannel Eyewear' },
  { provider: 'greenhouse', slug: 'spinny', companyName: 'Spinny', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Auto Retail' },
  { provider: 'greenhouse', slug: 'slice', companyName: 'Slice', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Consumer Banking' },
  { provider: 'greenhouse', slug: 'groww', companyName: 'Groww', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Investment & Wealth' },
  { provider: 'greenhouse', slug: 'dream11', companyName: 'Dream11', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Sports Tech & Gaming' },
  { provider: 'greenhouse', slug: 'hasura', companyName: 'Hasura', tier: 'tier_2_india_unicorns', country: 'india', industry: 'GraphQL Engine' },
  { provider: 'greenhouse', slug: 'sharechat', companyName: 'ShareChat', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Indic Social Media' },
  { provider: 'greenhouse', slug: 'udaan', companyName: 'Udaan', tier: 'tier_2_india_unicorns', country: 'india', industry: 'B2B Trade & Supply' },

  // Lever India Unicorns
  { provider: 'lever', slug: 'phonepe', companyName: 'PhonePe', tier: 'tier_2_india_unicorns', country: 'india', industry: 'UPI Payments & Insurance' },
  { provider: 'lever', slug: 'clevertap', companyName: 'CleverTap', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Retention Cloud' },
  { provider: 'lever', slug: 'khatabook', companyName: 'Khatabook', tier: 'tier_2_india_unicorns', country: 'india', industry: 'MSME SaaS' },
  { provider: 'lever', slug: 'chargebee', companyName: 'Chargebee', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Subscription Billing' },
  { provider: 'lever', slug: 'yellowai', companyName: 'Yellow.ai', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Conversational AI' },
  { provider: 'lever', slug: 'sprinklr', companyName: 'Sprinklr', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Unified CXM' },
  { provider: 'lever', slug: 'zerodha', companyName: 'Zerodha', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Discount Brokerage' },
  { provider: 'lever', slug: 'practo', companyName: 'Practo', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Healthtech & Consultations' },

  // Ashby India & Global Startups
  { provider: 'ashby', slug: 'zepto', companyName: 'Zepto', tier: 'tier_2_india_unicorns', country: 'india', industry: '10-Minute Delivery' },
  { provider: 'ashby', slug: 'curefoods', companyName: 'Curefoods', tier: 'tier_2_india_unicorns', country: 'india', industry: 'Cloud Kitchens' },

  // -------------------------------------------------------------------------
  // Tier 3: High-Growth Startups & YC Alumni
  // -------------------------------------------------------------------------
  { provider: 'greenhouse', slug: 'resend', companyName: 'Resend', tier: 'tier_3_growth_startups', country: 'global', industry: 'Developer Email' },
  { provider: 'greenhouse', slug: 'warp', companyName: 'Warp', tier: 'tier_3_growth_startups', country: 'us', industry: 'Terminal / DevTools' },
  { provider: 'greenhouse', slug: 'huggingface', companyName: 'Hugging Face', tier: 'tier_3_growth_startups', country: 'global', industry: 'AI Community & Models' },
  { provider: 'greenhouse', slug: 'togetherai', companyName: 'Together AI', tier: 'tier_3_growth_startups', country: 'us', industry: 'Generative AI Cloud' },
  { provider: 'greenhouse', slug: 'mistralai', companyName: 'Mistral AI', tier: 'tier_3_growth_startups', country: 'global', industry: 'Open Weight Models' },
  { provider: 'greenhouse', slug: 'cohere', companyName: 'Cohere', tier: 'tier_3_growth_startups', country: 'global', industry: 'Enterprise LLMs' },
  { provider: 'ashby', slug: 'modal', companyName: 'Modal', tier: 'tier_3_growth_startups', country: 'us', industry: 'Serverless Cloud for AI' },
  { provider: 'ashby', slug: 'langchain', companyName: 'LangChain', tier: 'tier_3_growth_startups', country: 'us', industry: 'LLM Frameworks' },
  { provider: 'ashby', slug: 'clerk', companyName: 'Clerk', tier: 'tier_3_growth_startups', country: 'global', industry: 'Authentication & User Management' },
  { provider: 'ashby', slug: 'prisma', companyName: 'Prisma', tier: 'tier_3_growth_startups', country: 'global', industry: 'Next-gen ORM' },
];

export function getRegistryByTier(tier?: string) {
  if (!tier || tier === 'all') return CURATED_COMPANY_REGISTRY;
  return CURATED_COMPANY_REGISTRY.filter((c) => c.tier === tier);
}

export function getRegistryByCountry(country?: string) {
  if (!country || country === 'all') return CURATED_COMPANY_REGISTRY;
  return CURATED_COMPANY_REGISTRY.filter((c) => c.country === country || c.country === 'global');
}
