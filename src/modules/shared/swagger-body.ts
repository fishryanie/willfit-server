import { ApiBody } from '@nestjs/swagger'

type JsonObject = Record<string, unknown>

const objectBody = (description: string, example: JsonObject) => {
  return ApiBody({
    description,
    schema: {
      type: 'object',
      additionalProperties: true,
      example
    }
  })
}

export const AuthLoginBody = () =>
  objectBody('Login credentials', {
    username: 'client@example.com',
    password: 'Password@123',
    expoPushToken: 'ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  })

export const SocialLoginBody = () =>
  objectBody('Social login payload', {
    idToken: 'provider-id-token',
    identityToken: 'apple-identity-token',
    data: {
      idToken: 'google-id-token',
      user: {
        email: 'user@example.com',
        name: 'Nguyen Van A',
        givenName: 'Nguyen',
        familyName: 'Van A'
      }
    },
    email: 'user@example.com',
    fullName: {
      givenName: 'Nguyen',
      familyName: 'Van A'
    },
    expoPushToken: 'ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  })

export const RefreshTokenBody = () =>
  objectBody('Refresh token payload', {
    refreshToken: 'refresh-token'
  })

export const ChangePasswordBody = () =>
  objectBody('Change password payload', {
    currentPassword: 'Password@123',
    newPassword: 'NewPassword@123'
  })

export const LookupBody = () =>
  objectBody('Lookup/catalog payload', {
    name: 'Active',
    description: 'Visible in app',
    order: 1
  })

export const AccountBody = () =>
  objectBody('Account payload', {
    fullName: 'Nguyen Van A',
    email: 'user@example.com',
    password: 'Password@123',
    phone: '+84901234567',
    avatar: 'https://example.com/avatar.png'
  })

export const OrganizationBody = () =>
  objectBody('Organization payload', {
    name: 'WillFit District 1',
    description: 'Main branch',
    address: 'Ho Chi Minh City',
    phone: '+84901234567',
    imageUrl: 'https://example.com/branch.png'
  })

export const ContentBody = () =>
  objectBody('Content payload', {
    name: 'Beginner guide',
    description: 'Short description',
    content: 'Rich text or markdown content',
    imageUrl: 'https://example.com/image.png',
    order: 1
  })

export const AssessmentBody = () =>
  objectBody('Assessment payload', {
    name: 'Initial assessment',
    description: 'Baseline assessment',
    level: 'beginner',
    questions: []
  })

export const WorkoutCatalogBody = () =>
  objectBody('Workout catalog payload', {
    name: 'Yoga mat',
    description: 'Basic equipment',
    imageUrl: 'https://example.com/equipment.png',
    order: 1
  })

export const WorkoutSessionBody = () =>
  objectBody('Workout session payload', {
    name: 'Lower body strength',
    client: '000000000000000000000000',
    exercises: [
      {
        exercise: '000000000000000000000000',
        sets: 3,
        reps: 12,
        restSeconds: 60
      }
    ]
  })

export const MealPlanBody = () =>
  objectBody('Meal plan payload', {
    name: 'Fat loss week 1',
    client: '000000000000000000000000',
    calories: 1800,
    meals: [
      {
        name: 'Breakfast',
        foods: [{ name: 'Oatmeal', quantity: '80g' }]
      }
    ]
  })

export const ChatMessageBody = () =>
  objectBody('Chat message payload', {
    receiverId: '000000000000000000000000',
    message: 'Hello, ready for today?',
    clientMessageId: 'local-message-id'
  })

export const PushDeviceBody = () =>
  objectBody('Push device payload', {
    expoPushToken: 'ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    platform: 'ios',
    appVersion: '1.0.0',
    deviceName: 'iPhone',
    notificationEnabled: true
  })

export const NotificationBody = () =>
  objectBody('Notification payload', {
    name: 'New workout assigned',
    description: 'You have a new workout session',
    content: 'Open the app to view details',
    type: 'all',
    sendToAll: false,
    sendPush: true,
    privateWith: ['000000000000000000000000']
  })
