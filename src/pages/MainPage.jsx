import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

const CATEGORIES = ['food', 'transport', 'utilities', 'entertainment', 'health', 'other']

export default function MainPage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchExpenses() }, [])

  async function fetchExpenses() {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      if (error) {
        if (
          error.message.includes('does not exist') ||
          error.message.includes('schema cache') ||
          error.message.includes('relation') ||
          error.message.includes('Could not find')
        ) {
          setError('Something went wrong. Please try again later.')
        } else {
          setError(error.message)
        }
        return
      }
      setExpenses(data)
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!title.trim()) { setFormError('Title is required'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setFormError('Amount must be a positive number'); return }
    if (!date) { setFormError('Date is required'); return }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          title: title.trim(),
          amount: Math.round(Number(amount)),
          category: category || 'other',
          date,
          notes: notes.trim() || null
        })
        .select()
        .single()
      if (error) { setFormError(error.message); return }
      setExpenses(prev => [data, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      setTitle('')
      setAmount('')
      setCategory('other')
      setDate(new Date().toISOString().slice(0, 10))
      setNotes('')
    } catch {
      setFormError('Failed to add expense. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const s = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    if (s > 0) acc[cat] = s
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Expense Tracker</h1>
        <button onClick={logout} className="bg-gray-200 px-4 py-2 rounded text-sm">Logout</button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Summary card */}
        {!isLoading && !error && expenses.length > 0 && (
          <div className="border rounded p-4 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Total Spending</span>
              <span className="text-xl font-bold">${total.toLocaleString()}</span>
            </div>
            {Object.keys(byCategory).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(byCategory).map(([cat, amt]) => (
                  <span key={cat} className="bg-white border rounded px-2 py-1 text-sm text-gray-600 capitalize">
                    {cat}: <span className="font-medium">${amt.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add expense form */}
        <form onSubmit={handleCreate} className="border rounded p-4 mb-6">
          <h2 className="font-semibold mb-3">Add Expense</h2>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-3"
          />
          <div className="flex gap-3 mb-3">
            <input
              type="number"
              placeholder="Amount ($)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-3 capitalize"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-3"
          />
          {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
        </form>

        {/* List */}
        {isLoading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-500 text-center py-8">{error}</div>}
        {!isLoading && !error && expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No expenses yet. Add your first one above.
          </div>
        )}
        {!isLoading && !error && expenses.length > 0 && (
          <ul className="space-y-2">
            {expenses.map(exp => (
              <li key={exp.id} className="border rounded px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{exp.title}</span>
                    <span className="text-blue-700 font-semibold shrink-0">${exp.amount.toLocaleString()}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded shrink-0 capitalize">
                      {exp.category}
                    </span>
                    <span className="text-gray-400 text-xs shrink-0">{exp.date}</span>
                  </div>
                  {exp.notes && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{exp.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-red-500 text-sm hover:text-red-700 shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
