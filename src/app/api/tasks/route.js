import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Task from '@/models/Task'
import { requireAuth } from '@/middleware/auth'

export async function GET(request) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const skip = (page - 1) * limit

    const filter = { user: user._id }
    if (searchParams.get('status')) filter.status = searchParams.get('status')
    if (searchParams.get('priority')) filter.priority = searchParams.get('priority')

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    const total = await Task.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    const body = await request.json()
    const { title, description, status, priority } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: 'title is required' }, { status: 400 })
    }

    await connectDB()

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'pending',
      priority: priority || 'medium',
      user: user._id
    })

    return NextResponse.json({ success: true, message: 'task created', data: task }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
