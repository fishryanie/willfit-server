type AnyObject = { [key: string]: any }

interface IDefinitionCommon {
  name: string
  image: string
  description: string
}

interface Paging {
  page?: number
  limit?: number
}

type PagingParams<P = void> = P extends void ? Paging | void : Paging & P

interface IContact {
  id: string
  name: string
  email: string
  company: string
  phone: string
  message: string
  processed?: boolean
  type: import('enums/common').ContactType
}
interface IUser {
  firstName: string
  lastName: string
  middleName: string
  fullName: string
  dateOfBirth: string
  gender: number
  phone: string
  securityNumber: string
  address: string
  notifications: string[]
  states: import('mongoose').Types.ObjectId
}

interface IAdmin {
  userId: import('mongoose').Types.ObjectId
}

interface IStaff {
  userId: import('mongoose').Types.ObjectId
  organizationId: import('mongoose').Types.ObjectId
  memberId: string
}
interface Tokens {
  accessToken: string
  refreshToken: string
}

interface TokenPayload {
  role: { _id: import('mongoose').Types.ObjectId; name: import('enums/common').RoleAccount }
  userId: import('mongoose').Types.ObjectId
  username: string
}

type TokenVerifiedRequest = import('express').Request & {
  tokenVerified?: TokenPayload
  requestId?: string
}

interface IRefreshToken {
  accountTokenId: import('mongoose').Types.ObjectId
  token: string
  expiresAt: Date
}

interface IAccountToken {
  accountId: import('mongoose').Types.ObjectId
  role: import('mongoose').Types.ObjectId
  status: import('mongoose').Types.ObjectId
  name: string
  username: string
  password: string
  fcmToken: string
}
interface Message {
  message: string
  imageUrl?: string
  videoUrl?: string
  seen: boolean
  sent: boolean
  delivered: boolean
  deliveredAt?: Date
  seenAt?: Date
  conversationId: import('mongoose').Types.ObjectId
  receiver: import('mongoose').Types.ObjectId
  msgByUserId: import('mongoose').Types.ObjectId
  clientMessageId?: string
}

interface Conversation {
  sender: import('mongoose').Types.ObjectId
  receiver: import('mongoose').Types.ObjectId
  participants: import('mongoose').Types.ObjectId[]
  participantKey: string
  lastMessage: import('mongoose').Types.ObjectId
  lastMessageAt?: Date
}
interface IClient {
  userInfo: import('mongoose').Types.ObjectId
  trainer: import('mongoose').Types.ObjectId[]
  organizationId: import('mongoose').Types.ObjectId
  medicalConditions: string[]
  memberId: string
  medicalHistory: boolean
  emergencyContact: string
  emergencyPhone: string
  medicalDetail: string
  avatarUrl: string
  email: string
  exercise: import('mongoose').Types.ObjectId[]
}

interface IInsertClientRequest extends IClient, Pick<IUser, 'phone' | 'fullName' | 'dateOfBirth' | 'gender'> {
  password: string
}

interface IUpdateClientRequest
  extends Omit<IClient, 'userId' | 'organizationId'>,
    Pick<IUser, 'phone' | 'fullName' | 'dateOfBirth' | 'gender'> {}
interface IPushDevice {
  token: string
  accountId?: import('mongoose').Types.ObjectId
  deviceName?: string
  platform?: string
  appVersion?: string
  active: boolean
  notificationEnabled: boolean
  lastSeenAt: Date
}

interface INotificationInbox {
  notification: import('mongoose').Types.ObjectId
  accountId: import('mongoose').Types.ObjectId
  readAt?: Date
  deletedAt?: Date
  deliveredAt?: Date
}
interface IOrganization {
  categoryId: import('mongoose').Types.ObjectId
  contactEmail: string
  contactName: string
  contactPhone: string
  contactTitle: string
  address: string
  name: string
  status: boolean
  taxId: string
}

interface IOrgBranch {
  name: string
  address: string
  capacity: number
  locationId: import('mongoose').Types.ObjectId
  organizationId: import('mongoose').Types.ObjectId
  phone: string
  type: string
}
interface ITrainer {
  email: string
  userInfo: import('mongoose').Types.ObjectId
  branch: import('mongoose').Types.ObjectId
  status: import('mongoose').Types.ObjectId
  memberId: string
  departmentCode: string
  certificates: string[]
  specialization: string
  maxClient: number
}

interface IInsertOrgStaffRequest
  extends Pick<ITrainer, 'userInfo' | 'branch' | 'memberId'>,
    Pick<IUser, 'fullName' | 'phone' | 'states' | 'address' | 'dateOfBirth'> {
  email: string
  password: string
  role: string
}
interface IExerciseOfWorkoutSession {
  sets: number
  reps: number
  exercise: import('mongoose').Types.ObjectId
  equipment: import('mongoose').Types.ObjectId
  schedule: import('mongoose').Types.ObjectId[]
}

interface IWorkoutSession extends IDefinitionCommon {
  client: import('mongoose').Types.ObjectId
  exercises: IExerciseOfWorkoutSession[]
}

interface IExercise extends IDefinitionCommon {
  goal: import('mongoose').Types.ObjectId
  level: import('mongoose').Types.ObjectId
  muscle: import('mongoose').Types.ObjectId
  category: import('mongoose').Types.ObjectId
  equipment: import('mongoose').Types.ObjectId
}
