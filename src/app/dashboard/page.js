'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
const router = useRouter()
const [user, setUser] = useState(null)
const [tasks, setTasks] = useState([])
const [loading, setLoading] = useState(true)
const [showModal, setShowModal] = useState(false)
const [editTask, setEditTask] = useState(null)
const [msg, setMsg] = useState({ text: '', type: '' })
const [filterStatus, setFilterStatus] = useState('')

const [title, setTitle] = useState('')
const [description, setDescription] = useState('')
const [status, setStatus] = useState('pending')
const [priority, setPriority] = useState('medium')
const [saving, setSaving] = useState(false)

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
localStorage.setItem('token', token) 
localStorage.setItem('user', JSON.stringify(freshUser))
setUser(freshUser)
loadTasks(token)
})
.catch(() => {
localStorage.clear()
router.push('/login')
})
}, [])

useEffect(() => {
if (user) loadTasks()
}, [filterStatus])

async function loadTasks(tokenOverride) {
const token = tokenOverride || localStorage.getItem('token')
setLoading(true)
try {
let url = '/api/tasks'
if (filterStatus) url += `?status=${filterStatus}`

const res = await fetch(url, {
headers: { Authorization: `Bearer ${token}` }
})
const data = await res.json()

if (!data.success) {
if (res.status === 401) {
localStorage.clear()
router.push('/login')
return
}
showMsg(data.message, 'error')
return
}

setTasks(data.data)
} catch {
showMsg('failed to load tasks', 'error')
} finally {
setLoading(false)
}
}

function showMsg(text, type) {
setMsg({ text, type })
setTimeout(() => setMsg({ text: '', type: '' }), 3000)
}

function openCreate() {
setEditTask(null)
setTitle('')
setDescription('')
setStatus('pending')
setPriority('medium')
setShowModal(true)
}

function openEdit(task) {
setEditTask(task)
setTitle(task.title)
setDescription(task.description || '')
setStatus(task.status)
setPriority(task.priority)
setShowModal(true)
}

async function handleSave() {
if (!title.trim()) {
showMsg('title cant be empty', 'error')
return
}

const token = localStorage.getItem('token')
setSaving(true)

try {
const url = editTask ? `/api/tasks/${editTask._id}` : '/api/tasks'
const method = editTask ? 'PUT' : 'POST'

const res = await fetch(url, {
method,
headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
body: JSON.stringify({ title, description, status, priority })
})

const data = await res.json()

if (!data.success) {
showMsg(data.message, 'error')
return
}

showMsg(editTask ? 'task updated' : 'task created', 'success')
setShowModal(false)
loadTasks()
} catch {
showMsg('something went wrong', 'error')
} finally {
setSaving(false)
}
}

async function handleDelete(id) {
if (!confirm('delete this task?')) return

const token = localStorage.getItem('token')
try {
const res = await fetch(`/api/tasks/${id}`, {
method: 'DELETE',
headers: { Authorization: `Bearer ${token}` }
})
const data = await res.json()

if (!data.success) {
showMsg(data.message, 'error')
return
}

showMsg('task deleted', 'success')
loadTasks()
} catch {
showMsg('delete failed', 'error')
}
}

function handleLogout() {
localStorage.clear()
router.push('/login')
}

if (!user) return null

return (
<div>
<nav className="navbar">
<span className="navbar-brand">PrimeTrade</span>
<div className="navbar-links">
<span style={{ fontSize: '13px', color: '#888' }}>{user.name} · {user.role}</span>
{user.role === 'admin' && <Link href="/admin" style={{ fontSize: '13px' }}>Admin</Link>}
<button className="btn-gray" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={handleLogout}>Logout</button>
</div>
</nav>

<div className="page-container">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
<div>
<h1 style={{ fontSize: '22px', fontWeight: '700' }}>My Tasks</h1>
<p style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>manage your work</p>
</div>
<button className="btn-green" onClick={openCreate}>+ New Task</button>
</div>

{msg.text && (
<p className={msg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginBottom: '16px' }}>
{msg.text}
</p>
)}

<div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
{['', 'pending', 'in-progress', 'done'].map(s => (
<button key={s} onClick={() => setFilterStatus(s)} style={{
padding: '6px 14px', fontSize: '12px', cursor: 'pointer',
background: filterStatus === s ? '#4ade80' : '#1a1a1a',
color: filterStatus === s ? '#000' : '#aaa',
border: '1px solid #333', borderRadius: '20px'
}}>
{s || 'all'}
</button>
))}
</div>

{loading ? (
<p style={{ color: '#555', padding: '40px 0', textAlign: 'center' }}>loading tasks...</p>
) : tasks.length === 0 ? (
<div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
<p style={{ color: '#555' }}>no tasks yet, click + New Task</p>
</div>
) : (
<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
{tasks.map(task => (
<div key={task._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
<div style={{ flex: 1, minWidth: 0 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
<span style={{ fontWeight: '600' }}>{task.title}</span>
<span className={`badge badge-${task.status}`}>{task.status}</span>
<span className={`badge badge-${task.priority}`}>{task.priority}</span>
</div>
{task.description && <p style={{ color: '#777', fontSize: '13px' }}>{task.description}</p>}
<p style={{ color: '#444', fontSize: '11px', marginTop: '6px' }}>{new Date(task.createdAt).toLocaleDateString()}</p>
</div>
<div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
<button className="btn-gray" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openEdit(task)}>Edit</button>
<button className="btn-red" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(task._id)}>Del</button>
</div>
</div>
))}
</div>
)}
</div>

{showModal && (
<div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
<div className="modal">
<h3>{editTask ? 'Edit Task' : 'New Task'}</h3>

<div className="form-group">
<label>Title *</label>
<input value={title} onChange={e => setTitle(e.target.value)} placeholder="task title" />
</div>

<div className="form-group">
<label>Description</label>
<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="optional..." rows={3} style={{ resize: 'vertical' }} />
</div>

<div className="grid-2">
<div className="form-group">
<label>Status</label>
<select value={status} onChange={e => setStatus(e.target.value)}>
<option value="pending">pending</option>
<option value="in-progress">in-progress</option>
<option value="done">done</option>
</select>
</div>
<div className="form-group">
<label>Priority</label>
<select value={priority} onChange={e => setPriority(e.target.value)}>
<option value="low">low</option>
<option value="medium">medium</option>
<option value="high">high</option>
</select>
</div>
</div>

<div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
<button className="btn-green" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
{saving ? 'saving...' : editTask ? 'Update' : 'Create'}
</button>
<button className="btn-gray" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
</div>
</div>
</div>
)}
</div>
)
}
