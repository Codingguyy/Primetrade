import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { requireAdmin } from '@/middleware/auth'

export async function GET(request) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectDB()
    const users = await User.find().sort({ createdAt: -1 })
    return NextResponse.json({ success: true, count: users.length, data: users })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
