/**
 * Seed script — creates demo data for local development / interview
 * demos ONLY. Passwords below are intentionally simple and clearly
 * marked as development-only; never reuse this pattern in production.
 *
 * Run with: npm run seed
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const DEV_PASSWORD = "Password@123"; // DEV ONLY — same for every seeded account

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

// 20 realistic doctors across a broad range of specializations. Each
// entry maps to one or more specialization names created below.
const DOCTOR_SEEDS = [
  { email: "dr.sharma@healthcare.demo", fullName: "Dr. Aditi Sharma", bio: "Senior cardiologist with a focus on preventive heart care.", experienceYears: 12, qualifications: "MBBS, MD (Cardiology)", consultationFee: 1200, specializations: ["Cardiology", "General Medicine"] },
  { email: "dr.mehta@healthcare.demo", fullName: "Dr. Rohan Mehta", bio: "Dermatologist specializing in skin allergies and cosmetic care.", experienceYears: 8, qualifications: "MBBS, MD (Dermatology)", consultationFee: 900, specializations: ["Dermatology"] },
  { email: "dr.iyer@healthcare.demo", fullName: "Dr. Kavya Iyer", bio: "Pediatrician passionate about child wellness and vaccination care.", experienceYears: 10, qualifications: "MBBS, DCH", consultationFee: 800, specializations: ["Pediatrics"] },
  { email: "dr.singh@healthcare.demo", fullName: "Dr. Manpreet Singh", bio: "Orthopedic surgeon experienced in sports injuries.", experienceYears: 15, qualifications: "MBBS, MS (Ortho)", consultationFee: 1500, specializations: ["Orthopedics"] },
  { email: "dr.reddy@healthcare.demo", fullName: "Dr. Sanjana Reddy", bio: "Neurologist focused on headache disorders and stroke recovery.", experienceYears: 11, qualifications: "MBBS, DM (Neurology)", consultationFee: 1600, specializations: ["Neurology"] },
  { email: "dr.das@healthcare.demo", fullName: "Dr. Arindam Das", bio: "Gynecologist with an emphasis on women's preventive health.", experienceYears: 14, qualifications: "MBBS, MD (Gynecology)", consultationFee: 1100, specializations: ["Gynecology"] },
  { email: "dr.khan@healthcare.demo", fullName: "Dr. Imran Khan", bio: "General physician for everyday illnesses and checkups.", experienceYears: 9, qualifications: "MBBS", consultationFee: 500, specializations: ["General Medicine"] },
  { email: "dr.rao@healthcare.demo", fullName: "Dr. Lakshmi Rao", bio: "ENT specialist treating ear, nose, and throat conditions.", experienceYears: 13, qualifications: "MBBS, MS (ENT)", consultationFee: 1000, specializations: ["ENT"] },
  { email: "dr.kapoor@healthcare.demo", fullName: "Dr. Nikhil Kapoor", bio: "Ophthalmologist specializing in cataract and vision correction.", experienceYears: 10, qualifications: "MBBS, MS (Ophthalmology)", consultationFee: 950, specializations: ["Ophthalmology"] },
  { email: "dr.bose@healthcare.demo", fullName: "Dr. Ritika Bose", bio: "Dentist offering general and cosmetic dental care.", experienceYears: 7, qualifications: "BDS, MDS", consultationFee: 700, specializations: ["Dentistry"] },
  { email: "dr.malhotra@healthcare.demo", fullName: "Dr. Yash Malhotra", bio: "Psychiatrist focused on anxiety, depression, and stress management.", experienceYears: 12, qualifications: "MBBS, MD (Psychiatry)", consultationFee: 1300, specializations: ["Psychiatry"] },
  { email: "dr.pillai@healthcare.demo", fullName: "Dr. Meera Pillai", bio: "Gastroenterologist treating digestive system disorders.", experienceYears: 16, qualifications: "MBBS, DM (Gastroenterology)", consultationFee: 1700, specializations: ["Gastroenterology"] },
  { email: "dr.chatterjee@healthcare.demo", fullName: "Dr. Sourav Chatterjee", bio: "Pulmonologist specializing in asthma and respiratory conditions.", experienceYears: 11, qualifications: "MBBS, MD (Pulmonology)", consultationFee: 1200, specializations: ["Pulmonology"] },
  { email: "dr.nair@healthcare.demo", fullName: "Dr. Anjali Nair", bio: "Urologist treating kidney stones and urinary tract conditions.", experienceYears: 13, qualifications: "MBBS, MCh (Urology)", consultationFee: 1400, specializations: ["Urology"] },
  { email: "dr.verma@healthcare.demo", fullName: "Dr. Karan Verma", bio: "Endocrinologist managing diabetes and thyroid disorders.", experienceYears: 10, qualifications: "MBBS, DM (Endocrinology)", consultationFee: 1300, specializations: ["Endocrinology"] },
  { email: "dr.joshi@healthcare.demo", fullName: "Dr. Priyanka Joshi", bio: "Oncologist specializing in early cancer detection and treatment.", experienceYears: 17, qualifications: "MBBS, DM (Oncology)", consultationFee: 2000, specializations: ["Oncology"] },
  { email: "dr.pandey@healthcare.demo", fullName: "Dr. Vivek Pandey", bio: "Nephrologist treating chronic kidney disease and dialysis care.", experienceYears: 14, qualifications: "MBBS, DM (Nephrology)", consultationFee: 1600, specializations: ["Nephrology"] },
  { email: "dr.gupta@healthcare.demo", fullName: "Dr. Neha Gupta", bio: "Radiologist providing diagnostic imaging and reporting.", experienceYears: 9, qualifications: "MBBS, MD (Radiology)", consultationFee: 900, specializations: ["Radiology"] },
  { email: "dr.thakur@healthcare.demo", fullName: "Dr. Aman Thakur", bio: "General surgeon experienced in minimally invasive procedures.", experienceYears: 15, qualifications: "MBBS, MS (Surgery)", consultationFee: 1800, specializations: ["Surgery"] },
  { email: "dr.bhatt@healthcare.demo", fullName: "Dr. Kritika Bhatt", bio: "Physiotherapist helping patients recover mobility after injury or surgery.", experienceYears: 8, qualifications: "BPT, MPT", consultationFee: 600, specializations: ["Physiotherapy"] },
];

const SPECIALIZATION_NAMES = [
  "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "General Medicine",
  "Neurology", "Gynecology", "ENT", "Ophthalmology", "Dentistry", "Psychiatry",
  "Gastroenterology", "Pulmonology", "Urology", "Endocrinology", "Oncology",
  "Nephrology", "Radiology", "Surgery", "Physiotherapy",
];

async function main() {
  console.log("Seeding database..."); // eslint-disable-line no-console

  // Clean slate — order matters due to foreign keys (children before parents).
  await prisma.prescriptionItem.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorLeave.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctorSpecialization.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.user.deleteMany();

  // --- Specializations ---
  const specializationByName = {};
  for (const name of SPECIALIZATION_NAMES) {
    const spec = await prisma.specialization.create({ data: { name, description: `${name} department` } });
    specializationByName[name] = spec;
  }

  // --- Admin ---
  await prisma.user.create({
    data: { email: "admin@healthcare.demo", passwordHash: await hash(DEV_PASSWORD), role: "ADMIN" },
  });

  // --- Doctors (~20 approved) ---
  const doctors = [];
  for (const d of DOCTOR_SEEDS) {
    const user = await prisma.user.create({
      data: { email: d.email, passwordHash: await hash(DEV_PASSWORD), role: "DOCTOR" },
    });
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        fullName: d.fullName,
        phone: "9800000000",
        bio: d.bio,
        experienceYears: d.experienceYears,
        qualifications: d.qualifications,
        consultationFee: d.consultationFee,
        approvalStatus: "APPROVED",
      },
    });
    await prisma.doctorSpecialization.createMany({
      data: d.specializations.map((name) => ({ doctorId: doctor.id, specializationId: specializationByName[name].id })),
    });
    // Mon–Fri, 09:00–13:00 and 15:00–18:00, 30-minute slots
    for (const dayOfWeek of [1, 2, 3, 4, 5]) {
      await prisma.doctorAvailability.createMany({
        data: [
          { doctorId: doctor.id, dayOfWeek, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 },
          { doctorId: doctor.id, dayOfWeek, startTime: "15:00", endTime: "18:00", slotDurationMinutes: 30 },
        ],
      });
    }
    doctors.push(doctor);
  }

  // One doctor left PENDING approval, to demo the admin-approval flow
  const pendingDoctorUser = await prisma.user.create({
    data: { email: "dr.pending@healthcare.demo", passwordHash: await hash(DEV_PASSWORD), role: "DOCTOR" },
  });
  await prisma.doctor.create({
    data: {
      userId: pendingDoctorUser.id,
      fullName: "Dr. New Applicant",
      phone: "9811111111",
      bio: "Recently registered, awaiting admin approval.",
      experienceYears: 3,
      qualifications: "MBBS",
      consultationFee: 500,
      approvalStatus: "PENDING",
    },
  });

  // --- Patients ---
  const patientSeeds = [
    { email: "patient1@healthcare.demo", fullName: "Aarav Patel", phone: "9822222222" },
    { email: "patient2@healthcare.demo", fullName: "Priya Nair", phone: "9833333333" },
  ];
  const patients = [];
  for (const p of patientSeeds) {
    const user = await prisma.user.create({
      data: { email: p.email, passwordHash: await hash(DEV_PASSWORD), role: "PATIENT" },
    });
    const patient = await prisma.patient.create({
      data: { userId: user.id, fullName: p.fullName, phone: p.phone, gender: "Unspecified" },
    });
    patients.push(patient);
  }

  // --- Sample appointments ---
  const today = new Date();
  const inTwoDays = new Date(today);
  inTwoDays.setDate(today.getDate() + 2);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  await prisma.appointment.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctors[0].id, // Dr. Sharma (Cardiology)
      appointmentDate: inTwoDays,
      startTime: "09:00",
      endTime: "09:30",
      status: "PENDING",
      reasonForVisit: "Routine heart checkup",
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patients[1].id,
      doctorId: doctors[1].id, // Dr. Mehta (Dermatology)
      appointmentDate: inTwoDays,
      startTime: "15:00",
      endTime: "15:30",
      status: "CONFIRMED",
      reasonForVisit: "Skin rash follow-up",
    },
  });

  // A COMPLETED appointment (yesterday) with a medical record attached,
  // to demonstrate the medical-records feature end to end.
  const completedAppointment = await prisma.appointment.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctors[6].id, // Dr. Khan (General Medicine)
      appointmentDate: yesterday,
      startTime: "10:00",
      endTime: "10:30",
      status: "COMPLETED",
      reasonForVisit: "Fever and body ache",
    },
  });

  const medicalRecord = await prisma.medicalRecord.create({
    data: {
      appointmentId: completedAppointment.id,
      patientId: patients[0].id,
      doctorId: doctors[6].id,
      diagnosis: "Viral fever",
      symptoms: "Fever (101°F), body ache, mild headache for 2 days.",
      doctorNotes: "Advised rest and hydration. Review in 5 days if fever persists.",
      followUpDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.prescriptionItem.createMany({
    data: [
      { medicalRecordId: medicalRecord.id, medicineName: "Paracetamol", dosage: "650mg", instructions: "Twice daily after food, for 3 days" },
      { medicalRecordId: medicalRecord.id, medicineName: "ORS Sachets", dosage: "1 sachet in 1L water", instructions: "As needed for hydration" },
    ],
  });

  // A one-off leave for a doctor, so the "doctor unavailable due to
  // leave" flow can be demonstrated immediately after seeding.
  const leaveStart = new Date(today);
  leaveStart.setDate(today.getDate() + 7);
  const leaveEnd = new Date(today);
  leaveEnd.setDate(today.getDate() + 9);
  await prisma.doctorLeave.create({
    data: {
      doctorId: doctors[3].id, // Dr. Singh (Orthopedics)
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: "Attending a medical conference",
    },
  });

  console.log("Seeding complete."); // eslint-disable-line no-console
  console.log("---------------------------------------------------"); // eslint-disable-line no-console
  console.log("DEMO CREDENTIALS (all use password: Password@123)"); // eslint-disable-line no-console
  console.log("Admin:   admin@healthcare.demo"); // eslint-disable-line no-console
  console.log(`Doctors: ${DOCTOR_SEEDS.length} approved (e.g. dr.sharma@healthcare.demo) + 1 pending (dr.pending@healthcare.demo)`); // eslint-disable-line no-console
  console.log("Patient: patient1@healthcare.demo"); // eslint-disable-line no-console
  console.log("Sample data: 1 pending appt, 1 confirmed appt, 1 completed appt with a medical record, 1 doctor on leave 7-9 days from now"); // eslint-disable-line no-console
  console.log("---------------------------------------------------"); // eslint-disable-line no-console
}

main()
  .catch((e) => {
    console.error(e); // eslint-disable-line no-console
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
