import mongoose from 'mongoose'

const cached: {
  connection?: typeof mongoose
  promise?: Promise<typeof mongoose>
} = {}

export default async function mongooseConnection() {
  if (cached.connection) {
    return cached.connection
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.MONGODB_DB,
      maxPoolSize: 50,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10_000
    })
  }
  try {
    cached.connection = await cached.promise
    console.log(`Mongoose Connection Success: ${mongoose.connection.db?.databaseName}`)
  } catch (e) {
    cached.promise = undefined
    throw e
  }
  return cached.connection
}
