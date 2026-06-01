import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { signToken } from '@/lib/jwt'

export async function POST(request) {
try {
const body = await request.json()
const { email, password } = body

if (!email || !password) {
return NextResponse.json({ success: false, message: 'email and password required' }, { status: 400 })
}

await connectDB()

const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
if (!user) {
return NextResponse.json({ success: false, message: 'invalid email or password' }, { status: 401 })
}

const match = await user.comparePassword(password)
if (!match) {
return NextResponse.json({ success: false, message: 'invalid email or password' }, { status: 401 })
}

const token = signToken(user._id)

return NextResponse.json({
success: true,
message: 'logged in',
token,
user: { id: user._id, name: user.name, email: user.email, role: user.role }
})

} catch (err) {
return NextResponse.json({ success: false, message: err.message }, { status: 500 })
}
}
