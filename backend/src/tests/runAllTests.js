import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testSuites = [
  { name: 'Phase 2: Database Foundation', file: 'dbVerify.js' },
  { name: 'Phase 3: Authentication & RBAC', file: 'authVerify.js' },
  { name: 'Phase 4: Patient Management', file: 'patientVerify.js' },
  { name: 'Phase 5: Departments & Doctors', file: 'deptDocVerify.js' },
  { name: 'Phase 6: Appointments & Slots', file: 'appointmentVerify.js' },
  { name: 'Phase 7: Notification Foundation', file: 'notificationVerify.js' },
  { name: 'Phase 8: Check-In & Digital Tokens', file: 'tokenVerify.js' },
  { name: 'Phase 9: Live Queue & TV Display', file: 'queueVerify.js' },
  { name: 'Phase 10: Doctor Consultation Workstation', file: 'consultationVerify.js' },
  { name: 'Phase 11: Digital Prescriptions', file: 'prescriptionVerify.js' },
  { name: 'Phase 12: Pharmacy & Inventory Management', file: 'pharmacyVerify.js' },
  { name: 'Phase 13: Billing & Invoicing', file: 'billingVerify.js' },
  { name: 'Phase 14: Role-Based Dashboards', file: 'dashboardVerify.js' },
  { name: 'Phase 15: Reports & Analytics', file: 'reportVerify.js' },
  { name: 'Phase 16a: Master End-to-End Patient Journey', file: 'e2ePatientJourney.js' },
  { name: 'Phase 16b: Boundary & Constraint Stress Testing', file: 'boundaryStressTest.js' },
  { name: 'Phase 18a: Concurrency & Race-Condition Stress Testing', file: 'concurrencyStressTest.js' },
  { name: 'Phase 18b: Production Readiness & Master E2E Verification', file: 'phase18E2EVerification.js' },
];

const runSuite = (suite) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const suitePath = path.join(__dirname, suite.file);
    const proc = spawn('node', [suitePath], { stdio: 'inherit' });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      resolve({
        name: suite.name,
        file: suite.file,
        passed: code === 0,
        duration,
      });
    });

    proc.on('error', (err) => {
      resolve({
        name: suite.name,
        file: suite.file,
        passed: false,
        duration: 0,
        error: err.message,
      });
    });
  });
};

const runAll = async () => {
  console.log('\n============================================================');
  console.log('   ADYAPAN HOSPITAL QUEUE & APPOINTMENT SYSTEM');
  console.log('   FULL SYSTEM STABILIZATION & REGRESSION TEST RUNNER');
  console.log('============================================================\n');

  const results = [];
  for (const suite of testSuites) {
    console.log(`\n▶ Running: ${suite.name} (${suite.file})...`);
    const result = await runSuite(suite);
    results.push(result);
  }

  console.log('\n============================================================');
  console.log('                 FINAL TEST SCORECARD');
  console.log('============================================================');

  let passedCount = 0;
  results.forEach((r, idx) => {
    const status = r.passed ? '✅ PASSED' : '❌ FAILED';
    if (r.passed) passedCount++;
    console.log(
      `${String(idx + 1).padStart(2, ' ')}. ${r.name.padEnd(46, ' ')} : ${status} (${r.duration}s)`
    );
  });

  console.log('------------------------------------------------------------');
  console.log(
    `TOTAL TEST SUITES: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`
  );
  console.log(
    `SYSTEM STABILIZATION SCORE: ${Math.round((passedCount / results.length) * 100)}%`
  );
  console.log('============================================================\n');

  if (passedCount !== results.length) {
    process.exit(1);
  }
};

runAll();
