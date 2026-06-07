// Static form templates baked into the app. The `id` query param
// (e.g. ?id=ADMISSION_FORM) selects which template to render.
//
// Field types: section | text | number | email | tel | date | select | checkbox | signature | scoreTable
// (`section` is a non-input heading used to group a long form.
//  `scoreTable` renders a labelled grid of number inputs; each `column.key`
//  is stored as its own value in the submission data.)
// Keep these field keys in sync with the admin FormsPage schema so submitted
// data lines up with what reviewers see.

export const FORM_TEMPLATES = {
  ADMISSION_FORM: {
    id: 'ADMISSION_FORM',
    title: 'Admission Form',
    version: '2.0',
    intro: 'This form collects the details needed to enrol a student at Crispr Learning. Your information will not be used for any marketing or promotional activity, and will never be shared or sold to any third party. Crispr Learning may use the mobile number and email address only to communicate with the student and parents / guardians.',
    fields: [
      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Name of the Student', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { key: 'dateOfAdmission', label: 'Date of Admission', type: 'date', required: true, hint: 'Enter the date you are joining, or plan to join, Crispr Learning.' },
      { key: 'tshirtSize', label: 'T-shirt Size (Collared Polo)', type: 'select', options: ['Small', 'Medium', 'Large', 'XL', 'XXL'], required: true, hint: 'Students must wear the uniform (collared polo T-shirt) on campus and on all working days. Please choose the correct size.' },

      { type: 'section', label: 'Parents / Guardian' },
      { key: 'mothersName', label: "Mother's Name", type: 'text', required: true },
      { key: 'fathersName', label: "Father's Name", type: 'text', required: true },
      { key: 'contactNumber', label: 'Contact Number', type: 'tel', required: true },

      { type: 'section', label: 'Address' },
      { key: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
      { key: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'district', label: 'District', type: 'text', required: true },
      { key: 'pincode', label: 'Pin Code', type: 'text', required: true, maxDigits: 6, pattern: '^\\d{6}$', patternMessage: 'Enter a valid 6-digit Pin Code.' },

      { type: 'section', label: 'Parental Updates', note: 'Parents / guardians will receive academic updates about their child on this email address and WhatsApp number. You can change these details later.' },
      { key: 'whatsappNumber', label: 'WhatsApp Number for Updates', type: 'tel', required: false },
      { key: 'email', label: 'Email Address for Updates', type: 'email', required: true },

      {
        type: 'section',
        label: 'App Access',
        note: "These numbers will be used to log in to the Crispr apps. On the Student App, the student can watch recorded classes and take exams. On the Parent App, parents / guardians can track their child's progress. Logging in needs an OTP, sent by SMS (or by WhatsApp for non-Indian numbers). For a non-Indian number, please add the country code — for example, UAE numbers start with +971.",
      },
      { key: 'studentAppAccessNumber', label: 'Mobile Number to access - Crispr Student App', type: 'tel', required: false },
      { key: 'parentAppAccessNumber', label: 'Mobile Number to access - Crispr Parent App', type: 'tel', required: false },

      { type: 'section', label: 'Academic Background' },
      { key: 'previousInstitute', label: 'Previous Institute', type: 'text', required: false, hint: 'Enter the school or coaching institute the student attended earlier.' },
      { key: 'boardType', label: 'Board', type: 'select', options: ['CBSE', 'State', 'ICSE'], required: true },
      { key: 'yearOfPassing', label: 'Year of Passing +2', type: 'select', options: Array.from({ length: 2030 - 2005 + 1 }, (_, i) => String(2005 + i)), required: false },
      {
        type: 'scoreTable',
        label: 'Scores in Board Exam (Percentage)',
        columns: [
          { key: 'physicsScore', label: 'Physics' },
          { key: 'chemistryScore', label: 'Chemistry' },
          { key: 'mathsScore', label: 'Maths' },
          { key: 'biologyScore', label: 'Biology' },
        ],
      },

      { type: 'section', label: 'Previous Attempts in IAT' },
      { key: 'iatAttempts', label: 'Number of Attempts in IAT', type: 'select', options: Array.from({ length: 16 }, (_, i) => String(i)), required: false },
      { key: 'iatScore', label: 'Score in last IAT', type: 'number', required: false, min: -100, max: 300, hint: 'This is optional. You may leave it blank if you prefer not to share it.' },

      { type: 'section', label: 'Declaration by Student', note: 'I confirm that all the details given above are true and correct to the best of my knowledge.', noteEmphasis: true },
      { key: 'signedOn', label: 'Signature', type: 'signature', required: true },
    ],
  },
  HOSTEL_REGISTRATION_FORM: {
    id: 'HOSTEL_REGISTRATION_FORM',
    title: 'Hostel Registration Form',
    version: '2.0',
    intro: 'Please fill in the details below to register for hostel accommodation at Crispr Learning. Your information will be used only for hostel records and student welfare, and will not be shared or sold to any third party.',
    fields: [
      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Name of the Student', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], required: true },
      { key: 'contactNumber', label: 'Contact Number', type: 'tel', required: true },

      { type: 'section', label: 'Home Address' },
      { key: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
      { key: 'addressLine2', label: 'Address Line 2', type: 'text', required: false },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'district', label: 'District', type: 'text', required: true },
      { key: 'pincode', label: 'Pin Code', type: 'text', required: true, maxDigits: 6, pattern: '^\\d{6}$', patternMessage: 'Enter a valid 6-digit Pin Code.' },

      { type: 'section', label: 'Hostel Preferences' },
      { key: 'expectedOccupancyDate', label: 'Expected Date of Occupancy', type: 'date', required: true, hint: 'The date you expect to move into the hostel.' },
      { key: 'roomSharing', label: 'Preferred Sharing', type: 'select', options: ['Single', 'Double', '3 or More'], required: true },
      { key: 'foodPreference', label: 'Food Preference', type: 'select', options: ['Pure Veg', 'Optionally Veg', 'Non Veg'], required: true },
      { key: 'allergies', label: 'Any Allergies?', type: 'text', required: false, freeText: true, hint: 'Mention any food or other allergies. Leave blank if none.' },

      { type: 'section', label: 'Emergency Contact', note: 'Preferably a local guardian we can reach in case of an emergency.' },
      { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text', required: true },
      { key: 'emergencyContactNumber', label: 'Emergency Contact Number', type: 'tel', required: true },

      { type: 'section', label: 'Additional Information' },
      { key: 'remarks', label: 'Remarks', type: 'text', required: false, freeText: true, hint: 'Mention any medical condition the warden should be aware of.' },

      { type: 'section', label: 'Declaration by Student', note: 'I confirm that the details given above are true and correct to the best of my knowledge.', noteEmphasis: true },
      { key: 'signedOn', label: 'Signature', type: 'signature', required: true },
    ],
  },
  DIGITAL_PRIVACY_CONSENT: {
    id: 'DIGITAL_PRIVACY_CONSENT',
    title: 'Digital Privacy Consent',
    version: '3.0',
    termsNotes: true,
    intro: [
      'At Crispr Learning, we use technology to enhance the learning experience of our students. Some classes, academic events, mentoring sessions, workshops, and student activities may be recorded or photographed for educational purposes.',
      'This consent form explains how such recordings and photographs may be used.',
    ],
    fields: [
      {
        type: 'section',
        label: '1. Purpose of Recordings',
        note: 'Certain classes and academic sessions may be recorded to:',
        bullets: [
          'Help students revise lessons at a later time.',
          'Support students who may have missed a class.',
          'Create educational resources for current and future students.',
          'Improve teaching quality and learning outcomes.',
        ],
      },
      {
        type: 'section',
        label: '2. What May Be Recorded',
        note: 'The primary focus of recordings will generally be:',
        bullets: [
          'The teacher or faculty member.',
          'Presentations, whiteboards, study materials, and academic content.',
          'Classroom discussions and question-answer sessions.',
        ],
        footnote: 'Students are not the primary focus of these recordings. However, students may occasionally appear or be heard while participating in class activities.',
      },
      {
        type: 'section',
        label: '3. Photographs & Videos During Academic Activities',
        note: 'Photographs and videos may be taken during:',
        bullets: [
          'Classroom sessions.',
          'Workshops and seminars.',
          'Academic events.',
          'Award ceremonies and celebrations.',
          'Student activities organized by Crispr Learning.',
        ],
        footnote: 'These photographs and videos may be used to document student achievements and academic activities.',
      },
      {
        type: 'section',
        label: '4. Use of Recordings & Photographs',
        note: 'Crispr Learning may use recordings, photographs, and videos for:',
        bullets: [
          'Student learning and revision.',
          'Academic and training purposes.',
          'Sharing educational content with students.',
          'Official websites and mobile applications.',
          'Social media platforms.',
          'Promotional and informational materials related to Crispr Learning.',
        ],
      },
      {
        type: 'section',
        label: '5. Privacy Commitment',
        note: [
          'Crispr Learning is committed to protecting the privacy and dignity of all students.',
          'We will make reasonable efforts to ensure that:',
        ],
        bullets: [
          'Students are not unnecessarily highlighted in public content.',
          'Personal information is not intentionally disclosed.',
          'Content is used responsibly and only for educational, academic, and promotional purposes related to Crispr Learning.',
        ],
      },
      {
        type: 'section',
        label: '6. Student Information',
        note: 'By signing this consent, the student and parent / guardian understand that the following information may be used where relevant for academic and promotional purposes:',
        bullets: [
          'Student name.',
          'Photograph.',
          'Video appearance.',
          'Voice recordings.',
          'Academic achievements.',
          'Examination results, ranks, awards, and recognitions.',
        ],
        footnote: 'Sensitive personal information such as home address, personal identification numbers, financial information, or private contact details will not be intentionally published.',
      },
      {
        type: 'section',
        label: '7. Online Classes & Recorded Sessions',
        note: [
          'For online classes, students understand that their voice, video, chat messages, screen participation, or questions may occasionally become part of recorded classroom sessions.',
          'These recordings may be made available to enrolled students for learning purposes.',
        ],
      },
      {
        type: 'section',
        label: '8. Responsible Use of Content',
        note: "Students shall not record, download through unauthorized means, distribute, upload, sell, or share Crispr Learning's videos, recordings, classes, study materials, or digital content without written permission.",
      },
      {
        type: 'section',
        label: '9. Consent & Permission',
        note: 'By signing this document, the student and parent / guardian acknowledge and agree that:',
        bullets: [
          'Certain classes, academic sessions, events, and activities may be photographed or recorded.',
          'The student may occasionally appear or be heard in such recordings.',
          'Crispr Learning may use such recordings, photographs, and related content for educational, academic, informational, and promotional purposes.',
          'No separate compensation or payment will be provided for such use.',
        ],
      },
      {
        type: 'section',
        label: '10. Questions & Support',
        note: [
          'If students or parents have any questions regarding privacy, recordings, or digital content, they may contact:',
          '**Email:** [support@crisprlearning.com](mailto:support@crisprlearning.com)',
          '**Phone:** 98096 77798',
        ],
      },

      { type: 'section', label: 'Declaration', note: 'I have read and understood this Digital Privacy & Recording Consent. I understand how recordings and photographs may be used by Crispr Learning and voluntarily provide my consent for the purposes described above.', noteEmphasis: true },

      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Student Name', type: 'text', required: true },
      { key: 'studentSignedOn', label: 'Student Signature', type: 'signature', required: true },

      { type: 'section', label: 'Parent / Guardian Details' },
      { key: 'guardianName', label: 'Parent / Guardian Name', type: 'text', required: true },
      { key: 'guardianSignedOn', label: 'Parent / Guardian Signature', type: 'signature', required: true },
    ],
  },
  STUDENT_CODE_OF_CONDUCT: {
    id: 'STUDENT_CODE_OF_CONDUCT',
    title: 'Student Code of Conduct & Undertaking',
    version: '1.1',
    termsNotes: true,
    intro: [
      'To ensure a safe, disciplined, and productive learning environment for all students, every student enrolled at Crispr Learning is expected to follow the rules and guidelines mentioned below.',
      'These rules are designed to help students make the best use of their learning experience and maintain a positive academic atmosphere.',
    ],
    fields: [
      { type: 'section', label: '1. Uniform', note: 'Students must wear the prescribed Crispr Learning uniform on all class days and during official academic activities, unless otherwise instructed by the management.' },
      { type: 'section', label: '2. Leave & Absence', note: [
        'Students requiring leave should inform their Class Teacher or Mentor in advance.',
        'Wherever possible, leave requests should be submitted at least **one week before** the planned absence.',
      ] },
      { type: 'section', label: '3. Discipline in Study Areas', note: [
        'Students must maintain silence and discipline in classrooms, study halls, libraries, and other study areas.',
        'Academic discussions and collaborative learning are encouraged, provided they do not disturb others.',
      ] },
      { type: 'section', label: '4. Identity Card', note: [
        'Students must wear and visibly display their Crispr Learning ID Card while on campus.',
        'Students are also encouraged to carry or wear their ID Card while travelling between home / hostel and the campus for safety and identification purposes.',
      ] },
      { type: 'section', label: '5. Attendance', note: [
        'Students are expected to attend classes regularly and mark their attendance on time.',
        'Regular attendance is important for academic progress and effective mentoring.',
      ] },
      { type: 'section', label: '6. Mobile Phones & Digital Devices', note: [
        'Mobile phones, tablets, laptops, and other electronic devices must be used responsibly.',
        'During classes, tests, study sessions, and academic activities, such devices should be used only for educational purposes as instructed by faculty.',
        'Students should avoid any use that distracts themselves or others from learning.',
      ] },
      {
        type: 'section',
        label: '7. Use of Crispr Learning Wi-Fi & Digital Resources',
        note: [
          'Internet access, Wi-Fi, computers, and digital resources provided by Crispr Learning are meant for educational purposes only.',
          'Students shall not:',
        ],
        bullets: [
          'Access inappropriate content.',
          'Attempt unauthorized access to systems or accounts.',
          'Download illegal content.',
          'Misuse institutional internet resources.',
        ],
      },
      { type: 'section', label: '8. Respectful Behaviour', note: [
        'Students must treat fellow students, faculty members, mentors, staff, and visitors with respect and courtesy.',
        'Bullying, harassment, intimidation, abusive language, discrimination, or any form of misconduct will not be tolerated.',
      ] },
      { type: 'section', label: '9. Academic Integrity', note: [
        'Students are expected to be honest in all academic activities.',
        'Cheating, copying, impersonation, plagiarism, or any unfair practice during tests, assignments, or examinations is strictly prohibited.',
      ] },
      { type: 'section', label: '10. Care of Campus Property', note: [
        'Students must use classrooms, furniture, study facilities, books, equipment, and other institutional resources responsibly.',
        'Any intentional damage to property may result in disciplinary action and recovery of repair or replacement costs.',
      ] },
      { type: 'section', label: '11. Photography & Recording', note: 'Students shall not record, photograph, livestream, or share classroom sessions, tests, study materials, faculty interactions, or fellow students without permission from Crispr Learning.' },
      { type: 'section', label: '12. Safety & Security', note: [
        'Students should follow all safety instructions provided by Crispr Learning.',
        'Any safety concern, emergency, accident, or suspicious activity should be immediately reported to faculty members, mentors, or support staff.',
      ] },
      { type: 'section', label: '13. Protecting the Reputation of Crispr Learning', note: [
        'Students are expected to conduct themselves responsibly both online and offline.',
        'Students shall not engage in activities, behaviour, communication, or social media actions that may harm the reputation, goodwill, or interests of Crispr Learning, its students, faculty, or staff.',
      ] },
      { type: 'section', label: '14. Seeking Help & Support', note: [
        'Students are encouraged to seek help whenever required.',
        'For academic guidance, students may contact their Mentors.',
        'For administrative, personal, safety-related, or urgent concerns, students may contact:',
        '**Crispr Support:** 98096 77798',
      ] },
      { type: 'section', label: '15. Fee Refund Policy', note: [
        'Students and parents acknowledge that fee refunds will be governed by the official Refund Policy of Crispr Learning.',
        'As a general rule, fees are not refundable after **30 days from the commencement of classes**, except where required by law or specifically approved by the management under exceptional circumstances.',
      ] },
      { type: 'section', label: '16. Compliance with Institutional Policies', note: 'Students are expected to follow all policies, guidelines, instructions, and notices issued by Crispr Learning from time to time for the smooth functioning of academic and campus activities.' },

      { type: 'section', label: 'Declaration', note: [
        'I understand that these rules are intended to maintain a safe, respectful, and effective learning environment for all students.',
        'I agree to follow the above rules and understand that repeated or serious violations may result in appropriate disciplinary action by Crispr Learning.',
      ], noteEmphasis: true },

      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Student Name', type: 'text', required: true },
      { key: 'studentSignedOn', label: 'Student Signature', type: 'signature', required: true },

      { type: 'section', label: 'Parent / Guardian Details' },
      { key: 'guardianName', label: 'Parent / Guardian Name', type: 'text', required: true },
      { key: 'guardianSignedOn', label: 'Parent / Guardian Signature', type: 'signature', required: true },
    ],
  },
  COURSE_TERMS_AND_CONDITIONS: {
    id: 'COURSE_TERMS_AND_CONDITIONS',
    title: 'Course Terms and Conditions',
    version: '1.0',
    termsNotes: true,
    intro: [
      'Please read these Terms & Conditions carefully before joining a course at Crispr Learning. By signing this document, the student and parent / guardian confirm that they have read, understood, and agreed to the terms below.',
    ],
    fields: [
      {
        type: 'section',
        label: '1. Course Information',
        note: [
          'Details about the course, syllabus, duration, fees, and academic offerings are available at:',
          'https://crisprlearning.com/courses/',
          'Students and parents are advised to go through the course details before joining.',
        ],
      },
      {
        type: 'section',
        label: '2. Coaching & Guidance',
        note: [
          'Crispr Learning provides coaching, academic guidance, mentorship, study materials, tests, and learning support.',
          "Success in exams depends on many things, including the student's effort, attendance, preparation, and active participation. For this reason, Crispr Learning does not guarantee any particular rank, score, admission, scholarship, or exam result.",
        ],
      },
      {
        type: 'section',
        label: '3. Mentorship Support',
        note: [
          'Students will receive mentorship and academic support as part of their course.',
          'However, mentors may not be available at all times. Mentorship is not a 24×7 service, and response times may vary depending on mentor availability.',
        ],
      },
      {
        type: 'section',
        label: '4. Student Support',
        note: [
          'For non-academic support, administrative help, fee-related queries, or general help, students and parents may contact:',
          '**Email:** [support@crisprlearning.com](mailto:support@crisprlearning.com)',
          '**Phone:** 98096 77798',
        ],
      },
      {
        type: 'section',
        label: '5. Study Materials & Copyright',
        note: 'All study materials, notes, worksheets, mock tests, presentations, videos, recordings, question banks, and other content provided by Crispr Learning belong to Crispr Learning. Students must not:',
        bullets: [
          'Copy or reproduce the materials.',
          'Share the materials with others.',
          'Upload materials to websites, social media, or messaging apps.',
          'Print, publish, sell, or share the materials without written permission.',
        ],
        footnote: 'Any misuse of Crispr Learning content may lead to the access being stopped and suitable legal action.',
      },
      {
        type: 'section',
        label: '6. Fee Payment & Disputes',
        note: 'Any concern about fee payment, receipts, or billing must be reported to Crispr Learning within **30 days** of the payment date.',
      },
      {
        type: 'section',
        label: '7. Access to Video Lectures & Digital Content',
        note: 'Recorded lectures and digital learning resources are provided only for the enrolled student. Students must not:',
        bullets: [
          'Share login details with others.',
          'Download videos using unapproved methods.',
          'Record, upload, share, or distribute Crispr Learning content on any platform.',
          'Allow others to use their account.',
        ],
        footnote: 'Breaking these rules may lead to the access being stopped and further action as needed.',
      },
      {
        type: 'section',
        label: '8. Mock Tests & Academic Content',
        note: [
          'Mock tests, question papers, solutions, rankings, and assessments are prepared by the academic team of Crispr Learning.',
          'Students must not copy, reproduce, share, change, publish, or use such content for coaching, teaching, commercial, or public purposes without written permission from Crispr Learning.',
        ],
      },
      {
        type: 'section',
        label: '9. Rank Lists & Academic Performance',
        note: [
          'To encourage healthy competition and help students track their progress, Crispr Learning may publish rank lists, achievement lists, and performance reports among enrolled students.',
          "By signing this document, the student and parent / guardian agree to include the student's name, score, rank, photograph (where applicable), and academic achievements in such academic publications.",
        ],
      },
      {
        type: 'section',
        label: '10. Attendance & Progress Updates',
        note: "Crispr Learning may share attendance records, test performance, academic progress, and mentor feedback with parents or guardians to support the student's learning.",
      },
      {
        type: 'section',
        label: '11. Class Schedule & Faculty Allocation',
        note: 'Class schedules, batch timings, faculty assignments, exam dates, and academic plans may be changed when needed due to operational requirements, faculty availability, public holidays, government rules, technical issues, or other situations beyond our reasonable control.',
      },
      {
        type: 'section',
        label: '12. Online Learning & Platform Availability',
        note: [
          'For online courses, students are responsible for arranging a suitable device and internet connection.',
          'Crispr Learning will make every reasonable effort to provide services without interruption, but short interruptions may happen due to maintenance, internet issues, technical problems, or third-party service outages.',
        ],
      },
      {
        type: 'section',
        label: '13. Communication',
        note: [
          'Important updates about classes, tests, schedules, events, and academic activities may be sent through email, phone calls, SMS, WhatsApp, the student portal, or the Crispr Learning mobile app.',
          'Students and parents are responsible for checking these messages regularly.',
        ],
      },
      {
        type: 'section',
        label: '14. Photography & Video During Events',
        note: [
          'Photographs and videos may be taken during classes, workshops, seminars, academic events, award ceremonies, and student activities.',
          "Such photographs or videos may be used on Crispr Learning's website, social media pages, brochures, publicity materials, and other official platforms.",
        ],
      },
      {
        type: 'section',
        label: '15. Refund Policy',
        note: [
          'Refund requests will be handled as per the official Refund Policy available at:',
          'https://crisprlearning.com/refund-policy/',
          'Students and parents are advised to go through the refund policy before joining.',
        ],
      },
      {
        type: 'section',
        label: '16. Following the Policies',
        note: 'Students are expected to follow all Student Rules & Regulations, Digital Privacy Consent requirements, and other policies issued by Crispr Learning from time to time.',
      },
      {
        type: 'section',
        label: '17. Policy Updates',
        note: 'Crispr Learning may update or revise its policies whenever needed. Updated policies will be shared through official channels and will apply from the date they are published.',
      },

      { type: 'section', label: 'Declaration', note: 'I have read and understood the above Terms & Conditions of Crispr Learning. I agree to follow these policies and understand that joining the course means I accept these terms.', noteEmphasis: true },

      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Student Name', type: 'text', required: true },
      { key: 'studentSignedOn', label: 'Student Signature', type: 'signature', required: true },

      { type: 'section', label: 'Parent / Guardian Details' },
      { key: 'guardianName', label: 'Parent / Guardian Name', type: 'text', required: true },
      { key: 'guardianSignedOn', label: 'Parent / Guardian Signature', type: 'signature', required: true },
    ],
  },
  RESIDENCE_TERMS_AND_CONDITIONS: {
    id: 'RESIDENCE_TERMS_AND_CONDITIONS',
    title: 'Residence Terms and Conditions',
    version: '1.0',
    termsNotes: true,
    intro: [
      'To provide a safe, comfortable, and productive living environment for students, Crispr Learning coordinates hostel accommodation through trusted residential partners.',
      'Students and parents are requested to carefully read and follow the guidelines below.',
    ],
    fields: [
      { type: 'section', label: '1. Hostel Allocation', note: [
        'Hostel accommodation is allocated after considering student preferences wherever possible.',
        'However, room allocation, roommate selection, location preferences, and accommodation type may vary based on availability, operational requirements, and overall student welfare.',
      ] },
      { type: 'section', label: '2. Nature of Hostel Facilities', note: [
        'The hostels provided to students are monitored and coordinated by Crispr Learning but are owned and operated by independent accommodation providers.',
        'Crispr Learning works closely with these providers to ensure a safe and student-friendly environment.',
      ] },
      { type: 'section', label: '3. Hostel Fee Payments', note: [
        'Hostel fees, where applicable, shall be paid only through the official payment channels designated by Crispr Learning.',
        'Students and parents are advised not to make direct payments to hostel staff or third parties unless specifically instructed by Crispr Learning.',
      ] },
      { type: 'section', label: '4. Food & Dining', note: [
        'Crispr Learning works with hostel providers to maintain good standards of food quality and hygiene.',
        'Students are encouraged to report any concerns regarding food, cleanliness, or dining facilities so that they can be addressed promptly.',
        'For support, contact:',
        '**Email:** [support@crisprlearning.com](mailto:support@crisprlearning.com)',
        '**Phone:** 98096 77798',
      ] },
      { type: 'section', label: '5. Mobile Phone Usage', note: [
        'Students are encouraged to use mobile phones responsibly and avoid excessive usage that may affect their studies, sleep, discipline, or well-being.',
        'Specific hostel rules regarding mobile phone usage and study hours shall be followed.',
      ] },
      { type: 'section', label: '6. Photography & Video Recording', note: 'To protect the privacy of all residents, photography, video recording, audio recording, livestreaming, and social media content creation inside hostel premises are strictly prohibited unless specifically approved by Crispr Learning or the hostel management.' },
      { type: 'section', label: '7. Respect for Privacy', note: [
        'Students must respect the privacy, personal space, belongings, and dignity of fellow residents.',
        'Any form of harassment, bullying, intimidation, inappropriate behaviour, or invasion of privacy will be treated seriously.',
      ] },
      { type: 'section', label: '8. Visitor Policy', note: [
        'Students, parents, relatives, and visitors must follow the visitor guidelines applicable to the hostel.',
        'Visitors shall be allowed only in designated areas and during approved visiting hours.',
      ] },
      { type: 'section', label: '9. Meeting Students in the Hostel', note: [
        'Parents, guardians, relatives, and visitors are requested to coordinate with the Warden or Caretaker before visiting students.',
        'Visits may be regulated to ensure student safety, discipline, and uninterrupted academic schedules.',
      ] },
      { type: 'section', label: '10. Appropriate Conduct & Dress', note: 'Students are expected to maintain decent behaviour and wear appropriate attire within the hostel premises, ensuring a comfortable and respectful environment for everyone.' },
      { type: 'section', label: '11. Room Allocation & Changes', note: [
        'Room allocations are made after careful consideration.',
        'Requests for room changes will be considered only in exceptional circumstances and subject to availability and administrative approval.',
      ] },
      { type: 'section', label: '12. Hostel-Specific Rules', note: [
        'Each hostel may have additional policies regarding timings, facilities, study hours, visitors, cleanliness, and safety.',
        'Students are required to follow both the Crispr Learning guidelines and the specific rules of their assigned hostel.',
      ] },
      { type: 'section', label: '13. Leave & Overnight Absence', note: [
        'Any leave, home visit, overnight absence, or stay away from the hostel must be approved through Crispr Learning.',
        'Students should submit requests at least **one week in advance** wherever possible.',
        'Emergency situations will be handled separately.',
      ] },
      { type: 'section', label: '14. Discipline & Hostel Eligibility', note: [
        'Students are expected to maintain good conduct both inside and outside the hostel.',
        'In case of serious misconduct or repeated violations of hostel rules, Crispr Learning may issue a warning and, if necessary, discontinue hostel accommodation support.',
      ] },
      { type: 'section', label: '15. Care of Hostel Property', note: [
        'Students are expected to use hostel facilities responsibly and maintain cleanliness in rooms and common areas.',
        'Any damage, misuse, or loss of hostel property may result in recovery of repair or replacement costs.',
        'Maintenance concerns should be reported promptly to the Caretaker or Warden.',
      ] },
      { type: 'section', label: '16. Warden & Emergency Contacts', note: 'The details of the Warden, Caretaker, emergency contacts, complaint channels, and hostel-specific support numbers will be provided separately to students and parents.' },
      { type: 'section', label: '17. Medical Assistance', note: [
        'In case of illness or medical emergencies, students should immediately inform the Warden, Caretaker, Mentor, or Crispr Support.',
        'For urgent assistance:',
        '**Phone:** 98096 77798',
        'Where necessary, students may be assisted in coordinating transportation and hospital visits.',
      ] },
      { type: 'section', label: '18. Study Environment', note: [
        'Students are expected to maintain a quiet and academic atmosphere within the hostel.',
        'On holidays, weekends, and non-class days, students should utilize their time productively and respect designated study hours.',
      ] },
      { type: 'section', label: '19. Return to Hostel After Classes', note: 'On class days, students are expected to return directly to their hostel residence after the completion of classes unless prior permission has been obtained.' },
      { type: 'section', label: '20. Curfew & Attendance', note: [
        'Students must follow hostel entry timings, attendance procedures, and curfew rules established by the hostel and Crispr Learning.',
        'Failure to comply may be treated as a disciplinary matter.',
      ] },
      { type: 'section', label: '21. Safety & Security', note: [
        'Students should not leave the hostel premises during restricted hours without permission.',
        'Students must immediately report any safety concerns, accidents, suspicious activities, or emergencies to the Warden, Caretaker, Mentor, or Crispr Support.',
      ] },
      {
        type: 'section',
        label: '22. Prohibited Activities',
        note: 'The following are strictly prohibited:',
        bullets: [
          'Smoking, tobacco, vaping, alcohol, or substance abuse.',
          'Gambling or betting activities.',
          'Possession of dangerous items or prohibited materials.',
          'Physical fights, threats, or violent behaviour.',
          'Any activity that may endanger the safety or well-being of others.',
        ],
      },
      { type: 'section', label: '23. Personal Belongings', note: [
        'Students are responsible for safeguarding their personal belongings, cash, electronic devices, and valuables.',
        'Students are advised not to keep large amounts of cash or expensive valuables in the hostel.',
      ] },
      { type: 'section', label: '24. Communication with Parents', note: 'In the interest of student welfare, Crispr Learning may communicate with parents or guardians regarding attendance, discipline, health concerns, hostel-related matters, and student well-being.' },
      { type: 'section', label: '25. Cleanliness & Personal Hygiene', note: 'Students are expected to maintain personal hygiene and keep their rooms, washrooms, and common areas clean and tidy. Hostel staff and fellow residents should be treated respectfully.' },
      { type: 'section', label: '26. Electricity & Water Conservation', note: 'Students should use electricity, water, air-conditioning, fans, lights, and other utilities responsibly. Lights, fans, and appliances should be switched off when not in use.' },
      { type: 'section', label: '27. Study Hours', note: 'Students shall observe the study hours prescribed by the hostel or Crispr Learning and avoid activities that disturb fellow students during study time.' },
      { type: 'section', label: '28. Night-Time Discipline', note: 'Students should maintain silence during designated sleeping hours and avoid activities that may disturb other residents.' },
      { type: 'section', label: '29. Health & Medication', note: 'Students requiring regular medication or having any known medical condition should inform their parents, Warden, and Crispr Learning in advance. Students should not consume medicines prescribed to another person.' },
      { type: 'section', label: '30. Personal Belongings (Liability)', note: 'Students are advised to label and secure their personal belongings. Crispr Learning and hostel providers shall not be responsible for loss of personal items resulting from negligence or failure to secure them properly.' },
      { type: 'section', label: '31. Compliance with Local Laws', note: 'Students must comply with all applicable laws and regulations while residing in the hostel and representing Crispr Learning.' },
      { type: 'section', label: '32. Emergency Situations', note: 'In emergency situations involving health, safety, discipline, or welfare concerns, Crispr Learning may take immediate decisions in the best interest of the student and may contact the parent or guardian without prior notice.' },
      { type: 'section', label: '33. Parent Cooperation', note: 'Parents and guardians are requested to cooperate with Crispr Learning, Wardens, and hostel providers regarding attendance, discipline, health, safety, and student welfare matters.' },
      { type: 'section', label: '34. Changes to Residence Arrangements', note: 'In exceptional circumstances, Crispr Learning may reassign a student to another room or hostel accommodation if required for operational, safety, disciplinary, medical, or student welfare reasons.' },

      { type: 'section', label: 'Declaration', note: 'I have read and understood the Residence (Hostel) Terms & Conditions. I agree to follow these guidelines and understand that these rules are intended to ensure the safety, well-being, discipline, and academic success of all students residing in hostel accommodation coordinated by Crispr Learning.', noteEmphasis: true },

      { type: 'section', label: 'Student Details' },
      { key: 'studentName', label: 'Student Name', type: 'text', required: true },
      { key: 'studentSignedOn', label: 'Student Signature', type: 'signature', required: true },

      { type: 'section', label: 'Parent / Guardian Details' },
      { key: 'guardianName', label: 'Parent / Guardian Name', type: 'text', required: true },
      { key: 'guardianSignedOn', label: 'Parent / Guardian Signature', type: 'signature', required: true },
    ],
  },
  EXAM_RESULTS_CONSENT: {
    id: 'EXAM_RESULTS_CONSENT',
    title: 'Exam Results Consent',
    version: '2.0',
    intro: 'Consent to the publication of your exam results.',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'examName', label: 'Exam Name', type: 'text', required: true },
      { key: 'consent', label: 'I consent to publish my results publicly', type: 'checkbox', required: true },
      { key: 'signedOn', label: 'Signature', type: 'signature', required: true },
    ],
  },
};

export function getTemplate(id) {
  return FORM_TEMPLATES[id] || null;
}
