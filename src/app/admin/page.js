'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
const router = useRouter()
const [currentUser, setCurrentUser] = useState(null)
const [users, setUsers] = useState([])
const [stats, setStats] = useState(null)
const [loading, setLoading] = useState(true)
const [msg, setMsg] = useState({ text: '', type: '' })
const [roleLoading, setRoleLoading] = useState({})

useEffect(() => {
const token = localStorage.getItem('token')
if (!token) {
router.push('/login')
return
}

fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
.then(r => r.json())
.then(d => {
if (!d.success) {
localStorage.clear()
router.push('/login')
return
}


const freshUser = d.user
localStorage.setItem('user', JSON.stringify(freshUser))

if (freshUser.role !== 'admin') {
router.push('/dashboard')
return
}

setCurrentUser(freshUser)
loadData(token)
})
.catch(() => {
localStorage.clear()
router.push('/login')
})
}, [])

async function loadData(tokenOverride) {
const token = tokenOverride || localStorage.getItem('token')
setLoading(true)
try {
const [usersRes, statsRes] = await Promise.all([
fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
])

const usersData = await usersRes.json()
const statsData = await statsRes.json()

if (!usersData.success && usersRes.status === 401) {
localStorage.clear()
router.push('/login')
return
}

if (usersData.success) setUsers(usersData.data)
if (statsData.success) setStats(statsData.data)
} catch {
showMsg('failed to load data', 'error')
} finally {
setLoading(false)
}
}

function showMsg(text, type) {
setMsg({ text, type })
setTimeout(() => setMsg({ text: '', type: '' }), 3500)
}

async function handleDeleteUser(id, name) {
if (!confirm(`delete user "${name}"? this also deletes their tasks`)) return

const token = localStorage.getItem('token')
try {
const res = await fetch(`/api/admin/users/${id}`, {
method: 'DELETE',
headers: { Authorization: `Bearer ${token}` }
})
const data = await res.json()
if (!data.success) {
showMsg(data.message, 'error')
return
}
showMsg('user deleted', 'success')
loadData()
} catch {
showMsg('delete failed', 'error')
}
}

async function handlePromote(userId, userName) {
if (!confirm(`promote ${userName} to admin?`)) return

const token = localStorage.getItem('token')
setRoleLoading(prev => ({ ...prev, [userId]: true }))

try {
const res = await fetch(`/api/admin/users/${userId}`, {
method: 'PATCH',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`
},
body: JSON.stringify({ role: 'admin' })
})

const data = await res.json()

if (!data.success) {
showMsg(data.message, 'error')
return
}

showMsg(`${userName} is now admin`, 'success')
setUsers(prev => prev.map(u => {
if (u._id === userId) return { ...u, role: 'admin' }
return u
}))

} catch {
showMsg('role update failed', 'error')
} finally {
setRoleLoading(prev => ({ ...prev, [userId]: false }))
}
}

if (!currentUser) return null

return (
<div>
<nav className="navbar">
<span className="navbar-brand">PrimeTrade</span>
<div className="navbar-links">
<span style={{ fontSize: '12px', color: '#4ade80', background: '#0a2a14', padding: '3px 10px', borderRadius: '20px', border: '1px solid #1a4a24' }}>admin</span>
<Link href="/dashboard" style={{ fontSize: '13px' }}>Dashboard</Link>
<button className="btn-gray" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => { localStorage.clear(); router.push('/login') }}>
Logout
</button>
</div>
</nav>

<div className="page-container">
<div style={{ marginBottom: '24px' }}>
<h1 style={{ fontSize: '22px', fontWeight: '700' }}>Admin Panel</h1>
<p style={{ color: '#555', fontSize: '13px', marginTop: '3px' }}>manage users and view platform stats</p>
</div>

{msg.text && (
<p className={msg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginBottom: '16px' }}>{msg.text}</p>
)}

{stats && (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
{[
{ label: 'total users', val: stats.totalUsers },
{ label: 'total tasks', val: stats.totalTasks },
{ label: 'pending', val: stats.pendingTasks },
{ label: 'done', val: stats.doneTasks }
].map(item => (
<div key={item.label} className="card" style={{ textAlign: 'center' }}>
<div style={{ fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>{item.val}</div>
<div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{item.label}</div>
</div>
))}
</div>
)}

<div style={{ background: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#6aae6a' }}>
<strong>Role-Based Access:</strong> Admins can promote regular users to admin. Once promoted, admin accounts cannot be changed or deleted.
</div>

<h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>All Users</h2>

{loading ? (
<p style={{ color: '#555' }}>loading...</p>
) : (
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
{users.map(u => {
const isYou = u._id === currentUser.id || u.id === currentUser.id
const isOtherAdmin = u.role === 'admin' && !isYou
const isUpdating = roleLoading[u._id]

return (
<div key={u._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
<div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a2a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#4ade80', flexShrink: 0 }}>
{u.name?.[0]?.toUpperCase() || '?'}
</div>
<div>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
<span style={{ fontWeight: '600', fontSize: '14px' }}>{u.name}</span>
{isYou && <span style={{ fontSize: '10px', color: '#888' }}>(you)</span>}
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
<span style={{ color: '#666', fontSize: '12px' }}>{u.email}</span>
<span className={`badge badge-${u.role}`}>{u.role}</span>
</div>
</div>
</div>

{!isYou && !isOtherAdmin && (
<div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
<button
onClick={() => handlePromote(u._id, u.name)}
disabled={isUpdating}
style={{
padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
background: '#0a1a2a',
color: '#60a5fa',
border: '1px solid #1a2a4a',
borderRadius: '6px', opacity: isUpdating ? 0.5 : 1
}}
>
{isUpdating ? '...' : '↑ promote'}
</button>

<button className="btn-red" style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }} onClick={() => handleDeleteUser(u._id, u.name)}>
Delete
</button>
</div>
)}
</div>
)
})}
</div>
)}
</div>
</div>
)
}
