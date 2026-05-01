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
