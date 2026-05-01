import crypto from 'crypto'

export const generateUniqueId = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += characters[bytes[i] % characters.length]
  }
  return `${result}${Date.now()}`
}

export const FunctionTemplateInterval = () => {
  FunctionTemplate()
  setInterval(function () {
    FunctionTemplate()
  }, 1000)
}

export const FunctionTemplate = () => {
  return 0
}
