import { createFileRoute } from '@tanstack/react-router'
import {
  Circle,
  Download,
  GripVertical,
  Image as ImageIcon,
  Palette,
  Plus,
  Save,
  Settings2,
  Share,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardNavbar from '@/components/shared/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface SurveyResponse {
  id: string
  surveyId: string
  answers: Record<string, string | number | boolean>
}

export const Route = createFileRoute('/dashboard/surveys/$surveyId')({
  component: SurveyBuilder,
})

function SurveyBuilder() {
  const { surveyId } = Route.useParams()
  const { toast } = useToast()

  // --- State ---
  const [title, setTitle] = useState('Untitled Survey')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [logoUrl, setLogoUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([]) // Strictly typed!
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]) // Strictly typed!
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        const res = await fetch(`http://localhost:8787/api/surveys/${surveyId}`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || 'Untitled Survey')
          setDescription(data.description || '')
          setPrimaryColor(data.primaryColor || '#3b82f6')
          setLogoUrl(data.logoUrl || '')
          setQuestions(data.questions || [])
        }

        const responsesRes = await fetch(
          `http://localhost:8787/api/surveys/${surveyId}/responses`,
          { credentials: 'include' },
        )
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json()
          setSurveyResponses(responsesData || [])
        }
      } catch (error) {
        console.error('Failed to load survey data:', error)
      }
    }
    loadSurveyData()
  }, [surveyId])

  const getQuestionText = (qId: string) => {
    const q = questions.find((q) => q.id === qId)
    return q ? q.questionText : 'Deleted Question'
  }

  const handleAddQuestion = async () => {
    setIsAdding(true)
    try {
      const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}/questions`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to add question')

      const newQuestion: Question = await response.json()
      setQuestions([...questions, newQuestion])
    } catch (error) {
      console.error(error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuestionChange = (
    id: string,
    field: keyof Question,
    value: string | string[] | number,
  ) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handleSave = async () => {
    const payload = { title, description, primaryColor, logoUrl, questions }

    try {
      const response = await fetch(`http://localhost:8787/api/surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save survey')

      toast({
        title: 'Success',
        description: 'Survey saved successfully! 🚀',
        className: 'bg-zinc-900 border-zinc-800 text-white',
      })
    } catch (error) {
      console.error('Error saving survey:', error)

      toast({
        title: 'Error',
        description: 'Something went wrong while saving.',
        variant: 'destructive',
        className: 'bg-red-900 border-red-800 text-white',
      })
    }
  }

  const handleCopyLink = async () => {
    const publicUrl = `${window.location.origin}/s/${surveyId}`

    try {
      await navigator.clipboard.writeText(publicUrl)

      toast({
        title: 'Link Copied! 📋',
        description: 'The public survey link is in your clipboard.',
        className: 'bg-zinc-900 border-zinc-800 text-white',
      })
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: 'Error',
        description: 'Could not copy the link to clipboard.',
        variant: 'destructive',
        className: 'bg-red-900 border-red-800 text-white',
      })
    }
  }

  const handleExportCSV = () => {
    if (surveyResponses.length === 0) {
      toast({
        title: 'No data',
        description: 'There are no responses to export yet.',
        variant: 'destructive',
        className: 'bg-zinc-900 border-zinc-800 text-white',
      })
      return
    }

    const headers = [
      'Submission #',
      ...questions.map((q) => `"${q.questionText.replace(/"/g, '""')}"`),
    ]

    const rows = surveyResponses.map((response, index) => {
      const rowData = [`Submission ${index + 1}`]

      questions.forEach((q) => {
        const answer = response.answers[q.id] || ''
        rowData.push(`"${String(answer).replace(/"/g, '""')}"`)
      })

      return rowData.join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${title ? title.replace(/\s+/g, '_') : 'Survey'}_Responses.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Export Successful',
      description: 'Your CSV file is downloading.',
      className: 'bg-zinc-900 border-zinc-800 text-white',
    })
  }

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return

    const newQuestions = [...questions]
    const draggedQuestion = newQuestions[draggedIndex]

    if (!draggedQuestion) return

    newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(index, 0, draggedQuestion)

    setDraggedIndex(index)
    setQuestions(newQuestions)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#030303] text-zinc-100">
      <DashboardNavbar />

      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#030303] px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="font-mono bg-zinc-900 px-2 py-1 rounded text-xs text-zinc-500">
            ID: {surveyId}
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2"
          >
            <Share className="h-4 w-4" />
            Copy Public Link
          </Button>
          <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200 gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-zinc-800 bg-zinc-950 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-6 text-zinc-100 font-semibold">
            <Settings2 className="h-5 w-5" />
            <h2>Survey Settings</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-400 text-xs uppercase tracking-wider">
                  Survey Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-zinc-400 text-xs uppercase tracking-wider"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this survey about?"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 min-h-[80px]"
                />
              </div>
            </div>

            <div className="h-px w-full bg-zinc-800 my-6" />

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-2">
                <Palette className="h-5 w-5" />
                <h2>Branding</h2>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="logo"
                  className="text-zinc-400 text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <ImageIcon className="h-3 w-3" /> Logo URL
                </Label>
                <Input
                  id="logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://imgur.com/my-logo.png"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs placeholder:font-sans focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                <p className="text-[10px] text-zinc-500">Paste a direct link to an image file.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-zinc-400 text-xs uppercase tracking-wider">
                  Theme Color
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-700 shadow-inner cursor-pointer">
                    <input
                      type="color"
                      id="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="absolute -top-2 -left-2 h-14 w-14 cursor-pointer"
                    />
                  </div>
                  <span className="font-mono text-xs text-zinc-400">
                    {primaryColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#030303] p-10 flex justify-center">
          <Tabs defaultValue="editor" className="w-full max-w-2xl">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                <TabsTrigger
                  value="editor"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
                >
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="responses"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400"
                >
                  Responses ({surveyResponses.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="space-y-8 mt-0 border-none p-0 outline-none">
              <div
                className="mb-8 flex flex-col items-center text-center space-y-6 bg-zinc-950/50 p-10 rounded-2xl border border-zinc-800 shadow-sm"
                style={{ borderTop: `6px solid ${primaryColor}` }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="max-h-20 max-w-[200px] object-contain rounded"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="h-16 w-16 border border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-700">
                    Logo
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">
                    {title || 'Untitled Survey'}
                  </h1>
                  {description && <p className="text-zinc-400">{description}</p>}
                </div>
              </div>

              <div className="space-y-6">
                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
                    <p>No questions added yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-6 list-none p-0 m-0">
                    {questions.map((q, index) => (
                      <li
                        key={q.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`relative group rounded-xl border p-6 shadow-sm transition-all hover:border-zinc-700 bg-zinc-950/50 ${
                          draggedIndex === index
                            ? 'opacity-40 border-dashed border-blue-500'
                            : 'border-zinc-800'
                        }`}
                      >
                        <div className="absolute left-2 top-6 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="ml-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <Input
                              value={q.questionText}
                              onChange={(e) =>
                                handleQuestionChange(q.id, 'questionText', e.target.value)
                              }
                              placeholder={`Question ${index + 1}`}
                              className="flex-1 bg-transparent border-0 border-b border-transparent hover:border-zinc-800 focus-visible:border-blue-500 focus-visible:ring-0 rounded-none px-0 text-lg font-medium"
                            />

                            <select
                              value={q.type}
                              onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value)}
                              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            >
                              <option value="text">Short Text</option>
                              <option value="mcq">Multiple Choice</option>
                              <option value="rating">1-5 Rating</option>
                            </select>
                          </div>

                          <div className="pt-2">
                            {q.type === 'text' && (
                              <Input
                                disabled
                                placeholder="Short answer text"
                                className="bg-zinc-900/50 border-zinc-800 border-dashed text-zinc-500"
                              />
                            )}

                            {q.type === 'rating' && (
                              <div className="flex gap-4 items-center">
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <div
                                    key={`rating-${num}`}
                                    className="flex flex-col items-center gap-2"
                                  >
                                    <div className="h-8 w-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-500">
                                      {num}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.type === 'mcq' && (
                              <div className="space-y-3">
                                {q.options?.map((opt: string, optIndex: number) => {
                                  const optionKey = `${q.id}-opt-${optIndex}`
                                  return (
                                    <div key={optionKey} className="flex items-center gap-3">
                                      <Circle className="h-4 w-4 text-zinc-600" />
                                      <Input
                                        value={opt}
                                        onChange={(e) => {
                                          const newOptions = [...(q.options || [])]
                                          newOptions[optIndex] = e.target.value
                                          handleQuestionChange(q.id, 'options', newOptions)
                                        }}
                                        className="h-8 bg-transparent border-transparent hover:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-700"
                                      />
                                    </div>
                                  )
                                })}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleQuestionChange(q.id, 'options', [
                                      ...(q.options || []),
                                      `Option ${(q.options?.length || 0) + 1}`,
                                    ])
                                  }
                                  className="text-zinc-500 hover:text-zinc-300 ml-7 h-7 text-xs"
                                >
                                  + Add Option
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={() =>
                              setQuestions(questions.filter((quest) => quest.id !== q.id))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="pt-4 flex justify-center">
                  <Button
                    onClick={handleAddQuestion}
                    disabled={isAdding}
                    className="rounded-full shadow-lg bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 gap-2 px-6"
                  >
                    <Plus className="h-5 w-5" />
                    {isAdding ? 'Adding...' : 'Add Question'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="responses" className="space-y-6 mt-0 border-none p-0 outline-none">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Collected Responses</h2>
                  <p className="text-zinc-400">Viewing all anonymous submissions.</p>
                </div>

                <Button
                  onClick={handleExportCSV}
                  disabled={surveyResponses.length === 0}
                  variant="outline"
                  className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  Export to CSV
                </Button>
              </div>

              {surveyResponses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 bg-zinc-950/30">
                  <p>No responses yet. Share your public link to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveyResponses.map((response, index) => (
                    <div
                      key={response.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm"
                    >
                      <div className="text-sm text-zinc-500 mb-4 font-mono border-b border-zinc-800 pb-2">
                        Submission #{index + 1}
                      </div>

                      <div className="space-y-4">
                        {Object.entries(response.answers || {}).map(([qId, answer]) => (
                          <div key={qId}>
                            <p className="text-sm font-semibold text-zinc-300 mb-1">
                              {getQuestionText(qId)}
                            </p>
                            <p className="text-zinc-100 bg-zinc-900 px-3 py-2 rounded-md border border-zinc-800/50">
                              {String(answer)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
