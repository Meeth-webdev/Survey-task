import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// --- STRICT TYPESCRIPT INTERFACES ---
interface Question {
  id: string
  surveyId?: string
  type: string
  questionText: string
  position?: number
  options?: string[]
  required?: boolean
}

interface Survey {
  id: string
  title: string
  description?: string
  primaryColor?: string
  logoUrl?: string
  questions: Question[]
}

export const Route = createFileRoute('/s/$surveyId')({
  component: PublicSurveyView,
})

function PublicSurveyView() {
  const { surveyId } = Route.useParams()
  const { toast } = useToast()

  // --- STRICT STATE DEFINITIONS ---
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Load the public survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}/public`)
        if (response.ok) {
          const data = await response.json()
          setSurvey(data)
        }
      } catch (error) {
        console.error('Failed to load survey:', error)
      }
    }
    fetchSurvey()
  }, [surveyId])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) throw new Error('Submission failed')

      setIsSubmitted(true)
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to submit your response. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-zinc-500">
        Loading survey...
      </div>
    )
  }

  // "Thank You" Screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div
          className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-8"
          style={{ borderColor: survey.primaryColor || '#3b82f6' }}
        >
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-zinc-500">Your response has been successfully submitted.</p>
        </div>
      </div>
    )
  }

  // The Survey Canvas
  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Branded Header */}
        <div
          className="bg-white rounded-2xl shadow-sm p-10 text-center border-t-8 space-y-6"
          style={{ borderColor: survey.primaryColor || '#3b82f6' }}
        >
          {survey.logoUrl && (
            <img
              src={survey.logoUrl}
              alt="Logo"
              className="mx-auto max-h-20 object-contain rounded"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{survey.title}</h1>
            {survey.description && <p className="mt-2 text-zinc-500">{survey.description}</p>}
          </div>
        </div>

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions?.map((q: Question) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm p-8 border border-zinc-100">
              <Label className="text-base font-semibold text-zinc-900 mb-4 block">
                {q.questionText}
              </Label>

              {q.type === 'text' && (
                <Input
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="bg-zinc-50 border-zinc-200 focus-visible:ring-1"
                  style={{ '--tw-ring-color': survey.primaryColor } as React.CSSProperties}
                  placeholder="Your answer"
                />
              )}

              {q.type === 'mcq' && (
                <div className="space-y-3">
                  {/* FIX: Create a stable composite key using the question ID and index */}
                  {q.options?.map((opt: string, idx: number) => {
                    const optionKey = `${q.id}-opt-${idx}`
                    return (
                      <label
                        key={optionKey}
                        className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          required={q.required}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="h-4 w-4"
                          style={{ accentColor: survey.primaryColor }}
                        />
                        <span className="text-zinc-700">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'rating' && (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={`rating-${q.id}-${num}`} className="cursor-pointer relative">
                      <input
                        type="radio"
                        name={q.id}
                        required={q.required}
                        value={num.toString()}
                        checked={answers[q.id] === num.toString()}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="peer sr-only"
                      />
                      <div
                        className="h-12 w-12 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-500 font-medium transition-all peer-checked:text-white"
                        style={{
                          backgroundColor:
                            answers[q.id] === num.toString() ? survey.primaryColor : 'transparent',
                          borderColor:
                            answers[q.id] === num.toString() ? survey.primaryColor : '#e4e4e7',
                        }}
                      >
                        {num}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-semibold shadow-xl hover:opacity-90 transition-opacity text-white rounded-xl"
            style={{ backgroundColor: survey.primaryColor || '#3b82f6' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </Button>
        </form>
      </div>
    </div>
  )
}
