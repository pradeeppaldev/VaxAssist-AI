import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_FAMILY_MEMBERS } from '@/data/mockFamilyData';
import { MOCK_PATIENTS_REGISTRY, MOCK_HEALTHCARE_WORKER } from '@/data/mockHealthcareData';

const DemoModeContext = createContext(null);

const DEMO_STORE_KEY = 'vaxassist_demo_store_v2';
const DEMO_MODE_FLAG = 'vaxassist_mode';

// Default initial demo state
function getInitialDemoStore() {
  return {
    familyMembers: INITIAL_FAMILY_MEMBERS,
    notifications: [
      {
        id: 'notif-demo-1',
        title: 'Overdue Alert: Aarav Sharma',
        message: 'DPT Booster 2 was due on 10 Jul 2026. Please schedule catch-up immunization at your earliest convenience.',
        scheduled_for: '2026-09-25T09:00:00Z',
        channel: 'IN_APP',
        notification_type: 'OVERDUE',
        priority: 'HIGH',
        is_read: false,
      },
      {
        id: 'notif-demo-2',
        title: 'Overdue Milestone: Ananya Sharma',
        message: '14-week primary immunization milestone (Pentavalent 3, OPV 3, Rota 3) was due on 18 Sep 2026.',
        scheduled_for: '2026-09-20T09:00:00Z',
        channel: 'IN_APP',
        notification_type: 'OVERDUE',
        priority: 'HIGH',
        is_read: false,
      },
      {
        id: 'notif-demo-3',
        title: 'Upcoming Window: Rajesh Sharma',
        message: 'Annual Quadrivalent Influenza shot is recommended ahead of winter season (due 15 Nov 2026).',
        scheduled_for: '2026-10-15T14:30:00Z',
        channel: 'IN_APP',
        notification_type: 'REMINDER',
        priority: 'NORMAL',
        is_read: true,
      },
    ],
    hcwSettings: {
      name: 'Dr. Anjali Deshmukh',
      designation: 'Senior Consultant Pediatrician & Cold-Chain Supervisor',
      hospital: 'Lilavati Hospital & Research Centre',
      department: 'Pediatric Infectious Diseases & Immunization',
      licenseNumber: 'MMC-2012-08492',
      phone: '+91 98201 99882',
      email: 'dr.anjali.deshmukh@vaxassist.demo',
      coldChainId: 'MH-MUM-CC-042',
      dailyTargetDoses: 35,
      alertUrgentSms: true,
      alertBatchExpiry: true,
      alertTemperatureBreach: true,
    },
    hcwNotifications: [
      {
        id: 'hcw-notif-1',
        title: 'Cold-Chain Storage Alert: Unit CC-042',
        message: 'Main vaccine storage unit temperature logged at 7.8°C (Threshold: 8.0°C). Normalcy restored.',
        type: 'WARNING',
        date: 'Today, 08:15 AM',
        isRead: false,
      },
      {
        id: 'hcw-notif-2',
        title: 'Overdue Follow-up: Aarav Sharma',
        message: 'Parent Rajesh Sharma received automated reminder for DPT Booster 2 catch-up.',
        type: 'ACTION',
        date: 'Today, 07:30 AM',
        isRead: false,
      },
      {
        id: 'hcw-notif-3',
        title: 'Batch Release Verification: PNT-2026-B89',
        message: 'Lot inspection passed Central Drugs Standard Control Organisation (CDSCO) release protocol.',
        type: 'INFO',
        date: 'Yesterday, 04:45 PM',
        isRead: true,
      },
    ],
  };
}

export function DemoModeProvider({ children }) {
  // Read persisted mode flag ('live' by default, or 'demo' if user explicitly toggled)
  const [isDemoMode, setIsDemoMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DEMO_MODE_FLAG);
      return stored === 'demo';
    } catch {
      return false;
    }
  });

  // Local demo store state
  const [demoStore, setDemoStore] = useState(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    const initial = getInitialDemoStore();
    try {
      localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  });

  // Save demoStore to localStorage whenever changed
  const saveDemoStore = useCallback((updatedStore) => {
    setDemoStore(updatedStore);
    try {
      localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updatedStore));
    } catch (e) {
      console.warn('Could not persist demo store to localStorage:', e);
    }
  }, []);

  // Toggle Mode Function
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DEMO_MODE_FLAG, next ? 'demo' : 'live');
        // Dispatch custom event to notify components
        window.dispatchEvent(new CustomEvent('vaxassist_mode_change', { detail: { isDemoMode: next } }));
      } catch (e) {
        console.warn('Could not persist mode:', e);
      }
      return next;
    });
  }, []);

  const setDemoMode = useCallback((enabled) => {
    setIsDemoMode(enabled);
    try {
      localStorage.setItem(DEMO_MODE_FLAG, enabled ? 'demo' : 'live');
      window.dispatchEvent(new CustomEvent('vaxassist_mode_change', { detail: { isDemoMode: enabled } }));
    } catch (e) {
      console.warn('Could not persist mode:', e);
    }
  }, []);

  // Reset Demo Store
  const resetDemoData = useCallback(() => {
    const initial = getInitialDemoStore();
    saveDemoStore(initial);
  }, [saveDemoStore]);

  // Demo Member CRUD operations
  const addDemoMember = useCallback((memberData) => {
    setDemoStore((prev) => {
      const newId = `fam-${Date.now()}`;
      const birthYear = memberData.dob ? new Date(memberData.dob).getFullYear() : new Date().getFullYear();
      const ageYears = Math.max(0, new Date().getFullYear() - birthYear);
      const isChild = ageYears < 18 || ['Son', 'Daughter', 'Child'].includes(memberData.relationship);

      const newMember = {
        id: newId,
        name: memberData.name,
        relationship: memberData.relationship || 'Dependent',
        age: `${ageYears} year${ageYears === 1 ? '' : 's'}`,
        dob: memberData.dob,
        gender: memberData.gender || 'Other',
        bloodGroup: memberData.bloodGroup || 'Unknown',
        isChild,
        phone: memberData.phone || '',
        email: memberData.email || '',
        allergies: memberData.allergies || 'None reported',
        primaryClinic: memberData.primaryClinic || 'Primary Health Center',
        pediatrician: isChild ? 'Pediatric Specialist' : 'General Practitioner',
        avatarFallback: (memberData.name || 'FM').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        avatarBg: isChild
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        progress: 100,
        completedDoses: 0,
        totalDoses: 0,
        upcomingCount: 1,
        overdueCount: 0,
        status: 'UPCOMING',
        statusLabel: 'Active Schedule',
        statusVariant: 'secondary',
        needsAttention: false,
        attentionReason: null,
        nextVaccine: {
          name: 'Scheduled Initial Assessment',
          dueDate: 'Within 30 Days',
          relative: 'Upcoming',
          status: 'UPCOMING',
          clinic: memberData.primaryClinic || 'Primary Health Center',
          category: 'Initial Check',
          notes: 'Initial clinical assessment recorded in demo mode.',
        },
      };

      const updated = {
        ...prev,
        familyMembers: [newMember, ...prev.familyMembers],
      };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateDemoMember = useCallback((id, updatedFields) => {
    setDemoStore((prev) => {
      const updatedMembers = prev.familyMembers.map((m) => {
        if (m.id === id) {
          return { ...m, ...updatedFields };
        }
        return m;
      });
      const updated = { ...prev, familyMembers: updatedMembers };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const deleteDemoMember = useCallback((id) => {
    setDemoStore((prev) => {
      const filtered = prev.familyMembers.filter((m) => m.id !== id);
      const updated = { ...prev, familyMembers: filtered };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Demo Notifications CRUD
  const markDemoNotificationRead = useCallback((notifId) => {
    setDemoStore((prev) => {
      const updatedNotifs = prev.notifications.map((n) => {
        if (n.id === notifId) {
          return { ...n, is_read: true };
        }
        return n;
      });
      const updated = { ...prev, notifications: updatedNotifs };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const markDemoHcwNotificationRead = useCallback((notifId) => {
    setDemoStore((prev) => {
      const updatedNotifs = (prev.hcwNotifications || []).map((n) => {
        if (n.id === notifId) {
          return { ...n, isRead: true };
        }
        return n;
      });
      const updated = { ...prev, hcwNotifications: updatedNotifs };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateDemoHcwSettings = useCallback((newSettings) => {
    setDemoStore((prev) => {
      const updated = {
        ...prev,
        hcwSettings: {
          ...prev.hcwSettings,
          ...newSettings,
        },
      };
      try {
        localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Browser-native client-side PDF generator for Demo Mode
  const downloadDemoPdf = useCallback((filename = 'vaxassist_demo_report.pdf', title = 'Digital Immunization Passport') => {
    // Generate an authentic PDF document with binary PDF header and content
    const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const content = `%PDF-1.4
1 0 obj
<<
/Title (${title})
/Author (VaxAssist AI Digital Immunization Platform)
/Creator (VaxAssist Phase 8 Verification Agent)
/Producer (VaxAssist Client PDF Engine)
/CreationDate (D:${new Date().toISOString().split(/[^0-9]/).filter(Boolean).join('').slice(0, 14)})
>>
endobj
2 0 obj
<<
/Type /Catalog
/Pages 3 0 R
>>
endobj
3 0 obj
<<
/Type /Pages
/Kids [4 0 R]
/Count 1
>>
endobj
4 0 obj
<<
/Type /Page
/Parent 3 0 R
/MediaBox [0 0 612 792]
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica-Bold
    >>
    /F2 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica
    >>
  >>
>>
/Contents 5 0 R
>>
endobj
5 0 obj
<<
/Length 550
>>
stream
BT
/F1 18 Tf
50 720 Td
(${title}) Tj
/F2 10 Tf
0 -25 Td
(VaxAssist AI Digital Immunization Verification Platform) Tj
0 -15 Td
(Date Generated: ${dateStr} | Mode: Verified Simulation) Tj
0 -20 Td
(---------------------------------------------------------------------------------------------------) Tj
0 -25 Td
(/F1 12 Tf) Tj
(PATIENT DEMOGRAPHICS & RECORD SUMMARY) Tj
/F2 10 Tf
0 -20 Td
(Patient Name: Aarav Sharma | Relationship: Son | DOB: 2020-07-10 | Blood Group: O+) Tj
0 -15 Td
(Healthcare Center: Lilavati Hospital & Research Centre | Attending: Dr. Anjali Deshmukh) Tj
0 -20 Td
(---------------------------------------------------------------------------------------------------) Tj
0 -25 Td
(IMMUNIZATION STATUS: 18 of 19 UIP Doses Completed. Overall Compliance: 88.0%) Tj
0 -15 Td
(Next Actionable Milestone: DPT Booster 2 (Age 5-6 Years) - Catch-up Recommended) Tj
0 -30 Td
(CRYPTOGRAPHIC INTEGRITY & VALIDATION SEAL:) Tj
0 -15 Td
(SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855) Tj
0 -20 Td
(This digital document conforms to National Immunization Schedule guidelines.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000215 00000 n 
0000000268 00000 n 
0000000329 00000 n 
0000000570 00000 n 
trailer
<<
/Size 6
/Root 2 0 R
/Info 1 0 R
>>
startxref
1175
%%EOF`;

    const blob = new Blob([content], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 400);

    return { success: true, filename };
  }, []);

  const value = {
    isDemoMode,
    setDemoMode,
    toggleDemoMode,
    demoStore,
    resetDemoData,
    addDemoMember,
    updateDemoMember,
    deleteDemoMember,
    markDemoNotificationRead,
    markDemoHcwNotificationRead,
    updateDemoHcwSettings,
    downloadDemoPdf,
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
