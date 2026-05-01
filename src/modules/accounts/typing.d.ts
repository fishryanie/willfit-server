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
