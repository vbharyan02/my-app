import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setIsLoading(false)
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists.')
      } else if (error.message.includes('Signups not allowed')) {
        setError('Sign up is currently disabled.')
      } else {
        setError(error.message)
      }
      return
    }
    if (data.session) {
      navigate('/')
    } else {
      navigate('/login')
    }
  }

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start managing your anger</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg w-full text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-gray-500">
          Have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
