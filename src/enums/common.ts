export enum RoleAccount {
  CLIENT = 'Client',
  MANAGE = 'Manager',
  TRAINER = 'Trainer',
  DEVELOPER = 'Developer',
  ADMINISTRATOR = 'Administrator',
  MODERATOR = 'Moderator'
}

export enum StatusAccount {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum TypeNotify {
  All = 'All',
  System = 'System',
  Reminder = 'Reminder',
  Progress = 'Progress'
}

export enum TypeArticles {
  PLAN = 'PLAN',
  COURSE = 'COURSE',
  PREVENTION = 'PREVENTION',
  WELLNESS = 'WELLNESS',
  KINIS_AI = 'KINIS_AI',
  BALANCE_HEALTH = 'BALANCE_HEALTH'
}

export enum EnumTypePlan {
  MEAL = 'MealPlan',
  WORKOUT = 'WorkoutPlan',
  WALKING = 'WalkingPlan',
  NUTRITION = 'NutritionPlan',
  OTHER = 'OtherPlan'
}

export enum ContactType {
  INVESTOR = 'Investor',
  PARTNERSHIP = 'Partnership',
  SUBSCRIBER = 'Subscriber'
}
