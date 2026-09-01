import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Send,
  Bot,
  CheckCheck,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useQueueLiveStore } from '@/store/queue-live-store'
import { useNavigate } from 'react-router-dom'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  time: string
  actionLink?: {
    label: string
    url: string
  }
}

interface WhatsAppSimulatorModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

let msgIdCounter = 1

function createGreetingMessage(farmerName: string, isHindi: boolean): Message {
  return {
    id: `msg-${msgIdCounter++}`,
    sender: 'bot',
    text: isHindi
      ? `नमस्ते ${farmerName} जी! 🙏 मैं **किसानक्यू कृषि मित्र** हूँ। आप घर बैठे राजगढ़ उपार्जन केंद्र की लाइव स्थिति, कतार, डिजिटल पास और एमएसपी भुगतान की जानकारी प्राप्त कर सकते हैं।`
      : `Hello ${farmerName}! 🙏 I am your **KisanQueue Krishi Mitra** assistant. You can check live Mandi queue conditions, your digital pass, MSP rates, and DBT payment status anytime.`,
    time: 'Just now',
  }
}

export function WhatsAppSimulatorModal({ isOpen, onClose }: WhatsAppSimulatorModalProps) {
  const navigate = useNavigate()
  const language = useAppStore((s) => s.language)
  const farmer = useAppStore((s) => s.farmer)
  const condition = useQueueLiveStore((s) => s.condition)
  const getFarmerPositionAndEta = useQueueLiveStore((s) => s.getFarmerPositionAndEta)

  const farmerName = farmer?.name || (language === 'hi' ? 'रमेश कुमार' : 'Ramesh Kumar')
  const isHindi = language === 'hi'

  const [messages, setMessages] = useState<Message[]>(() => [createGreetingMessage(farmerName, isHindi)])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSendPrompt = useCallback((promptText: string, customQuery?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = {
      id: `user-${msgIdCounter++}`,
      sender: 'user',
      text: customQuery || promptText,
      time: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    setTimeout(async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const query = customQuery || promptText
      try {
        const response = await fetch(`${apiBase}/v1/whatsapp/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: farmer?.phone || '+919876543210',
            text: query,
          }),
        })

        if (!response.ok) throw new Error('API Error')

        const data = await response.json()

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${msgIdCounter++}`,
            sender: 'bot',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionLink: data.action_link || undefined,
          },
        ])
      } catch {
        // Resilient intelligent offline fallback
        let fallbackReply = ''
        const lower = query.toLowerCase()
        if (lower.includes('pass') || lower.includes('पास') || lower.includes('token') || lower.includes('टोकन')) {
          fallbackReply = isHindi
            ? '🎫 आपका सक्रिय डिजिटल पास: **KQ-PASS-7729** (टोकन #47)\n📍 केंद्र: राजगढ़ उपार्जन केंद्र\n🌾 फसल: गेहूं (40 क्विंटल)\n✅ स्थिति: सक्रिय (प्रतीक्षा में)'
            : '🎫 Your Active Digital Pass: **KQ-PASS-7729** (Token #47)\n📍 Centre: Rajgarh Procurement Centre\n🌾 Crop: Wheat (40.0 Q)\n✅ Status: ACTIVE (Waiting in Queue)'
        } else if (lower.includes('status') || lower.includes('eta') || lower.includes('स्थिति') || lower.includes('समय')) {
          fallbackReply = isHindi
            ? '🌾 **राजगढ़ उपार्जन केंद्र - लाइव स्थिति**:\n• परिचालन स्थिति: सामान्य (100% क्षमता)\n• सक्रिय काउंटर: 2\n• आपकी कतार स्थिति: #1 (अनुमानित समय ~25 मिनट)'
            : '🌾 **Rajgarh Procurement Centre - Live Status**:\n• Status: NORMAL (100% capacity)\n• Active Counters: 2\n• Your Position: #1 (Est. Wait: ~25 min)'
        } else if (lower.includes('msp') || lower.includes('मूल्य') || lower.includes('दाम') || lower.includes('rate')) {
          fallbackReply = isHindi
            ? '💰 **शासकीय न्यूनतम समर्थन मूल्य (MSP 2026)**:\n• गेहूं: ₹2,275/क्विंटल\n• चना: ₹5,440/क्विंटल\n• सरसों: ₹5,650/क्विंटल\n• सोयाबीन: ₹4,892/क्विंटल\n\nभुगतान सीधे आपके आधार लिंक बैंक खाते (DBT) में 48 घंटे में जमा होगा।'
            : '💰 **Statutory MSP Rates (2026-27)**:\n• Wheat: ₹2,275/Q\n• Gram: ₹5,440/Q\n• Mustard: ₹5,650/Q\n• Soybean: ₹4,892/Q\n\nDirect DBT payout to Aadhaar-linked bank account within 48 hours.'
        } else {
          fallbackReply = isHindi
            ? '🙏 नमस्ते! किसानक्यू कृषि मित्र सहायक में आपका स्वागत है। आप मंडी की लाइव स्थिति, डिजिटल पास, ईटीए और समर्थन मूल्य की जानकारी ले सकते हैं।'
            : '🙏 Hello! Welcome to KisanQueue Krishi Mitra. You can check live Mandi queue status, get your digital pass, check ETAs, and verify statutory MSP rates.'
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${msgIdCounter++}`,
            sender: 'bot',
            text: fallbackReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      } finally {
        setIsTyping(false)
      }
    }, 400)
  }, [condition, farmer, farmerName, getFarmerPositionAndEta, isHindi])

  function handleResetChat() {
    setMessages([createGreetingMessage(farmerName, isHindi)])
  }

  if (!isOpen) return null

  const promptOptions = [
    {
      id: 'p1',
      label: isHindi ? '🌾 मंडी कतार व स्थिति' : '🌾 Check Mandi ETA',
    },
    {
      id: 'p2',
      label: isHindi ? '🎫 मेरा डिजिटल पास' : '🎫 My Digital Pass',
    },
    {
      id: 'p3',
      label: isHindi ? '💰 एमएसपी भाव व भुगतान' : '💰 MSP & DBT Status',
    },
    {
      id: 'p4',
      label: isHindi ? '🚜 गेट चेक-इन दस्तावेज़' : '🚜 Gate Check-in Help',
    },
  ]

  return (
    <AnimatePresence>
      <div className="wa-modal-backdrop" onClick={onClose} role="presentation">
        <motion.div
          className="wa-modal-window"
          role="dialog"
          aria-modal="true"
          aria-label="WhatsApp Krishi Mitra Assistant"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* WhatsApp Header */}
          <div className="wa-header">
            <div className="wa-header-left">
              <div className="wa-avatar">
                <Bot size={20} aria-hidden="true" />
                <span className="wa-online-dot" />
              </div>
              <div className="wa-meta">
                <div className="wa-title-row">
                  <strong className="wa-name">KisanQueue कृषि मित्र</strong>
                  <span className="wa-verified-badge" title="Official Government Verified Bot">✓</span>
                </div>
                <span className="wa-status">
                  {isHindi ? 'ऑनलाइन · 24x7 किसान सेवा' : 'Online · 24x7 Farmer Assistant'}
                </span>
              </div>
            </div>

            <div className="wa-header-actions">
              <button
                type="button"
                className="wa-icon-btn"
                onClick={handleResetChat}
                title={isHindi ? 'बातचीत रीसेट करें' : 'Reset chat'}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                className="wa-icon-btn"
                onClick={onClose}
                aria-label="Close WhatsApp chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="wa-chat-body">
            <div className="wa-encryption-badge">
              <span>🔒 {isHindi ? 'संदेश एंड-टू-एंड एन्क्रिप्टेड हैं' : 'Messages are end-to-end encrypted'}</span>
            </div>

            {messages.map((m) => (
              <div key={m.id} className={`wa-bubble-wrapper ${m.sender === 'user' ? 'is-user' : 'is-bot'}`}>
                <div className="wa-bubble">
                  <div className="wa-bubble-text">{m.text}</div>

                  {m.actionLink && (
                    <button
                      type="button"
                      className="wa-action-btn"
                      onClick={() => {
                        onClose()
                        navigate(m.actionLink!.url)
                      }}
                    >
                      <span>{m.actionLink.label}</span>
                      <ArrowUpRight size={14} />
                    </button>
                  )}

                  <div className="wa-bubble-footer">
                    <span className="wa-time">{m.time}</span>
                    {m.sender === 'user' && (
                      <CheckCheck size={14} className="wa-blue-ticks" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="wa-bubble-wrapper is-bot">
                <div className="wa-bubble wa-typing-bubble">
                  <span className="wa-dot" />
                  <span className="wa-dot" />
                  <span className="wa-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="wa-chips-row">
            {promptOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="wa-chip"
                onClick={() => handleSendPrompt(opt.label)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* WhatsApp Message Input */}
          <form
            className="wa-input-bar"
            onSubmit={(e) => {
              e.preventDefault()
              if (inputText.trim()) {
                handleSendPrompt(inputText.trim(), inputText.trim())
              }
            }}
          >
            <input
              type="text"
              className="wa-input-field"
              placeholder={
                isHindi
                  ? 'संदेश लिखें (उदा. मंडी कब आऊं? या पास दिखाएं)...'
                  : 'Type message (e.g. mandi status, digital pass)...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className="wa-send-btn"
              disabled={!inputText.trim()}
              aria-label="Send WhatsApp message"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
