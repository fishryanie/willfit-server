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
