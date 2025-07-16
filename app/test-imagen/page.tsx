'use client'

import { useState } from 'react'
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session'
import { API_CONFIG } from '../config/api'

interface TestResult {
  success: boolean
  conversationId: string
  stage: string
  timestamp: string
  context?: EdgePhotoShootContext
  locations?: EdgeLocation[]
  shots?: EdgeShot[]
  error?: string
}

export default function PhotoAssistantTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  
  // Test inputs
  const [testMode, setTestMode] = useState<'conversation' | 'mock' | 'transcript' | 'custom'>('mock')
  const [conversationId, setConversationId] = useState('conv_01k07v5tdeebfamvqctge5z8k2')
  const [mockType, setMockType] = useState<'portrait' | 'landscape' | 'street'>('portrait')
  const [transcript, setTranscript] = useState('')
  const [stage, setStage] = useState<'full' | 'context' | 'locations' | 'storyboard'>('full')
  const [generateImages, setGenerateImages] = useState(false)
  
  // Custom context for advanced testing
  const [customContext, setCustomContext] = useState<Partial<PhotoShootContext>>({
    shootType: 'portrait',
    mood: ['dramatic', 'moody'],
    timeOfDay: 'golden hour',
    subject: 'Local musician',
  })

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      // Build request body based on test mode
      let requestBody: any = { stage, generateImages }
      
      switch (testMode) {
        case 'conversation':
          requestBody.conversationId = conversationId
          break
        case 'mock':
          requestBody.mockContext = mockType
          break
        case 'transcript':
          requestBody.transcript = transcript
          break
        case 'custom':
          if (stage !== 'context' && stage !== 'full') {
            requestBody.context = customContext
          }
          break
      }
      
      console.log('Request:', requestBody)
      
      const response = await fetch(API_CONFIG.ELEVENLABS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_CONFIG.SUPABASE_ANON_KEY && {
            'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`
          })
        },
        body: JSON.stringify(requestBody)
      })
      
      const data = await response.json()
      setResult(data)
      
      // Save to localStorage for sharing
      if (data.success) {
        localStorage.setItem('lastPhotoShoot', JSON.stringify(data))
      }
    } catch (error: any) {
      console.error('Error:', error)
      setResult({ 
        success: false, 
        error: error.message,
        conversationId: '',
        stage: stage,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    if (!result || !result.success) return
    
    const compressed = btoa(JSON.stringify(result))
    const shareUrl = `${window.location.origin}/shoot?data=${compressed}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Photography Assistant Test Page</h1>
        
        {/* Test Configuration */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Test Mode Selection */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Test Mode</h2>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="mock"
                  checked={testMode === 'mock'}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="mr-2"
                />
                <span>Mock Data (Quick Testing)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="conversation"
                  checked={testMode === 'conversation'}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="mr-2"
                />
                <span>ElevenLabs Conversation ID</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="transcript"
                  checked={testMode === 'transcript'}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="mr-2"
                />
                <span>Direct Transcript</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={testMode === 'custom'}
                  onChange={(e) => setTestMode(e.target.value as any)}
                  className="mr-2"
                />
                <span>Custom Context</span>
              </label>
            </div>
            
            {/* Mode-specific inputs */}
            <div className="mt-4">
              {testMode === 'mock' && (
                <select
                  value={mockType}
                  onChange={(e) => setMockType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
                >
                  <option value="portrait">Portrait Shoot</option>
                  <option value="landscape">Landscape Shoot</option>
                  <option value="street">Street Photography</option>
                </select>
              )}
              
              {testMode === 'conversation' && (
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  placeholder="Enter conversation ID"
                />
              )}
              
              {testMode === 'transcript' && (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md h-32"
                  placeholder="Paste conversation transcript here..."
                />
              )}
              
              {testMode === 'custom' && stage !== 'context' && stage !== 'full' && (
                <div className="space-y-2 text-sm">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={customContext.subject}
                    onChange={(e) => setCustomContext({...customContext, subject: e.target.value})}
                    className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Mood (comma separated)"
                    value={customContext.mood?.join(', ')}
                    onChange={(e) => setCustomContext({...customContext, mood: e.target.value.split(',').map(m => m.trim())})}
                    className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Processing Options */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Processing Options</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Processing Stage:</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md"
                >
                  <option value="full">Full Pipeline</option>
                  <option value="context">Context Only</option>
                  <option value="locations">Locations Only</option>
                  <option value="storyboard">Storyboard Only</option>
                </select>
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateImages}
                  onChange={(e) => setGenerateImages(e.target.checked)}
                  className="mr-2"
                />
                <span>Generate Storyboard Images (Imagen 3)</span>
              </label>
              
              <button
                onClick={runTest}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Run Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Status */}
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">Status: {result.success ? 'Success' : 'Error'}</h3>
                  <p className="text-sm opacity-75">Stage: {result.stage} | {new Date(result.timestamp).toLocaleTimeString()}</p>
                </div>
                {result.success && (
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    Copy Share Link
                  </button>
                )}
              </div>
              {result.error && <p className="mt-2 text-red-300">{result.error}</p>}
            </div>
            
            {/* Context */}
            {result.context && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📸 Shoot Context</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-semibold">Type:</span> {result.context.shootType}</p>
                    <p><span className="font-semibold">Mood:</span> {result.context.mood.join(', ')}</p>
                    <p><span className="font-semibold">Time:</span> {result.context.timeOfDay}</p>
                    <p><span className="font-semibold">Duration:</span> {result.context.duration}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">Subject:</span> {result.context.subject}</p>
                    <p><span className="font-semibold">Experience:</span> {result.context.experience}</p>
                    {result.context.equipment && (
                      <p><span className="font-semibold">Equipment:</span> {result.context.equipment.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Locations */}
            {result.locations && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📍 Location Suggestions ({result.locations.length})</h3>
                <div className="space-y-4">
                  {result.locations.map((location, idx) => (
                    <div key={idx} className="border border-gray-700 rounded p-4">
                      <h4 className="font-bold text-lg">{idx + 1}. {location.name}</h4>
                      {location.address && <p className="text-sm text-gray-400">{location.address}</p>}
                      <p className="mt-2 text-sm">{location.description}</p>
                      <div className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
                        <p><span className="font-semibold">Best Time:</span> {location.bestTime}</p>
                        <p><span className="font-semibold">Permits:</span> {location.permits}</p>
                        <p className="md:col-span-2"><span className="font-semibold">Lighting:</span> {location.lightingNotes}</p>
                        <p className="md:col-span-2"><span className="font-semibold">Access:</span> {location.accessibility}</p>
                      </div>
                      {location.alternatives.length > 0 && (
                        <p className="mt-2 text-sm"><span className="font-semibold">Nearby:</span> {location.alternatives.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Shots/Storyboard */}
            {result.shots && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">🎬 Shot List ({result.shots.length} shots)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.shots.map((shot, idx) => (
                    <div key={idx} className="border border-gray-700 rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold">Shot #{shot.shotNumber}</h4>
                        <span className="text-sm text-gray-400">
                          Location {shot.locationIndex + 1}
                        </span>
                      </div>
                      
                      {shot.storyboardImage && (
                        <img 
                          src={shot.storyboardImage} 
                          alt={`Storyboard for shot ${shot.shotNumber}`}
                          className="w-full h-48 object-cover rounded mb-3"
                        />
                      )}
                      
                      <p className="text-sm mb-2"><span className="font-semibold">Scene:</span> {shot.imagePrompt}</p>
                      <p className="text-sm mb-2"><span className="font-semibold">Direction:</span> {shot.poseInstruction}</p>
                      <p className="text-sm mb-2"><span className="font-semibold">Technical:</span> {shot.technicalNotes}</p>
                      <p className="text-sm"><span className="font-semibold">Gear:</span> {shot.equipment.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Raw Response */}
            <details className="bg-gray-800 p-4 rounded-lg">
              <summary className="cursor-pointer font-bold">Raw Response Data</summary>
              <pre className="mt-4 text-xs overflow-auto bg-gray-900 p-4 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
        
        {/* Quick Test Buttons */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-bold mb-3">Quick Tests:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setTestMode('mock'); setMockType('portrait'); setStage('full'); runTest(); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Portrait Full
            </button>
            <button
              onClick={() => { setTestMode('mock'); setMockType('landscape'); setStage('locations'); runTest(); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Landscape Locations
            </button>
            <button
              onClick={() => { setTestMode('mock'); setMockType('street'); setStage('storyboard'); runTest(); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Street Storyboard
            </button>
            <button
              onClick={() => { setTestMode('conversation'); setStage('full'); setGenerateImages(true); runTest(); }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Real Conv + Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}