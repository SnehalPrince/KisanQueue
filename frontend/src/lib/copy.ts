import type { CentreStatus, Language } from '../types/centre'

export type { Language }

/**
 * Shape interface for bilingual copy map.
 * All fields are typed as `string` to support English and Hindi assignability.
 * Applied per TypeScript skill.
 */
export interface CopyMap {
  // Brand & Nav
  brand: string
  navCentres: string
  navHow: string
  profile: string
  live: string
  eyebrow: string
  heading: string
  intro: string
  explore: string
  profileHint: string
  proofTitle: string
  proofBody: string
  preview: string
  previewNote: string
  status: string
  queue: string
  updated: string
  estimatedWait: string
  confidence: string
  counters: string
  details: string
  normal: string
  busy: string
  delayed: string
  paused: string
  high: string
  medium: string
  low: string
  na: string
  pausedEta: string
  joinSignIn: string
  howTitle: string
  howText: string
  statOne: string
  statTwo: string
  statThree: string
  modalTitle: string
  close: string
  source: string
  toastTitle: string
  toastDescription: string
  scroll: string
  min: string

  // Onboarding Wizard Strings
  onboardingTitle: string
  onboardingSubtitle: string
  stepPhone: string
  stepProfile: string
  stepPrefs: string
  stepOf: string
  phoneLabel: string
  phonePlaceholder: string
  demoAutofill: string
  sendOtp: string
  sendingOtp: string
  otpLabel: string
  demoOtpHint: string
  verifyOtp: string
  verifyingOtp: string
  resendOtp: string
  resendIn: string
  nameLabel: string
  namePlaceholder: string
  villageLabel: string
  villagePlaceholder: string
  districtLabel: string
  districtPlaceholder: string
  aadhaarLabel: string
  aadhaarPlaceholder: string
  cropLabel: string
  cropWheat: string
  cropSoybean: string
  cropPaddy: string
  cropBarley: string
  nextStep: string
  backStep: string
  preferredLangTitle: string
  langHindiName: string
  langHindiDesc: string
  langEngName: string
  langEngDesc: string
  whatsappToggleTitle: string
  whatsappToggleDesc: string
  completeOnboarding: string
  savingProfile: string
  successTitle: string
  successDesc: string
  goToHome: string
  goToCentres: string
  errPhoneRequired: string
  errOtpRequired: string
  errNameRequired: string
  errVillageRequired: string
  errDistrictRequired: string
}

/** English copy */
const en: CopyMap = {
  brand: 'KisanQueue',
  navCentres: 'Centre conditions',
  navHow: 'How it works',
  profile: 'Set up profile',
  live: 'Live operational preview',
  eyebrow: 'Procurement, before the journey',
  heading: 'Know the mandi situation before you leave home.',
  intro:
    'KisanQueue makes the queue, capacity, and real wait visible—so a valid slot does not become a day lost at the gate.',
  explore: 'See nearby centre conditions',
  profileHint: 'One-time profile. No repeated forms.',
  proofTitle: 'A clear signal, before a long trip.',
  proofBody: 'Officer updates become understandable status and wait estimates for farmers.',
  preview: 'Nearby centre preview',
  previewNote:
    'Sample public view · Sign in for your personal recommendations and queue actions.',
  status: 'Centre status',
  queue: 'Farmers waiting',
  updated: 'Updated',
  estimatedWait: 'Estimated wait',
  confidence: 'Estimate quality',
  counters: 'Active counters',
  details: 'View status details',
  normal: 'Operating normally',
  busy: 'Busy today',
  delayed: 'Lifting delayed',
  paused: 'Operations paused',
  high: 'Good estimate',
  medium: 'Approximate estimate',
  low: 'Rough estimate',
  na: 'ETA unavailable',
  pausedEta: 'No ETA while paused',
  joinSignIn: 'Sign in to continue',
  howTitle: 'Honest operational visibility',
  howText:
    'A centre officer can report a capacity change in two taps. KisanQueue recalculates the estimate and explains what changed—without pretending it is a promise.',
  statOne: 'one-time profile',
  statTwo: 'capacity-aware ETA',
  statThree: 'bilingual access',
  modalTitle: 'Centre condition',
  close: 'Close',
  source: 'Demo data · officer-reported status is simulated for this preview.',
  toastTitle: 'Profile setup comes next',
  toastDescription:
    'This first slice is focused on centre discovery. Phone verification will be available on the next page.',
  scroll: 'Scroll to explore',
  min: 'min',

  // Onboarding Wizard Strings
  onboardingTitle: 'Farmer Profile Setup',
  onboardingSubtitle: 'One-time registration for seamless mandi access',
  stepPhone: 'Mobile & OTP',
  stepProfile: 'Farmer Details',
  stepPrefs: 'Language & WhatsApp',
  stepOf: 'Step',
  phoneLabel: 'Mobile Number',
  phonePlaceholder: 'Enter 10-digit number',
  demoAutofill: 'Demo Login (Ramesh Kumar)',
  sendOtp: 'Send OTP',
  sendingOtp: 'Sending OTP...',
  otpLabel: 'Enter 4-digit verification code',
  demoOtpHint: 'Demo code is 1234',
  verifyOtp: 'Verify & Continue',
  verifyingOtp: 'Verifying...',
  resendOtp: 'Resend OTP',
  resendIn: 'Resend code in',
  nameLabel: 'Full Name',
  namePlaceholder: 'e.g. Ramesh Kumar',
  villageLabel: 'Village / Town',
  villagePlaceholder: 'e.g. Biaora',
  districtLabel: 'District',
  districtPlaceholder: 'Select District',
  aadhaarLabel: 'Aadhaar Last 4 Digits (Optional)',
  aadhaarPlaceholder: 'e.g. 4521',
  cropLabel: 'Primary Crop for Sale',
  cropWheat: 'Wheat',
  cropSoybean: 'Soybean',
  cropPaddy: 'Paddy',
  cropBarley: 'Barley',
  nextStep: 'Next Step',
  backStep: 'Back',
  preferredLangTitle: 'Choose Preferred Language',
  langHindiName: 'हिंदी (Hindi)',
  langHindiDesc: 'Default for voice alerts, WhatsApp & updates',
  langEngName: 'English',
  langEngDesc: 'Technical & administrative display',
  whatsappToggleTitle: 'Receive Digital Passes on WhatsApp',
  whatsappToggleDesc: 'Instant digital QR pass, delay notifications & token status',
  completeOnboarding: 'Complete Profile Setup',
  savingProfile: 'Saving Profile...',
  successTitle: 'Profile Successfully Linked!',
  successDesc:
    'You will never need to fill identity forms again. Welcome to KisanQueue.',
  goToHome: 'Go to Mandi Dashboard',
  goToCentres: 'Explore Nearby Mandis',
  errPhoneRequired: 'Please enter a valid 10-digit mobile number',
  errOtpRequired: 'Please enter the complete 4-digit code',
  errNameRequired: 'Please enter your full name',
  errVillageRequired: 'Please enter your village name',
  errDistrictRequired: 'Please select your district',
}

/** Hindi copy */
const hi: CopyMap = {
  brand: 'किसानक्यू',
  navCentres: 'केंद्र की स्थिति',
  navHow: 'यह कैसे काम करता है',
  profile: 'प्रोफ़ाइल बनाएं',
  live: 'लाइव स्थिति का पूर्वावलोकन',
  eyebrow: 'यात्रा से पहले खरीद की जानकारी',
  heading: 'घर से निकलने से पहले मंडी की स्थिति जानें।',
  intro:
    'किसानक्यू कतार, क्षमता और अनुमानित प्रतीक्षा को साफ़ दिखाता है—ताकि वैध स्लॉट का मतलब गेट पर पूरा दिन न हो।',
  explore: 'नज़दीकी केंद्रों की स्थिति देखें',
  profileHint: 'प्रोफ़ाइल सिर्फ़ एक बार। बार-बार फॉर्म नहीं।',
  proofTitle: 'लंबी यात्रा से पहले, साफ़ जानकारी।',
  proofBody:
    'अधिकारी के अपडेट किसानों के लिए समझने योग्य स्थिति और समय अनुमान बन जाते हैं।',
  preview: 'नज़दीकी केंद्रों का पूर्वावलोकन',
  previewNote:
    'सार्वजनिक नमूना दृश्य · व्यक्तिगत सुझाव और कतार के लिए साइन इन करें।',
  status: 'केंद्र की स्थिति',
  queue: 'प्रतीक्षारत किसान',
  updated: 'अपडेट',
  estimatedWait: 'अनुमानित प्रतीक्षा',
  confidence: 'अनुमान की विश्वसनीयता',
  counters: 'सक्रिय काउंटर',
  details: 'स्थिति का विवरण देखें',
  normal: 'सामान्य रूप से चल रहा है',
  busy: 'आज व्यस्त है',
  delayed: 'उठान में देरी',
  paused: 'कामकाज बंद है',
  high: 'सटीक अनुमान',
  medium: 'अनुमानित समय',
  low: 'लगभग अनुमान',
  na: 'समय उपलब्ध नहीं',
  pausedEta: 'बंद होने पर समय उपलब्ध नहीं',
  joinSignIn: 'आगे बढ़ने के लिए साइन इन करें',
  howTitle: 'साफ़ संचालन जानकारी',
  howText:
    'केंद्र अधिकारी दो टैप में क्षमता बदल सकते हैं। किसानक्यू अनुमान को फिर से गिनता है और बदलाव समझाता है—इसे कोई पक्का वादा नहीं बताता।',
  statOne: 'एक बार प्रोफ़ाइल',
  statTwo: 'क्षमता आधारित अनुमान',
  statThree: 'दो भाषाओं में',
  modalTitle: 'केंद्र की स्थिति',
  close: 'बंद करें',
  source: 'डेमो डेटा · इस पूर्वावलोकन में अधिकारी की स्थिति नकली है।',
  toastTitle: 'प्रोफ़ाइल सेटअप अगला चरण है',
  toastDescription:
    'यह पहला चरण केंद्र खोजने पर केंद्रित है। फोन सत्यापन अगले पेज में उपलब्ध होगा।',
  scroll: 'देखने के लिए स्क्रॉल करें',
  min: 'मिनट',

  // Onboarding Wizard Strings (Hindi)
  onboardingTitle: 'किसान प्रोफ़ाइल सेटअप',
  onboardingSubtitle: 'मंडी में बिना रुकावट पहुंच के लिए एक बार पंजीकरण',
  stepPhone: 'मोबाइल और ओटीपी',
  stepProfile: 'किसान विवरण',
  stepPrefs: 'भाषा और व्हाट्सएप',
  stepOf: 'चरण',
  phoneLabel: 'मोबाइल नंबर',
  phonePlaceholder: '10 अंकों का मोबाइल नंबर दर्ज करें',
  demoAutofill: 'डेमो लॉगिन (रमेश कुमार)',
  sendOtp: 'ओटीपी भेजें',
  sendingOtp: 'ओटीपी भेजा जा रहा है...',
  otpLabel: '4 अंकों का सत्यापन कोड दर्ज करें',
  demoOtpHint: 'डेमो कोड 1234 है',
  verifyOtp: 'सत्यापित करें और आगे बढ़ें',
  verifyingOtp: 'सत्यापन हो रहा है...',
  resendOtp: 'ओटीपी पुनः भेजें',
  resendIn: 'पुनः कोड भेजें',
  nameLabel: 'पूरा नाम',
  namePlaceholder: 'उदा. रमेश कुमार',
  villageLabel: 'गांव / कस्बा',
  villagePlaceholder: 'उदा. ब्यावरा',
  districtLabel: 'जिला',
  districtPlaceholder: 'जिला चुनें',
  aadhaarLabel: 'आधार के अंतिम 4 अंक (वैकल्पिक)',
  aadhaarPlaceholder: 'उदा. 4521',
  cropLabel: 'बिक्री के लिए मुख्य फसल',
  cropWheat: 'गेहूं (Wheat)',
  cropSoybean: 'सोयाबीन (Soybean)',
  cropPaddy: 'धान (Paddy)',
  cropBarley: 'जौ (Barley)',
  nextStep: 'अगला चरण',
  backStep: 'पीछे',
  preferredLangTitle: 'पसंदीदा भाषा चुनें',
  langHindiName: 'हिंदी (Hindi)',
  langHindiDesc: 'सभी अपडेट, वॉयस और व्हाट्सएप संदेशों के लिए',
  langEngName: 'English (अंग्रेज़ी)',
  langEngDesc: 'तकनीकी और प्रशासनिक विवरण के लिए',
  whatsappToggleTitle: 'व्हाट्सएप पर डिजिटल पास और अपडेट प्राप्त करें',
  whatsappToggleDesc: 'डिजिटल क्यूआर पास, देरी की सूचना और टोकन स्थिति सीधे व्हाट्सएप पर',
  completeOnboarding: 'प्रोफ़ाइल पूरी करें',
  savingProfile: 'सहेजा जा रहा है...',
  successTitle: 'प्रोफ़ाइल सफलतापूर्वक जुड़ गई!',
  successDesc:
    'आपको दोबारा कभी पहचान फॉर्म भरने की आवश्यकता नहीं होगी। किसानक्यू में आपका स्वागत है।',
  goToHome: 'मंडी डैशबोर्ड पर जाएं',
  goToCentres: 'नज़दीकी मंडियां देखें',
  errPhoneRequired: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें',
  errOtpRequired: 'कृपया पूरा 4 अंकों का कोड दर्ज करें',
  errNameRequired: 'कृपया अपना पूरा नाम दर्ज करें',
  errVillageRequired: 'कृपया अपने गांव का नाम दर्ज करें',
  errDistrictRequired: 'कृपया अपना जिला चुनें',
}

export const copy: Record<Language, CopyMap> = { en, hi }

export const statusKey: Record<CentreStatus, 'normal' | 'busy' | 'delayed' | 'paused'> = {
  NORMAL: 'normal',
  BUSY: 'busy',
  LIFTING_DELAYED: 'delayed',
  PAUSED: 'paused',
}
