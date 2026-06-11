import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Edit2, FileText, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardNavbar from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // 1. Swap the mock array for real React State
  const [surveys, setSurveys] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(true)

  // 2. Fetch the surveys when the dashboard loads
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await fetch('http://localhost:8787/api/surveys', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setSurveys(data)
        }
      } catch (error) {
        console.error('Failed to fetch surveys', error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchSurveys()
  }, [])

  const handleCreateSurvey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8787/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to create survey in DB')
      const data = await response.json()

      navigate({
        to: '/dashboard/surveys/$surveyId',
        params: { surveyId: data.id },
      })
    } catch (error) {
      console.error('Failed to create survey', error)
      alert('Something went wrong creating your survey.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100">
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Manage your active feedback pipelines.</p>
          </div>

          <Button
            onClick={handleCreateSurvey}
            disabled={isLoading}
            className="rounded-full gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Survey'}
          </Button>
        </div>

        <div className="mt-10">
          {isFetching ? (
            <div className="flex justify-center p-20 text-zinc-500">Loading surveys...</div>
          ) : surveys.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-20 text-center bg-zinc-950/20">
              <div className="rounded-full bg-zinc-900 p-4 text-zinc-400">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-200">No surveys found</h3>
              <p className="mt-2 max-w-sm text-sm text-zinc-400">
                Get started by creating your very first survey to gather anonymous responses from
                your users.
              </p>
              <Button
                onClick={handleCreateSurvey}
                disabled={isLoading}
                className="mt-6 rounded-full gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
              >
                <Plus className="h-4 w-4" />
                {isLoading ? 'Creating...' : 'Create your first survey'}
              </Button>
            </div>
          ) : (
            /* 3. The New Survey Grid! */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/50 group"
                >
                  <div>
                    {/* Brand Color Dot & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{ backgroundColor: survey.primaryColor || '#3b82f6' }}
                      />
                      <h3 className="font-semibold text-zinc-100 truncate text-lg">
                        {survey.title || 'Untitled Survey'}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-400 line-clamp-2 h-10">
                      {survey.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-between border-t border-zinc-800/50 pt-4">
                    <span className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded">
                      ID: {survey.id.split('-')[0]}...
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/dashboard/surveys/$surveyId',
                          params: { surveyId: survey.id },
                        })
                      }
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
