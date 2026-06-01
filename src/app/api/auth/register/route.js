import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { signToken } from '@/lib/jwt'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'all fields required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'password must be at least 6 characters' }, { status: 400 })
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'invalid email' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ success: false, message: 'email already in use' }, { status: 400 })
    }

    // first user ever registered becomes admin automatically
    const userCount = await User.countDocuments()
    const role = userCount === 0 ? 'admin' : 'user'

    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role })
    const token = signToken(user._id)

    return NextResponse.json({
      success: true,
      message: role === 'admin' ? 'admin account created (first user)' : 'account created',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
