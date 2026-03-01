/* AI Health Companion — pure HTML/CSS/JS (mobile-first 375px) */

const STORAGE = {
  language: 'ahc_language',
  role: 'ahc_role',
  booking: 'ahc_booking',
  chat: 'ahc_chat',
};

// --- Google Analytics Configuration ---
const GA_MEASUREMENT_ID = 'G-Y0W9J2PW3H';

// Google Analytics UTM Parameter Tracking
function trackUTMParameters() {
  if (typeof gtag === 'undefined') return;
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Extract UTM parameters
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmTerm = urlParams.get('utm_term');
  const utmContent = urlParams.get('utm_content');
  
  // Track UTM parameters in Google Analytics if they exist
  if (utmSource || utmMedium || utmCampaign) {
    gtag('event', 'page_view', {
      'utm_source': utmSource || '',
      'utm_medium': utmMedium || '',
      'utm_campaign': utmCampaign || '',
      'utm_term': utmTerm || '',
      'utm_content': utmContent || ''
    });
    
    // Store in sessionStorage for later use
    if (utmSource) sessionStorage.setItem('utm_source', utmSource);
    if (utmMedium) sessionStorage.setItem('utm_medium', utmMedium);
    if (utmCampaign) sessionStorage.setItem('utm_campaign', utmCampaign);
  }
}

// Track custom events in Google Analytics
function trackEvent(eventName, eventCategory, eventLabel, eventValue) {
  if (typeof gtag === 'undefined') return;
  
  gtag('event', eventName, {
    'event_category': eventCategory || 'User Interaction',
    'event_label': eventLabel || '',
    'value': eventValue || 0
  });
}

// --- Supabase configuration ---
// TODO: Paste your own Supabase values here (from supabase-credentials.txt)
const SUPABASE_URL = 'https://fnudwfyposaypzkmoppk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZudWR3Znlwb3NheXB6a21vcHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDQyODksImV4cCI6MjA4NDcyMDI4OX0.uLs20gK9ASQalEj_86tTs2ysyd5uae2v8Yeqjr9UwWo';

// --- n8n Webhook Configuration ---
// TODO: Paste your n8n webhook URL here (from N8N_MULTILINGUAL_CHAT_SETUP.md Step 3.3)
// Example: 'https://your-username.app.n8n.cloud/webhook/ai-health-chat'
const N8N_WEBHOOK_URL = 'https://ai-health-companion.app.n8n.cloud/webhook/ai-health-chat'; // Leave empty to use mock responses, or paste your n8n URL here

let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL.startsWith('http')) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ta', label: 'Tamil' },
  { code: 'mr', label: 'Marathi' },
];


// Keep original constants for backward compatibility (will be replaced with getMockData() calls)
const DOCTORS = [
  { name: 'Dr. Aisha Menon', specialty: 'Cardiologist', clinic: 'Green Valley Clinic', city: 'Bengaluru', rating: 4.7, nextSlot: 'Today • 7:00 PM' },
  { name: 'Dr. Kabir Sharma', specialty: 'General Physician', clinic: 'City Health Hub', city: 'Mumbai', rating: 4.8, nextSlot: 'Today • 6:30 PM' },
  { name: 'Dr. Meera Iyer', specialty: 'Dermatologist', clinic: 'Skin Renew', city: 'Hyderabad', rating: 4.6, nextSlot: 'Today • 5:30 PM' },
];

const PATIENT = { name: 'Aarav Patel', age: '29', city: 'Bengaluru', conditions: 'Hypertension' };
const DOCTOR_PROFILE = { name: 'Dr. Kavya Rao', specialty: 'Family Medicine', clinic: 'Community Care', city: 'Hyderabad' };
const PATIENTS = [
  { name: 'Aarav Patel', age: '29', city: 'Bengaluru', conditions: 'Fever, Sore throat' },
  { name: 'Isha Nair', age: '34', city: 'Hyderabad', conditions: 'Dermatitis' },
  { name: 'Rohan Kulkarni', age: '40', city: 'Mumbai', conditions: 'Diabetes follow-up' },
];

const UPCOMING = [
  { doctorName: 'Dr. Kabir Sharma', specialty: 'General Physician', date: 'Today', time: '6:00 PM', status: 'Scheduled' },
  { doctorName: 'Dr. Aisha Menon', specialty: 'Cardiologist', date: 'Jan 25', time: '11:30 AM', status: 'Completed' },
];

// Simple helper to test Supabase connection from UI
async function testSupabaseConnection() {
  if (!supabaseClient) {
    toast('Supabase not configured yet. Please paste your URL and anon key in script.js');
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from('doctor_profiles')
      .select('full_name,specialty,city')
      .limit(1);

    if (error) {
      console.error(error);
      toast('Supabase error – check console');
      return;
    }
    if (!data || !data.length) {
      toast('Connected, but no doctors found yet');
      return;
    }
    const doc = data[0];
    toast(`Connected! Example doctor: ${doc.full_name} (${doc.specialty}, ${doc.city})`);
  } catch (e) {
    console.error(e);
    toast('Unable to connect to Supabase');
  }
}

// Fetch doctor profile from database
async function fetchDoctorProfile(doctorUserId) {
  if (!supabaseClient || !doctorUserId) {
    return null;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', doctorUserId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching doctor profile:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Exception fetching doctor profile:', e);
    return null;
  }
}

// Fetch doctor dashboard statistics
async function fetchDoctorStats(doctorUserId) {
  if (!supabaseClient || !doctorUserId) {
    return { todayAppointments: 0, pendingFollowups: 0, rating: 0 };
  }
  
  try {
    const today = getLocalDateString();

    // Today's appointments
    const { count: todayCount } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorUserId)
      .eq('appointment_date', today)
      .eq('status', 'scheduled');
    
    // Pending follow-ups
    const { count: pendingCount } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorUserId)
      .eq('follow_up_required', true)
      .gte('follow_up_date', today);
    
    // Average rating
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('rating')
      .eq('doctor_id', doctorUserId);
    
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    return {
      todayAppointments: todayCount || 0,
      pendingFollowups: pendingCount || 0,
      rating: parseFloat(avgRating.toFixed(1))
    };
  } catch (e) {
    console.error('Exception fetching doctor stats:', e);
    return { todayAppointments: 0, pendingFollowups: 0, rating: 0 };
  }
}

// Fetch today's patients for doctor
async function fetchTodaysPatients(doctorUserId) {
  if (!supabaseClient || !doctorUserId) {
    return [];
  }
  
  try {
    const today = getLocalDateString();

    // First, get today's appointments
    const { data: appointments, error: aptError } = await supabaseClient
      .from('appointments')
      .select('id, appointment_time, reason, patient_id')
      .eq('doctor_id', doctorUserId)
      .eq('appointment_date', today)
      .eq('status', 'scheduled')
      .order('appointment_time');
    
    if (aptError) {
      console.error('Error fetching appointments:', aptError);
      return [];
    }
    
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
    // Get patient IDs
    const patientIds = appointments.map(apt => apt.patient_id);
    
    // Fetch patient profiles
    const { data: patients, error: patientError } = await supabaseClient
      .from('patient_profiles')
      .select('user_id, full_name, age, city, medical_conditions')
      .in('user_id', patientIds);
    
    if (patientError) {
      console.error('Error fetching patient profiles:', patientError);
      return [];
    }
    
    // Combine appointment and patient data; exclude past slots (only future appointments today)
    const now = new Date();
    const todayStr = today;
    return appointments
      .map((apt) => {
        const patient = patients?.find(p => p.user_id === apt.patient_id);
        return {
          id: apt.id,
          dateRaw: todayStr,
          timeRaw: apt.appointment_time,
          patient_id: apt.patient_id,
          name: patient?.full_name || (I18N[state.language] || I18N.en).patient_fallback,
          age: patient?.age || '',
          city: patient?.city || '',
          conditions: apt.reason || (patient?.medical_conditions && patient.medical_conditions.join(', ')) || 'Consultation'
        };
      })
      .filter((p) => isAppointmentInFuture(todayStr, p.timeRaw));
  } catch (e) {
    console.error('Exception fetching today\'s patients:', e);
    return [];
  }
}

// Fetch upcoming appointments for doctor (next 7-14 days)
async function fetchDoctorUpcomingAppointments(doctorUserId) {
  if (!supabaseClient || !doctorUserId) {
    return [];
  }
  
  try {
    const today = getLocalDateString();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 14);
    const nextWeekStr = getLocalDateString(nextWeek);

    // Fetch upcoming appointments
    const { data: appointments, error: aptError } = await supabaseClient
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, reason, patient_id')
      .eq('doctor_id', doctorUserId)
      .eq('status', 'scheduled')
      .gte('appointment_date', today)
      .lte('appointment_date', nextWeekStr)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (aptError) {
      console.error('Error fetching upcoming appointments:', aptError);
      return [];
    }
    
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
    // Get patient IDs
    const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];
    
    // Fetch patient profiles
    const { data: patients, error: patientError } = await supabaseClient
      .from('patient_profiles')
      .select('user_id, full_name, age, city')
      .in('user_id', patientIds);
    
    if (patientError) {
      console.error('Error fetching patient profiles:', patientError);
    }
    
    // Create patient map
    const patientMap = {};
    if (patients) {
      patients.forEach(p => {
        patientMap[p.user_id] = p;
      });
    }
    
    // Transform and keep only future appointments (exclude past date+time)
    const transformed = appointments.map((apt) => {
      const patient = patientMap[apt.patient_id];
      const aptDate = new Date(apt.appointment_date);
      const todayCheck = new Date();
      todayCheck.setHours(0, 0, 0, 0);
      const isToday = aptDate.getTime() === todayCheck.getTime();
      const i18n = I18N[state.language] || I18N.en;
      
      return {
        id: apt.id,
        patient_id: apt.patient_id,
        patientName: translateName(patient?.full_name || i18n.patient_fallback),
        patientAge: patient?.age || '',
        patientCity: patient?.city || '',
        date: isToday ? i18n.today : aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateRaw: apt.appointment_date,
        time: new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        timeRaw: apt.appointment_time,
        reason: apt.reason || 'Consultation',
        status: 'Scheduled'
      };
    });
    return transformed.filter((apt) => isAppointmentInFuture(apt.dateRaw, apt.timeRaw));
  } catch (e) {
    console.error('Exception fetching upcoming appointments:', e);
    return [];
  }
}

// Fetch completed appointments for doctor (recent)
async function fetchDoctorCompletedAppointments(doctorUserId) {
  if (!supabaseClient || !doctorUserId) {
    return [];
  }
  
  try {
    // Fetch last 10 completed appointments
    const { data: appointments, error: aptError } = await supabaseClient
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, reason, patient_id, notes')
      .eq('doctor_id', doctorUserId)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(10);
    
    if (aptError) {
      console.error('Error fetching completed appointments:', aptError);
      return [];
    }
    
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
    // Get patient IDs
    const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];
    
    // Fetch patient profiles
    const { data: patients, error: patientError } = await supabaseClient
      .from('patient_profiles')
      .select('user_id, full_name, age, city')
      .in('user_id', patientIds);
    
    if (patientError) {
      console.error('Error fetching patient profiles:', patientError);
    }
    
    // Create patient map
    const patientMap = {};
    if (patients) {
      patients.forEach(p => {
        patientMap[p.user_id] = p;
      });
    }
    
    // Transform appointments
    return appointments.map((apt) => {
      const patient = patientMap[apt.patient_id];
      const aptDate = new Date(apt.appointment_date);
      const i18n = I18N[state.language] || I18N.en;
      
      return {
        id: apt.id,
        patientName: translateName(patient?.full_name || i18n.patient_fallback),
        patientAge: patient?.age || '',
        patientCity: patient?.city || '',
        date: aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dateRaw: apt.appointment_date,
        time: new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        reason: apt.reason || 'Consultation',
        notes: apt.notes || '',
        status: 'Completed'
      };
    });
  } catch (e) {
    console.error('Exception fetching completed appointments:', e);
    return [];
  }
}

// Fetch patient profile from database
async function fetchPatientProfile(patientUserId) {
  if (!supabaseClient || !patientUserId) {
    return null;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('patient_profiles')
      .select('*')
      .eq('user_id', patientUserId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching patient profile:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Exception fetching patient profile:', e);
    return null;
  }
}

// Fetch patient's appointments
async function fetchPatientAppointments(patientUserId) {
  if (!supabaseClient || !patientUserId) {
    console.log('fetchPatientAppointments: Missing supabaseClient or patientUserId', { patientUserId });
    return [];
  }
  
  try {
    console.log('fetchPatientAppointments: Fetching for patient:', patientUserId);
    console.log('fetchPatientAppointments: Patient ID type:', typeof patientUserId);
    
    // First, fetch appointments without join to see if they exist
    const { data: appointmentsData, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, reason, doctor_id')
      .eq('patient_id', patientUserId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (appointmentsError) {
      console.error('Error fetching patient appointments:', appointmentsError);
      toast('Error loading appointments: ' + appointmentsError.message);
      return [];
    }
    
    console.log('fetchPatientAppointments: Raw appointments from database:', appointmentsData);
    console.log('fetchPatientAppointments: Found', appointmentsData?.length || 0, 'appointments');
    
    if (!appointmentsData || appointmentsData.length === 0) {
      console.log('fetchPatientAppointments: No appointments found for patient:', patientUserId);
      return [];
    }
    
    // Now fetch doctor details for each appointment
    const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctor_id))];
    console.log('fetchPatientAppointments: Fetching doctor details for IDs:', doctorIds);
    
    const { data: doctorsData, error: doctorsError } = await supabaseClient
      .from('doctor_profiles')
      .select('user_id, full_name, specialty')
      .in('user_id', doctorIds);
    
    if (doctorsError) {
      console.warn('Error fetching doctor profiles:', doctorsError);
    }
    
    console.log('fetchPatientAppointments: Doctor profiles:', doctorsData);
    
    // Create a map of doctor_id -> doctor info
    const doctorMap = {};
    if (doctorsData) {
      doctorsData.forEach(doc => {
        doctorMap[doc.user_id] = doc;
      });
    }
    
    // Transform to match UI format
    const transformed = appointmentsData.map((apt) => {
      const aptDate = new Date(apt.appointment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = aptDate.getTime() === today.getTime();
      
      // Get doctor info from map
      const doctor = doctorMap[apt.doctor_id];
      const i18n = I18N[state.language] || I18N.en;
      const doctorName = doctor?.full_name || i18n.unknown_doctor;
      const specialty = doctor?.specialty || 'General';
      
      return {
        id: apt.id,
        doctorId: apt.doctor_id,
        doctorName: doctorName,
        specialty: specialty,
        date: isToday ? 'Today' : aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateRaw: apt.appointment_date, // Store raw date for filtering
        time: new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        timeRaw: apt.appointment_time,
        status: apt.status === 'scheduled' ? 'Scheduled' : apt.status === 'completed' ? 'Completed' : apt.status,
        statusRaw: apt.status, // Store raw status for filtering
        reason: apt.reason
      };
    });
    
    console.log('fetchPatientAppointments: Transformed appointments:', transformed);
    return transformed;
  } catch (e) {
    console.error('Exception fetching patient appointments:', e);
    toast('Error loading appointments. Check console for details.');
    return [];
  }
}

// --- Consultation (Jitsi) helpers ---
const JOIN_WINDOW_START_MINS = 30;  // Join button appears 30 minutes before (doctor and patient)
const JOIN_WINDOW_END_MINS = 60;    // Join allowed until 60 minutes after start

/**
 * Returns true only when current time is within join window: from 30 min before to 60 min after appointment time.
 * @param appointment - { dateRaw, timeRaw } (e.g. dateRaw: '2026-01-26', timeRaw: '14:00' or '14:00:00')
 */
function canJoinConsultation(appointment) {
  if (!appointment || !appointment.dateRaw || !appointment.timeRaw) return false;
  const dateStr = String(appointment.dateRaw).trim().slice(0, 10);
  let timeStr = String(appointment.timeRaw).trim();
  // Handle full ISO string (e.g. "2026-01-26T14:00:00" or "14:00:00")
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return false;
  const hh = parseInt(timeMatch[1], 10);
  const mm = parseInt(timeMatch[2], 10);
  if (isNaN(hh) || isNaN(mm)) return false;
  const consultAt = new Date(dateStr + 'T' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':00');
  const now = new Date();
  const start = new Date(consultAt.getTime() - JOIN_WINDOW_START_MINS * 60 * 1000);
  const end = new Date(consultAt.getTime() + JOIN_WINDOW_END_MINS * 60 * 1000);
  return now >= start && now <= end;
}

/**
 * Create or get consultation for an appointment. Returns { id, room_name, appointment_id } or null.
 * Enforces that only the assigned patient or doctor can create/fetch.
 */
async function createOrGetConsultation(appointmentId) {
  if (!supabaseClient || !appointmentId) return null;
  const user = getCurrentUser();
  if (!user) return null;

  const { data: appointment, error: aptErr } = await supabaseClient
    .from('appointments')
    .select('id, patient_id, doctor_id')
    .eq('id', appointmentId)
    .eq('status', 'scheduled')
    .single();

  if (aptErr || !appointment) return null;
  const isPatient = user.role === 'patient' && user.id === appointment.patient_id;
  const isDoctor = user.role === 'doctor' && user.id === appointment.doctor_id;
  if (!isPatient && !isDoctor) return null;

  const { data: existing } = await supabaseClient
    .from('consultations')
    .select('id, room_name, appointment_id')
    .eq('appointment_id', appointmentId)
    .in('status', ['scheduled', 'active'])
    .maybeSingle();

  if (existing) return existing;

  const roomName = 'ahc-' + crypto.randomUUID().replace(/-/g, '') + '-' + Date.now().toString(36);
  const { data: created, error: insertErr } = await supabaseClient
    .from('consultations')
    .insert({
      appointment_id: appointmentId,
      room_name: roomName,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select('id, room_name, appointment_id')
    .single();

  if (insertErr) {
    console.error('createOrGetConsultation insert error', insertErr);
    return null;
  }
  return created;
}

/**
 * Mark consultation as completed and set ended_at.
 */
async function endConsultation(consultationId) {
  if (!supabaseClient || !consultationId) return;
  await supabaseClient
    .from('consultations')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', consultationId);
}

// --- Jitsi Meet (video call) ---
let jitsiApi = null;
const JITSI_DOMAIN = 'meet.jit.si';

function getJitsiDisplayName() {
  const user = getCurrentUser();
  if (user && (user.full_name || user.username)) return user.full_name || user.username;
  return state.role === 'doctor' ? 'Doctor' : 'Patient';
}

function destroyJitsi() {
  if (jitsiApi) {
    try { jitsiApi.dispose(); } catch (e) { /* ignore */ }
    jitsiApi = null;
  }
  const container = document.getElementById('jitsi-container');
  if (container) container.innerHTML = '';
}

function initJitsi() {
  const consultation = state.activeConsultation;
  if (!consultation || !consultation.room_name) return;
  const container = document.getElementById('jitsi-container');
  if (!container) return;
  container.innerHTML = '';
  destroyJitsi();

  function startMeet() {
    if (!window.JitsiMeetExternalAPI) {
      console.error('Jitsi API not loaded');
      toast('Could not load video call.');
      return;
    }
    jitsiApi = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: consultation.room_name,
      width: '100%',
      height: '100%',
      parentNode: container,
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableThirdPartyRequests: true,
        enableWelcomePage: false,
        fileRecordingsEnabled: false,
        liveStreamingEnabled: false,
        disableRecordAudioNotification: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
      },
      userInfo: { displayName: getJitsiDisplayName() },
    });
    jitsiApi.addEventListener('videoConferenceLeft', () => {
      destroyJitsi();
      if (state.activeConsultation) {
        endConsultation(state.activeConsultation.id);
        state.activeConsultation = null;
      }
      if (state.role === 'doctor') go('doctor'); else if (state.role === 'patient') go('patient');
      else go('language');
    });
  }

  if (window.JitsiMeetExternalAPI) {
    startMeet();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://' + JITSI_DOMAIN + '/external_api.js';
  script.async = true;
  script.onload = startMeet;
  script.onerror = () => toast('Could not load video call.');
  document.head.appendChild(script);
}

// Fetch doctors from Supabase database
async function fetchDoctorsFromDB(city = null) {
  if (!supabaseClient) {
    console.warn('Supabase not initialized, using mock data');
    return DOCTORS; // Fallback to mock data
  }
  
  try {
    let query = supabaseClient
      .from('doctor_profiles')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false });
    
    // Filter by city if provided
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching doctors:', error);
      toast('Error loading doctors. Using sample data.');
      return getMockData().DOCTORS; // Fallback to mock data
    }
    
    if (!data || data.length === 0) {
      console.warn('No doctors found in database');
      return getMockData().DOCTORS; // Fallback to mock data
    }
    
    // Transform database format to UI format
    return data.map((doc) => ({
      id: doc.user_id,
      name: doc.full_name,
      specialty: doc.specialty,
      clinic: doc.clinic_name || 'Clinic',
      city: doc.city,
      rating: parseFloat(doc.rating) || 0,
      total_reviews: doc.total_reviews || 0,
      nextSlot: 'Today • Available', // You can enhance this later with actual slot data
      consultation_fee: doc.consultation_fee,
      languages_spoken: doc.languages_spoken || [],
    }));
  } catch (e) {
    console.error('Exception fetching doctors:', e);
    return DOCTORS; // Fallback to mock data
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Simple password hashing (for demo - in production, use server-side hashing!)
// NOTE: This is NOT secure for production. Use Supabase Edge Function or backend API for real password hashing.
async function hashPassword(password) {
  // Simple hash using Web Crypto API (better than nothing, but still needs server-side for production)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verify password (compare hashed password)
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Sign up new user
async function signupUser(username, email, password, fullName, role) {
  if (!supabaseClient) {
    toast('Database not connected. Please check your Supabase configuration.');
    return { success: false, error: 'Database not connected' };
  }

  // Validate inputs
  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  if (!fullName) {
    return { success: false, error: 'Please enter your full name' };
  }

  try {
    // Hash password (in production, do this server-side!)
    const passwordHash = await hashPassword(password);

    // Check if username already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, error: 'Username already taken. Please choose another.' };
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return { success: false, error: 'Email already registered. Please login instead.' };
    }

    // Create user in database
    const { data: newUser, error: userError } = await supabaseClient
      .from('users')
      .insert({
        username: username,
        email: email,
        password_hash: passwordHash,
        role: role,
        language_preference: state.language,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return { success: false, error: 'Failed to create account. Please try again.' };
    }

    // Create profile based on role
    if (role === 'patient') {
      const { error: profileError } = await supabaseClient
        .from('patient_profiles')
        .insert({
          user_id: newUser.id,
          full_name: fullName,
          city: '', // User can update later
          medical_conditions: []
        });

      if (profileError) {
        console.error('Error creating patient profile:', profileError);
        // User is created, but profile failed - still allow login
      }
    } else if (role === 'doctor') {
      const { error: profileError } = await supabaseClient
        .from('doctor_profiles')
        .insert({
          user_id: newUser.id,
          full_name: fullName,
          specialty: '', // User can update later
          city: '',
          is_available: true,
          rating: 0,
          total_reviews: 0
        });

      if (profileError) {
        console.error('Error creating doctor profile:', profileError);
        // User is created, but profile failed - still allow login
      }
    }

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

// Login user
async function loginUser(username, password) {
  if (!supabaseClient) {
    toast('Database not connected. Please check your Supabase configuration.');
    return { success: false, error: 'Database not connected' };
  }

  if (!username || !password) {
    return { success: false, error: 'Please enter username and password' };
  }

  try {
    // Find user by username
    const { data: user, error: findError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (findError || !user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Update last_login
    await supabaseClient
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Remove password_hash from user object before storing
    const { password_hash, ...userData } = user;

    // Store user session
    save('current_user', userData);
    state.currentUser = userData;
    state.role = userData.role;
    
    // Track user login in Google Analytics
    trackEvent('user_logged_in', 'Authentication', userData.role);
    
    // Clear any stale localStorage bookings (logged-in users should only see database appointments)
    save(STORAGE.booking, null);

    return { success: true, user: userData };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

// Get current logged-in user
function getCurrentUser() {
  if (state.currentUser) {
    return state.currentUser;
  }
  const user = load('current_user', null);
  if (user) {
    state.currentUser = user;
    state.role = user.role;
  }
  return user;
}

// Logout user
function logoutUser() {
  state.currentUser = null;
  state.role = null;
  save('current_user', null);
  save(STORAGE.role, null);
  go('language');
  toast('Logged out successfully');
}

/* Simple EN/HI strings */

const I18N = {
  en: {
    kicker_welcome: 'Welcome',
    language_title: 'Choose your language',
    language_subtitle: 'We’ll tailor the experience to your preference.',
    continue: 'Continue',
    kicker_step2: 'Step 2',
    role_title: 'Select your role',
    role_subtitle: 'We’ll personalize the journey for you.',
    role_guest_title: 'Guest',
    role_guest_desc: 'Preview experience',
    role_patient_title: 'Patient',
    role_patient_desc: 'Care & bookings',
    role_doctor_title: 'Doctor',
    role_doctor_desc: 'Manage consultations',
    kicker_patient: 'Patient',
    patient_dashboard_title: 'Dashboard',
    ai_card_title: 'AI Health Companion',
    ai_card_subtitle: 'Ask questions in your language.',
    type_instead: 'Type instead',
    upcoming_title: 'Upcoming care',
    upcoming_sub: 'Stay on top of visits and bookings',
    completed_title: 'Completed care',
    completed_sub: 'Your past consultations',
    cancelled_title: 'Cancelled appointments',
    cancelled_sub: 'Appointments you or the system cancelled',
    recommended_title: 'Recommended doctors',
    recommended_sub: 'Nearby specialists for you',
    find_doctors: 'Find doctors',
    quick_find_doctor: 'Find doctor',
    quick_ai_chat: 'AI Chat',
    quick_change_role: 'Change role',
    view: 'View',
    kicker_ai: 'AI Companion',
    chat_title: 'AI Chat',
    find_doctors_nearby: 'Find doctors nearby',
    kicker_booking: 'Booking',
    doctors_title: 'Doctors near you',
    doctors_subtitle: 'Suggested specialists available today.',
    kicker_doctor: 'Doctor',
    doctor_dashboard_title: 'Doctor dashboard',
    patients_title: 'Patient list',
    patients_sub: "Today’s scheduled patients",
    doctor_upcoming_title: 'Upcoming appointments',
    doctor_upcoming_sub: 'Next 7 days schedule',
    doctor_completed_title: 'Recent completed',
    doctor_completed_sub: 'Last consultations',
    stat_today: 'Today',
    stat_consults: 'Consultations',
    stat_pending: 'Pending',
    stat_followups: 'Follow-ups',
    stat_rating: 'Rating',
    stat_score: 'Patient score',
    brand_tagline: 'Care in your language',
    kicker_settings: 'Preferences',
    settings_title: 'Settings',
    settings_subtitle: 'Language updates live across the experience.',
    settings_language: 'Language',
    settings_pwa: 'PWA install',
    settings_pwa_note: 'Install works when served over http(s). Double-click file:// cannot install PWAs.',
    back: 'Back',
    tab_home: 'Home',
    tab_chat: 'Chat',
    tab_doctors: 'Doctors',
    tab_role: 'Role',
    // Auth & video
    login_kicker: 'Sign in',
    login_title: 'Welcome back',
    login_subtitle: 'This is a demo login screen – no real account needed.',
    login_username_label: 'Username',
    login_email_label: 'Email',
    login_password_label: 'Password',
    login_submit: 'Continue',
    login_back: 'Back to role select',
    login_to_signup: 'Need an account? Sign up',
    signup_kicker: 'Create account',
    signup_title: 'Join AI Health Companion',
    signup_subtitle: 'This is a demo signup screen for flows only.',
    signup_username_label: 'Username',
    signup_name_label: 'Full name',
    signup_email_label: 'Email',
    signup_password_label: 'Password',
    signup_submit: 'Create account',
    signup_back: 'Back to login',
    kicker_call: 'Live consult',
    video_title: 'Video call in progress',
    video_subtitle: 'Secure video consultation. Join when both parties are ready.',
    video_end_call: 'End call',
    video_disclaimer: 'Not for emergencies. For diagnosis and treatment, see a healthcare provider in person. This session is not recorded.',
    join_call: 'Join call',
    join_available_soon: 'Join available 30 min before',
    // Booking
    booking_title: 'Choose a time',
    booking_confirmed: 'Booking confirmed 🎉',
    book_button: 'Book',
    today: 'Today',
    booking_confirmed_toast: 'Booking confirmed',
    next_slot: 'Next: ',
    available: 'Available',
    no_doctors_available: 'No doctors available at the moment.',
    booking_date_label: 'Select date',
    booking_date_sub: 'Weekdays only (Mon–Fri)',
    booking_slots_label: 'Available time slots',
    booking_slots_sub: 'Times between 09:00–17:00',
    booking_slots_sub_today: 'Today: 09:00–22:00 (open till 10 PM)',
    booking_back: 'Back',
    booking_confirm: 'Confirm',
    booking_future_only: 'Please choose a slot at least 30 minutes from now',
    slot_passed: 'Available from 30 minutes from now',
    slot_booked: 'This slot is already booked',
    weekdays_only_slot: 'Weekdays only (Mon–Fri)',
    weekdays_only_message: 'Choose a weekday to see available slots.',
    // Medical conditions
    condition_hypertension: 'Hypertension',
    condition_fever: 'Fever',
    condition_sore_throat: 'Sore throat',
    condition_dermatitis: 'Dermatitis',
    condition_diabetes: 'Diabetes',
    condition_follow_up: 'follow-up',
    condition_consultation: 'Consultation',
    // Doctor specialties
    specialty_cardiologist: 'Cardiologist',
    specialty_general_physician: 'General Physician',
    specialty_dermatologist: 'Dermatologist',
    specialty_family_medicine: 'Family Medicine',
    // Fallback names
    patient_fallback: 'Patient',
    unknown_doctor: 'Unknown Doctor',
  },
  hi: {
    kicker_welcome: 'स्वागत है',
    language_title: 'अपनी भाषा चुनें',
    language_subtitle: 'हम अनुभव को आपकी पसंद के अनुसार बनाएँगे।',
    continue: 'आगे बढ़ें',
    kicker_step2: 'चरण 2',
    role_title: 'अपनी भूमिका चुनें',
    role_subtitle: 'हम आपके लिए यात्रा को व्यक्तिगत बनाएँगे।',
    role_guest_title: 'गेस्ट',
    role_guest_desc: 'प्रीव्यू अनुभव',
    role_patient_title: 'मरीज़',
    role_patient_desc: 'केयर व बुकिंग',
    role_doctor_title: 'डॉक्टर',
    role_doctor_desc: 'कंसल्टेशन मैनेज करें',
    kicker_patient: 'मरीज़',
    patient_dashboard_title: 'डैशबोर्ड',
    ai_card_title: 'AI हेल्थ साथी',
    ai_card_subtitle: 'अपनी भाषा में सवाल पूछें।',
    type_instead: 'टाइप करें',
    upcoming_title: 'आगामी देखभाल',
    upcoming_sub: 'अपॉइंटमेंट और बुकिंग पर नज़र रखें',
    completed_title: 'पूर्ण हुई देखभाल',
    completed_sub: 'आपके पिछले परामर्श',
    recommended_title: 'सुझाए गए डॉक्टर',
    recommended_sub: 'आपके पास के विशेषज्ञ',
    find_doctors: 'डॉक्टर खोजें',
    quick_find_doctor: 'डॉक्टर',
    quick_ai_chat: 'AI चैट',
    quick_change_role: 'भूमिका बदलें',
    kicker_ai: 'AI साथी',
    chat_title: 'AI चैट',
    find_doctors_nearby: 'पास के डॉक्टर खोजें',
    kicker_booking: 'बुकिंग',
    doctors_title: 'पास के डॉक्टर',
    doctors_subtitle: 'आज उपलब्ध विशेषज्ञ',
    kicker_doctor: 'डॉक्टर',
    doctor_dashboard_title: 'डॉक्टर डैशबोर्ड',
    patients_title: 'मरीज़ सूची',
    patients_sub: 'आज के निर्धारित मरीज़',
    doctor_upcoming_title: 'आगामी अपॉइंटमेंट',
    doctor_upcoming_sub: 'अगले 7 दिनों का शेड्यूल',
    doctor_completed_title: 'हाल की पूर्ण हुई',
    doctor_completed_sub: 'पिछले परामर्श',
    stat_today: 'आज',
    stat_consults: 'परामर्श',
    stat_pending: 'लंबित',
    stat_followups: 'फॉलो-अप',
    stat_rating: 'रेटिंग',
    stat_score: 'स्कोर',
    brand_tagline: 'आपकी भाषा में देखभाल',
    kicker_settings: 'सेटिंग्स',
    settings_title: 'सेटिंग्स',
    settings_subtitle: 'भाषा तुरंत बदल जाएगी।',
    settings_language: 'भाषा',
    settings_pwa: 'PWA इंस्टॉल',
    settings_pwa_note: 'इंस्टॉल http(s) पर काम करता है। file:// पर PWA इंस्टॉल नहीं होता।',
    back: 'वापस',
    tab_home: 'होम',
    tab_chat: 'चैट',
    tab_doctors: 'डॉक्टर',
    tab_role: 'भूमिका',
    // Auth & video
    login_kicker: 'साइन इन',
    login_title: 'वापस स्वागत है',
    login_subtitle: 'यह एक डेमो लॉगिन स्क्रीन है – किसी असली खाते की जरूरत नहीं।',
    login_username_label: 'उपयोगकर्ता नाम',
    login_email_label: 'ईमेल',
    login_password_label: 'पासवर्ड',
    login_submit: 'जारी रखें',
    login_back: 'रोल चुनने पर वापस जाएँ',
    login_to_signup: 'खाता चाहिए? साइन अप करें',
    signup_kicker: 'खाता बनाएँ',
    signup_title: 'AI हेल्थ कम्पेनियन से जुड़ें',
    signup_subtitle: 'यह केवल फ्लो दिखाने के लिए डेमो साइन‑अप स्क्रीन है।',
    signup_username_label: 'उपयोगकर्ता नाम',
    signup_name_label: 'पूरा नाम',
    signup_email_label: 'ईमेल',
    signup_password_label: 'पासवर्ड',
    signup_submit: 'खाता बनाएँ',
    signup_back: 'लॉगिन पर वापस जाएँ',
    kicker_call: 'लाइव कंसल्ट',
    video_title: 'वीडियो कॉल जारी है',
    video_subtitle: 'सुरक्षित वीडियो परामर्श। दोनों पक्ष तैयार हों तो जॉइन करें।',
    video_end_call: 'कॉल समाप्त करें',
    video_disclaimer: 'इमरजेंसी के लिए नहीं। निदान के लिए डॉक्टर से मिलें। यह सत्र रिकॉर्ड नहीं होता।',
    join_call: 'कॉल में जॉइन करें',
    join_available_soon: 'अपॉइंटमेंट से 30 मिनट पहले जॉइन कर सकते हैं',
    // Booking
    booking_confirmed: 'बुकिंग कन्फर्म 🎉',
    book_button: 'बुक करें',
    today: 'आज',
    booking_confirmed_toast: 'बुकिंग हो गई',
    next_slot: 'अगला स्लॉट: ',
    available: 'उपलब्ध',
    no_doctors_available: 'इस समय कोई डॉक्टर उपलब्ध नहीं है।',
    booking_date_label: 'तारीख चुनें',
    booking_date_sub: 'सिर्फ सोमवार से शुक्रवार',
    booking_slots_label: 'उपलब्ध समय स्लॉट',
    booking_slots_sub: 'सुबह 09:00 से शाम 17:00 के बीच के समय',
    booking_back: 'वापस',
    booking_confirm: 'कन्फर्म करें',
    cancelled_title: 'रद्द की गई अपॉइंटमेंट',
    cancelled_sub: 'जो अपॉइंटमेंट आप या सिस्टम ने रद्द कीं',
    // Medical conditions
    condition_hypertension: 'उच्च रक्तचाप',
    condition_fever: 'बुखार',
    condition_sore_throat: 'गले में दर्द',
    condition_dermatitis: 'त्वचा रोग',
    condition_diabetes: 'मधुमेह',
    condition_follow_up: 'फॉलो-अप',
    condition_consultation: 'परामर्श',
    // Doctor specialties
    specialty_cardiologist: 'हृदय रोग विशेषज्ञ',
    specialty_general_physician: 'सामान्य चिकित्सक',
    specialty_dermatologist: 'त्वचा रोग विशेषज्ञ',
    specialty_family_medicine: 'पारिवारिक चिकित्सा',
    // Fallback names
    patient_fallback: 'मरीज़',
    unknown_doctor: 'अज्ञात डॉक्टर',
  },

  // 3) Bengali
  bn: {
    kicker_welcome: 'স্বাগতম',
    language_title: 'আপনার ভাষা বেছে নিন',
    language_subtitle: 'আমরা আপনার পছন্দ অনুযায়ী অভিজ্ঞতা সাজাবো।',
    continue: 'পরবর্তী',
    kicker_step2: 'ধাপ ২',
    role_title: 'আপনার ভূমিকা নির্বাচন করুন',
    role_subtitle: 'আমরা আপনার জন্য যাত্রা ব্যক্তিগত করব।',
    role_guest_title: 'অতিথি',
    role_guest_desc: 'প্রিভিউ এক্সপেরিয়েন্স',
    role_patient_title: 'রোগী',
    role_patient_desc: 'কেয়ার ও বুকিং',
    role_doctor_title: 'ডাক্তার',
    role_doctor_desc: 'কনসাল্টেশন ম্যানেজ করুন',
    kicker_patient: 'রোগী',
    patient_dashboard_title: 'ড্যাশবোর্ড',
    ai_card_title: 'AI হেলথ সঙ্গী',
    ai_card_subtitle: 'আপনার ভাষায় প্রশ্ন করুন।',
    type_instead: 'টাইপ করুন',
    upcoming_title: 'আসন্ন কেয়ার',
    upcoming_sub: 'ভিজিট ও বুকিংয়ের উপর নজর রাখুন',
    completed_title: 'সম্পন্ন কেয়ার',
    completed_sub: 'আপনার অতীত পরামর্শ',
    recommended_title: 'প্রস্তাবিত ডাক্তার',
    recommended_sub: 'আপনার আশেপাশের বিশেষজ্ঞরা',
    find_doctors: 'ডাক্তার খুঁজুন',
    quick_find_doctor: 'ডাক্তার',
    quick_ai_chat: 'AI চ্যাট',
    quick_change_role: 'ভূমিকা বদলান',
    kicker_ai: 'AI সঙ্গী',
    chat_title: 'AI চ্যাট',
    find_doctors_nearby: 'কাছের ডাক্তার খুঁজুন',
    kicker_booking: 'বুকিং',
    doctors_title: 'কাছের ডাক্তার',
    doctors_subtitle: 'আজ উপলব্ধ বিশেষজ্ঞরা',
    kicker_doctor: 'ডাক্তার',
    doctor_dashboard_title: 'ডাক্তার ড্যাশবোর্ড',
    patients_title: 'রোগীর তালিকা',
    patients_sub: 'আজকের নির্ধারিত রোগী',
    doctor_upcoming_title: 'আসন্ন অ্যাপয়েন্টমেন্ট',
    doctor_upcoming_sub: 'পরবর্তী 7 দিনের সময়সূচী',
    doctor_completed_title: 'সাম্প্রতিক সম্পন্ন',
    doctor_completed_sub: 'শেষ পরামর্শ',
    stat_today: 'আজ',
    stat_consults: 'কনসাল্টেশন',
    stat_pending: 'অমীমাংসিত',
    stat_followups: 'ফলো‑আপ',
    stat_rating: 'রেটিং',
    stat_score: 'স্কোর',
    brand_tagline: 'আপনার ভাষায় যত্ন',
    kicker_settings: 'সেটিংস',
    settings_title: 'সেটিংস',
    settings_subtitle: 'ভাষা পরিবর্তন সাথে সাথেই প্রয়োগ হবে।',
    settings_language: 'ভাষা',
    settings_pwa: 'PWA ইন্সটল',
    settings_pwa_note: 'ইন্সটল শুধুমাত্র http(s) থেকে কাজ করে। file:// থেকে PWA ইন্সটল হয় না।',
    back: 'ফিরে যান',
    tab_home: 'হোম',
    tab_chat: 'চ্যাট',
    tab_doctors: 'ডাক্তার',
    tab_role: 'ভূমিকা',
    // Auth & video
    login_kicker: 'সাইন ইন',
    login_title: 'ফিরে আসার জন্য স্বাগতম',
    login_subtitle: 'এটি একটি ডেমো লগইন স্ক্রিন – কোনও সত্যিকারের একাউন্টের প্রয়োজন নেই।',
    login_email_label: 'ইমেল',
    login_password_label: 'পাসওয়ার্ড',
    login_submit: 'চালিয়ে যান',
    login_back: 'রোল সিলেক্টে ফিরে যান',
    login_to_signup: 'একাউন্ট দরকার? সাইন আপ করুন',
    signup_kicker: 'একাউন্ট তৈরি করুন',
    signup_title: 'AI হেলথ কম্প্যানিয়নে যোগ দিন',
    signup_subtitle: 'এটি শুধু ফ্লো বোঝাতে একটি ডেমো সাইন‑আপ স্ক্রিন।',
    signup_name_label: 'পূর্ণ নাম',
    signup_email_label: 'ইমেল',
    signup_password_label: 'পাসওয়ার্ড',
    signup_submit: 'একাউন্ট তৈরি করুন',
    signup_back: 'লগইনে ফিরে যান',
    kicker_call: 'লাইভ কনসাল্ট',
    video_title: 'ভিডিও কল চলছে',
    video_subtitle: 'এটি টেলিকনসালটেশনের একটি প্লেসহোল্ডার স্ক্রিন।',
    video_end_call: 'কল শেষ করুন',
    // Booking
    booking_confirmed: 'বুকিং নিশ্চিত 🎉',
    book_button: 'বুক করুন',
    today: 'আজ',
    booking_confirmed_toast: 'বুকিং নিশ্চিত হয়েছে',
    next_slot: 'পরবর্তী স্লট: ',
    available: 'উপলব্ধ',
    no_doctors_available: 'এই মুহূর্তে কোন ডাক্তার উপলব্ধ নেই।',
    // Medical conditions
    condition_hypertension: 'উচ্চ রক্তচাপ',
    condition_fever: 'জ্বর',
    condition_sore_throat: 'গলা ব্যথা',
    condition_dermatitis: 'চর্মরোগ',
    condition_diabetes: 'ডায়াবেটিস',
    condition_follow_up: 'ফলো-আপ',
    condition_consultation: 'পরামর্শ',
    // Doctor specialties
    specialty_cardiologist: 'হৃদরোগ বিশেষজ্ঞ',
    specialty_general_physician: 'সাধারণ চিকিৎসক',
    specialty_dermatologist: 'চর্মরোগ বিশেষজ্ঞ',
    specialty_family_medicine: 'পারিবারিক চিকিৎসা',
    // Fallback names
    patient_fallback: 'রোগী',
    unknown_doctor: 'অজানা ডাক্তার',
  },

  // 4) Kannada
  kn: {
    kicker_welcome: 'ಸ್ವಾಗತ',
    language_title: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    language_subtitle: 'ನಿಮ್ಮ ಇಷ್ಟಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಅನುಭವವನ್ನು ರೂಪಿಸುತ್ತೇವೆ.',
    continue: 'ಮುಂದೆ',
    kicker_step2: 'ಹಂತ ೨',
    role_title: 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆರಿಸಿ',
    role_subtitle: 'ನಿಮಗಾಗಿ ಪ್ರಯಾಣವನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸುತ್ತೇವೆ.',
    role_guest_title: 'ಅತಿಥಿ',
    role_guest_desc: 'ಪ್ರೀವ್ಯೂ ಅನುಭವ',
    role_patient_title: 'ರೋಗಿ',
    role_patient_desc: 'ಕೇರ್ ಮತ್ತು ಬುಕ್ಕಿಂಗ್',
    role_doctor_title: 'ವೈದ್ಯ',
    role_doctor_desc: 'ಕನ್ಸಲ್ಟೇಶನ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    kicker_patient: 'ರೋಗಿ',
    patient_dashboard_title: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    ai_card_title: 'AI ಆರೋಗ್ಯ ಸಂಗಾತಿ',
    ai_card_subtitle: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.',
    type_instead: 'ಬರೆಯಿರಿ',
    upcoming_title: 'ಮುಂದಿನ ಕಾಳಜಿ',
    upcoming_sub: 'ವಿಜಿಟ್‌ಗಳು ಮತ್ತು ಬುಕ್ಕಿಂಗ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    completed_title: 'ಪೂರ್ಣಗೊಂಡ ಕಾಳಜಿ',
    completed_sub: 'ನಿಮ್ಮ ಹಿಂದಿನ ಸಲಹೆಗಳು',
    recommended_title: 'ಶಿಫಾರಸು ಮಾಡಿದ ವೈದ್ಯರು',
    recommended_sub: 'ನಿಮಗೆ ಹತ್ತಿರದ ತಜ್ಞರು',
    find_doctors: 'ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
    quick_find_doctor: 'ವೈದ್ಯ',
    quick_ai_chat: 'AI ಚಾಟ್',
    quick_change_role: 'ಪಾತ್ರ ಬದಲಿಸಿ',
    view: 'ನೋಡಿ',
    kicker_ai: 'AI ಸಂಗಾತಿ',
    chat_title: 'AI ಚಾಟ್',
    find_doctors_nearby: 'ಹತ್ತಿರದ ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
    kicker_booking: 'ಬುಕ್ಕಿಂಗ್',
    doctors_title: 'ಹತ್ತಿರದ ವೈದ್ಯರು',
    doctors_subtitle: 'ಇಂದು ಲಭ್ಯವಿರುವ ತಜ್ಞರು',
    kicker_doctor: 'ವೈದ್ಯ',
    doctor_dashboard_title: 'ವೈದ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    patients_title: 'ರೋಗಿಗಳ ಪಟ್ಟಿ',
    patients_sub: 'ಇಂದಿನ ನಿರ್ದೇಶಿತ ರೋಗಿಗಳು',
    doctor_upcoming_title: 'ಮುಂದಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳು',
    doctor_upcoming_sub: 'ಮುಂದಿನ 7 ದಿನಗಳ ವೇಳಾಪಟ್ಟಿ',
    doctor_completed_title: 'ಇತ್ತೀಚಿನ ಪೂರ್ಣಗೊಂಡ',
    doctor_completed_sub: 'ಕೊನೆಯ ಸಲಹೆಗಳು',
    stat_today: 'ಇಂದು',
    stat_consults: 'ಸಲಹೆಗಳು',
    stat_pending: 'ಬಾಕಿ',
    stat_followups: 'ಫಾಲೋ‑ಅಪ್‌ಗಳು',
    stat_rating: 'ರೇಟಿಂಗ್',
    stat_score: 'ಸ್ಕೋರ್',
    brand_tagline: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಆರೈಕೆ',
    kicker_settings: 'ಸಿದ್ಧತೆಗಳು',
    settings_title: 'ಸೇಟಿಂಗ್ಸ್',
    settings_subtitle: 'ಭಾಷಾ ಬದಲಾವಣೆ ತಕ್ಷಣ ಅನ್ವಯವಾಗುತ್ತದೆ.',
    settings_language: 'ಭಾಷೆ',
    settings_pwa: 'PWA ಇನ್‌ಸ್ಟಾಲ್',
    settings_pwa_note: 'ಇನ್‌ಸ್ಟಾಲ್ http(s) ನಲ್ಲೇ ಕೆಲಸ ಮಾಡುತ್ತದೆ. file:// ನಿಂದ PWA ಇನ್‌ಸ್ಟಾಲ್ ಆಗುವುದಿಲ್ಲ.',
    back: 'ಹಿಂದೆ',
    tab_home: 'ಮನೆ',
    tab_chat: 'ಚಾಟ್',
    tab_doctors: 'ವೈದ್ಯರು',
    tab_role: 'ಪಾತ್ರ',
    // Auth & video
    login_kicker: 'ಸೈನ್ ಇನ್',
    login_title: 'ಮತ್ತೆ ಸ್ವಾಗತ',
    login_subtitle: 'ಇದು ಡೆಮೋ ಲಾಗಿನ್ ಸ್ಕ್ರೀನ್ – ನಿಜವಾದ ಖಾತೆ ಅಗತ್ಯವಿಲ್ಲ.',
    login_email_label: 'ಇಮೇಲ್',
    login_password_label: 'ಪಾಸ್‌ವರ್ಡ್',
    login_submit: 'ಮುಂದುವರಿಸಿ',
    login_back: 'ಪಾತ್ರ ಆಯ್ಕೆಗೇ ಹಿಂದಿರುಗಿ',
    login_to_signup: 'ಖಾತೆ ಬೇಕೇ? ಸೈನ್ ಅಪ್ ಮಾಡಿ',
    signup_kicker: 'ಖಾತೆ ರಚಿಸಿ',
    signup_title: 'AI ಹೆಲ್ತ್ ಕಂಪಾನಿಯನ್‌ಗೆ ಸೇರಿ',
    signup_subtitle: 'ಇದು ಫ್ಲೋ ತೋರಿಸಲು ಮಾತ್ರ ಡೆಮೋ ಸೈನ್‑ಅಪ್ ಸ್ಕ್ರೀನ್.',
    signup_name_label: 'ಪೂರ್ಣ ಹೆಸರು',
    signup_email_label: 'ಇಮೇಲ್',
    signup_password_label: 'ಪಾಸ್‌ವರ್ಡ್',
    signup_submit: 'ಖಾತೆ ರಚಿಸಿ',
    signup_back: 'ಲಾಗಿನ್‌ಗೆ ಹಿಂದಿರುಗಿ',
    kicker_call: 'ಲೈವ್ ಕನ್ಸಲ್ಟ್',
    video_title: 'ವೀಡಿಯೋ ಕಾಲ್ ನಡೆಯುತ್ತಿದೆ',
    video_subtitle: 'ಇದು ಟೆಲಿಕನ್ಸಲ್ಟೇಶನ್ ತೋರಿಸಲು ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್ ಸ್ಕ್ರೀನ್.',
    video_end_call: 'ಕಾಲ್ ಮುಗಿಸಿ',
    // Booking
    booking_confirmed: 'ಬುಕ್ಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ 🎉',
    book_button: 'ಬುಕ್ ಮಾಡಿ',
    today: 'ಇಂದು',
    booking_confirmed_toast: 'ಬುಕ್ಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    next_slot: 'ಮುಂದಿನ ಸ್ಲಾಟ್: ',
    available: 'ಲಭ್ಯವಿದೆ',
    no_doctors_available: 'ಈ ಕ್ಷಣದಲ್ಲಿ ಯಾವುದೇ ವೈದ್ಯರು ಲಭ್ಯವಿಲ್ಲ.',
    // Medical conditions
    condition_hypertension: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ',
    condition_fever: 'ಜ್ವರ',
    condition_sore_throat: 'ಗಂಟಲು ನೋವು',
    condition_dermatitis: 'ಚರ್ಮದ ಉರಿಯೂತ',
    condition_diabetes: 'ಮಧುಮೇಹ',
    condition_follow_up: 'ಫಾಲೋ-ಅಪ್',
    condition_consultation: 'ಸಲಹೆ',
    // Doctor specialties
    specialty_cardiologist: 'ಹೃದ್ರೋಗ ತಜ್ಞ',
    specialty_general_physician: 'ಸಾಮಾನ್ಯ ವೈದ್ಯ',
    specialty_dermatologist: 'ಚರ್ಮರೋಗ ತಜ್ಞ',
    specialty_family_medicine: 'ಕುಟುಂಬ ವೈದ್ಯಕೀಯ',
    // Fallback names
    patient_fallback: 'ರೋಗಿ',
    unknown_doctor: 'ಅಜ್ಞಾತ ವೈದ್ಯ',
  },

  // 5) Telugu
  te: {
    kicker_welcome: 'స్వాగతం',
    language_title: 'మీ భాషను ఎంచుకోండి',
    language_subtitle: 'మీ అభిరుచికి అనుగుణంగా అనుభవాన్ని మార్చుకుంటాం.',
    continue: 'తర్వాత',
    kicker_step2: 'దశ 2',
    role_title: 'మీ పాత్రను ఎంచుకోండి',
    role_subtitle: 'మీ కోసమే ప్రయాణాన్ని వ్యక్తిగతం చేస్తాము.',
    role_guest_title: 'అతిథి',
    role_guest_desc: 'ప్రీవ్యూ అనుభవం',
    role_patient_title: 'రోగి',
    role_patient_desc: 'కేర్ & బుకింగ్స్',
    role_doctor_title: 'డాక్టర్',
    role_doctor_desc: 'కన్సల్టేషన్లు నిర్వహించండి',
    kicker_patient: 'రోగి',
    patient_dashboard_title: 'డ్యాష్‌బోర్డ్',
    ai_card_title: 'AI హెల్త్ తోడు',
    ai_card_subtitle: 'మీ భాషలో ప్రశ్నలు అడగండి.',
    type_instead: 'టైప్ చేయండి',
    upcoming_title: 'రాబోయే సంరక్షణ',
    upcoming_sub: 'విజిట్‌లు మరియు బుకింగ్స్‌ ను ట్రాక్ చేయండి',
    completed_title: 'పూర్తయిన సంరక్షణ',
    completed_sub: 'మీ గత సంప్రదింపులు',
    recommended_title: 'సిఫారసు చేసిన డాక్టర్లు',
    recommended_sub: 'మీ దగ్గరలో ఉన్న నిపుణులు',
    find_doctors: 'డాక్టర్లను కనుగొనండి',
    quick_find_doctor: 'డాక్టర్',
    quick_ai_chat: 'AI చాట్',
    quick_change_role: 'పాత్ర మార్చండి',
    view: 'చూడండి',
    kicker_ai: 'AI తోడు',
    chat_title: 'AI చాట్',
    find_doctors_nearby: 'దగ్గరలోని డాక్టర్లను కనుగొనండి',
    kicker_booking: 'బుకింగ్',
    doctors_title: 'దగ్గరలోని డాక్టర్లు',
    doctors_subtitle: 'ఈ రోజు అందుబాటులో ఉన్న నిపుణులు',
    kicker_doctor: 'డాక్టర్',
    doctor_dashboard_title: 'డాక్టర్ డ్యాష్‌బోర్డ్',
    patients_title: 'రోగుల జాబితా',
    patients_sub: 'ఈ రోజు షెడ్యూల్ అయిన రోగులు',
    doctor_upcoming_title: 'రాబోయే అపాయింట్‌మెంట్‌లు',
    doctor_upcoming_sub: 'తదుపరి 7 రోజుల షెడ్యూల్',
    doctor_completed_title: 'ఇటీవల పూర్తయిన',
    doctor_completed_sub: 'చివరి సంప్రదింపులు',
    stat_today: 'ఈ రోజు',
    stat_consults: 'కన్సల్టేషన్లు',
    stat_pending: 'పెండింగ్',
    stat_followups: 'ఫాలో‑అప్స్',
    stat_rating: 'రేటింగ్',
    stat_score: 'స్కోర్',
    brand_tagline: 'మీ భాషలో కేర్',
    kicker_settings: 'సెట్టింగులు',
    settings_title: 'సెట్టింగులు',
    settings_subtitle: 'భాష మార్పు వెంటనే అమలవుతుంది.',
    settings_language: 'భాష',
    settings_pwa: 'PWA ఇన్‌స్టాల్',
    settings_pwa_note: 'ఇన్‌స్టాల్ http(s) లో మాత్రమే పని చేస్తుంది. file:// నుండి PWA ఇన్‌స్టాల్ కాదు.',
    back: 'వెనక్కి',
    tab_home: 'హోమ్',
    tab_chat: 'చాట్',
    tab_doctors: 'డాక్టర్లు',
    tab_role: 'పాత్ర',
    // Auth & video
    login_kicker: 'సైన్ ఇన్',
    login_title: 'తిరిగి స్వాగతం',
    login_subtitle: 'ఇది డెమో లాగిన్ స్క్రీన్ – నిజమైన ఖాతా అవసరం లేదు.',
    login_email_label: 'ఈమెయిల్',
    login_password_label: 'పాస్‌వర్డ్',
    login_submit: 'కొనసాగించు',
    login_back: 'పాత్ర ఎంపికకు తిరిగి వెళ్ళండి',
    login_to_signup: 'ఖాతా కావాలా? సైన్ అప్ చేయండి',
    signup_kicker: 'ఖాతా సృష్టించండి',
    signup_title: 'AI హెల్త్ కంపానియన్‌లో చేరండి',
    signup_subtitle: 'ఇది ఫ్లో చూపించడానికి మాత్రమే డెమో సైన్‑అప్ స్క్రీన్.',
    signup_name_label: 'పూర్తి పేరు',
    signup_email_label: 'ఈమెయిల్',
    signup_password_label: 'పాస్‌వర్డ్',
    signup_submit: 'ఖాతా సృష్టించు',
    signup_back: 'లాగిన్‌కు తిరిగి వెళ్ళండి',
    kicker_call: 'లైవ్ కన్సల్ట్',
    video_title: 'వీడియో కాల్ కొనసాగుతోంది',
    video_subtitle: 'ఇది టెలీకన్సల్టేషన్ చూపించడానికి ప్లేస్‌హోల్డర్ స్క్రీన్.',
    video_end_call: 'కాల్ ముగించు',
    // Booking
    booking_confirmed: 'బుకింగ్ నిర్ధారించబడింది 🎉',
    book_button: 'బుక్ చేయి',
    today: 'ఈరోజు',
    booking_confirmed_toast: 'బుకింగ్ నిర్ధారించబడింది',
    next_slot: 'తదుపరి స్లాట్: ',
    available: 'అందుబాటులో ఉంది',
    no_doctors_available: 'ఈ సమయంలో ఎవరూ డాక్టర్లు అందుబాటులో లేరు.',
    // Medical conditions
    condition_hypertension: 'అధిక రక్తపోటు',
    condition_fever: 'జ్వరం',
    condition_sore_throat: 'గొంతు నొప్పి',
    condition_dermatitis: 'చర్మ వ్యాధి',
    condition_diabetes: 'మధుమేహం',
    condition_follow_up: 'ఫాలో-అప్',
    condition_consultation: 'సంప్రదింపు',
    // Doctor specialties
    specialty_cardiologist: 'హృదయ వైద్యుడు',
    specialty_general_physician: 'సాధారణ వైద్యుడు',
    specialty_dermatologist: 'చర్మరోగ నిపుణుడు',
    specialty_family_medicine: 'కుటుంబ వైద్యం',
    // Fallback names
    patient_fallback: 'రోగి',
    unknown_doctor: 'తెలియని డాక్టర్',
  },

  // 6) Malayalam
  ml: {
    kicker_welcome: 'സ്വാഗതം',
    language_title: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക',
    language_subtitle: 'നിങ്ങളുടെ ഇഷ്ടത്തിന് അനുയോജ്യമായി അനുഭവം ഒരുക്കാം.',
    continue: 'അടുത്തത്',
    kicker_step2: 'നില 2',
    role_title: 'നിങ്ങളുടെ പങ്ക് തിരഞ്ഞെടുക്കുക',
    role_subtitle: 'നിങ്ങൾക്കായി യാത്ര വ്യക്തിഗതമാക്കുന്നു.',
    role_guest_title: 'അതിഥി',
    role_guest_desc: 'പ്രിവ്യൂ അനുഭവം',
    role_patient_title: 'രോഗി',
    role_patient_desc: 'പരിചരണം & ബുക്കിംഗ്',
    role_doctor_title: 'ഡോക്ടർ',
    role_doctor_desc: 'കൺസൾട്ടേഷനുകൾ മാനേജുചെയ്യുക',
    kicker_patient: 'രോഗി',
    patient_dashboard_title: 'ഡാഷ്‌ബോർഡ്',
    ai_card_title: 'AI ഹെൽത്ത് കൂട്ടുകാരൻ',
    ai_card_subtitle: 'നിങ്ങളുടെ ഭാഷയിൽ ചോദ്യങ്ങൾ ചോദിക്കൂ.',
    type_instead: 'ടൈപ്പ് ചെയ്യുക',
    upcoming_title: 'വരുമാന പരിചരണം',
    upcoming_sub: 'സന്ദർശനങ്ങളും ബുക്കിംഗും ട്രാക്ക് ചെയ്യുക',
    completed_title: 'പൂർത്തിയാക്കിയ പരിചരണം',
    completed_sub: 'നിങ്ങളുടെ കഴിഞ്ഞ കൺസൾട്ടേഷനുകൾ',
    recommended_title: 'ശുപാർശ ചെയ്ത ഡോക്ടർമാർ',
    recommended_sub: 'നിങ്ങളുടെ സമീപത്തുള്ള വിദഗ്ധർ',
    find_doctors: 'ഡോക്ടർമാരെ കണ്ടെത്തുക',
    quick_find_doctor: 'ഡോക്ടർ',
    quick_ai_chat: 'AI ചാറ്റ്',
    quick_change_role: 'പങ്ക് മാറ്റുക',
    view: 'കാണുക',
    kicker_ai: 'AI കൂട്ടുകാരൻ',
    chat_title: 'AI ചാറ്റ്',
    find_doctors_nearby: 'അടുത്തുള്ള ഡോക്ടർമാരെ കണ്ടെത്തുക',
    kicker_booking: 'ബുക്കിംഗ്',
    doctors_title: 'സമീപത്തുള്ള ഡോക്ടർമാർ',
    doctors_subtitle: 'ഇന്ന് ലഭ്യമായ വിദഗ്ധർ',
    kicker_doctor: 'ഡോക്ടർ',
    doctor_dashboard_title: 'ഡോക്ടർ ഡാഷ്‌ബോർഡ്',
    patients_title: 'രോഗികളുടെ പട്ടിക',
    patients_sub: 'ഇന്നത്തെ ഷെഡ്യൂൾ ചെയ്ത രോഗികൾ',
    doctor_upcoming_title: 'വരാനിരിക്കുന്ന അപ്പോയിന്റ്‌മെന്റുകൾ',
    doctor_upcoming_sub: 'അടുത്ത 7 ദിവസത്തെ ഷെഡ്യൂൾ',
    doctor_completed_title: 'ഇടിവിലെ പൂർത്തിയാക്കിയത്',
    doctor_completed_sub: 'അവസാന കൺസൾട്ടേഷനുകൾ',
    stat_today: 'ഇന്ന്',
    stat_consults: 'കൺസൾട്ടേഷനുകൾ',
    stat_pending: 'പെൻഡിംഗ്',
    stat_followups: 'ഫോളോ‑അപ്പുകൾ',
    stat_rating: 'റേറ്റിംഗ്',
    stat_score: 'സ്കോർ',
    brand_tagline: 'നിങ്ങളുടെ ഭാഷയിൽ പരിചരണം',
    kicker_settings: 'ക്രമീകരണങ്ങൾ',
    settings_title: 'ക്രമീകരണങ്ങൾ',
    settings_subtitle: 'ഭാഷ മാറ്റം ഉടൻ പ്രാവർത്തികമാകും.',
    settings_language: 'ഭാഷ',
    settings_pwa: 'PWA ഇൻസ്റ്റാൾ',
    settings_pwa_note: 'http(s) മുഖേന മാത്രമേ ഇൻസ്റ്റാൾ സാധ്യമാകൂ. file:// വഴി PWA ഇൻസ്റ്റാൾ ചെയ്യാൻ സാധ്യമല്ല.',
    back: 'തിരികെ',
    tab_home: 'ഹോം',
    tab_chat: 'ചാറ്റ്',
    tab_doctors: 'ഡോക്ടർമാർ',
    tab_role: 'പങ്ക്',
    // Auth & video
    login_kicker: 'സൈൻ ഇൻ',
    login_title: 'വീണ്ടും സ്വാഗതം',
    login_subtitle: 'ഇത് ഒരു ഡെമോ ലോഗിൻ സ്ക്രീൻ ആണ് – യഥാർത്ഥ അക്കൗണ്ട് ആവശ്യമില്ല.',
    login_email_label: 'ഇമെയിൽ',
    login_password_label: 'പാസ്‌വേഡ്',
    login_submit: 'തുടരുക',
    login_back: 'റോൾ സെലക്ടിലേക്കു മടങ്ങുക',
    login_to_signup: 'അക്കൗണ്ട് വേണമോ? സൈൻ അപ് ചെയ്യുക',
    signup_kicker: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    signup_title: 'AI ഹെൽത്ത് കമ്പാനിയനിൽ ചേരുക',
    signup_subtitle: 'ഇത് ഫ്ലോ കാണിക്കാൻ മാത്രം ഉള്ള ഡെമോ സൈൻ‑അപ്പ് സ്ക്രീൻ ആണ്.',
    signup_name_label: 'പൂർണ്ണ നാമം',
    signup_email_label: 'ഇമെയിൽ',
    signup_password_label: 'പാസ്‌വേഡ്',
    signup_submit: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    signup_back: 'ലോഗിനിലേക്ക് മടങ്ങുക',
    kicker_call: 'ലൈവ് കൺസൾട്ട്',
    video_title: 'വീഡിയോ കോൾ നടത്തപ്പെടുന്നു',
    video_subtitle: 'ടെലികൺസൾട്ടേഷൻ കാണിക്കുന്ന പ്ലേസ്‌ഹോൾഡർ സ്ക്രീൻ ആണ് ഇത്.',
    video_end_call: 'കോൾ അവസാനിപ്പിക്കുക',
    // Booking
    booking_confirmed: 'ബുക്കിംഗ് സ്ഥിരീകരിച്ചു 🎉',
    book_button: 'ബുക്ക് ചെയ്യുക',
    today: 'ഇന്ന്',
    booking_confirmed_toast: 'ബുക്കിംഗ് സ്ഥിരീകരിച്ചു',
    next_slot: 'അടുത്ത സ്ലോട്ട്: ',
    available: 'ലഭ്യമാണ്',
    no_doctors_available: 'ഈ നിമിഷം ഒരു ഡോക്ടറും ലഭ്യമല്ല.',
    // Medical conditions
    condition_hypertension: 'ഉയർന്ന രക്തസമ്മർദ്ദം',
    condition_fever: 'പനി',
    condition_sore_throat: 'തൊണ്ടവേദന',
    condition_dermatitis: 'ചർമ്മരോഗം',
    condition_diabetes: 'പ്രമേഹം',
    condition_follow_up: 'ഫോളോ-അപ്പ്',
    condition_consultation: 'കൺസൾട്ടേഷൻ',
    // Doctor specialties
    specialty_cardiologist: 'ഹൃദ്രോഗ വിദഗ്ധൻ',
    specialty_general_physician: 'പൊതു വൈദ്യൻ',
    specialty_dermatologist: 'ചർമ്മരോഗ വിദഗ്ധൻ',
    specialty_family_medicine: 'കുടുംബ വൈദ്യം',
    // Fallback names
    patient_fallback: 'രോഗി',
    unknown_doctor: 'അജ്ഞാത ഡോക്ടർ',
  },

  // 7) Tamil
  ta: {
    kicker_welcome: 'வரவேற்பு',
    language_title: 'உங்கள் மொழியைத் தேர்வு செய்யவும்',
    language_subtitle: 'உங்கள் விருப்பத்துக்கு ஏற்ப அனுபவத்தை மாற்றுகிறோம்.',
    continue: 'அடுத்தது',
    kicker_step2: 'படி 2',
    role_title: 'உங்கள் பாத்திரத்தைத் தேர்வு செய்யவும்',
    role_subtitle: 'உங்களுக்கு ஏற்ற பயணத்தை வடிவமைப்போம்.',
    role_guest_title: 'விருந்தினர்',
    role_guest_desc: 'முன் நோக்கு அனுபவம்',
    role_patient_title: 'நோயாளி',
    role_patient_desc: 'பராமரிப்பு & முன்பதிவு',
    role_doctor_title: 'மருத்துவர்',
    role_doctor_desc: 'ஆலோசனைகளை மேலாண்மை செய்யவும்',
    kicker_patient: 'நோயாளி',
    patient_dashboard_title: 'டாஷ்போர்டு',
    ai_card_title: 'AI சுகாதார துணை',
    ai_card_subtitle: 'உங்கள் மொழியில் கேள்விகளை கேளுங்கள்.',
    type_instead: 'டைப் செய்யவும்',
    upcoming_title: 'வரவிருக்கும் பராமரிப்பு',
    upcoming_sub: 'சந்திப்பு மற்றும் முன்பதிவுகளை கண்காணிக்கவும்',
    completed_title: 'முடிக்கப்பட்ட பராமரிப்பு',
    completed_sub: 'உங்கள் கடந்த ஆலோசனைகள்',
    recommended_title: 'பரிந்துரைக்கப்பட்ட மருத்துவர்கள்',
    recommended_sub: 'உங்கள் அருகிலுள்ள நிபுணர்கள்',
    find_doctors: 'மருத்துவரை தேடவும்',
    quick_find_doctor: 'மருத்துவர்',
    quick_ai_chat: 'AI அரட்டை',
    quick_change_role: 'பாத்திரம் மாற்று',
    view: 'பார்க்க',
    quick_find_doctor: 'மருத்துவர்',
    quick_ai_chat: 'AI அரட்டை',
    quick_change_role: 'பாத்திரம் மாற்று',
    view: 'பார்க்க',
    kicker_ai: 'AI துணை',
    chat_title: 'AI அரட்டை',
    find_doctors_nearby: 'அருகிலுள்ள மருத்துவர்களைத் தேடவும்',
    kicker_booking: 'முன்பதிவு',
    doctors_title: 'அருகிலுள்ள மருத்துவர்கள்',
    doctors_subtitle: 'இன்று கிடைக்கும் நிபுணர்கள்',
    kicker_doctor: 'மருத்துவர்',
    doctor_dashboard_title: 'மருத்துவர் டாஷ்போர்டு',
    patients_title: 'நோயாளி பட்டியல்',
    patients_sub: 'இன்றைய நிர்ணயிக்கப்பட்ட நோயாளிகள்',
    doctor_upcoming_title: 'வரவிருக்கும் நியமனங்கள்',
    doctor_upcoming_sub: 'அடுத்த 7 நாட்கள் அட்டவணை',
    doctor_completed_title: 'சமீபத்தில் முடிக்கப்பட்டது',
    doctor_completed_sub: 'கடைசி ஆலோசனைகள்',
    stat_today: 'இன்று',
    stat_consults: 'ஆலோசனைகள்',
    stat_pending: 'நிலுவை',
    stat_followups: 'பின்தொடர்வுகள்',
    stat_rating: 'மதிப்பீடு',
    stat_score: 'மதிப்பெண்',
    brand_tagline: 'உங்கள் மொழியில் பராமரிப்பு',
    kicker_settings: 'அமைப்புகள்',
    settings_title: 'அமைப்புகள்',
    settings_subtitle: 'மொழி மாற்றம் உடனடியாக பயன்படுத்தப்படும்.',
    settings_language: 'மொழி',
    settings_pwa: 'PWA நிறுவல்',
    settings_pwa_note: 'நிறுவுதல் http(s) வழியாக மட்டுமே செயல்படும். file:// மூலம் PWA நிறுவ முடியாது.',
    back: 'மீண்டும்',
    tab_home: 'முகப்பு',
    tab_chat: 'அரட்டை',
    tab_doctors: 'மருத்துவர்',
    tab_role: 'பாத்திரம்',
    // Auth & video
    login_kicker: 'உள்நுழைய',
    login_title: 'மீண்டும் வரவேற்கிறோம்',
    login_subtitle: 'இது ஒரு டெமோ உள்நுழைவு திரை – உண்மையான கணக்கு தேவையில்லை.',
    login_username_label: 'பயனர்பெயர்',
    login_email_label: 'மின்னஞ்சல்',
    login_password_label: 'கடவுச்சொல்',
    login_submit: 'தொடரவும்',
    login_back: 'பாத்திரம் தேர்வுக்கு திரும்ப',
    login_to_signup: 'கணக்கு தேவையா? பதிவு செய்யவும்',
    signup_kicker: 'கணக்கு உருவாக்க',
    signup_title: 'AI ஹெல்த் கம்பானியனில் சேரவும்',
    signup_subtitle: 'இது ஓட்டங்களைக் காட்டுவதற்கான டெமோ பதிவு திரை மட்டுமே.',
    signup_username_label: 'பயனர்பெயர்',
    signup_name_label: 'முழு பெயர்',
    signup_email_label: 'மின்னஞ்சல்',
    signup_password_label: 'கடவுச்சொல்',
    signup_submit: 'கணக்கு உருவாக்க',
    signup_back: 'உள்நுழைவுக்கு திரும்ப',
    kicker_call: 'நேரடி ஆலோசனை',
    video_title: 'வீடியோ அழைப்பு நடைபெறுகிறது',
    video_subtitle: 'இது டெலிகன்ஸல்டேஷனைக் குறிக்கும் ஒரு பிளேஸ்ஹோல்டர் திரை.',
    video_end_call: 'அழைப்பை முடிக்க',
    // Booking
    booking_confirmed: 'முன்பதிவு உறுதிப்படுத்தப்பட்டது 🎉',
    book_button: 'முன்பதிவு செய்',
    today: 'இன்று',
    booking_confirmed_toast: 'முன்பதிவு உறுதிப்படுத்தப்பட்டது',
    next_slot: 'அடுத்த ஸ்லாட்: ',
    available: 'கிடைக்கிறது',
    no_doctors_available: 'இந்த நேரத்தில் எந்த மருத்துவர்களும் கிடைக்கவில்லை.',
    // Medical conditions
    condition_hypertension: 'உயர் இரத்த அழுத்தம்',
    condition_fever: 'காய்ச்சல்',
    condition_sore_throat: 'தொண்டை வலி',
    condition_dermatitis: 'தோல் அழற்சி',
    condition_diabetes: 'நீரிழிவு',
    condition_follow_up: 'பின்தொடர்வு',
    condition_consultation: 'ஆலோசனை',
    // Doctor specialties
    specialty_cardiologist: 'இதய நோய் நிபுணர்',
    specialty_general_physician: 'பொது மருத்துவர்',
    specialty_dermatologist: 'தோல் நோய் நிபுணர்',
    specialty_family_medicine: 'குடும்ப மருத்துவம்',
    // Fallback names
    patient_fallback: 'நோயாளி',
    unknown_doctor: 'அறியப்படாத மருத்துவர்',
  },

  // 8) Marathi
  mr: {
    kicker_welcome: 'स्वागत आहे',
    language_title: 'आपली भाषा निवडा',
    language_subtitle: 'आम्ही तुमच्या पसंतीनुसार अनुभव तयार करू.',
    continue: 'पुढे',
    kicker_step2: 'पायरी २',
    role_title: 'तुमची भूमिका निवडा',
    role_subtitle: 'आम्ही तुमच्यासाठी प्रवास वैयक्तिक करू.',
    role_guest_title: 'गेस्ट',
    role_guest_desc: 'प्रिव्ह्यू अनुभव',
    role_patient_title: 'रुग्ण',
    role_patient_desc: 'काळजी आणि बुकिंग',
    role_doctor_title: 'डॉक्टर',
    role_doctor_desc: 'कन्सल्टेशन व्यवस्थापित करा',
    kicker_patient: 'रुग्ण',
    patient_dashboard_title: 'डॅशबोर्ड',
    ai_card_title: 'AI हेल्थ साथीदार',
    ai_card_subtitle: 'तुमच्या भाषेत प्रश्न विचारा.',
    type_instead: 'टाइप करा',
    upcoming_title: 'येणारी काळजी',
    upcoming_sub: 'व्हिजिट्स आणि बुकिंग्सवर नजर ठेवा',
    completed_title: 'पूर्ण झालेली काळजी',
    completed_sub: 'तुमचे मागील सल्लामसलत',
    recommended_title: 'शिफारस केलेले डॉक्टर',
    recommended_sub: 'तुमच्या जवळचे तज्ञ',
    find_doctors: 'डॉक्टर शोधा',
    quick_find_doctor: 'डॉक्टर',
    quick_ai_chat: 'AI चॅट',
    quick_change_role: 'भूमिका बदला',
    view: 'पहा',
    view: 'पहा',
    view: 'देखें',
    kicker_ai: 'AI साथीदार',
    chat_title: 'AI चॅट',
    find_doctors_nearby: 'जवळचे डॉक्टर शोधा',
    kicker_booking: 'बुकिंग',
    doctors_title: 'जवळचे डॉक्टर',
    doctors_subtitle: 'आज उपलब्ध तज्ञ',
    kicker_doctor: 'डॉक्टर',
    doctor_dashboard_title: 'डॉक्टर डॅशबोर्ड',
    patients_title: 'रुग्णांची यादी',
    patients_sub: 'आजचे नियोजित रुग्ण',
    doctor_upcoming_title: 'येणारी अपॉइंटमेंट',
    doctor_upcoming_sub: 'पुढील 7 दिवसांचे वेळापत्रक',
    doctor_completed_title: 'अलीकडील पूर्ण झालेले',
    doctor_completed_sub: 'शेवटचे सल्लामसलत',
    stat_today: 'आज',
    stat_consults: 'कन्सल्टेशन',
    stat_pending: 'प्रलंबित',
    stat_followups: 'फॉलो‑अप्स',
    stat_rating: 'रेटिंग',
    stat_score: 'स्कोअर',
    brand_tagline: 'तुमच्या भाषेत काळजी',
    kicker_settings: 'सेटिंग्ज',
    settings_title: 'सेटिंग्ज',
    settings_subtitle: 'भाषा बदल तत्काळ लागू होईल.',
    settings_language: 'भाषा',
    settings_pwa: 'PWA इन्स्टॉल',
    settings_pwa_note: 'इन्स्टॉल फक्त http(s) वरच काम करते. file:// वरून PWA इन्स्टॉल होत नाही.',
    back: 'मागे',
    tab_home: 'होम',
    tab_chat: 'चॅट',
    tab_doctors: 'डॉक्टर',
    tab_role: 'भूमिका',
    // Auth & video
    login_kicker: 'साइन इन',
    login_title: 'पुन्हा स्वागत आहे',
    login_subtitle: 'ही एक डेमो लॉगिन स्क्रीन आहे – खऱ्या खात्याची गरज नाही.',
    login_email_label: 'ईमेल',
    login_password_label: 'पासवर्ड',
    login_submit: 'सुरू ठेवा',
    login_back: 'भूमिका निवडीवर परत जा',
    login_to_signup: 'खाते हवे आहे? साइन अप करा',
    signup_kicker: 'खाते तयार करा',
    signup_title: 'AI हेल्थ कम्पॅनियनमध्ये सामील व्हा',
    signup_subtitle: 'ही केवळ फ्लो दाखवण्यासाठी डेमो साइन‑अप स्क्रीन आहे.',
    signup_name_label: 'पूर्ण नाव',
    signup_email_label: 'ईमेल',
    signup_password_label: 'पासवर्ड',
    signup_submit: 'खाते तयार करा',
    signup_back: 'लॉगिनवर परत जा',
    kicker_call: 'लाईव्ह कन्सल्ट',
    video_title: 'व्हिडिओ कॉल सुरू आहे',
    video_subtitle: 'ही टेलीकन्सल्टेशन दाखवण्यासाठी एक प्लेसहोल्डर स्क्रीन आहे.',
    video_end_call: 'कॉल समाप्त करा',
    // Booking
    booking_confirmed: 'बुकिंग पुष्टी झाली 🎉',
    book_button: 'बुक करा',
    today: 'आज',
    booking_confirmed_toast: 'बुकिंग पुष्टी झाली',
    next_slot: 'पुढील स्लॉट: ',
    available: 'उपलब्ध',
    no_doctors_available: 'या क्षणी कोणतेही डॉक्टर उपलब्ध नाहीत.',
    // Medical conditions
    condition_hypertension: 'उच्च रक्तदाब',
    condition_fever: 'ताप',
    condition_sore_throat: 'घसा खवखव',
    condition_dermatitis: 'त्वचारोग',
    condition_diabetes: 'मधुमेह',
    condition_follow_up: 'फॉलो-अप',
    condition_consultation: 'सल्लामसलत',
    // Doctor specialties
    specialty_cardiologist: 'हृदयरोग तज्ञ',
    specialty_general_physician: 'सामान्य वैद्यक',
    specialty_dermatologist: 'त्वचारोग तज्ञ',
    specialty_family_medicine: 'कुटुंब वैद्यकीय',
    // Fallback names
    patient_fallback: 'रुग्ण',
    unknown_doctor: 'अज्ञात डॉक्टर',
  },
};

const state = {
  language: load(STORAGE.language, 'en'),
  role: load(STORAGE.role, null),
  screen: 'language',
  currentUser: null, // Will be loaded from localStorage on boot
  // Advanced booking flow
  bookingDoctor: null, // full doctor object for current booking
  bookingDate: null,   // ISO date string yyyy-mm-dd
  bookingSlot: null,   // time string like "09:30"
  // Agentic AI booking
  suggestedDoctors: null, // doctors suggested by AI
  consultationReason: null, // reason for consultation from AI
  activeConsultation: null,  // { id, room_name, appointment_id } when in/entering video call
};

// Language-specific mock names
const MOCK_NAMES = {
  en: {
    patient: 'Aarav Patel',
    doctors: ['Dr. Aisha Menon', 'Dr. Kabir Sharma', 'Dr. Meera Iyer'],
    doctorProfile: 'Dr. Kavya Rao',
    patients: ['Aarav Patel', 'Isha Nair', 'Rohan Kulkarni'],
    upcomingDoctors: ['Dr. Kabir Sharma', 'Dr. Aisha Menon'],
  },
  hi: {
    patient: 'अरविंद सिंह',
    doctors: ['डॉ. प्रिया शर्मा', 'डॉ. राज कुमार', 'डॉ. अनिता देवी'],
    doctorProfile: 'डॉ. कविता शर्मा',
    patients: ['अरविंद सिंह', 'इशा गुप्ता', 'रोहन जैन'],
    upcomingDoctors: ['डॉ. राज कुमार', 'डॉ. प्रिया शर्मा'],
  },
  bn: {
    patient: 'অরবিন্দ ঘোষ',
    doctors: ['ডা. প্রিয়া চক্রবর্তী', 'ডা. রাজীব দাস', 'ডা. অনিতা রায়'],
    doctorProfile: 'ডা. কবিতা সেন',
    patients: ['অরবিন্দ ঘোষ', 'ঈশা মিত্র', 'রোহন ব্যানার্জী'],
    upcomingDoctors: ['ডা. রাজীব দাস', 'ডা. প্রিয়া চক্রবর্তী'],
  },
  kn: {
    patient: 'ಅರವಿಂದ್ ಪಟೇಲ್',
    doctors: ['ಡಾ. ಪ್ರಿಯಾ ರೆಡ್ಡಿ', 'ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್', 'ಡಾ. ಅನಿತಾ ರಾವ್'],
    doctorProfile: 'ಡಾ. ಕವಿತಾ ಶರ್ಮಾ',
    patients: ['ಅರವಿಂದ್ ಪಟೇಲ್', 'ಇಶಾ ನಾಯರ್', 'ರೋಹನ್ ಕುಲಕರ್ಣಿ'],
    upcomingDoctors: ['ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್', 'ಡಾ. ಪ್ರಿಯಾ ರೆಡ್ಡಿ'],
  },
  te: {
    patient: 'అరవింద్ పటేల్',
    doctors: ['డా. ప్రియ రెడ్డి', 'డా. రాజేష్ కుమార్', 'డా. అనిత రావు'],
    doctorProfile: 'డా. కవిత శర్మ',
    patients: ['అరవింద్ పటేల్', 'ఇష నాయర్', 'రోహన్ కులకర్ణి'],
    upcomingDoctors: ['డా. రాజేష్ కుమార్', 'డా. ప్రియ రెడ్డి'],
  },
  ml: {
    patient: 'അരവിന്ദ് പട്ടേൽ',
    doctors: ['ഡോ. പ്രിയ രാവ്', 'ഡോ. രാജേഷ് കുമാർ', 'ഡോ. അനിത ഐയ്യർ'],
    doctorProfile: 'ഡോ. കവിത ശർമ',
    patients: ['അരവിന്ദ് പട്ടേൽ', 'ഇഷ നായർ', 'രോഹൻ കുള്ളക്കരണി'],
    upcomingDoctors: ['ഡോ. രാജേഷ് കുമാർ', 'ഡോ. പ്രിയ രാവ്'],
  },
  ta: {
    patient: 'அரவிந்த் படேல்',
    doctors: ['டா. பிரியா ராவ்', 'டா. ராஜேஷ் குமார்', 'டா. அனிதா ஐயர்'],
    doctorProfile: 'டா. கவிதா ஷர்மா',
    patients: ['அரவிந்த் படேல்', 'இஷா நாயர்', 'ரோஹன் குல்கர்னி'],
    upcomingDoctors: ['டா. ராஜேஷ் குமார்', 'டா. பிரியா ராவ்'],
  },
  mr: {
    patient: 'अरविंद पाटील',
    doctors: ['डॉ. प्रिया पाटील', 'डॉ. राजेश कुलकर्णी', 'डॉ. अनिता जोशी'],
    doctorProfile: 'डॉ. कविता शर्मा',
    patients: ['अरविंद पाटील', 'ईशा नाईक', 'रोहन कुलकर्णी'],
    upcomingDoctors: ['डॉ. राजेश कुलकर्णी', 'डॉ. प्रिया पाटील'],
  },
};

// Helper to get language-specific mock data
function getMockData() {
  const lang = state.language || 'en';
  const names = MOCK_NAMES[lang] || MOCK_NAMES.en;
  const i18n = I18N[lang] || I18N.en;
  
  return {
    DOCTORS: [
      { name: names.doctors[0], specialty: 'Cardiologist', clinic: 'Green Valley Clinic', city: 'Bengaluru', rating: 4.7, nextSlot: `${i18n.today} • 7:00 PM` },
      { name: names.doctors[1], specialty: 'General Physician', clinic: 'City Health Hub', city: 'Mumbai', rating: 4.8, nextSlot: `${i18n.today} • 6:30 PM` },
      { name: names.doctors[2], specialty: 'Dermatologist', clinic: 'Skin Renew', city: 'Hyderabad', rating: 4.6, nextSlot: `${i18n.today} • 5:30 PM` },
    ],
    PATIENT: { name: names.patient, age: '29', city: 'Bengaluru', conditions: 'Hypertension' },
    DOCTOR_PROFILE: { name: names.doctorProfile, specialty: 'Family Medicine', clinic: 'Community Care', city: 'Hyderabad' },
    PATIENTS: [
      { name: names.patients[0], age: '29', city: 'Bengaluru', conditions: 'Fever, Sore throat' },
      { name: names.patients[1], age: '34', city: 'Hyderabad', conditions: 'Dermatitis' },
      { name: names.patients[2], age: '40', city: 'Mumbai', conditions: 'Diabetes follow-up' },
    ],
    UPCOMING: [
      { doctorName: names.upcomingDoctors[0], specialty: 'General Physician', date: i18n.today, time: '6:00 PM', status: 'Scheduled' },
      { doctorName: names.upcomingDoctors[1], specialty: 'Cardiologist', date: 'Jan 25', time: '11:30 AM', status: 'Completed' },
    ],
  };
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const el = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function t(key) {
  const dict = I18N[state.language] || I18N.en;
  return dict[key] || I18N.en[key] || key;
}

// Translate medical conditions
function translateCondition(condition) {
  if (!condition) return condition;
  const i18n = I18N[state.language] || I18N.en;
  const lower = condition.toLowerCase().trim();
  
  // If already translated or empty, return as is
  if (lower === '' || lower === 'no conditions listed') return condition;
  
  // Handle combined conditions like "Fever, Sore throat" or "Fever,Sore throat"
  if (lower.includes('fever') && (lower.includes('sore throat') || lower.includes('sorethroat'))) {
    const parts = condition.split(/[,，]/).map(p => p.trim());
    return parts.map(p => {
      const pl = p.toLowerCase();
      if (pl.includes('fever')) return i18n.condition_fever;
      if (pl.includes('sore throat') || pl.includes('sorethroat')) return i18n.condition_sore_throat;
      return translateCondition(p);
    }).join(', ');
  }
  
  // Single condition translations
  if (lower.includes('fever')) return i18n.condition_fever;
  if (lower.includes('sore throat') || lower.includes('sorethroat')) return i18n.condition_sore_throat;
  if (lower.includes('hypertension') || lower.includes('high blood pressure')) return i18n.condition_hypertension;
  if (lower.includes('dermatitis') || lower.includes('skin condition')) return i18n.condition_dermatitis;
  if (lower.includes('diabetes') || lower.includes('diabetic')) {
    if (lower.includes('follow-up') || lower.includes('follow up') || lower.includes('followup')) {
      return `${i18n.condition_diabetes} ${i18n.condition_follow_up}`;
    }
    return i18n.condition_diabetes;
  }
  if (lower.includes('consultation') || lower === 'consultation') return i18n.condition_consultation;
  
  // If no match, return original
  return condition;
}

// Translate doctor specialties
function translateSpecialty(specialty) {
  if (!specialty) return specialty;
  const i18n = I18N[state.language] || I18N.en;
  const lower = specialty.toLowerCase().trim();
  
  if (lower.includes('cardiologist')) return i18n.specialty_cardiologist;
  if (lower.includes('general physician') || lower.includes('general medicine') || lower === 'general') return i18n.specialty_general_physician;
  if (lower.includes('dermatologist')) return i18n.specialty_dermatologist;
  if (lower.includes('family medicine')) return i18n.specialty_family_medicine;
  
  // If no match, return original
  return specialty;
}

// --- end booking helpers (removed advanced flow on user request) ---

// Translate clinic names
function translateClinic(clinic) {
  if (!clinic || state.language === 'en') return clinic;
  
  const lang = state.language || 'en';
  const clinicMap = {
    hi: {
      'City Health Hub': 'सिटी हेल्थ हब',
      'Green Valley Clinic': 'ग्रीन वैली क्लिनिक',
      'Skin Renew': 'स्किन रिन्यू',
      'Community Care': 'कम्युनिटी केयर',
      'Clinic': 'क्लिनिक',
    },
    bn: {
      'City Health Hub': 'সিটি হেলথ হাব',
      'Green Valley Clinic': 'গ্রিন ভ্যালি ক্লিনিক',
      'Skin Renew': 'স্কিন রিনিউ',
      'Community Care': 'কমিউনিটি কেয়ার',
      'Clinic': 'ক্লিনিক',
    },
    kn: {
      'City Health Hub': 'ಸಿಟಿ ಹೆಲ್ತ್ ಹಬ್',
      'Green Valley Clinic': 'ಗ್ರೀನ್ ವ್ಯಾಲಿ ಕ್ಲಿನಿಕ್',
      'Skin Renew': 'ಸ್ಕಿನ್ ರಿನ್ಯೂ',
      'Community Care': 'ಕಮ್ಯುನಿಟಿ ಕೇರ್',
      'Clinic': 'ಕ್ಲಿನಿಕ್',
    },
    te: {
      'City Health Hub': 'సిటి హెల్త్ హబ్',
      'Green Valley Clinic': 'గ్రీన్ వ్యాలీ క్లినిక్',
      'Skin Renew': 'స్కిన్ రిన్యూ',
      'Community Care': 'కమ్యూనిటీ కేర్',
      'Clinic': 'క్లినిక్',
    },
    ml: {
      'City Health Hub': 'സിറ്റി ഹെൽത്ത് ഹബ്',
      'Green Valley Clinic': 'ഗ്രീൻ വാലി ക്ലിനിക്',
      'Skin Renew': 'സ്കിൻ റിന്യൂ',
      'Community Care': 'കമ്മ്യൂണിറ്റി കെയർ',
      'Clinic': 'ക്ലിനിക്',
    },
    ta: {
      'City Health Hub': 'சிட்டி ஹெல்த் ஹப்',
      'Green Valley Clinic': 'கிரீன் வேலி கிளினிக்',
      'Skin Renew': 'ஸ்கின் ரின்யூ',
      'Community Care': 'கம்யூனிட்டி கேர்',
      'Clinic': 'கிளினிக்',
    },
    mr: {
      'City Health Hub': 'सिटी हेल्थ हब',
      'Green Valley Clinic': 'ग्रीन व्हॅली क्लिनिक',
      'Skin Renew': 'स्किन रिन्यू',
      'Community Care': 'कम्युनिटी केयर',
      'Clinic': 'क्लिनिक',
    },
  };
  
  const translations = clinicMap[lang];
  if (translations && translations[clinic]) {
    return translations[clinic];
  }
  
  return clinic;
}

// Translate city names
function translateCity(city) {
  if (!city || state.language === 'en') return city;
  
  const lang = state.language || 'en';
  const cityMap = {
    hi: {
      'Mumbai': 'मुंबई',
      'Bengaluru': 'बेंगलुरु',
      'Bangalore': 'बेंगलुरु',
      'Hyderabad': 'हैदराबाद',
      'Delhi': 'दिल्ली',
      'Chennai': 'चेन्नई',
      'Kolkata': 'कोलकाता',
      'Pune': 'पुणे',
    },
    bn: {
      'Mumbai': 'মুম্বাই',
      'Bengaluru': 'বেঙ্গালুরু',
      'Bangalore': 'বেঙ্গালুরু',
      'Hyderabad': 'হায়দ্রাবাদ',
      'Delhi': 'দিল্লি',
      'Chennai': 'চেন্নাই',
      'Kolkata': 'কলকাতা',
      'Pune': 'পুনে',
    },
    kn: {
      'Mumbai': 'ಮುಂಬೈ',
      'Bengaluru': 'ಬೆಂಗಳೂರು',
      'Bangalore': 'ಬೆಂಗಳೂರು',
      'Hyderabad': 'ಹೈದರಾಬಾದ್',
      'Delhi': 'ದೆಹಲಿ',
      'Chennai': 'ಚೆನ್ನೈ',
      'Kolkata': 'ಕೋಲ್ಕತ್ತಾ',
      'Pune': 'ಪುಣೆ',
    },
    te: {
      'Mumbai': 'ముంబై',
      'Bengaluru': 'బెంగళూరు',
      'Bangalore': 'బెంగళూరు',
      'Hyderabad': 'హైదరాబాద్',
      'Delhi': 'ఢిల్లీ',
      'Chennai': 'చెన్నై',
      'Kolkata': 'కోల్కతా',
      'Pune': 'పూణే',
    },
    ml: {
      'Mumbai': 'മുംബൈ',
      'Bengaluru': 'ബെംഗളൂരു',
      'Bangalore': 'ബെംഗളൂരു',
      'Hyderabad': 'ഹൈദരാബാദ്',
      'Delhi': 'ഡെൽഹി',
      'Chennai': 'ചെന്നൈ',
      'Kolkata': 'കൊൽക്കത്ത',
      'Pune': 'പൂണെ',
    },
    ta: {
      'Mumbai': 'மும்பை',
      'Bengaluru': 'பெங்களூரு',
      'Bangalore': 'பெங்களூரு',
      'Hyderabad': 'ஹைதராபாத்',
      'Delhi': 'டெல்லி',
      'Chennai': 'சென்னை',
      'Kolkata': 'கொல்கத்தா',
      'Pune': 'புனே',
    },
    mr: {
      'Mumbai': 'मुंबई',
      'Bengaluru': 'बेंगलुरु',
      'Bangalore': 'बेंगलुरु',
      'Hyderabad': 'हैदराबाद',
      'Delhi': 'दिल्ली',
      'Chennai': 'चेन्नई',
      'Kolkata': 'कोलकाता',
      'Pune': 'पुणे',
    },
  };
  
  const translations = cityMap[lang];
  if (translations && translations[city]) {
    return translations[city];
  }
  
  return city;
}

// Translate names based on selected language (for known test/demo names)
function translateName(name) {
  if (!name || state.language === 'en') return name;
  
  const lang = state.language || 'en';
  
  // Normalize name: handle variations like "Dr. Berry Stone" vs "Dr.Berry Stone"
  const normalizedName = name.replace(/Dr\.\s*/g, 'Dr. ').trim();
  
  const nameMap = {
    hi: {
      'Pam Rice': 'पम राइस',
      'Dr. Aisha Menon': 'डॉ. आइशा मेनन',
      'Dr. Meera Iyer': 'डॉ. मीरा अय्यर',
      'Dr. Berry Stone': 'डॉ. बेरी स्टोन',
      'Dr.Berry Stone': 'डॉ. बेरी स्टोन',
      'Dr. Kabir Sharma': 'डॉ. कबीर शर्मा',
      'Dr. Kavya Rao': 'डॉ. काव्या राव',
      'Aarav Patel': 'अरविंद पटेल',
      'Isha Nair': 'इशा नायर',
      'Rohan Kulkarni': 'रोहन कुलकर्णी',
    },
    bn: {
      'Pam Rice': 'পাম রাইস',
      'Dr. Aisha Menon': 'ডা. আইশা মেনন',
      'Dr. Meera Iyer': 'ডা. মীরা আইয়ার',
      'Dr. Berry Stone': 'ডা. বেরি স্টোন',
      'Dr.Berry Stone': 'ডা. বেরি স্টোন',
      'Dr. Kabir Sharma': 'ডা. কবির শর্মা',
      'Dr. Kavya Rao': 'ডা. কাব্য রাও',
      'Aarav Patel': 'অরবিন্দ পাটেল',
      'Isha Nair': 'ঈশা নায়ার',
      'Rohan Kulkarni': 'রোহন কুলকার্নি',
    },
    kn: {
      'Pam Rice': 'ಪ್ಯಾಮ್ ರೈಸ್',
      'Dr. Aisha Menon': 'ಡಾ. ಐಶಾ ಮೆನನ್',
      'Dr. Meera Iyer': 'ಡಾ. ಮೀರಾ ಅಯ್ಯರ್',
      'Dr. Berry Stone': 'ಡಾ. ಬೆರಿ ಸ್ಟೋನ್',
      'Dr.Berry Stone': 'ಡಾ. ಬೆರಿ ಸ್ಟೋನ್',
      'Dr. Kabir Sharma': 'ಡಾ. ಕಬೀರ್ ಶರ್ಮಾ',
      'Dr. Kavya Rao': 'ಡಾ. ಕಾವ್ಯ ರಾವ್',
      'Aarav Patel': 'ಅರವಿಂದ್ ಪಟೇಲ್',
      'Isha Nair': 'ಇಶಾ ನಾಯರ್',
      'Rohan Kulkarni': 'ರೋಹನ್ ಕುಲಕರ್ಣಿ',
    },
    te: {
      'Pam Rice': 'పామ్ రైస్',
      'Dr. Aisha Menon': 'డా. ఐషా మెనన్',
      'Dr. Meera Iyer': 'డా. మీరా అయ్యర్',
      'Dr. Berry Stone': 'డా. బెర్రీ స్టోన్',
      'Dr.Berry Stone': 'డా. బెర్రీ స్టోన్',
      'Dr. Kabir Sharma': 'డా. కబీర్ శర్మ',
      'Dr. Kavya Rao': 'డా. కావ్య రావ్',
      'Aarav Patel': 'అరవింద్ పటేల్',
      'Isha Nair': 'ఇష నాయర్',
      'Rohan Kulkarni': 'రోహన్ కులకర్ణి',
    },
    ml: {
      'Pam Rice': 'പാം റൈസ്',
      'Dr. Aisha Menon': 'ഡോ. ഐഷ മെനൻ',
      'Dr. Meera Iyer': 'ഡോ. മീര അയ്യർ',
      'Dr. Berry Stone': 'ഡോ. ബെറി സ്റ്റോൺ',
      'Dr.Berry Stone': 'ഡോ. ബെറി സ്റ്റോൺ',
      'Dr. Kabir Sharma': 'ഡോ. കബീർ ശർമ',
      'Dr. Kavya Rao': 'ഡോ. കാവ്യ റാവ്',
      'Aarav Patel': 'അരവിന്ദ് പട്ടേൽ',
      'Isha Nair': 'ഇഷ നായർ',
      'Rohan Kulkarni': 'രോഹൻ കുള്ളക്കരണി',
    },
    ta: {
      'Pam Rice': 'பாம் ரைஸ்',
      'Dr. Aisha Menon': 'டா. ஐஷா மெனன்',
      'Dr. Meera Iyer': 'டா. மீரா ஐயர்',
      'Dr. Berry Stone': 'டா. பெர்ரி ஸ்டோன்',
      'Dr.Berry Stone': 'டா. பெர்ரி ஸ்டோன்',
      'Dr. Kabir Sharma': 'டா. கபீர் ஷர்மா',
      'Dr. Kavya Rao': 'டா. காவ்ய ராவ்',
      'Aarav Patel': 'அரவிந்த் படேல்',
      'Isha Nair': 'இஷா நாயர்',
      'Rohan Kulkarni': 'ரோஹன் குல்கர்னி',
    },
    mr: {
      'Pam Rice': 'पॅम राईस',
      'Dr. Aisha Menon': 'डॉ. आइशा मेनन',
      'Dr. Meera Iyer': 'डॉ. मीरा अय्यर',
      'Dr. Berry Stone': 'डॉ. बेरी स्टोन',
      'Dr.Berry Stone': 'डॉ. बेरी स्टोन',
      'Dr. Kabir Sharma': 'डॉ. कबीर शर्मा',
      'Dr. Kavya Rao': 'डॉ. काव्या राव',
      'Aarav Patel': 'अरविंद पटेल',
      'Isha Nair': 'ईशा नायर',
      'Rohan Kulkarni': 'रोहन कुलकर्णी',
    },
  };
  
  const translations = nameMap[lang];
  if (translations) {
    // Try exact match first
    if (translations[name]) {
      return translations[name];
    }
    // Try normalized name (handles "Dr.Berry Stone" vs "Dr. Berry Stone")
    if (translations[normalizedName]) {
      return translations[normalizedName];
    }
  }
  
  // If no translation found, return original
  return name;
}

function applyI18n() {
  $$('[data-i18n]').forEach((node) => {
    const k = node.getAttribute('data-i18n');
    node.textContent = t(k);
  });

  el('brandSub').textContent = t('brand_tagline');
  el('chatInput').setAttribute(
    'placeholder',
    state.language === 'hi' ? 'संदेश लिखें...' : 'Type a message...',
  );

  const lang = LANGS.find((l) => l.code === state.language) || LANGS[0];
  el('currentLanguage').textContent = lang.label;
  el('segEN').classList.toggle('active', state.language === 'en');
  el('segHI').classList.toggle('active', state.language === 'hi');
}

// Safety: strip any leading 2-letter country codes like "US English" -> "English"
function stripCountryPrefix(text) {
  if (!text) return text;
  const m = text.match(/^[A-Z]{2}\s+(.*)$/);
  return m ? m[1] : text;
}

function toast(msg) {
  const node = el('toast');
  node.textContent = msg;
  node.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => node.classList.remove('show'), 1600);
}

function setTabsActive(screen) {
  $$('nav .tab').forEach((b) => b.classList.toggle('active', b.dataset.go === screen));
}

function go(screen) {
  if (screen === state.screen) return;
  const prev = document.querySelector('.screen.active');
  const next = document.querySelector(`.screen[data-screen="${screen}"]`);
  if (!next || !prev) return;

  prev.classList.remove('active');
  prev.classList.add('leaving');
  next.classList.add('active');
  state.screen = screen;
  setTabsActive(screen);

  // Refresh dashboard data when navigating to doctor or patient screens
  if (screen === 'doctor') {
    renderDoctorDashboard();
  } else if (screen === 'patient') {
    renderPatientDashboard();
  }

  // Start Jitsi when entering video screen with an active consultation
  if (screen === 'video' && state.activeConsultation) {
    setTimeout(initJitsi, 150);
  }
  if (screen !== 'video') {
    destroyJitsi();
  }

  setTimeout(() => prev.classList.remove('leaving'), 220);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderLanguage() {
  const list = el('languageList');
  list.innerHTML = '';
  LANGS.forEach((lng) => {
    const btn = document.createElement('button');
    btn.className = `cardItem ${state.language === lng.code ? 'selected' : ''}`;
    btn.innerHTML = `
      <div class="left">
        <div class="itemTitle">${lng.label}</div>
      </div>
      <div class="pill">${state.language === lng.code ? 'Selected' : ''}</div>
    `;
    btn.addEventListener('click', () => {
      state.language = lng.code;
      save(STORAGE.language, state.language);
      renderLanguage();
      applyI18n();
      renderRoles(); // keep role cards in the same language
      // NO navigation, NO toast - just select the language
      // User presses Continue button to proceed
    });
    list.appendChild(btn);
  });

  // Extra safety in case any text still has "US English"-style prefixes
  list.querySelectorAll('.itemTitle').forEach((node) => {
    node.textContent = stripCountryPrefix(node.textContent);
  });
}

// Global helpers for inline HTML handlers
// On the first screen, clicking a language should ONLY select/highlight it.
// The user moves to the next screen by pressing the Continue button.
function selectLanguage(code) {
  const lng = LANGS.find((l) => l.code === code);
  if (!lng) return;
  state.language = lng.code;
  save(STORAGE.language, state.language);
  
  // Track language selection in Google Analytics
  trackEvent('language_selected', 'User Preference', code);
  
  renderLanguage();
  applyI18n();
   // Keep role cards in sync so when user lands there it's already localized
   renderRoles();
  // no navigation, no toast here – keep the UX calm
}

function goSettings() {
  go('settings');
}

// Expose on window for inline onclick
window.selectLanguage = selectLanguage;
window.goSettings = goSettings;

function renderRoles() {
  const list = el('roleList');
  list.innerHTML = '';
  const roles = [
    { key: 'guest', titleKey: 'role_guest_title', descKey: 'role_guest_desc', emoji: '👀' },
    { key: 'patient', titleKey: 'role_patient_title', descKey: 'role_patient_desc', emoji: '👤' },
    { key: 'doctor', titleKey: 'role_doctor_title', descKey: 'role_doctor_desc', emoji: '👨‍⚕️' },
  ];
  roles.forEach((r) => {
    const btn = document.createElement('button');
    btn.className = `cardItem ${state.role === r.key ? 'selected' : ''}`;
    btn.innerHTML = `
      <div class="left">
        <div class="flag" aria-hidden="true">${r.emoji}</div>
        <div>
          <div class="itemTitle">${t(r.titleKey)}</div>
          <div class="itemSub">${t(r.descKey)}</div>
        </div>
      </div>
      <div class="chev" aria-hidden="true">›</div>
    `;
    btn.addEventListener('click', () => {
      state.role = r.key;
      save(STORAGE.role, state.role);
      
      // Track role selection in Google Analytics
      trackEvent('role_selected', 'User Onboarding', r.key);
      
      renderRoles();
      if (r.key === 'guest') {
        go('chat');
      } else {
        // patient / doctor go through auth flow first
        go('login');
      }
    });
    list.appendChild(btn);
  });
}

async function renderPatientDashboard() {
  const card = el('patientCard');
  const upcoming = el('upcomingList');
  const completed = el('completedList');
  const cancelled = el('cancelledList');
  const reco = el('doctorRecoList');
  
  // Show loading state
  if (card) card.innerHTML = '<div class="cardSub">Loading...</div>';
  if (upcoming) upcoming.innerHTML = '<div class="card center"><div class="cardSub">Loading appointments...</div></div>';
  if (completed) completed.innerHTML = '';
  if (cancelled) cancelled.innerHTML = '';
  if (reco) reco.innerHTML = '';
  
  // Get current logged-in user
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'patient') {
    // Fallback to mock data if not logged in as patient - use language-specific names
    const mockData = getMockData();
    if (card) {
      card.innerHTML = `
        <div class="avatar">${mockData.PATIENT.name.charAt(0)}</div>
        <div style="flex:1">
          <div class="itemTitle">${mockData.PATIENT.name}</div>
          <div class="patientMeta">${mockData.PATIENT.age} • ${mockData.PATIENT.city}</div>
          <div class="patientCond">${translateCondition(mockData.PATIENT.conditions)}</div>
        </div>
      `;
    }
    if (upcoming) {
      upcoming.innerHTML = '';
      const booking = load(STORAGE.booking, null);
      const rows = booking
        ? [{ doctorName: booking.doctorName, specialty: booking.specialty, date: booking.date, time: booking.time, status: 'Scheduled' }, ...mockData.UPCOMING]
        : mockData.UPCOMING;
      rows.forEach((a) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <div class="apptTitle">${translateName(a.doctorName)}</div>
          <div class="apptMeta">${translateSpecialty(a.specialty)} • ${a.date} • ${a.time}</div>
          <div class="apptStatus">${a.status}</div>
        `;
        upcoming.appendChild(div);
      });
    }
    return;
  }
  
  // Fetch real data from database
  console.log('renderPatientDashboard: Current user ID:', currentUser.id);
  console.log('renderPatientDashboard: Current user:', currentUser);
  const patientProfile = await fetchPatientProfile(currentUser.id);
  const appointments = await fetchPatientAppointments(currentUser.id);
  console.log('renderPatientDashboard: Fetched appointments count:', appointments?.length || 0);
  
  // Render patient profile
  if (card) {
    if (patientProfile) {
      let conditionsRaw = patientProfile.medical_conditions && patientProfile.medical_conditions.length > 0
        ? patientProfile.medical_conditions.join(', ')
        : 'No conditions listed';
      // Translate conditions - handle both single conditions and comma-separated lists
      let conditions = conditionsRaw;
      if (conditionsRaw && conditionsRaw !== 'No conditions listed') {
        if (conditionsRaw.includes(',')) {
          conditions = conditionsRaw.split(',').map(c => translateCondition(c.trim())).join(', ');
        } else {
          conditions = translateCondition(conditionsRaw);
        }
      }
      card.innerHTML = `
        <div class="avatar">${patientProfile.full_name.charAt(0)}</div>
        <div style="flex:1">
          <div class="itemTitle">${translateName(patientProfile.full_name)}</div>
          <div class="patientMeta">${patientProfile.age ? patientProfile.age + ' • ' : ''}${patientProfile.city || ''}</div>
          <div class="patientCond">${conditions}</div>
        </div>
      `;
    } else {
      // Fallback if profile not found
      card.innerHTML = `
        <div class="avatar">${currentUser.username.charAt(0).toUpperCase()}</div>
        <div style="flex:1">
          <div class="itemTitle">${currentUser.username}</div>
          <div class="patientMeta">Update your profile in settings</div>
        </div>
      `;
    }
  }
  
  // Render upcoming appointments
  if (upcoming) {
    upcoming.innerHTML = '';
    
    const todayIso = getLocalDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = new Date(todayIso + 'T00:00:00');

    const upcomingAppointments = appointments.filter((a) => {
      if (a.statusRaw !== 'scheduled') return false;
      if (!a.dateRaw) return false;
      const aptDate = new Date(a.dateRaw + 'T00:00:00');
      if (aptDate.getTime() < todayStart.getTime()) return false; // past date
      if (aptDate.getTime() > todayStart.getTime()) return true;   // future date
      return isAppointmentInFuture(a.dateRaw, a.timeRaw);         // today: only if time is in future
    });
    
    if (upcomingAppointments.length === 0) {
      upcoming.innerHTML = `
        <div class="card center">
          <div class="cardSub">No upcoming appointments</div>
        </div>
      `;
    } else {
      const i18n = I18N[state.language] || I18N.en;
      upcomingAppointments.forEach((a) => {
        const div = document.createElement('div');
        div.className = 'card';

        // Determine if cancel/reschedule is allowed (>= 12 hours before)
        let canModify = false;
        if (a.dateRaw && a.timeRaw) {
          const dt = new Date(a.dateRaw);
          const [hh, mm] = (a.timeRaw || a.time || '').split(':');
          if (!isNaN(hh) && !isNaN(mm)) {
            dt.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
            const now = new Date();
            const diffMs = dt.getTime() - now.getTime();
            const hours = diffMs / (1000 * 60 * 60);
            if (hours >= 12) canModify = true;
          }
        }

        const showJoin = canJoinConsultation(a);

        div.innerHTML = `
          <div class="apptTitle">${translateName(a.doctorName)}</div>
          <div class="apptMeta">${translateSpecialty(a.specialty)} • ${a.date} • ${a.time}</div>
          <div class="apptStatus">${a.status}</div>
          ${
            showJoin
              ? `<div class="apptActions"><button class="btn primary btnSmall" type="button" data-action="join" data-appointment-id="${a.id || ''}">${i18n.join_call}</button></div>`
              : !canModify && a.dateRaw && a.timeRaw
                ? `<div class="apptSub" style="font-size:12px;color:#6b7280;margin-top:4px;">${i18n.join_available_soon}</div>`
                : ''
          }
          ${
            canModify
              ? `<div class="apptActions">
                  <button class="btn ghost btnSmall" type="button" data-action="cancel">Cancel</button>
                  <button class="btn primary btnSmall" type="button" data-action="reschedule">Reschedule</button>
                </div>`
              : ''
          }
        `;

        if (canModify) {
          const cancelBtn = div.querySelector('button[data-action="cancel"]');
          const rescheduleBtn = div.querySelector('button[data-action="reschedule"]');
          if (cancelBtn) cancelBtn.addEventListener('click', () => cancelAppointment(a.id));
          if (rescheduleBtn) rescheduleBtn.addEventListener('click', () => openReschedule(a));
        }

        upcoming.appendChild(div);
      });
    }
  }
  
  // Render completed appointments
  // Render completed appointments
  if (completed) {
    completed.innerHTML = '';
    
    const completedAppointments = appointments.filter((a) => a.statusRaw === 'completed');
    completedAppointments.sort((a, b) => {
      if (a.dateRaw && b.dateRaw) {
        return new Date(b.dateRaw) - new Date(a.dateRaw);
      }
      return 0;
    });
    
    if (completedAppointments.length === 0) {
      completed.innerHTML = `
        <div class="card center">
          <div class="cardSub">No completed appointments</div>
        </div>
      `;
    } else {
      completedAppointments.forEach((a) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <div class="apptTitle">${translateName(a.doctorName)}</div>
          <div class="apptMeta">${translateSpecialty(a.specialty)} • ${a.date} • ${a.time}</div>
          <div class="apptStatus">${a.status}</div>
        `;
        completed.appendChild(div);
      });
    }
  }

  // Render cancelled appointments section (data will come from DB once status is updated there)
  if (cancelled) {
    cancelled.innerHTML = '';
    const cancelledAppointments = appointments.filter((a) => a.statusRaw === 'cancelled');
    if (cancelledAppointments.length === 0) {
      cancelled.innerHTML = `
        <div class="card center">
          <div class="cardSub">No cancelled appointments</div>
        </div>
      `;
    } else {
      cancelledAppointments.forEach((a) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <div class="apptTitle">${translateName(a.doctorName)}</div>
          <div class="apptMeta">${translateSpecialty(a.specialty)} • ${a.date} • ${a.time}</div>
          <div class="apptStatus">${a.status}</div>
        `;
        cancelled.appendChild(div);
      });
    }
  }
  
  // Fetch recommended doctors (matching patient's city if available)
  const patientCity = patientProfile?.city || null;
  fetchDoctorsFromDB(patientCity).then((doctors) => {
    if (reco) {
      reco.innerHTML = '';
      if (doctors.length === 0) {
        // If no doctors in patient's city, show all available doctors
        return fetchDoctorsFromDB();
      }
      return doctors;
    }
    return [];
  }).then((doctors) => {
    if (reco && doctors.length > 0) {
      // Show top 3 recommended doctors
      doctors.slice(0, 3).forEach((d) => {
        reco.appendChild(doctorCardNode(d, 'View', () => go('doctors')));
      });
    } else if (reco && doctors.length === 0) {
      // Fallback to mock doctors with language-specific names
      const mockData = getMockData();
      mockData.DOCTORS.slice(0, 3).forEach((d) => {
        reco.appendChild(doctorCardNode(d, 'View', () => go('doctors')));
      });
    }
  });
}

function doctorCardNode(d, actionLabel, onAction) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const rating = typeof d.rating === 'number' ? d.rating.toFixed(1) : (parseFloat(d.rating) || 0).toFixed(1);
  const clinicName = d.clinic || d.clinic_name || 'Clinic';
  const cityName = d.city || '';
  const i18n = I18N[state.language] || I18N.en;
  
  // Translate clinic and city names
  const translatedClinic = translateClinic(clinicName);
  const translatedCity = translateCity(cityName);
  
  // Translate nextSlot format: "Today • Available" -> translated version
  let nextSlotText = d.nextSlot || i18n.available;
  if (nextSlotText.includes('Today')) {
    nextSlotText = nextSlotText.replace('Today', i18n.today);
  }
  if (nextSlotText.includes('Available')) {
    nextSlotText = nextSlotText.replace('Available', i18n.available);
  }
  
  // Translate action label (View button)
  const translatedActionLabel = actionLabel === 'View' ? (i18n.view || 'View') : actionLabel;
  
  wrap.innerHTML = `
    <div class="doctorRow">
      <div class="docAvatar">${(d.name.split(' ')[1] || d.name)[0]}</div>
      <div style="flex:1">
        <div class="docName">${translateName(d.name)}</div>
        <div class="docSpec">${translateSpecialty(d.specialty)}</div>
        <div class="docMeta">${translatedClinic}${translatedCity ? ' • ' + translatedCity : ''}</div>
      </div>
      <div class="pill">★ ${rating}</div>
    </div>
    <div class="docFooter">
      <div class="docSlot">${i18n.next_slot}${nextSlotText}</div>
      <button class="btn primary btnSmall" type="button">${translatedActionLabel}</button>
    </div>
  `;
  wrap.querySelector('button').addEventListener('click', onAction);
  return wrap;
}

async function renderDoctorSearch() {
  const list = el('doctorList');
  const i18n = I18N[state.language] || I18N.en;
  list.innerHTML = '<div class="card center"><div class="cardSub">Loading doctors...</div></div>';
  
  // Check if we have filtered doctors from AI suggestion
  let doctors = [];
  if (state.suggestedDoctors && state.suggestedDoctors.length > 0) {
    doctors = state.suggestedDoctors;
    state.suggestedDoctors = null; // Clear after use
  } else {
    // Normal flow: fetch all doctors
    doctors = await fetchDoctorsFromDB();
  }
  
  list.innerHTML = '';
  
  if (doctors.length === 0) {
    list.innerHTML = `<div class="card center"><div class="cardSub">${i18n.no_doctors_available}</div></div>`;
    return;
  }

  const currentUser = getCurrentUser();

  doctors.forEach((d) => {
    list.appendChild(
      doctorCardNode(d, i18n.book_button, () => {
        // If not logged in as patient, keep simple localStorage + video flow
        if (!currentUser || currentUser.role !== 'patient') {
          const timePart = d.nextSlot.split('•')[1]?.trim() || '6:30 PM';
          const booking = {
            doctorName: d.name,
            specialty: d.specialty, // Store original, will translate when displaying
            date: i18n.today,
            time: timePart,
          };
          save(STORAGE.booking, booking);
          toast(i18n.booking_confirmed_toast);
          renderBookingCard();
          go('video');
          return;
        }

        // Logged-in patient: open advanced booking screen
        openBookingScreen(d);
      }),
    );
  });
  renderBookingCard();
}

function renderBookingCard() {
  const booking = load(STORAGE.booking, null);
  const card = el('bookingCard');
  if (!booking) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  const i18n = I18N[state.language] || I18N.en;
  card.innerHTML = `
    <div class="cardTitle">${i18n.booking_confirmed}</div>
    <div class="cardSub">${translateName(booking.doctorName)} • ${translateSpecialty(booking.specialty)}</div>
    <div class="cardSub">${booking.date} • ${booking.time}</div>
  `;
}

// ---------- AGENTIC AI BOOKING HANDLER ----------

async function handleConsultDoctorAction(doctors, reason) {
  const currentUser = getCurrentUser();
  const i18n = I18N[state.language] || I18N.en;
  
  // Store consultation reason for booking
  state.consultationReason = reason || 'Consultation';
  
  // If no doctors from n8n, fetch from database as fallback
  // fetchDoctorsFromDB already has fallback to mock data, so we'll always get doctors
  if (!doctors || doctors.length === 0) {
    console.log('No doctors from n8n, fetching from database...');
    doctors = await fetchDoctorsFromDB();
    console.log('Fetched doctors from DB:', doctors.length);
  }
  
  // Navigate to doctor search with doctors (from n8n, DB, or mock fallback)
  state.suggestedDoctors = doctors;
  go('doctors');
}

// ---------- ADVANCED BOOKING HELPERS ----------

// Current date in user's local timezone as YYYY-MM-DD (no UTC shift)
function getLocalDateString(dateOrUndefined) {
  const d = dateOrUndefined ? new Date(dateOrUndefined) : new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// True if appointment date+time is after now (used for Upcoming / future-only lists)
function isAppointmentInFuture(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const t = String(timeStr).trim();
  const parts = t.split(':').map((n) => parseInt(n, 10));
  const h = isNaN(parts[0]) ? 0 : parts[0];
  const m = isNaN(parts[1]) ? 0 : parts[1];
  const at = new Date(dateStr + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
  return at > new Date();
}

// Generate 30-minute slots (local time). Default 09:00–17:00; use endHour 22 for today (open till 10 PM).
function generateBrisbaneSlotsForDate(dateStr, endHour) {
  const end = endHour != null ? endHour : 17;
  const slots = [];
  for (let h = 9; h < end; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

async function fetchDoctorDayAppointments(doctorId, dateStr) {
  // Use the same Supabase client used elsewhere; fail gracefully if missing
  if (!supabaseClient || !doctorId || !dateStr) {
    console.log('fetchDoctorDayAppointments: Missing params', { supabaseClient: !!supabaseClient, doctorId, dateStr });
    return [];
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('appointments')
      .select('id, appointment_date, appointment_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', dateStr);
    
    if (error) {
      console.error('Error fetching doctor day appointments:', error);
      return [];
    }
    
    if (!data) {
      console.log('No appointments found for doctor', doctorId, 'on', dateStr);
      return [];
    }
    
    console.log('Found', data.length, 'appointments for doctor', doctorId, 'on', dateStr);
    return data;
  } catch (err) {
    console.error('Exception in fetchDoctorDayAppointments:', err);
    return [];
  }
}

function openBookingScreen(doctor, existingAppointment) {
  state.bookingDoctor = doctor;
  state.bookingSlot = null;

  // Minimum date: today in user's local timezone (no past dates)
  const todayIso = getLocalDateString();

  // Use existing appointment date if rescheduling and date is not in the past; otherwise today
  const existingDateRaw = existingAppointment?.dateRaw || existingAppointment?.date;
  let startDate = todayIso;
  if (existingDateRaw && String(existingDateRaw).length >= 10) {
    const existingIso = String(existingDateRaw).slice(0, 10);
    if (existingIso >= todayIso) startDate = existingIso;
  }

  state.bookingDate = startDate;

  const i18n = I18N[state.language] || I18N.en;

  // Fill doctor info
  const name = doctor.name || doctor.full_name || i18n.unknown_doctor;
  const clinicName = translateClinic(doctor.clinic || doctor.clinic_name || 'Clinic');
  const cityName = translateCity(doctor.city || '');

  const avatarEl = el('bookDoctorAvatar');
  const nameEl = el('bookDoctorName');
  const specEl = el('bookDoctorSpec');
  const metaEl = el('bookDoctorMeta');
  const dateInput = el('bookDate');

  if (avatarEl) avatarEl.textContent = (name.split(' ')[1] || name)[0];
  if (nameEl) nameEl.textContent = translateName(name);
  if (specEl) specEl.textContent = translateSpecialty(doctor.specialty || 'General Physician');
  if (metaEl) metaEl.textContent = clinicName + (cityName ? ' • ' + cityName : '');
  if (dateInput) {
    dateInput.value = state.bookingDate;
    dateInput.min = todayIso; // cannot pick past dates
  }

  renderBookingSlots();
  go('book');
}

async function renderBookingSlots() {
  const container = el('bookSlots');
  if (!container || !state.bookingDoctor || !state.bookingDate) return;
  container.innerHTML = '';

  // Today (local): slots open till 10 PM (22:00). Other days: till 5 PM (17:00).
  const isToday = state.bookingDate === getLocalDateString();
  const allSlots = generateBrisbaneSlotsForDate(state.bookingDate, isToday ? 22 : 17);

  const i18n = I18N[state.language] || I18N.en;
  const slotsSub = document.querySelector('[data-i18n="booking_slots_sub"]');
  if (slotsSub) slotsSub.textContent = isToday ? (i18n.booking_slots_sub_today || 'Today: 09:00–22:00') : i18n.booking_slots_sub;

  // Load booked slots for this doctor and date
  let bookedSet = new Set();
  try {
    const bookedAppointments = await fetchDoctorDayAppointments(state.bookingDoctor.id, state.bookingDate);
    console.log('Booked appointments for doctor', state.bookingDoctor.id, 'on', state.bookingDate, ':', bookedAppointments);
    
    // Normalize time to HH:MM so it matches slot format (e.g. "09:00:00" -> "09:00", "9:00" -> "09:00")
    function toSlotTime(t) {
      const s = String(t || '').trim();
      if (!s) return '';
      const parts = s.split(':').map((n) => parseInt(n, 10));
      const h = isNaN(parts[0]) ? 0 : parts[0];
      const m = isNaN(parts[1]) ? 0 : parts[1];
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    bookedSet = new Set(
      bookedAppointments
        .filter((a) => a.status !== 'cancelled')
        .map((a) => toSlotTime(a.appointment_time))
        .filter((t) => t.length > 0),
    );
    
    console.log('Normalized booked times:', Array.from(bookedSet));
  } catch (err) {
    console.error('Error loading booked slots', err);
    bookedSet = new Set();
  }

  const now = new Date();
  const minSlotTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now onwards

  // Weekdays only for future dates; today is always allowed (e.g. today open till 10 PM even if Sunday)
  const selectedDate = new Date(state.bookingDate + 'T12:00:00');
  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendNotAllowed = isWeekend && !isToday;

  if (weekendNotAllowed) {
    const msg = document.createElement('p');
    msg.className = 'slotGridMessage';
    msg.textContent = (I18N[state.language] || I18N.en).weekdays_only_message || 'Choose a weekday to see available slots.';
    msg.style.cssText = 'font-size:14px; color:#6b7280; margin:12px 0; padding:12px; background:#f3f4f6; border-radius:8px;';
    container.appendChild(msg);
    return;
  }

  allSlots.forEach((time) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slotBtn';
    btn.textContent = time;

    const isPastSlot = isToday && (() => {
      const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
      const slotAt = new Date(now);
      slotAt.setHours(hh, mm, 0, 0);
      return slotAt < minSlotTime; // disable if slot is before 30 min from now
    })();

    const isBooked = bookedSet.has(time);
    const disabled = isBooked || isPastSlot;
    let titleMsg = (I18N[state.language] || I18N.en).slot_booked;
    if (isPastSlot) titleMsg = (I18N[state.language] || I18N.en).slot_passed;

    if (disabled) {
      btn.classList.add('disabled');
      btn.disabled = true;
      btn.title = titleMsg;
    } else {
      btn.addEventListener('click', () => {
        state.bookingSlot = time;
        Array.from(container.querySelectorAll('.slotBtn')).forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    }

    container.appendChild(btn);
  });
}

async function confirmBooking() {
  const i18n = I18N[state.language] || I18N.en;
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'patient') {
    toast('Please login as patient to book');
    return;
  }
  if (!state.bookingDoctor || !state.bookingDate || !state.bookingSlot) {
    toast('Please choose a date and time');
    return;
  }
  if (!supabaseClient) {
    toast('Database not connected');
    return;
  }

  // Ensure appointment is at least 30 minutes from now
  const [hh, mm] = state.bookingSlot.split(':').map((n) => parseInt(n, 10));
  const appointmentAt = new Date(state.bookingDate + 'T' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':00');
  const minAllowed = new Date(Date.now() + 30 * 60 * 1000);
  if (appointmentAt < minAllowed) {
    toast(i18n.booking_future_only);
    return;
  }

  // Re-check slot is still available (avoid double-book if someone else took it)
  const existingOnSlot = await fetchDoctorDayAppointments(state.bookingDoctor.id, state.bookingDate);
  const slotNorm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const isBooked = existingOnSlot.some((a) => {
    if (a.status === 'cancelled') return false;
    const t = String(a.appointment_time || '').trim();
    const parts = t.split(':').map((n) => parseInt(n, 10));
    const existing = String(parts[0] ?? 0).padStart(2, '0') + ':' + String(parts[1] ?? 0).padStart(2, '0');
    return existing === slotNorm;
  });
  if (isBooked) {
    toast(i18n.slot_booked);
    renderBookingSlots(); // refresh slots so user can pick another
    return;
  }

  // Insert appointment in Supabase
  const payload = {
    patient_id: currentUser.id,
    doctor_id: state.bookingDoctor.id,
    appointment_date: state.bookingDate,
    appointment_time: state.bookingSlot,
    status: 'scheduled',
    reason: state.consultationReason || 'Consultation', // Use AI-suggested reason if available
  };

  const { error } = await supabaseClient.from('appointments').insert(payload);
  if (error) {
    console.error('Booking error', error);
    toast('Could not book appointment');
    return;
  }

  // Track booking in GA
  trackEvent('appointment_booked', 'Booking', state.bookingDoctor.id);

  toast(i18n.booking_confirmed_toast);
  // Refresh patient dashboard and go back
  await renderPatientDashboard();
  go('patient');
}

async function cancelAppointment(appointmentId) {
  if (!supabase) return;
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);
  if (error) {
    console.error('Cancel error', error);
    toast('Could not cancel');
    return;
  }
  trackEvent('appointment_cancelled', 'Booking', appointmentId);
  await renderPatientDashboard();
}

function openReschedule(appointment) {
  if (!appointment) return;
  const doctor = {
    id: appointment.doctorId,
    name: appointment.doctorName,
    specialty: appointment.specialty,
    clinic: appointment.clinic,
    city: appointment.city,
  };
  openBookingScreen(doctor, appointment);
}

async function renderDoctorDashboard() {
  const profile = el('doctorProfile');
  const list = el('patientList');
  const upcomingList = el('doctorUpcomingList');
  const completedList = el('doctorCompletedList');
  const statToday = document.querySelector('#statTodayValue');
  const statPending = document.querySelector('#statPendingValue');
  const statRating = document.querySelector('#statRatingValue');
  
  // Show loading state
  if (profile) profile.innerHTML = '<div class="cardSub">Loading...</div>';
  if (list) list.innerHTML = '<div class="card center"><div class="cardSub">Loading patients...</div></div>';
  if (upcomingList) upcomingList.innerHTML = '<div class="card center"><div class="cardSub">Loading...</div></div>';
  if (completedList) completedList.innerHTML = '<div class="card center"><div class="cardSub">Loading...</div></div>';
  
  // Get current logged-in user
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'doctor') {
    // Fallback to mock data if not logged in as doctor
    if (profile) {
      const mockData = getMockData();
      profile.innerHTML = `
        <div class="doctorRow">
          <div class="docAvatar">${mockData.DOCTOR_PROFILE.name.charAt(0)}</div>
          <div style="flex:1">
            <div class="docName">${mockData.DOCTOR_PROFILE.name}</div>
            <div class="docSpec">${translateSpecialty(mockData.DOCTOR_PROFILE.specialty)}</div>
            <div class="docMeta">${translateClinic(mockData.DOCTOR_PROFILE.clinic)} • ${translateCity(mockData.DOCTOR_PROFILE.city)}</div>
          </div>
        </div>
      `;
    }
    if (list) {
      list.innerHTML = '';
      const mockData = getMockData();
      mockData.PATIENTS.forEach((p) => {
        const div = document.createElement('div');
        div.className = 'card patientCard';
        const translatedConditions = translateCondition(p.conditions);
        div.innerHTML = `
          <div class="avatar">${p.name.charAt(0)}</div>
          <div style="flex:1">
            <div class="itemTitle">${translateName(p.name)}</div>
            <div class="patientMeta">${p.age} • ${p.city}</div>
            <div class="patientCond">${translatedConditions}</div>
          </div>
        `;
        list.appendChild(div);
      });
    }
    return;
  }
  
  // Fetch real data from database
  const doctorProfile = await fetchDoctorProfile(currentUser.id);
  const stats = await fetchDoctorStats(currentUser.id);
  const todaysPatients = await fetchTodaysPatients(currentUser.id);
  const upcomingAppointments = await fetchDoctorUpcomingAppointments(currentUser.id);
  const completedAppointments = await fetchDoctorCompletedAppointments(currentUser.id);
  
  // Render doctor profile
  if (profile) {
    if (doctorProfile) {
      profile.innerHTML = `
        <div class="doctorRow">
          <div class="docAvatar">${doctorProfile.full_name.charAt(0)}</div>
          <div style="flex:1">
            <div class="docName">${translateName(doctorProfile.full_name)}</div>
            <div class="docSpec">${translateSpecialty(doctorProfile.specialty || 'General Medicine')}</div>
            <div class="docMeta">${translateClinic(doctorProfile.clinic_name || 'Clinic')} • ${translateCity(doctorProfile.city || '')}</div>
          </div>
        </div>
      `;
    } else {
      // Fallback if profile not found
      profile.innerHTML = `
        <div class="doctorRow">
          <div class="docAvatar">${currentUser.username.charAt(0).toUpperCase()}</div>
          <div style="flex:1">
            <div class="docName">Dr. ${currentUser.username}</div>
            <div class="docSpec">${translateSpecialty('General Medicine')}</div>
            <div class="docMeta">Update your profile in settings</div>
          </div>
        </div>
      `;
    }
  }
  
  // Update statistics (Today = future appointments today only, to match list below)
  if (statToday) statToday.textContent = todaysPatients.length;
  if (statPending) statPending.textContent = stats.pendingFollowups;
  if (statRating) statRating.textContent = stats.rating.toFixed(1);

  // Render patient list
  if (list) {
    list.innerHTML = '';

    if (todaysPatients.length === 0) {
      list.innerHTML = '<div class="card center"><div class="cardSub">No patients scheduled for today</div></div>';
    } else {
      const i18n = I18N[state.language] || I18N.en;
      todaysPatients.forEach((p) => {
        const div = document.createElement('div');
        div.className = 'card patientCard';
        let translatedConditions = p.conditions;
        if (p.conditions && p.conditions !== 'Consultation') {
          if (p.conditions.includes(',')) {
            translatedConditions = p.conditions.split(',').map(c => translateCondition(c.trim())).join(', ');
          } else {
            translatedConditions = translateCondition(p.conditions);
          }
        } else if (p.conditions === 'Consultation') {
          translatedConditions = translateCondition('Consultation');
        }
        const showJoin = canJoinConsultation(p);
        const showJoinDisabled = !showJoin && p.dateRaw && p.timeRaw && isAppointmentInFuture(p.dateRaw, p.timeRaw);
        const timeDisplay = p.timeRaw ? new Date('2000-01-01T' + String(p.timeRaw).trim()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
        div.innerHTML = `
          <div class="avatar">${p.name.charAt(0)}</div>
          <div style="flex:1">
            <div class="itemTitle">${translateName(p.name)}</div>
            <div class="patientMeta">${p.age ? p.age + ' • ' : ''}${p.city}</div>
            <div class="patientCond">${translatedConditions}</div>
            ${timeDisplay ? `<div class="patientCond" style="font-size:12px;color:#6b7280;">${timeDisplay}</div>` : ''}
            ${showJoin ? `<div class="apptActions" style="margin-top:8px;"><button class="btn primary btnSmall" type="button" data-action="join" data-appointment-id="${p.id || ''}">${i18n.join_call}</button></div>` : ''}
            ${showJoinDisabled ? `<div class="apptActions" style="margin-top:8px;"><button class="btn primary btnSmall" type="button" disabled title="${i18n.join_available_soon}">${i18n.join_call}</button></div>` : ''}
            ${!showJoin && !showJoinDisabled && p.dateRaw && p.timeRaw ? `<div class="apptSub" style="font-size:11px;color:#9ca3af;">${i18n.join_available_soon}</div>` : ''}
          </div>
        `;
        list.appendChild(div);
      });
    }
  }
  
  // Render upcoming appointments
  if (upcomingList) {
    upcomingList.innerHTML = '';
    
    if (upcomingAppointments.length === 0) {
      upcomingList.innerHTML = '<div class="card center"><div class="cardSub">No upcoming appointments</div></div>';
    } else {
      const i18n = I18N[state.language] || I18N.en;
      upcomingAppointments.forEach((apt) => {
        const div = document.createElement('div');
        div.className = 'card patientCard';
        const showJoin = canJoinConsultation(apt);
        const showJoinDisabled = !showJoin && apt.dateRaw && apt.timeRaw && isAppointmentInFuture(apt.dateRaw, apt.timeRaw);
        div.innerHTML = `
          <div class="avatar">${apt.patientName.charAt(0)}</div>
          <div style="flex:1">
            <div class="itemTitle">${translateName(apt.patientName)}</div>
            <div class="patientMeta">${apt.patientAge ? apt.patientAge + ' • ' : ''}${apt.patientCity}</div>
            <div class="patientCond">${apt.date} • ${apt.time}</div>
            <div class="patientCond" style="margin-top: 4px; font-size: 12px; color: #666;">${translateCondition(apt.reason)}</div>
            ${showJoin ? `<div class="apptActions" style="margin-top:8px;"><button class="btn primary btnSmall" type="button" data-action="join" data-appointment-id="${apt.id || ''}">${i18n.join_call}</button></div>` : ''}
            ${showJoinDisabled ? `<div class="apptActions" style="margin-top:8px;"><button class="btn primary btnSmall" type="button" disabled title="${i18n.join_available_soon}">${i18n.join_call}</button></div>` : ''}
            ${!showJoin && !showJoinDisabled && apt.dateRaw && apt.timeRaw ? `<div class="apptSub" style="font-size:11px;color:#9ca3af;">${i18n.join_available_soon}</div>` : ''}
          </div>
          <div class="apptStatus" style="margin-top: 8px;">${apt.status}</div>
        `;
        upcomingList.appendChild(div);
      });
    }
  }
  
  // Render completed appointments
  if (completedList) {
    completedList.innerHTML = '';
    
    if (completedAppointments.length === 0) {
      completedList.innerHTML = '<div class="card center"><div class="cardSub">No completed appointments</div></div>';
    } else {
      completedAppointments.forEach((apt) => {
        const div = document.createElement('div');
        div.className = 'card patientCard';
        div.innerHTML = `
          <div class="avatar">${apt.patientName.charAt(0)}</div>
          <div style="flex:1">
            <div class="itemTitle">${translateName(apt.patientName)}</div>
            <div class="patientMeta">${apt.patientAge ? apt.patientAge + ' • ' : ''}${apt.patientCity}</div>
            <div class="patientCond">${apt.date} • ${apt.time}</div>
            ${apt.notes ? `<div class="patientCond" style="margin-top: 4px; font-size: 12px; color: #666;">${translateCondition(apt.notes)}</div>` : ''}
          </div>
          <div class="apptStatus" style="margin-top: 8px; opacity: 0.7;">${apt.status}</div>
        `;
        completedList.appendChild(div);
      });
    }
  }
}

function defaultChat() {
  return [
    {
      from: 'ai',
      text:
        state.language === 'hi'
          ? 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता/सकती हूँ?'
          : 'Hello! How can I support your health today?',
    },
    {
      from: 'user',
      text:
        state.language === 'hi'
          ? 'गले में दर्द और हल्का बुखार है।'
          : 'I have a sore throat and mild fever.',
    },
    {
      from: 'ai',
      text:
        state.language === 'hi'
          ? 'मैं घरेलू देखभाल बता सकता/सकती हूँ और पास के डॉक्टर ढूंढ सकता/सकती हूँ।'
          : 'I can suggest home care and find doctors nearby.',
    },
  ];
}

function addBubble(from, text) {
  const list = el('chatList');
  const div = document.createElement('div');
  div.className = `bubble ${from === 'user' ? 'user' : 'ai'}`;
  div.textContent = text;
  list.appendChild(div);
  scrollChatToBottom();
}

function renderChat() {
  const saved = load(STORAGE.chat, null);
  const chat = Array.isArray(saved) && saved.length ? saved : defaultChat();
  el('chatList').innerHTML = '';
  chat.forEach((m) => addBubble(m.from, m.text));
  save(STORAGE.chat, chat);
}

function resetChat() {
  // Clear stored chat and UI so every fresh entry to chat starts clean
  save(STORAGE.chat, []);
  const list = el('chatList');
  if (list) list.innerHTML = '';
  const input = el('chatInput');
  if (input) input.value = '';
}

function scrollChatToBottom() {
  const wrap = document.querySelector('.chatWrap');
  if (!wrap) return;
  wrap.scrollTop = wrap.scrollHeight;
}

// Call n8n webhook to get AI response
async function callN8nLLM(userText) {
  // If n8n webhook URL is not configured, return null to use mock responses
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.trim() === '') {
    return null;
  }

  const history = load(STORAGE.chat, []) || [];
  
  // Prepare chat history (last 6 messages for context)
  const chatHistory = history
    .slice(-6)
    .map(msg => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

  const payload = {
    language: state.language || 'en',  // e.g. "hi", "en", "ta", "bn", etc.
    role: state.role || 'guest',        // "patient", "doctor", "guest"
    message: userText,
    history: chatHistory
  };

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('n8n error status:', res.status);
      const errorText = await res.text();
      console.error('n8n error response:', errorText);
      
      // Return error message in user's language
      if (state.language === 'hi') {
        return { type: 'text', text: 'क्षमा करें, मैं अभी जवाब नहीं दे सकता/सकती। कृपया कुछ समय बाद पुनः प्रयास करें।' };
      }
      return { type: 'text', text: 'Sorry, I could not respond right now. Please try again in a moment.' };
    }

    const data = await res.json();
    
    // Debug: Log the full response to see structure
    console.log('n8n response:', data);
    console.log('n8n response keys:', Object.keys(data));
    if (data.reply) console.log('reply content:', data.reply);
    if (data.doctors) console.log('doctors in data:', data.doctors);
    if (data.json) console.log('json property:', data.json);
    
    // Handle different response formats from n8n
    let reply = data.reply || data.response || data.message || data.text;
    
    // If reply is still not found, try common paths
    if (!reply && data.choices && data.choices[0] && data.choices[0].message) {
      reply = data.choices[0].message.content;
    }
    
    if (!reply && data.data && data.data[0] && data.data[0].content) {
      reply = data.data[0].content[0]?.text || data.data[0].content;
    }
    
    if (!reply) {
      console.error('Unexpected n8n response format:', data);
      if (state.language === 'hi') {
        return { type: 'text', text: 'क्षमा करें, मुझे एक वैध जवाब नहीं मिला।' };
      }
      return { type: 'text', text: 'Sorry, I did not get a valid reply.' };
    }
    
    // Try to parse JSON if reply is a JSON string
    let parsedReply = null;
    try {
      // Check if reply is a JSON string
      if (typeof reply === 'string' && (reply.trim().startsWith('{') || reply.trim().startsWith('['))) {
        parsedReply = JSON.parse(reply);
      }
    } catch (e) {
      // Not JSON, continue with normal text
    }
    
    // Check if response has structured action (from parsed JSON or direct object)
    const actionData = parsedReply || data;
    
    // Debug: Check for doctors in various locations
    let doctorsArray = [];
    
    // Try multiple paths to find doctors array
    if (Array.isArray(actionData.doctors)) {
      doctorsArray = actionData.doctors;
    } else if (Array.isArray(data.doctors)) {
      doctorsArray = data.doctors;
    } else if (actionData.doctors && Array.isArray(actionData.doctors)) {
      doctorsArray = actionData.doctors;
    } else if (data.doctors && Array.isArray(data.doctors)) {
      doctorsArray = data.doctors;
    } else if (data.json && Array.isArray(data.json.doctors)) {
      // Check if doctors are nested in json property
      doctorsArray = data.json.doctors;
    } else if (actionData.json && Array.isArray(actionData.json.doctors)) {
      doctorsArray = actionData.json.doctors;
    }
    
    // Debug: Log the full structure to help identify where doctors are
    console.log('Doctors found:', doctorsArray.length, doctorsArray);
    console.log('Full data structure:', JSON.stringify(data, null, 2));
    console.log('ActionData structure:', JSON.stringify(actionData, null, 2));
    
    if (actionData.action === 'consult_doctor') {
      return {
        type: 'action',
        action: 'consult_doctor',
        message: actionData.message || reply || 'Finding available doctors...',
        doctors: doctorsArray,
        reason: actionData.reason || data.reason || 'Consultation',
        language: actionData.language || data.language || state.language || 'en'
      };
    }
    
    // If reply was JSON but not an action, extract message if available
    if (parsedReply && parsedReply.message) {
      return { type: 'text', text: parsedReply.message };
    }
    
    // If reply contains JSON string with action, try to extract message
    if (typeof reply === 'string' && reply.includes('"action"') && reply.includes('"message"')) {
      try {
        const jsonMatch = reply.match(/\{.*"action"[^}]*"message"\s*:\s*"([^"]+)"[^}]*\}/);
        if (jsonMatch && jsonMatch[1]) {
          // Found message in JSON string, but check if it's a consult_doctor action
          const fullJson = JSON.parse(reply);
          if (fullJson.action === 'consult_doctor') {
            return {
              type: 'action',
              action: 'consult_doctor',
              message: fullJson.message || jsonMatch[1],
              doctors: Array.isArray(fullJson.doctors) ? fullJson.doctors : (Array.isArray(data.doctors) ? data.doctors : []),
              reason: fullJson.reason || data.reason || 'Consultation',
              language: fullJson.language || data.language || state.language || 'en'
            };
          }
          return { type: 'text', text: jsonMatch[1] };
        }
      } catch (e) {
        // JSON parsing failed, continue with normal text extraction
      }
    }
    
    // Return normal text response (clean up any JSON artifacts)
    // Extract message from JSON string if present
    let cleanReply = reply;
    if (typeof reply === 'string') {
      // Try to extract message field from JSON string
      const messageMatch = reply.match(/"message"\s*:\s*"([^"]+)"/);
      if (messageMatch && messageMatch[1]) {
        cleanReply = messageMatch[1];
      } else {
        // Remove JSON structure if it's a simple JSON string
        cleanReply = reply.replace(/^\{[^}]*"message"\s*:\s*"([^"]+)"[^}]*\}$/, '$1').trim();
      }
    }
    return { type: 'text', text: cleanReply };
  } catch (err) {
    console.error('n8n call failed:', err);
    
    // Return error message in user's language
    if (state.language === 'hi') {
      return { type: 'text', text: 'नेटवर्क समस्या। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।' };
    }
    return { type: 'text', text: 'Network problem talking to AI assistant. Please check your internet and try again.' };
  }
}

function mockAIReply(userText) {
  const lower = (userText || '').toLowerCase();
  const repliesEN = [
    'Thanks — a few questions: do you have cough, chills, or difficulty breathing?',
    'For mild fever: rest, fluids, and consider paracetamol as needed. Want me to book a doctor?',
    'If symptoms persist beyond 48 hours or worsen, consult a doctor. I can find one nearby.',
  ];
  const repliesHI = [
    'धन्यवाद — कुछ सवाल: क्या खांसी, कंपकंपी या सांस लेने में दिक्कत है?',
    'हल्के बुखार में: आराम, पानी/ORS, जरूरत हो तो पैरासिटामोल। क्या मैं डॉक्टर बुक कर दूँ?',
    'यदि 48 घंटे में सुधार न हो या हालत बिगड़े, डॉक्टर से मिलें। मैं पास के डॉक्टर ढूंढ सकता/सकती हूँ।',
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (state.language === 'hi') return pick(repliesHI);
  if (lower.includes('fever') || lower.includes('throat') || lower.includes('cold')) return repliesEN[1];
  return pick(repliesEN);
}

async function sendChat() {
  const input = el('chatInput');
  const text = (input.value || '').trim();
  if (!text) return;
  
  // Track chat message sent in Google Analytics
  trackEvent('chat_message_sent', 'AI Chat', 'User Message');
  
  input.value = '';
  const chat = load(STORAGE.chat, []) || [];
  
  // Add user message
  chat.push({ from: 'user', text, ts: Date.now() });
  save(STORAGE.chat, chat);
  addBubble('user', text);

  // Add thinking/loading message
  const thinking = state.language === 'hi' ? '… सोच रहा/रही हूँ' : '… thinking';
  chat.push({ from: 'ai', text: thinking, ts: Date.now(), thinking: true });
  save(STORAGE.chat, chat);
  addBubble('ai', thinking);
  scrollChatToBottom();

  // Get AI reply from n8n (or fallback to mock)
  let reply;
  try {
    reply = await callN8nLLM(text);
    
    // If n8n is not configured or returned null, use mock response
    if (reply === null) {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 700));
      reply = { type: 'text', text: mockAIReply(text) };
    }
  } catch (err) {
    console.error('Error getting AI reply:', err);
    // Fallback to mock response on error
    reply = { type: 'text', text: mockAIReply(text) };
  }

  // Handle structured response (agentic booking)
  if (reply && typeof reply === 'object' && reply.type === 'action' && reply.action === 'consult_doctor') {
    // Store doctors and reason in state
    state.suggestedDoctors = reply.doctors || [];
    state.consultationReason = reply.reason || 'Consultation';
    
    // Show AI message
    chat[chat.length - 1] = { 
      from: 'ai', 
      text: reply.message, 
      ts: Date.now() 
    };
    save(STORAGE.chat, chat);
    renderChat();
    
    // Handle the consultation action
    handleConsultDoctorAction(reply.doctors, reply.reason);
    return;
  }

  // Normal text response handling
  const replyText = reply?.text || reply || 'Sorry, I could not respond.';
  chat[chat.length - 1] = { from: 'ai', text: replyText, ts: Date.now() };
  save(STORAGE.chat, chat);
  renderChat();
  scrollChatToBottom();
}

function registerPWA() {
  if (location.protocol === 'file:') return;
  const manifest = {
    name: 'AI Health Companion',
    short_name: 'AI Health',
    start_url: './',
    display: 'standalone',
    background_color: '#F3F4F6',
    theme_color: '#10B981',
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = url;
  document.head.appendChild(link);
}

function bind() {
  const languageContinue = el('languageContinue');
  if (languageContinue) {
    languageContinue.addEventListener('click', () => go('role'));
  }

  const settingsBtn = el('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => go('settings'));
  }

  const testSupabaseBtn = el('testSupabaseBtn');
  if (testSupabaseBtn) {
    testSupabaseBtn.addEventListener('click', testSupabaseConnection);
  }

  const backBtn = el('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () =>
      go(state.role === 'doctor' ? 'doctor' : state.role === 'patient' ? 'patient' : 'role'),
    );
  }

  el('segEN').addEventListener('click', () => {
    state.language = 'en';
    save(STORAGE.language, state.language);
    renderLanguage();
    applyI18n();
    renderRoles();
    renderBookingCard();
    renderDoctorSearch();
    toast('Language updated');
  });
  el('segHI').addEventListener('click', () => {
    state.language = 'hi';
    save(STORAGE.language, state.language);
    renderLanguage();
    applyI18n();
    renderRoles();
    renderBookingCard();
    renderDoctorSearch();
    toast('भाषा बदली गई');
  });

  el('typeInstead').addEventListener('click', () => {
    resetChat();
    go('chat');
  });
  el('micBtn').addEventListener('click', () => {
    resetChat();
    go('chat');
  });
  el('findDoctors').addEventListener('click', () => go('doctors'));
  el('quickDoctors').addEventListener('click', () => go('doctors'));
  el('quickChat').addEventListener('click', () => {
    resetChat();
    go('chat');
  });
  el('quickRole').addEventListener('click', () => go('role'));
  el('chatFindDoctors').addEventListener('click', () => go('doctors'));

  el('chatSend').addEventListener('click', sendChat);
  el('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  // Login / signup flow
  const loginSubmit = el('loginSubmit');
  const loginBack = el('loginBack');
  const loginToSignup = el('loginToSignup');
  const signupSubmit = el('signupSubmit');
  const signupBack = el('signupBack');
  
  if (loginSubmit) {
    loginSubmit.addEventListener('click', async () => {
      const username = el('loginUsername')?.value.trim();
      const password = el('loginPassword')?.value;

      if (!username || !password) {
        toast(state.language === 'hi' ? 'कृपया उपयोगकर्ता नाम और पासवर्ड दर्ज करें' : 'Please enter username and password');
        return;
      }

      loginSubmit.disabled = true;
      loginSubmit.textContent = state.language === 'hi' ? 'लॉग इन हो रहा है...' : 'Logging in...';

      const result = await loginUser(username, password);

      loginSubmit.disabled = false;
      loginSubmit.textContent = t('login_submit');

      if (result.success) {
        toast(state.language === 'hi' ? 'सफलतापूर्वक लॉग इन!' : 'Login successful!');
        // Navigate based on user role
        if (result.user.role === 'doctor') {
          go('doctor');
        } else if (result.user.role === 'patient') {
          go('patient');
        } else {
          go('chat');
        }
      } else {
        toast(result.error || (state.language === 'hi' ? 'लॉग इन विफल' : 'Login failed'));
      }
    });
  }
  
  if (loginBack) {
    loginBack.addEventListener('click', () => go('role'));
  }
  
  if (loginToSignup) {
    loginToSignup.addEventListener('click', () => go('signup'));
  }
  
  if (signupSubmit) {
    signupSubmit.addEventListener('click', async () => {
      const username = el('signupUsername')?.value.trim();
      const fullName = el('signupFullName')?.value.trim();
      const email = el('signupEmail')?.value.trim();
      const password = el('signupPassword')?.value;
      const role = state.role || 'patient'; // Use selected role or default to patient

      if (!username || !fullName || !email || !password) {
        toast(state.language === 'hi' ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill all fields');
        return;
      }

      signupSubmit.disabled = true;
      signupSubmit.textContent = state.language === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating account...';

      const result = await signupUser(username, email, password, fullName, role);

      signupSubmit.disabled = false;
      signupSubmit.textContent = t('signup_submit');

      if (result.success) {
        // Track user signup in Google Analytics
        trackEvent('user_signed_up', 'Authentication', role);
        
        toast(state.language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account created successfully!');
        // Auto-login after signup
        const loginResult = await loginUser(username, password);
        if (loginResult.success) {
          if (loginResult.user.role === 'doctor') {
            go('doctor');
          } else if (loginResult.user.role === 'patient') {
            go('patient');
          } else {
            go('chat');
          }
        } else {
          go('login');
        }
      } else {
        toast(result.error || (state.language === 'hi' ? 'खाता बनाने में विफल' : 'Failed to create account'));
      }
    });
  }
  
  if (signupBack) {
    signupBack.addEventListener('click', () => go('login'));
  }


  // Video call end handler
  const videoEnd = el('videoEnd');
  if (videoEnd) {
    videoEnd.addEventListener('click', () => {
      if (state.activeConsultation) {
        destroyJitsi();
        endConsultation(state.activeConsultation.id);
        state.activeConsultation = null;
      }
      if (state.role === 'doctor') go('doctor');
      else if (state.role === 'patient') go('patient');
      else go('language');
    });
  }

  // Delegated handler for Join call buttons (patient and doctor dashboards)
  document.body.addEventListener('click', async (e) => {
    const btn = e.target && e.target.closest && e.target.closest('button[data-action="join"]');
    if (!btn || btn.disabled) return;
    const appointmentId = btn.getAttribute('data-appointment-id');
    if (!appointmentId) return;
    e.preventDefault();
    const c = await createOrGetConsultation(appointmentId);
    if (!c) {
      toast('Could not start call');
      return;
    }
    state.activeConsultation = c;
    go('video');
  });

  // Advanced booking screen buttons
  const bookBack = el('bookBack');
  const bookConfirm = el('bookConfirm');
  const bookDate = el('bookDate');
  if (bookBack) {
    bookBack.addEventListener('click', () => {
      // Go back to doctor list for patients
      go('doctors');
    });
  }
  if (bookConfirm) {
    bookConfirm.addEventListener('click', () => {
      confirmBooking();
    });
  }
  if (bookDate) {
    bookDate.addEventListener('change', (e) => {
      state.bookingDate = e.target.value;
      renderBookingSlots();
    });
  }

  $$('nav .tab').forEach((b) => {
    b.addEventListener('click', () => {
      const target = b.dataset.go;
      if (target === 'chat') {
        resetChat();
        go('chat');
      }
      else if (target === 'doctors') go('doctors');
      else if (target === 'role') go('role');
      else go('language');
    });
  });
}

function boot() {
  // Check if user is already logged in
  const currentUser = getCurrentUser();
  if (currentUser) {
    state.currentUser = currentUser;
    state.role = currentUser.role;
    // If logged in, start on appropriate dashboard
    if (currentUser.role === 'doctor') {
      state.screen = 'doctor';
    } else if (currentUser.role === 'patient') {
      state.screen = 'patient';
    } else {
      state.screen = 'language';
    }
  } else {
    // Always start on language picker so user explicitly chooses language each time
    state.screen = 'language';
  }

  renderLanguage();
  renderRoles();
  renderPatientDashboard();
  renderDoctorSearch();
  renderDoctorDashboard();
  applyI18n();

  // Final guard: if any lingering labels include a country code, strip it
  document
    .querySelectorAll('#languageList .itemTitle')
    .forEach((node) => (node.textContent = stripCountryPrefix(node.textContent)));

  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const active = document.querySelector(`.screen[data-screen="${state.screen}"]`);
  if (active) active.classList.add('active');
  setTabsActive(state.screen);

  bind();
  registerPWA();
  
  // Initialize Google Analytics UTM tracking when page loads
  if (typeof window !== 'undefined') {
    // Wait for gtag to be available
    window.addEventListener('load', () => {
      if (typeof gtag !== 'undefined') {
        trackUTMParameters();
      }
    });
  }
}

boot();
