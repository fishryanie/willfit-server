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
