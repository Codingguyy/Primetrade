import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Task from '@/models/Task'
import { requireAdmin } from '@/middleware/auth'

export async function GET(request) {
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectDB()

    const totalUsers = await User.countDocuments()
    const totalTasks = await Task.countDocuments()
    const pendingTasks = await Task.countDocuments({ status: 'pending' })
    const doneTasks = await Task.countDocuments({ status: 'done' })

    return NextResponse.json({
      success: true,
      data: { totalUsers, totalTasks, pendingTasks, doneTasks }
    })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
