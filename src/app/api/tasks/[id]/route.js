import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Task from '@/models/Task'
import { requireAuth } from '@/middleware/auth'

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    await connectDB()
    const task = await Task.findOne({ _id: params.id, user: user._id })
    if (!task) return NextResponse.json({ success: false, message: 'task not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: task })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    const body = await request.json()
    await connectDB()

    const task = await Task.findOne({ _id: params.id, user: user._id })
    if (!task) return NextResponse.json({ success: false, message: 'task not found' }, { status: 404 })

    const allowed = ['title', 'description', 'status', 'priority']
    allowed.forEach(f => {
      if (body[f] !== undefined) task[f] = body[f]
    })

    await task.save()
    return NextResponse.json({ success: true, message: 'task updated', data: task })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    await connectDB()
    const task = await Task.findOneAndDelete({ _id: params.id, user: user._id })
    if (!task) return NextResponse.json({ success: false, message: 'task not found' }, { status: 404 })
    return NextResponse.json({ success: true, message: 'task deleted' })
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
