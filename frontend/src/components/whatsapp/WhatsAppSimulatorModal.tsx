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

    setTimeout(() => {
      let botReply = ''
      let actionLink: { label: string; url: string } | undefined

      const query = (customQuery || promptText).toLowerCase()

      if (
        query.includes('status') ||
        query.includes('स्थिति') ||
        query.includes('mandi') ||
        query.includes('eta') ||
        query.includes('कतार')
      ) {
        const liveInfo = getFarmerPositionAndEta(farmer?.phone ? 42 : 'farmer-001')
        botReply = isHindi
          ? `📊 **राजगढ़ उपार्जन केंद्र - लाइव रिपोर्ट:**\n• स्थिति: **${condition.status === 'NORMAL' ? 'सामान्य रूप से चालू' : condition.status === 'BUSY' ? 'आज व्यस्त' : 'प्रक्रिया धीमी'}**\n• सक्रिय कांटे: **${condition.activeCounters} काउंटर**\n• अनुमानित प्रतीक्षा: **${liveInfo.etaMinutes ? `~${liveInfo.etaMinutes} मिनट` : '15-20 मिनट'}**\n• अधिकारी नोट: "${condition.note}"`
          : `📊 **Rajgarh Procurement Centre - Live Status:**\n• Condition: **${condition.status}**\n• Active Weighing Counters: **${condition.activeCounters}**\n• Estimated Queue Wait: **~${liveInfo.etaMinutes ?? 25} mins**\n• Mandi Note: "${condition.note}"`
        actionLink = {
          label: isHindi ? 'लाइव कतार पृष्ठ खोलें' : 'Open Live Queue Tracker',
          url: '/queue',
        }
      } else if (
        query.includes('pass') ||
        query.includes('पास') ||
        query.includes('qr') ||
        query.includes('slot') ||
        query.includes('टोकन')
      ) {
        botReply = isHindi
          ? `🎫 **आपका डिजिटल किसान पास:**\n• पास कोड: **KQ-PASS-7729**\n• किसान: **${farmerName}**\n• फसल: **गेहूं (Wheat) - 40 क्विंटल**\n• स्लॉट समय: **आज सुबह 09:00 AM**\n• गेट चेक-इन पर यह क्यूआर दिखाएं।`
          : `🎫 **Your Digital Kisan Pass:**\n• Pass Code: **KQ-PASS-7729**\n• Farmer: **${farmerName}**\n• Crop: **Wheat - 40 Quintals**\n• Slot Time: **Today 09:00 AM**\n• Present this QR code at Gate 1.`
        actionLink = {
          label: isHindi ? 'डिजिटल पास (QR) देखें' : 'View Digital QR Pass',
          url: '/pass/PASS-7729',
        }
      } else if (
        query.includes('msp') ||
        query.includes('भाव') ||
        query.includes('payment') ||
        query.includes('भुगतान') ||
        query.includes('dbt') ||
        query.includes('रुपये')
      ) {
        botReply = isHindi
          ? `💰 **एमएसपी दरें व डीबीटी भुगतान स्थिति:**\n• गेहूं (Wheat): **₹2,275/क्विंटल**\n• सोयाबीन (Soybean): **₹4,600/क्विंटल**\n• धान (Paddy): **₹2,183/क्विंटल**\n• तौल के बाद भुगतान 48 घंटों में सीधे आपके आधार-लिंक्ड बैंक खाते (DBT) में क्रेडिट होता है।`
          : `💰 **Government MSP Rates & DBT Status:**\n• Wheat: **₹2,275 / Quintal**\n• Soybean: **₹4,600 / Quintal**\n• Paddy: **₹2,183 / Quintal**\n• Payments are credited directly via PFMS/DBT to your bank account within 48 hours of weighment.`
        actionLink = {
          label: isHindi ? 'उपार्जन रसीद व भुगतान स्थिति देखें' : 'View Receipt & DBT Tracker',
          url: '/procurement/rec-39',
        }
      } else {
        botReply = isHindi
          ? `🚜 **मंडी गेट चेक-इन सहायता:**\nउपार्जन केंद्र आते समय निम्नलिखित दस्तावेज़ साथ लाएं:\n1. किसान ऋण पुस्तिका / खसरा नकल\n2. आधार कार्ड व बैंक पासबुक\n3. वाहन (ट्रैक्टर/ट्रॉली) पंजीयन\n4. किसानक्यू डिजिटल पास (क्यूआर कोड)`
          : `🚜 **Mandi Gate Check-in Assistance:**\nPlease ensure you carry the following documents:\n1. Land Record / Khasra document\n2. Aadhaar Card & Bank Passbook\n3. Tractor/Trolley registration\n4. KisanQueue Digital Pass QR.`
      }

      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${msgIdCounter++}`,
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionLink,
        },
      ])
    }, 600)
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
