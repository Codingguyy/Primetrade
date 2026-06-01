import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected) return

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI not set in env')
  }

  const db = await mongoose.connect(process.env.MONGO_URI)
  isConnected = db.connections[0].readyState === 1
}
