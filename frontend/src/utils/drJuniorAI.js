/**
 * Dr. Junior Clinical Knowledge Base & NLP Response Engine
 * Provides instant, zero-latency, reliable intelligent assistance
 * regarding Adyapan Hospital services, OPD suites, doctors, and triage.
 */

export const QUICK_SUGGESTIONS = [
  {
    label: '🕒 OPD Timings',
    query: 'What are the OPD consultation timings and days?',
  },
  {
    label: '🎫 Track Token',
    query: 'How do I track my queue token status live?',
  },
  {
    label: '👶 Pediatrician & Room',
    query: 'Who is the pediatrician and which room is he in?',
  },
  {
    label: '🚨 Emergency Helpline',
    query: 'What is the emergency helpline number?',
  },
  {
    label: '❤️ Heart Specialist',
    query: 'Who is the cardiology doctor and how do I consult?',
  },
  {
    label: '💊 Pharmacy & Prescriptions',
    query: 'Where is the hospital pharmacy located?',
  },
];

export const HOSPITAL_DATA = {
  name: 'Adyapan Multi-Specialty Hospital',
  location: 'Shaikpet, Hyderabad, Telangana, India',
  emergency: '+91 (800) 425-9999',
  emergencyAlt: '108',
  opdTimings: '8:00 AM - 8:00 PM (Monday to Saturday)',
  doctors: [
    {
      name: 'Dr. Rajesh Sharma',
      dept: 'General Medicine',
      room: 'Room 101',
      code: 'GEN',
      degree: 'MD, Internal Medicine (AIIMS)',
      days: 'Mon - Sat (8:00 AM - 4:00 PM)',
      specialty: 'Primary care, hypertension, fever, diabetes & adult chronic illness',
    },
    {
      name: 'Dr. Priya Patel',
      dept: 'Cardiovascular Sciences',
      room: 'Room 102',
      code: 'CARD',
      degree: 'DM, FACC (Cardiology)',
      days: 'Mon - Sat (9:00 AM - 5:00 PM)',
      specialty: 'Advanced echo, ECG analysis, arrhythmia, hypertension & post-stent cardiac health',
    },
    {
      name: 'Dr. Vikram Rao',
      dept: 'Pediatrics & Child Health',
      room: 'Room 103',
      code: 'PED',
      degree: 'MD, DCH (Pediatrics)',
      days: 'Mon - Sat (8:30 AM - 6:00 PM)',
      specialty: 'Neonatal checks, child growth, pediatric fever, vaccinations & adolescent care',
    },
    {
      name: 'Dr. Suresh Menon',
      dept: 'Orthopedics & Joint Surgery',
      room: 'Room 104',
      code: 'ORTH',
      degree: 'MS Ortho, MCh (Joint Replacements)',
      days: 'Mon, Wed, Fri (9:00 AM - 3:00 PM)',
      specialty: 'Joint pain, fractures, spine alignment, sports injury rehabilitation & arthroscopy',
    },
    {
      name: 'Dr. Neha Kapoor',
      dept: 'Advanced Dental Care',
      room: 'Room 105',
      code: 'DENT',
      degree: 'MDS, Oral Maxillofacial Specialist',
      days: 'Tue, Thu, Sat (10:00 AM - 6:00 PM)',
      specialty: 'Painless root canals, dental implants, orthodontic alignment & cosmetic dentistry',
    },
    {
      name: 'Dr. Arvind Joshi',
      dept: 'Neurosciences & Brain Health',
      room: 'Room 106',
      code: 'NEU',
      degree: 'DM Neurology, Stroke Fellowship',
      days: 'Mon - Fri (10:00 AM - 5:00 PM)',
      specialty: 'Comprehensive stroke care, epilepsy, migraines, neuropathy & cognitive diagnostics',
    },
  ],
};

/**
 * Intelligent natural language response generator
 * Matches user intent and formulates a warm, Pixar-doctor style response.
 */
export function generateDrJuniorResponse(rawInput) {
  const query = (rawInput || '').toLowerCase().trim();

  // 1. Emergency & Trauma Helpline
  if (
    query.includes('emergency') ||
    query.includes('helpline') ||
    query.includes('ambulance') ||
    query.includes('trauma') ||
    query.includes('phone') ||
    query.includes('call') ||
    query.includes('accident') ||
    query.includes('critical')
  ) {
    return {
      text: `🚨 **24/7 Trauma Emergency Unit is Open!**\n\nFor immediate emergency assistance, call our dedicated hospital hotline:\n\n📞 **+91 (800) 425-9999** (Toll-Free, 24/7)\n🚑 **Ambulance Dispatch**: 4 standby mobile ICUs ready in Hyderabad.\n\nEmergency walk-ins do not require tokens — proceed straight to the Red Triage Desk at Ground Floor Entrance!`,
      action: { type: 'link', label: 'Call Emergency: +91 800 425-9999', url: 'tel:+918004259999' },
    };
  }

  // 2. OPD Timings & Working Hours
  if (
    query.includes('timing') ||
    query.includes('time') ||
    query.includes('hours') ||
    query.includes('open') ||
    query.includes('sunday') ||
    query.includes('schedule')
  ) {
    return {
      text: `🕒 **Adyapan Hospital Timings:**\n\n• **OPD Consultation:** 8:00 AM – 8:00 PM (Monday to Saturday)\n• **Trauma & Emergency ICU:** 24 Hours, 7 Days a week (Round-the-clock)\n• **In-House Pharmacy:** 24/7 Dispensary on Ground Floor\n• **Diagnostic Labs & Radiology:** 7:00 AM – 9:00 PM daily\n\n*Tip: Sunday OPD is reserved for emergency walk-ins and priority appointments.*`,
    };
  }

  // 3. Token Tracking & Queue Status
  if (
    query.includes('token') ||
    query.includes('track') ||
    query.includes('queue') ||
    query.includes('status') ||
    query.includes('wait') ||
    query.includes('turn')
  ) {
    return {
      text: `🎫 **Tracking Your Live OPD Token:**\n\n1. Scroll down to the **"Track Your Live OPD Token Status"** section on this homepage (or click the button below).\n2. Enter your **Token #** (e.g. \`GEN-001\`, \`CARD-102\`, or simple number \`1\`).\n3. Instantly see how many patients are ahead of you, your estimated wait time, and your assigned doctor's room!\n\n📺 You can also check the **Live TV Screen** broadcast in the central waiting hall.`,
      action: { type: 'scroll', label: 'Go to Token Tracker', targetId: 'token-tracker' },
    };
  }

  // 4. Pediatrics & Child Health (Dr. Junior's specialty!)
  if (
    query.includes('pediatric') ||
    query.includes('child') ||
    query.includes('baby') ||
    query.includes('kid') ||
    query.includes('infant') ||
    query.includes('vaccin') ||
    query.includes('vikram')
  ) {
    return {
      text: `👶 **Pediatrics & Child Health Suite:**\n\n• **Specialist:** **Dr. Vikram Rao** (MD, DCH Pediatrics)\n• **Chamber:** **Room 103** (Pediatric Wing, 1st Floor)\n• **OPD Hours:** Mon - Sat, 8:30 AM – 6:00 PM\n• **Key Services:** Neonatal monitoring, growth assessments, child immunization, pediatric fevers, and asthma care.\n\n*Dr. Junior's tip: Our pediatric chamber has a child-friendly play zone and complimentary distraction toys!* 🧸🩺`,
      action: { type: 'scroll', label: 'View Room 103 Info', targetId: 'specialties' },
    };
  }

  // 5. Cardiology & Heart Sciences
  if (
    query.includes('cardio') ||
    query.includes('heart') ||
    query.includes('chest') ||
    query.includes('ecg') ||
    query.includes('priya') ||
    query.includes('bp') ||
    query.includes('pressure')
  ) {
    return {
      text: `❤️ **Cardiovascular Sciences Department:**\n\n• **Chief Cardiologist:** **Dr. Priya Patel** (DM, FACC)\n• **Chamber:** **Room 102**\n• **Timings:** Monday – Saturday, 9:00 AM – 5:00 PM\n• **Services:** Echocardiography, digital telemetry, ECG wave rhythm mapping, post-stent management, and hypertension triage.\n\n*If you are experiencing sudden severe chest tightness or pain, please dial +91 800 425-9999 immediately!*`,
    };
  }

  // 6. General Medicine
  if (
    query.includes('general') ||
    query.includes('rajesh') ||
    query.includes('fever') ||
    query.includes('cold') ||
    query.includes('cough') ||
    query.includes('headache') ||
    query.includes('physician')
  ) {
    return {
      text: `🩺 **General Medicine & Adult Care:**\n\n• **Senior Consultant:** **Dr. Rajesh Sharma** (MD, Internal Medicine - AIIMS)\n• **Chamber:** **Room 101**\n• **Timings:** Monday – Saturday, 8:00 AM – 4:00 PM\n• **Scope:** General wellness checks, persistent fever, infectious illnesses, hypertension & diabetic lifestyle management.`,
    };
  }

  // 7. Orthopedics & Joints
  if (
    query.includes('ortho') ||
    query.includes('bone') ||
    query.includes('joint') ||
    query.includes('fracture') ||
    query.includes('knee') ||
    query.includes('menon') ||
    query.includes('spine')
  ) {
    return {
      text: `🦴 **Orthopedics & Joint Surgery:**\n\n• **Specialist:** **Dr. Suresh Menon** (MS Ortho, MCh Joint Replacements)\n• **Chamber:** **Room 104**\n• **Timings:** Mon, Wed, Fri (9:00 AM – 3:00 PM)\n• **Treatments:** Knee & hip arthroplasty, fracture trauma, spine alignment, sports injury rehabilitation, and arthroscopy.`,
    };
  }

  // 8. Dental Care
  if (
    query.includes('dental') ||
    query.includes('tooth') ||
    query.includes('teeth') ||
    query.includes('gum') ||
    query.includes('kapoor') ||
    query.includes('dentist')
  ) {
    return {
      text: `😁 **Advanced Dental Care Suite:**\n\n• **Oral Specialist:** **Dr. Neha Kapoor** (MDS, Oral Maxillofacial)\n• **Chamber:** **Room 105**\n• **Timings:** Tue, Thu, Sat (10:00 AM – 6:00 PM)\n• **Services:** Painless root canals, dental implants, cosmetic smile restoration, and orthodontic braces.`,
    };
  }

  // 9. Neurology & Brain
  if (
    query.includes('neuro') ||
    query.includes('brain') ||
    query.includes('stroke') ||
    query.includes('joshi') ||
    query.includes('migraine') ||
    query.includes('seizure') ||
    query.includes('numb')
  ) {
    return {
      text: `🧠 **Neurosciences & Brain Health:**\n\n• **Neurologist:** **Dr. Arvind Joshi** (DM Neurology, Stroke Fellowship)\n• **Chamber:** **Room 106**\n• **Timings:** Monday – Friday, 10:00 AM – 5:00 PM\n• **Expertise:** Stroke prevention, epilepsy clinic, chronic migraines, neuropathy, and cognitive diagnostic mapping.`,
    };
  }

  // 10. Pharmacy & Medication
  if (
    query.includes('pharmacy') ||
    query.includes('medicine') ||
    query.includes('prescription') ||
    query.includes('drug') ||
    query.includes('fefo') ||
    query.includes('pill')
  ) {
    return {
      text: `💊 **Smart Hospital Pharmacy Dispensary:**\n\n• **Location:** Ground Floor, right adjacent to OPD Room 101.\n• **Operation:** **Open 24/7** for inpatients, emergency cases, and outpatient pickups.\n• **Smart FEFO Technology:** All dispensations are automated with First-Expiry-First-Out batch tracking and counterfeit-free verified barcodes.\n• E-prescriptions sent by our doctors reflect instantly at the counter!`,
    };
  }

  // 11. Location & Hospital Address
  if (
    query.includes('location') ||
    query.includes('address') ||
    query.includes('where is') ||
    query.includes('reach') ||
    query.includes('hyderabad')
  ) {
    return {
      text: `📍 **Adyapan Hospital Address:**\n\nMain Campus: **Shaikpet, Hyderabad, Telangana, India**\n• Nearest Landmark: Beside Shaikpet Central Junction\n• Free Valet & Patient Parking Available (Basement 1 & 2)\n• 24/7 Ambulance Bay at East Gate\n\nNeed transport guidance? Call our helpline: **+91 (800) 425-9999**!`,
    };
  }

  // 12. Friendly Greetings
  if (
    query.includes('hello') ||
    query.includes('hi') ||
    query.includes('hey') ||
    query.includes('good morning') ||
    query.includes('good evening') ||
    query.includes('who are you')
  ) {
    return {
      text: `👋 **Hello! I'm Dr. Junior!** 🩺\n\nI am your friendly AI hospital assistant at Adyapan Hospital. I can help you with:\n\n• Finding doctor chambers and schedules (Rooms 101 – 106)\n• Checking OPD consultation hours\n• Tracking your queue token in real-time\n• Emergency trauma assistance (+91 800 425-9999)\n• Pharmacy and medical records guidance\n\nWhat can I look up for you today?`,
    };
  }

  // 13. Doctors General List
  if (
    query.includes('doctor') ||
    query.includes('specialist') ||
    query.includes('consultant') ||
    query.includes('list')
  ) {
    return {
      text: `👨‍⚕️ **Active OPD Specialist Consultants Today:**\n\n1. **Room 101 (GEN):** Dr. Rajesh Sharma — General Medicine\n2. **Room 102 (CARD):** Dr. Priya Patel — Cardiology\n3. **Room 103 (PED):** Dr. Vikram Rao — Pediatrics & Child Health\n4. **Room 104 (ORTH):** Dr. Suresh Menon — Orthopedics & Joints\n5. **Room 105 (DENT):** Dr. Neha Kapoor — Advanced Dental\n6. **Room 106 (NEU):** Dr. Arvind Joshi — Neurosciences\n\nTap any doctor card on the homepage to view detailed qualifications and tokens!`,
      action: { type: 'scroll', label: 'View All Specialists', targetId: 'doctors' },
    };
  }

  // 14. Smart Fallback for any other health question
  return {
    text: `🩺 **Dr. Junior's Medical Note:**\n\nI understand you are asking about: *"_**${rawInput}**_"\n\nAt Adyapan Hospital, our certified medical specialists are available across 6 OPD suites (Rooms 101 to 106) between **8:00 AM and 8:00 PM** to examine your symptoms and provide personalized diagnosis.\n\n• Would you like me to connect you with **General Medicine (Room 101)**, or check live queue tokens?\n• For urgent symptoms, our **24/7 Emergency Trauma Unit** is always open at **+91 (800) 425-9999**.`,
  };
}
