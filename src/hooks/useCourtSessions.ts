import { useState, useEffect, useCallback } from 'react'
import { Session } from '@/types'

// Helper function to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function useCourtSessions(courtId: string) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [finishedSessions, setFinishedSessions] = useState<Session[]>([])
  
  // Load sessions from localStorage on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('squash4all_sessions')
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      const courtData = parsedData.courts?.[courtId] || { upcoming: [], active: null, finished: [] }
      setUpcomingSessions(courtData.upcoming || [])
      setActiveSession(courtData.active || null)
      setFinishedSessions(courtData.finished || [])
    }
  }, [courtId])
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    const storedData = localStorage.getItem('squash4all_sessions')
    const parsedData = storedData ? JSON.parse(storedData) : { courts: {} }
    
    parsedData.courts = parsedData.courts || {}
    parsedData.courts[courtId] = {
      upcoming: upcomingSessions,
      active: activeSession,
      finished: finishedSessions
    }
    
    localStorage.setItem('squash4all_sessions', JSON.stringify(parsedData))
  }, [courtId, upcomingSessions, activeSession, finishedSessions])
  
  // Create a new upcoming session
  const createUpcomingSession = useCallback((session: Omit<Session, 'id' | 'status'>) => {
    const newSession: Session = {
      ...session,
      id: generateId(),
      status: 'upcoming'
    }
    
    setUpcomingSessions(prev => [...prev, newSession])
    return newSession
  }, [])
  
  // Edit an existing upcoming session
  const updateUpcomingSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setUpcomingSessions(prev => 
      prev.map(session => 
        session.id === sessionId ? { ...session, ...updates } : session
      )
    )
  }, [])
  
  // Cancel an upcoming session
  const cancelUpcomingSession = useCallback((sessionId: string) => {
    setUpcomingSessions(prev => prev.filter(session => session.id !== sessionId))
  }, [])
  
  // Start a session (convert from upcoming to active)
  const startSession = useCallback((sessionId?: string, newSession?: Omit<Session, 'id' | 'status'>) => {
    // Case 1: Starting from an existing upcoming session
    if (sessionId) {
      const sessionToStart = upcomingSessions.find(s => s.id === sessionId)
      
      if (sessionToStart) {
        const now = new Date()
        const newActiveSession: Session = {
          ...sessionToStart,
          status: 'active',
          startTime: now,
          actualDuration: 0
        }
        
        setActiveSession(newActiveSession)
        setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId))
        return newActiveSession
      }
    } 
    // Case 2: Starting a new session directly (not from upcoming)
    else if (newSession) {
      const now = new Date()
      const newActiveSession: Session = {
        ...newSession,
        id: generateId(),
        status: 'active',
        startTime: now,
        actualDuration: 0
      }
      
      setActiveSession(newActiveSession)
      return newActiveSession
    }
    
    return null
  }, [upcomingSessions])
  
  // Update the active session (e.g., adding items)
  const updateActiveSession = useCallback((updates: Partial<Session>) => {
    if (activeSession) {
      setActiveSession(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [activeSession])
  
  // End the active session and move it to finished
  const endSession = useCallback((finalCost: number, paymentMethod?: 'cash' | 'card', isExplicitCancel?: boolean) => {
    if (activeSession) {
      console.log('useCourtSessions: Ending session with cost:', finalCost, 'Method:', paymentMethod, 'Explicit Cancel:', isExplicitCancel);
      
      const now = new Date()
      const finishedSession: Session = {
        ...activeSession,
        status: 'finished',
        endTime: now,
        cost: finalCost,
        paymentStatus: isExplicitCancel ? 'canceled' : 'paid', // If not explicitly canceled, it's 'paid' (even if 0 cost)
        paymentMethod: isExplicitCancel || finalCost === 0 ? null : (paymentMethod || null) // No payment method if canceled or zero cost
      }
      
      // Log the session being ended
      console.log('Session completed:', finishedSession);
      
      setFinishedSessions(prev => [finishedSession, ...prev])
      setActiveSession(null)
      return finishedSession
    }
    return null
  }, [activeSession])
  
  // Get a specific session by ID from any category
  const getSessionById = useCallback((sessionId: string): Session | null => {
    return (
      upcomingSessions.find(s => s.id === sessionId) ||
      (activeSession?.id === sessionId ? activeSession : null) ||
      finishedSessions.find(s => s.id === sessionId) ||
      null
    )
  }, [upcomingSessions, activeSession, finishedSessions])
  
  return {
    // Session lists
    upcomingSessions,
    activeSession,
    finishedSessions,
    
    // Session management functions
    createUpcomingSession,
    updateUpcomingSession,
    cancelUpcomingSession,
    startSession,
    updateActiveSession,
    endSession,
    getSessionById
  }
} 