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
