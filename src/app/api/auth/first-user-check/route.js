import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

// just tells the register page if db is empty — no sensitive info exposed
export async function GET() {
  try{
    await connectDB()
    const count = await User.countDocuments()
    return NextResponse.json({ isFirst: count === 0 })
  }catch{
    return NextResponse.json({ isFirst: false })
  }
}
