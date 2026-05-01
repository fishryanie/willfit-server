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
