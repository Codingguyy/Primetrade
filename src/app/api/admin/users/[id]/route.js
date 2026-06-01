import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Task from '@/models/Task'
import { requireAdmin } from '@/middleware/auth'


export async function DELETE(request, { params }) {
const { error, user: adminUser } = await requireAdmin(request)
if (error) return error

try {
await connectDB()

const target = await User.findById(params.id)
if (!target) return NextResponse.json({ success: false, message: 'user not found' }, { status: 404 })

if (target._id.toString() === adminUser._id.toString()) {
return NextResponse.json({ success: false, message: 'cannot delete yourself' }, { status: 400 })
}

if (target.role === 'admin') {
return NextResponse.json({ success: false, message: 'cannot delete another admin' }, { status: 400 })
}

await User.findByIdAndDelete(params.id)
await Task.deleteMany({ user: params.id })

return NextResponse.json({ success: true, message: 'user and their tasks deleted' })
} catch (err) {
return NextResponse.json({ success: false, message: err.message }, { status: 500 })
}
}


export async function PATCH(request, { params }) {
const { error, user: adminUser } = await requireAdmin(request)
if (error) return error

try {
const body = await request.json()
const { role } = body

if (!role || !['user', 'admin'].includes(role)) {
return NextResponse.json({ success: false, message: 'role must be user or admin' }, { status: 400 })
}

await connectDB()

const target = await User.findById(params.id)
if (!target) {
return NextResponse.json({ success: false, message: 'user not found' }, { status: 404 })
}

if (target._id.toString() === adminUser._id.toString()) {
return NextResponse.json({ success: false, message: 'cannot change your own role' }, { status: 400 })
}

if (target.role === 'admin') {
return NextResponse.json({ success: false, message: 'cannot change role of another admin' }, { status: 400 })
}

target.role = role
await target.save()

return NextResponse.json({
success: true,
message: `role updated to ${role}`,
data: { id: target._id, name: target.name, email: target.email, role: target.role }
})

} catch (err) {
return NextResponse.json({ success: false, message: err.message }, { status: 500 })
}
}
