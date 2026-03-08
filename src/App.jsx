import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, query, where, onSnapshot, updateDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import {
  Users,
  BookOpen,
  Settings,
  Plus,
  Search,
  Smartphone,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
  Lock,
  Edit2,
  Trash2,
  Send,
  QrCode,
  LogOut,
  Bell,
  LayoutGrid,
  X,
  Loader2,
  AlertCircle,
  Globe,
  Upload,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Mail,
  Building,
  Key,
  ShieldAlert,
  History,
  AlertTriangle,
  Megaphone,
  Monitor,
  Volume2,
  Settings2,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

/**
 * FIREBASE INITIALIZATION
 */
const getFirebaseConfig = () => {
  try {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } catch (error) {
    return {
      apiKey: "preview-only",
      authDomain: "preview-only",
      projectId: "preview-only",
      storageBucket: "preview-only",
      messagingSenderId: "preview-only",
      appId: "preview-only"
    };
  }
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login / Reg Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Dashboard Data State ---
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]); 
  const [library, setLibrary] = useState([]);
  const [staff, setStaff] = useState([]); 
  const [pendingInvites, setPendingInvites] = useState([]);
  const [orgDetails, setOrgDetails] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]); 
  
  // --- Notifications State ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [readNotifs, setReadNotifs] = useState(() => JSON.parse(localStorage.getItem('zip_read_notifs') || '[]'));
  
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceTargetOrg, setAnnounceTargetOrg] = useState('');
  const [announceTargetRole, setAnnounceTargetRole] = useState('all');

  // --- Super Admin State ---
  const [systemUsers, setSystemUsers] = useState([]); 
  const [organizations, setOrganizations] = useState([]);
  const [systemStudents, setSystemStudents] = useState([]);
  const [saInviteEmail, setSaInviteEmail] = useState('');
  const [saInviteOrgId, setSaInviteOrgId] = useState('');

  const [dataLoading, setDataLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remoteDevicePin, setRemoteDevicePin] = useState(''); // Remote PIN state
  
  // --- Modals State ---
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [editingLibraryPage, setEditingLibraryPage] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('📄');

  // Add Student Modal
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSchoolId, setNewStudentSchoolId] = useState('');

  // Assign Existing Student/Teacher Modals
  const [editingStudentSchool, setEditingStudentSchool] = useState(null);
  const [editStudentSchoolId, setEditStudentSchoolId] = useState('');
  const [editingTeacherSchools, setEditingTeacherSchools] = useState(null);
  const [editTeacherAllSchools, setEditTeacherAllSchools] = useState(false);
  const [editTeacherSchoolList, setEditTeacherSchoolList] = useState([]);

  // --- District Default Settings State ---
  const [districtTheme, setDistrictTheme] = useState('Light');
  const [districtVoice, setDistrictVoice] = useState('Standard Female');
  const [districtLayout, setDistrictLayout] = useState('Grid');

  // --- Student Settings Modal State ---
  const [showStudentSettingsModal, setShowStudentSettingsModal] = useState(false);
  const [editTheme, setEditTheme] = useState('Light');
  const [editAiContext, setEditAiContext] = useState('');
  const [editVoiceModel, setEditVoiceModel] = useState('Standard Female');
  const [editLayout, setEditLayout] = useState('Grid');
  const [isGeneratingAiContext, setIsGeneratingAiContext] = useState(false);
  const [aiGeneratorProgress, setAiGeneratorProgress] = useState(0);
  const mlcEngineRef = useRef(null);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAllSchools, setInviteAllSchools] = useState(true);
  const [inviteSchools, setInviteSchools] = useState([]);

  // Manage Schools Form
  const [newSchoolName, setNewSchoolName] = useState('');

  // Nuke District State (Local Admin)
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [nukeConfirmText, setNukeConfirmText] = useState('');
  const [isNuking, setIsNuking] = useState(false);

  // Super Admin Nuke District State
  const [showSANukeModal, setShowSANukeModal] = useState(false);
  const [saNukeTarget, setSaNukeTarget] = useState(null);
  const [saNukeCode, setSaNukeCode] = useState('');
  const [saNukeInputCode, setSaNukeInputCode] = useState('');
  const [saNukeInputName, setSaNukeInputName] = useState('');

  // --- Push to Student State ---
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedLibraryPageId, setSelectedLibraryPageId] = useState('');

  // --- Refs ---
  const libraryUploadRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);

  // 1. Listen for Firebase Login state changes & Fetch Profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
            setUser(currentUser);
          } else {
            // NEW USER CREATION (OAuth/SSO Fallback)
            try {
                const qInvite = query(collection(db, 'invites'), where('email', '==', currentUser.email.toLowerCase()));
                const inviteDocs = await getDocs(qInvite);
                const pendingInvite = inviteDocs.docs.find(doc => doc.data().status === 'pending');
                
                if (pendingInvite) {
                    const data = pendingInvite.data();
                    
                    const newProfile = {
                      email: currentUser.email,
                      name: currentUser.displayName || '',
                      role: data.role || 'teacher', 
                      orgId: data.orgId, 
                      schools: data.schools || [], 
                      createdAt: new Date().toISOString()
                    };
                    await setDoc(userRef, newProfile);
                    setUserProfile(newProfile);
                    setUser(currentUser);

                    await updateDoc(doc(db, 'invites', pendingInvite.id), { status: 'accepted' });
                    writeAuditLog('USER_REGISTERED', `User registered via invite code. Role: ${data.role}`, data.orgId, newProfile.email, newProfile.role);
                } else {
                    console.warn("Unauthorized access attempt by:", currentUser.email);
                    await signOut(auth);
                    setLoginError(`Access Denied: The email ${currentUser.email} has not been invited. Please use an Invite Code.`);
                    setUser(null);
                    setUserProfile(null);
                }
            } catch(err) {
                console.error("Error during profile validation", err);
                await signOut(auth);
                setLoginError("An error occurred while verifying your account. Please try again.");
                setUser(null);
                setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          await signOut(auth);
          setLoginError("Could not connect to the server.");
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Live Data from Firestore when Profile loads
  useEffect(() => {
    if (!userProfile || userProfile.orgId === 'pending') {
      setStudents([]);
      setLibrary([]);
      setStaff([]);
      setPendingInvites([]);
      setSchools([]);
      setAuditLogs([]);
      setNotifications([]);
      setOrgDetails(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const orgId = userProfile.orgId;

    // Listen to District Data
    const unsubOrg = onSnapshot(doc(db, 'organizations', orgId), (docSnap) => {
       if (docSnap.exists()) setOrgDetails(docSnap.data());
       else setOrgDetails(null);
    });

    // Listen to Schools Collection
    const qSchools = query(collection(db, 'schools'), where('orgId', '==', orgId));
    const unsubSchools = onSnapshot(qSchools, (snapshot) => {
       setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Students Collection
    const qStudents = query(collection(db, 'students'), where('orgId', '==', orgId));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentData);
      
      setSelectedStudent(prev => {
        if (!prev) return null;
        const updated = studentData.find(s => s.id === prev.id);
        return updated || null;
      });
    });

    // Listen to Library Collection
    const qLibrary = query(collection(db, 'library'), where('orgId', '==', orgId));
    const unsubLibrary = onSnapshot(qLibrary, (snapshot) => {
      setLibrary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Staff
    const qStaff = query(collection(db, 'users'), where('orgId', '==', orgId));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
    });

    // Listen to Pending Invites
    const qInvites = query(collection(db, 'invites'), where('orgId', '==', orgId));
    const unsubInvites = onSnapshot(qInvites, (snapshot) => {
      const inviteData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(inv => inv.status === 'pending');
      setPendingInvites(inviteData);
      setDataLoading(false);
    });

    // Listen to Notifications
    let globalNotifs = [];
    let orgNotifs = [];
    
    const updateNotifs = () => {
        const merged = [...globalNotifs, ...orgNotifs];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        const filtered = unique.filter(n => n.targetRole === 'all' || n.targetRole === userProfile.role);
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(filtered);
    };

    const unsubGlobalNotifs = onSnapshot(query(collection(db, 'notifications'), where('targetOrgId', '==', 'all')), snap => {
        globalNotifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateNotifs();
    });

    const unsubOrgNotifs = onSnapshot(query(collection(db, 'notifications'), where('targetOrgId', '==', orgId)), snap => {
        orgNotifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateNotifs();
    });

    // Listen to Audit Logs (District Admin scope)
    let unsubLogs = () => {};
    if (userProfile.role === 'district_admin') {
      const qLogs = query(collection(db, 'audit_logs'), where('orgId', '==', orgId));
      unsubLogs = onSnapshot(qLogs, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAuditLogs(logs);
        pruneOldAuditLogs(logs, orgId);
      });
    }

    return () => {
      unsubOrg();
      unsubSchools();
      unsubStudents();
      unsubLibrary();
      unsubStaff();
      unsubInvites();
      unsubGlobalNotifs();
      unsubOrgNotifs();
      unsubLogs();
    };
  }, [userProfile]);

  // Keep remote PIN input synced with the currently selected student
  useEffect(() => {
    if (selectedStudent) {
        setRemoteDevicePin(selectedStudent.adminPin || '');
    } else {
        setRemoteDevicePin('');
    }
  }, [selectedStudent?.id, selectedStudent?.adminPin]);

  // 3. Super Admin Live Feeds
  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setSystemUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      });
      const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
        setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubStudentsAll = onSnapshot(collection(db, 'students'), (snapshot) => {
        setSystemStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const unsubLogsAll = onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAuditLogs(logs);
      });
      return () => {
         unsubUsers();
         unsubOrgs();
         unsubStudentsAll();
         unsubLogsAll();
      };
    }
  }, [userProfile]);

  // 4. Camera Stream & QR Scanner Loop
  useEffect(() => {
    let scanAnimationFrame;
    
    if (showPairingModal) {
      setIsStreamReady(false);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.setAttribute("playsinline", true);
             videoRef.current.play();
             setIsStreamReady(true);
             
             // --- QR Scanning Loop ---
             const canvas = document.createElement("canvas");
             const ctx = canvas.getContext("2d");
             
             const scanQRCode = () => {
                if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                    canvas.height = videoRef.current.videoHeight;
                    canvas.width = videoRef.current.videoWidth;
                    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (window.jsQR) {
                        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert"
                        });
                        if (code && code.data && code.data.length === 10) {
                            setPairingCode(code.data.toUpperCase());
                        }
                    }
                }
                scanAnimationFrame = requestAnimationFrame(scanQRCode);
             };
             
             scanAnimationFrame = requestAnimationFrame(scanQRCode);
          }
        })
        .catch(err => console.error("Camera access denied", err));
    } else {
      setIsStreamReady(false);
      if (scanAnimationFrame) cancelAnimationFrame(scanAnimationFrame);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      setIsStreamReady(false);
      if (scanAnimationFrame) cancelAnimationFrame(scanAnimationFrame);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [showPairingModal]);


  // --- USER ACCESS FILTERING ---
  const visibleStudents = students.filter(s => {
      if (!userProfile) return false;
      if (userProfile.role === 'super_admin' || userProfile.role === 'district_admin') return true;
      if (userProfile.schools === 'all') return true;
      return userProfile.schools?.includes(s.schoolId);
  });

  const activeLicensesCount = students.filter(s => s.hasLicense !== false).length;
  const maxLicenses = orgDetails?.licenses || 0;
  const availableLicenses = Math.max(0, maxLicenses - activeLicensesCount);


  // --- AUDIT LOGGING HELPER ---
  const writeAuditLog = async (action, details, targetOrgId = userProfile?.orgId, customEmail = null, customRole = null) => {
      try {
          await addDoc(collection(db, 'audit_logs'), {
              action,
              details,
              actorEmail: customEmail || userProfile?.email || user?.email || 'System',
              actorRole: customRole || userProfile?.role || 'System',
              orgId: targetOrgId,
              createdAt: new Date().toISOString()
          });
      } catch (e) {
          console.error("Failed to write audit log:", e);
      }
  };

  // --- PRUNE OLD LOGS ---
  const pruneOldAuditLogs = async (currentLogs, orgId) => {
      const lastPruneKey = `zip_last_prune_${orgId}`;
      const lastPruneStr = localStorage.getItem(lastPruneKey);
      
      if (lastPruneStr) {
          const lastPruneDate = new Date(lastPruneStr);
          const hoursSinceLastPrune = (new Date() - lastPruneDate) / (1000 * 60 * 60);
          if (hoursSinceLastPrune < 24) return;
      }

      console.log("Running Audit Log Pruning Routine...");
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const logsToDelete = currentLogs.filter(log => new Date(log.createdAt) < cutoffDate);
      
      if (logsToDelete.length > 0) {
          try {
              const batch = writeBatch(db);
              const batchLimit = 400;
              const logsToProcess = logsToDelete.slice(0, batchLimit);
              
              logsToProcess.forEach(log => {
                  const logRef = doc(db, 'audit_logs', log.id);
                  batch.delete(logRef);
              });
              
              await batch.commit();
              localStorage.setItem(lastPruneKey, new Date().toISOString());

          } catch (e) {
              console.error("Failed to prune old audit logs:", e);
          }
      } else {
          localStorage.setItem(lastPruneKey, new Date().toISOString());
      }
  };

  // --- NOTIFICATION HELPERS ---
  const unreadNotifCount = notifications.filter(n => !readNotifs.includes(n.id)).length;
  
  const markNotifsAsRead = () => {
      const allIds = notifications.map(n => n.id);
      const newRead = [...new Set([...readNotifs, ...allIds])];
      setReadNotifs(newRead);
      localStorage.setItem('zip_read_notifs', JSON.stringify(newRead));
  };

  const handleSendAnnouncement = async (e) => {
      e.preventDefault();
      if (!announceTitle.trim() || !announceMessage.trim()) return;

      try {
          await addDoc(collection(db, 'notifications'), {
              title: announceTitle.trim(),
              message: announceMessage.trim(),
              targetOrgId: announceTargetOrg || userProfile.orgId,
              targetRole: announceTargetRole,
              createdBy: userProfile.name || user.email,
              createdAt: new Date().toISOString()
          });
          writeAuditLog('BROADCAST_ANNOUNCEMENT', `Broadcast sent: "${announceTitle}" to Org: ${announceTargetOrg || userProfile.orgId}, Role: ${announceTargetRole}`);
          
          setShowAnnounceModal(false);
          setAnnounceTitle('');
          setAnnounceMessage('');
          setAnnounceTargetRole('all');
          setAnnounceTargetOrg('');
          alert("Announcement sent successfully!");
      } catch (err) {
          console.error("Failed to send announcement", err);
          alert("Error sending announcement.");
      }
  };

  // --- Handle Saving Remote Device PIN ---
  const handleSaveRemotePin = async () => {
      if (!selectedStudent) return;
      try {
          await updateDoc(doc(db, 'students', selectedStudent.id), {
              adminPin: remoteDevicePin.trim(),
              lastSync: 'Just now (PIN Updated)'
          });
          writeAuditLog('UPDATE_DEVICE_PIN', `Updated remote device PIN for student "${selectedStudent.name}"`);
          alert("Device PIN updated successfully.");
      } catch (error) {
          console.error("Failed to save remote pin:", error);
          alert("Failed to save PIN.");
      }
  };

  // --- ACTIONS ---

  // Auth: Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
         setLoginError("Invalid email or password.");
      } else {
         setLoginError(error.message.replace('Firebase: ', ''));
      }
      setIsLoggingIn(false);
    }
  };

  // Auth: Register with Invite Code
  const handleRegisterWithCode = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
        const cleanCode = regInviteCode.trim().toUpperCase();
        
        const qInvite = query(collection(db, 'invites'), where('code', '==', cleanCode));
        const inviteDocs = await getDocs(qInvite);
        const pendingInviteDoc = inviteDocs.docs.find(doc => doc.data().status === 'pending');

        if (!pendingInviteDoc) {
            throw new Error("Invalid or expired invite code.");
        }
        
        const inviteData = pendingInviteDoc.data();

        if (inviteData.email.toLowerCase() !== loginEmail.toLowerCase().trim()) {
            throw new Error(`This code is registered to ${inviteData.email}. Please use that email address.`);
        }

        const userCred = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        
        const newProfile = {
            email: loginEmail.toLowerCase().trim(),
            name: regName.trim(),
            role: inviteData.role || 'teacher',
            orgId: inviteData.orgId,
            schools: inviteData.schools || [],
            createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
        await updateDoc(doc(db, 'invites', pendingInviteDoc.id), { status: 'accepted' });
        writeAuditLog('USER_REGISTERED', `User registered via invite code. Role: ${inviteData.role}`, inviteData.orgId, newProfile.email, newProfile.role);

    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-in-use') {
            setLoginError("An account already exists for this email. Try switching to 'Sign In'.");
        } else {
            setLoginError(error.message.replace('Firebase: ', ''));
        }
        await signOut(auth);
    } finally {
        setIsLoggingIn(false);
    }
  };

  // Auth: OAuth Login
  const handleOAuthLogin = async (providerName) => {
    setLoginError('');
    setIsLoggingIn(true);
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new OAuthProvider('microsoft.com');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoginError(error.message.replace('Firebase: ', ''));
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error("Error signing out: ", error); }
  };


  // Schools: Create a new School in the District
  const handleCreateSchool = async (e) => {
      e.preventDefault();
      if (!newSchoolName.trim() || !userProfile?.orgId) return;
      try {
          await addDoc(collection(db, 'schools'), {
              name: newSchoolName.trim(),
              orgId: userProfile.orgId,
              createdAt: new Date().toISOString()
          });
          writeAuditLog('CREATE_SCHOOL', `Created new school: "${newSchoolName.trim()}"`);
          setNewSchoolName('');
      } catch (e) {
          console.error("Error creating school", e);
          alert("Failed to create school.");
      }
  };

  // Assign Existing Student to a different School
  const handleUpdateStudentSchool = async (e) => {
      e.preventDefault();
      if (!editingStudentSchool || !editStudentSchoolId) return;
      try {
          await updateDoc(doc(db, 'students', editingStudentSchool.id), {
              schoolId: editStudentSchoolId
          });
          const newSchoolName = schools.find(s => s.id === editStudentSchoolId)?.name;
          writeAuditLog('UPDATE_STUDENT_SCHOOL', `Reassigned student "${editingStudentSchool.name}" to school: ${newSchoolName}`);
          
          if (selectedStudent?.id === editingStudentSchool.id) {
              setSelectedStudent(prev => ({...prev, schoolId: editStudentSchoolId}));
          }
          setEditingStudentSchool(null);
      } catch (err) {
          console.error("Error updating student school", err);
          alert("Failed to assign school.");
      }
  };

  // Assign Existing Teacher to different Schools
  const handleUpdateTeacherSchools = async (e) => {
      e.preventDefault();
      if (!editingTeacherSchools) return;
      try {
          const newAccess = editTeacherAllSchools ? 'all' : editTeacherSchoolList;
          await updateDoc(doc(db, 'users', editingTeacherSchools.uid), {
              schools: newAccess
          });
          writeAuditLog('UPDATE_TEACHER_ACCESS', `Updated school access for teacher ${editingTeacherSchools.email}. Access: ${editTeacherAllSchools ? 'All' : 'Specific'}`);
          setEditingTeacherSchools(null);
      } catch (err) {
          console.error("Error updating teacher schools", err);
          alert("Failed to update teacher access.");
      }
  };


  // Staff: Invite Teacher
  const handleInviteTeacher = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !userProfile?.orgId) return;

    if (!inviteAllSchools && inviteSchools.length === 0) {
        return alert("Please select at least one school or check 'All Schools'.");
    }

    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        await addDoc(collection(db, 'invites'), {
            email: inviteEmail.trim().toLowerCase(),
            orgId: userProfile.orgId,
            role: 'teacher',
            invitedBy: user.email,
            code: code,
            schools: inviteAllSchools ? 'all' : inviteSchools,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        
        writeAuditLog('INVITE_TEACHER', `Generated invite code for ${inviteEmail.trim()}`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteSchools([]);
        setInviteAllSchools(true);
        alert(`Invite created successfully!\n\nProvide the teacher with this code: ${code}`);
    } catch (err) {
        console.error("Error inviting teacher:", err);
        alert("Failed to send invitation. Check console for permissions.");
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (window.confirm("Are you sure you want to cancel this invitation?")) {
        try { 
            await deleteDoc(doc(db, 'invites', inviteId)); 
            writeAuditLog('CANCEL_INVITE', `Revoked a pending invitation.`);
        } 
        catch (err) { console.error("Error canceling invite:", err); }
    }
  };

  // Remove Existing Teacher
  const handleRemoveTeacher = async (teacherUid, teacherEmail) => {
    if (window.confirm(`Are you sure you want to remove ${teacherEmail} from the district? They will lose all access immediately.`)) {
        try {
            await deleteDoc(doc(db, 'users', teacherUid));
            writeAuditLog('REMOVE_TEACHER', `Removed teacher ${teacherEmail} from the district`);
        } catch (err) {
            console.error("Failed to remove teacher", err);
            alert("Failed to remove teacher.");
        }
    }
  };

  // Delete District Batch Function
  const deleteCollectionInBatches = async (colName, orgId) => {
      const q = query(collection(db, colName), where('orgId', '==', orgId));
      const snap = await getDocs(q);
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(db);
          docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
          await batch.commit();
      }
  };

  // Delete District (Nuke - Local Admin)
  const handleNukeDistrict = async (e) => {
      e.preventDefault();
      const targetName = orgDetails?.name || userProfile?.orgId;
      if (nukeConfirmText !== targetName) return alert("Confirmation text does not match.");

      if (!window.confirm("FINAL WARNING: This will permanently delete ALL data, students, teachers, and logs for this district. This action is irreversible.")) return;

      setIsNuking(true);
      try {
          const orgId = userProfile.orgId;
          const collectionsToWipe = ['students', 'schools', 'library', 'users', 'invites', 'audit_logs', 'notifications'];

          for (const colName of collectionsToWipe) {
              await deleteCollectionInBatches(colName, orgId);
          }

          await deleteDoc(doc(db, 'organizations', orgId));
          await signOut(auth);
          alert("District data has been permanently deleted.");
      } catch (error) {
          console.error("Failed to delete district data:", error);
          alert("An error occurred while deleting district data.");
          setIsNuking(false);
      }
  };

  // --- Super Admin Nuke Modal Logic ---
  const openSANukeModal = (orgId, name) => {
      setSaNukeTarget({ id: orgId, name: name || orgId });
      setSaNukeCode(Math.floor(100000 + Math.random() * 900000).toString());
      setSaNukeInputCode('');
      setSaNukeInputName('');
      setShowSANukeModal(true);
  };

  const handleSuperAdminNuke = async (e) => {
      e.preventDefault();
      if (saNukeInputCode !== saNukeCode) return alert("Security Verification Code is incorrect.");
      if (saNukeInputName !== saNukeTarget.name) return alert("District name does not match.");

      if (!window.confirm(`FINAL WARNING: This will permanently delete ${saNukeTarget.name} and ALL associated user data. This action is irreversible.`)) return;

      setIsNuking(true);
      try {
          const collectionsToWipe = ['students', 'schools', 'library', 'users', 'invites', 'audit_logs', 'notifications'];
          for (const colName of collectionsToWipe) {
              await deleteCollectionInBatches(colName, saNukeTarget.id);
          }
          await deleteDoc(doc(db, 'organizations', saNukeTarget.id));
          writeAuditLog('SUPER_ADMIN_DELETE_DISTRICT', `Super Admin permanently deleted district "${saNukeTarget.name}"`, saNukeTarget.id);
          alert("District successfully deleted.");
          setShowSANukeModal(false);
          setSaNukeTarget(null);
      } catch (error) {
          console.error("Failed to delete district:", error);
          alert("An error occurred while deleting district data.");
      } finally {
          setIsNuking(false);
      }
  };

  // Students: Create a new Student Profile
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !userProfile?.orgId) return;
    if (!newStudentSchoolId) return alert("Please assign this student to a school.");

    const canAssignLicense = maxLicenses === 0 || activeLicensesCount < maxLicenses;

    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName.trim(),
        schoolId: newStudentSchoolId,
        orgId: userProfile.orgId,
        device: 'Unlinked',
        status: 'offline',
        lastSync: 'Never',
        pages: [],
        hasLicense: canAssignLicense,
        adminPin: "" 
      });
      
      const schName = schools.find(s => s.id === newStudentSchoolId)?.name;
      writeAuditLog('CREATE_STUDENT', `Created student profile for "${newStudentName.trim()}" at ${schName}`);
      
      setShowNewStudentModal(false);
      setNewStudentName('');
      setNewStudentSchoolId('');

      if (!canAssignLicense) {
          alert(`Profile created! However, your district is out of available licenses, so this profile is currently Unlicensed.`);
      }
    } catch (err) {
      console.error("Error creating student:", err);
      alert("Failed to create student.");
    }
  };

  const handleToggleLicense = async (student) => {
    const currentStatus = student.hasLicense !== false; 
    if (!currentStatus && maxLicenses > 0 && activeLicensesCount >= maxLicenses) {
        alert("You do not have enough available licenses in your district quota."); return;
    }
    try { 
        await updateDoc(doc(db, 'students', student.id), { hasLicense: !currentStatus }); 
        writeAuditLog('TOGGLE_LICENSE', `${!currentStatus ? 'Assigned' : 'Revoked'} license for student "${student.name}"`);
    } 
    catch (e) { console.error("Failed to update license:", e); }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    const confirmMessage = `WARNING: Are you sure you want to permanently delete "${selectedStudent.name}"? \n\nThis will wipe all managed pages from their device, sever their connection, and free up a license. This CANNOT be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const studentName = selectedStudent.name;
      await deleteDoc(doc(db, 'students', selectedStudent.id));
      writeAuditLog('DELETE_STUDENT', `Deleted student profile for "${studentName}"`);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student profile.");
    }
  };

  // Devices: Link and Unlink
  const handleManualLinkDevice = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !pairingCode) return;
    
    const code = pairingCode.trim().toUpperCase();
    if (code.length !== 10) return alert("Please enter a valid 10-character code.");
    
    try {
       const codeRef = doc(db, 'pairing_codes', code);
       const codeSnap = await getDoc(codeRef);
       const codeData = codeSnap.data();

       if (!codeSnap.exists() || codeData?.status !== 'pending') {
           return alert("Invalid or expired pairing code.");
       }

       const detectedDevice = codeData.deviceName || "Linked Device";

       await updateDoc(doc(db, 'students', selectedStudent.id), {
          device: detectedDevice, status: 'online', lastSync: 'Just now'
       });

       await updateDoc(codeRef, {
           status: 'linked', studentId: selectedStudent.id, orgId: userProfile.orgId
       });

       writeAuditLog('LINK_DEVICE', `Linked device (${detectedDevice}) to student "${selectedStudent.name}"`);

       setShowPairingModal(false);
       setPairingCode('');
    } catch(err) {
       console.error("Failed to link device", err);
       alert("Error communicating with database.");
    }
  };

  const handleUnlinkDevice = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Are you sure you want to unlink the current device?`)) return;
    try {
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        device: 'Unlinked', status: 'offline', lastSync: 'Never'
      });
      writeAuditLog('UNLINK_DEVICE', `Unlinked device from student "${selectedStudent.name}"`);
    } catch (error) { console.error("Error unlinking device:", error); }
  };

  // Library & Pages
  const handlePushPageToStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedLibraryPageId) return;
    const pageToPush = library.find(p => p.id === selectedLibraryPageId);
    if (!pageToPush) return;

    try {
      const newStudentPage = {
         id: `managed_${pageToPush.id}_${Date.now()}`, 
         label: pageToPush.label,
         icon: pageToPush.icon,
         color: pageToPush.color || "bg-slate-100",
         tiles: pageToPush.tiles || [],
         type: 'managed' 
      };
      const updatedPages = [...(selectedStudent.pages || []), newStudentPage];
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        pages: updatedPages, lastSync: 'Just now (Update Pushed)'
      });
      writeAuditLog('PUSH_PAGE', `Pushed master page "${pageToPush.label}" to student "${selectedStudent.name}"`);
      setShowPushModal(false);
      setSelectedLibraryPageId('');
    } catch (error) {
      console.error("Error pushing page:", error);
      alert("Failed to push page to device.");
    }
  };

  const handleRemoveStudentPage = async (pageIdToRemove) => {
    if (!selectedStudent) return;
    if (!window.confirm("Remove this page from the student's device?")) return;
    try {
      const updatedPages = (selectedStudent.pages || []).filter(p => p.id !== pageIdToRemove);
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        pages: updatedPages, lastSync: 'Just now (Page Removed)'
      });
      writeAuditLog('REMOVE_PAGE', `Removed a master page from student "${selectedStudent.name}"`);
    } catch (error) { console.error("Error removing page:", error); }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    try {
      await addDoc(collection(db, 'library'), {
        orgId: userProfile.orgId, label: newPageTitle, icon: newPageIcon || '📄',
        color: 'bg-slate-100', tileCount: 0, tiles: [],
        lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      writeAuditLog('CREATE_MASTER_PAGE', `Created new master page "${newPageTitle}" in district library`);
      setShowNewPageModal(false); setNewPageTitle(''); setNewPageIcon('📄');
    } catch(err) { console.error("Error creating page:", err); }
  };

  const handleLibraryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        let pagesToImport = [];

        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
           pagesToImport = data.pages; 
        } else if (data.id && data.tiles) {
           pagesToImport = [data]; 
        }

        if (pagesToImport.length === 0) throw new Error("File does not contain valid EasySpeak page data.");

        // Bulk insert all pages in this file
        await Promise.all(pagesToImport.map(page => 
           addDoc(collection(db, 'library'), {
             orgId: userProfile.orgId,
             label: page.label || "Imported Page",
             icon: page.icon || "📄",
             color: page.color || "bg-slate-100",
             tileCount: page.tiles ? page.tiles.length : 0,
             tiles: page.tiles || [],
             lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
           })
        ));

        writeAuditLog('IMPORT_MASTER_PAGE', `Imported ${pagesToImport.length} master page(s) into the district library from JSON`);
        alert(`Successfully imported ${pagesToImport.length} page(s)!`);
      } catch (err) {
        console.error(err);
        alert("Error importing page: " + err.message);
      } finally {
        if (libraryUploadRef.current) libraryUploadRef.current.value = '';
      }
    };
  };

  const openTemplateModal = async () => {
     setShowTemplateModal(true);
     setSelectedTemplate(null);
     if (availableTemplates.length === 0) {
        setLoadingTemplate(true);
        try {
           const res = await fetch('/templates/index.json');
           const data = await res.json();
           setAvailableTemplates(data);
        } catch(err) {
           console.error("Failed to load template index", err);
        } finally { setLoadingTemplate(false); }
     }
  };

  const handleSelectTemplate = async (templateManifest) => {
     setSelectedTemplate(templateManifest);
     if (!templateManifest.tiles) {
         setLoadingTemplate(true);
         try {
             const res = await fetch(`/templates/${templateManifest.file}`);
             const fullTemplate = await res.json();
             
             // Support multi-page templates directly
             if (fullTemplate.pages && Array.isArray(fullTemplate.pages)) {
                 const mainPage = fullTemplate.pages[0];
                 const updated = availableTemplates.map(t => t.id === templateManifest.id ? { ...t, tiles: mainPage.tiles, pages: fullTemplate.pages } : t);
                 setAvailableTemplates(updated);
                 setSelectedTemplate({ ...templateManifest, tiles: mainPage.tiles, pages: fullTemplate.pages });
             } else {
                 const updated = availableTemplates.map(t => t.id === templateManifest.id ? { ...t, tiles: fullTemplate.tiles } : t);
                 setAvailableTemplates(updated);
                 setSelectedTemplate({ ...templateManifest, tiles: fullTemplate.tiles });
             }
         } catch(err) {
             console.error("Failed to fetch full template details", err);
         } finally { setLoadingTemplate(false); }
     }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !selectedTemplate.tiles) return;
    try {
      if (selectedTemplate.pages && Array.isArray(selectedTemplate.pages) && selectedTemplate.pages.length > 1) {
          // Bulk import multi-page template
          await Promise.all(selectedTemplate.pages.map(page => 
            addDoc(collection(db, 'library'), {
                orgId: userProfile.orgId,
                label: page.label || "Imported Page",
                icon: page.icon || "📄",
                color: page.color || "bg-slate-100",
                tileCount: page.tiles ? page.tiles.length : 0,
                tiles: page.tiles || [],
                lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            })
          ));
          writeAuditLog('IMPORT_MASTER_PAGE', `Imported ${selectedTemplate.pages.length} pages from template "${selectedTemplate.label}" into district library`);
      } else {
          // Import single-page template (or single-page wrapped in pages)
          const tilesToSave = (selectedTemplate.pages && selectedTemplate.pages.length === 1) ? selectedTemplate.pages[0].tiles : selectedTemplate.tiles;
          await addDoc(collection(db, 'library'), {
            orgId: userProfile.orgId,
            label: selectedTemplate.label,
            icon: selectedTemplate.icon,
            color: selectedTemplate.color,
            tileCount: selectedTemplate.tileCount,
            tiles: tilesToSave,
            lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
          writeAuditLog('IMPORT_MASTER_PAGE', `Imported pre-made template "${selectedTemplate.label}" into district library`);
      }
      setShowTemplateModal(false);
      setSelectedTemplate(null);
    } catch(err) { console.error("Error creating template page:", err); }
  };

  const handleUpdateLibraryPage = async (e) => {
    e.preventDefault();
    if (!editingLibraryPage) return;

    try {
      await updateDoc(doc(db, 'library', editingLibraryPage.id), {
        label: editingLibraryPage.label,
        icon: editingLibraryPage.icon,
        lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      writeAuditLog('UPDATE_MASTER_PAGE', `Updated metadata for master page "${editingLibraryPage.label}"`);
      setEditingLibraryPage(null);
    } catch(err) {
      console.error("Error updating page:", err);
      alert("Failed to update master page.");
    }
  };

  const handleDeleteLibraryPage = async (id) => {
    if (window.confirm("Are you sure you want to delete this master page? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'library', id));
        writeAuditLog('DELETE_MASTER_PAGE', `Deleted a master page from the library`);
      } catch (err) {
        console.error("Error deleting page:", err);
        alert("Failed to delete page.");
      }
    }
  };

  // --- SUPER ADMIN SPECIFIC ACTIONS ---
  const handleCreateOrganization = async (name, licensesStr) => {
    if (!name || !name.trim()) return alert("Organization name cannot be empty.");
    const cleanName = name.trim();
    const licenses = parseInt(licensesStr) || 0;
    
    try {
      const orgRef = await addDoc(collection(db, 'organizations'), { 
        name: cleanName,
        licenses: licenses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      writeAuditLog('CREATE_DISTRICT', `Created new district "${cleanName}" with ${licenses} licenses`, orgRef.id);
      alert(`Successfully created district: ${cleanName}`);
      const newNameInput = document.getElementById('new-org-name');
      const newLicInput = document.getElementById('new-org-lic');
      if (newNameInput) newNameInput.value = '';
      if (newLicInput) newLicInput.value = '';
    } catch (error) {
      console.error("Error creating organization:", error);
      alert('Failed to create district. Check console for details.');
    }
  };

  const handleUpdateOrgLicense = async (orgId, licensesStr) => {
    const licenses = parseInt(licensesStr) || 0;
    try {
      await updateDoc(doc(db, 'organizations', orgId), { 
        licenses: licenses,
        updatedAt: new Date().toISOString()
      });
      writeAuditLog('UPDATE_DISTRICT_LICENSES', `Updated license quota to ${licenses}`, orgId);
      alert(`Successfully updated licenses!`);
    } catch (error) { console.error("Error updating licenses:", error); }
  };

  const handleUpdateSystemUser = async (uid, newRole, newOrgId) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole, orgId: newOrgId.trim() });
      writeAuditLog('UPDATE_SYSTEM_USER', `Modified system user ${uid} - Assigned role: ${newRole}, District: ${newOrgId}`, newOrgId);
      alert('User updated successfully!');
    } catch (error) { console.error("Error updating user:", error); }
  };

  const handleSuperAdminInvite = async (e) => {
    e.preventDefault();
    if (!saInviteEmail.trim() || !saInviteOrgId) return;

    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        await addDoc(collection(db, 'invites'), {
            email: saInviteEmail.trim().toLowerCase(),
            orgId: saInviteOrgId,
            role: 'district_admin',
            invitedBy: user.email,
            code: code,
            schools: 'all', 
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        
        writeAuditLog('INVITE_DISTRICT_ADMIN', `Generated District Admin invite code for ${saInviteEmail}`, saInviteOrgId);
        setSaInviteEmail('');
        setSaInviteOrgId('');
        alert(`District Admin Invite created successfully!\n\nEmail: ${saInviteEmail}\nCode: ${code}\n\nProvide the admin with this code so they can register.`);
    } catch (err) {
        console.error("Error creating district admin invite:", err);
        alert("Failed to create invite.");
    }
  };

  const handleSaveDistrictDefaults = async () => {
      if (!userProfile?.orgId) return;
      try {
          await updateDoc(doc(db, 'organizations', userProfile.orgId), {
              defaultSettings: {
                  theme: districtTheme,
                  voice: districtVoice,
                  layout: districtLayout
              },
              updatedAt: new Date().toISOString()
          });
          writeAuditLog('UPDATE_DISTRICT_DEFAULTS', `Updated district-wide default device settings.`);
          alert("District Defaults saved successfully.");
      } catch (error) {
          console.error("Error saving defaults:", error);
          alert("Failed to save district defaults.");
      }
  };

  const handleOpenStudentSettings = () => {
      if (!selectedStudent) return;
      const t = selectedStudent.settings?.theme || districtTheme;
      const v = selectedStudent.settings?.voice || districtVoice;
      const l = selectedStudent.settings?.layout || districtLayout;
      const c = selectedStudent.settings?.aiContext || '';
      
      setEditTheme(t);
      setEditVoiceModel(v);
      setEditLayout(l);
      setEditAiContext(c);
      setShowStudentSettingsModal(true);
  };

  const handleSaveStudentSettings = async (e) => {
      e.preventDefault();
      if (!selectedStudent) return;
      try {
          const newSettings = {
              theme: editTheme,
              voice: editVoiceModel,
              layout: editLayout,
              aiContext: editAiContext.trim()
          };
          await updateDoc(doc(db, 'students', selectedStudent.id), {
              settings: newSettings,
              lastSync: 'Just now (Settings Updated)'
          });
          setSelectedStudent({ ...selectedStudent, settings: newSettings });
          writeAuditLog('UPDATE_STUDENT_SETTINGS', `Updated device settings for student "${selectedStudent.name}"`);
          setShowStudentSettingsModal(false);
          alert("Student settings saved.");
      } catch (err) {
          console.error("Failed to save student settings:", err);
          alert("Failed to save settings.");
      }
  };

  const generateAiContext = async () => {
     if (!selectedStudent) return;
     if (!confirm("This will download a small AI model to your browser (~1GB) if not already cached. It will run entirely offline. Proceed?")) return;

     setIsGeneratingAiContext(true);
     setAiGeneratorProgress(0);
     
     try {
         if (!mlcEngineRef.current) {
             const initProgressCallback = (report) => {
                 setAiGeneratorProgress(Math.round(report.progress * 100));
             };
             mlcEngineRef.current = await CreateWebWorkerMLCEngine(
                 new Worker(
                     new URL('./worker.js', import.meta.url), 
                     {type: 'module'}
                 ),
                 "Llama-3.2-1B-Instruct-q4f32_1-MLC", 
                 { initProgressCallback }
             );
         }

         const prompt = `Write a short, professional, and descriptive 2-in-1 paragraph about a student named ${selectedStudent.name}. Include plausible general interests logically suitable for school-aged learners, and mention that the AI should act as a supportive, encouraging, and clear communicator. Keep it under 50 words. Do not use asterisks or formatting.`;
         
         const reply = await mlcEngineRef.current.chat.completions.create({
             messages: [{ role: "user", content: prompt }],
         });
         
         setEditAiContext(reply.choices[0].message.content.trim());
     } catch (err) {
         console.error("AI Generation Error", err);
         alert("Failed to generate AI context. Ensure your browser supports WebGPU and you have enough memory.");
     } finally {
         setIsGeneratingAiContext(false);
         setAiGeneratorProgress(0);
     }
  };

  // --- UI: Loading State ---
  if (authLoading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
        <h2 className="font-bold text-lg">Loading Dashboard...</h2>
      </div>
    );
  }

  // --- UI: Landing Page (Unauthenticated) ---
  if (!user) {
    return (
      <div className="min-h-screen font-sans bg-slate-50 text-slate-800 flex flex-col relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden -z-10 pointer-events-none">
           <div className="absolute -top-[300px] left-[50%] -translate-x-[50%] w-[1200px] h-[1200px] bg-gradient-to-b from-blue-100/60 to-transparent rounded-full blur-3xl opacity-50"></div>
           <div className="absolute top-[100px] -right-[200px] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl opacity-60 mix-blend-multiply"></div>
        </div>

        {/* Public Header */}
        <header className="w-full px-6 py-4 flex items-center justify-between z-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-inner">Z</div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Zip EasySpeak for Education</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-bold text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#resources" className="hover:text-blue-600 transition-colors">Resources</a>
          </div>
          <button onClick={() => setShowLoginModal(true)} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all">Sign In</button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center pt-20 lg:pt-32 px-6 max-w-7xl mx-auto w-full z-10 relative">
          
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-6 border border-blue-100">
               <Sparkles size={16} /> Now with built-in AI Context Generation
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Empower Every Voice in Your District
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              The modern, centralized dashboard for managing special education AAC devices. Pre-configure tablets, push custom pages instantly, and integrate offline AI all from one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => { setIsRegistering(true); setShowLoginModal(true); }} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 text-lg transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto">
                 Join Your District
              </button>
              <button className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl shadow-sm text-lg transition-colors w-full sm:w-auto">
                 Request Demo
              </button>
            </div>
          </div>

          {/* Hero Image / Mockup */}
          <div className="relative w-full max-w-5xl mx-auto mb-32 group perspective-1000">
             <div className="absolute inset-x-0 -bottom-10 h-10 bg-slate-900/10 blur-xl rounded-[100%]"></div>
             <img 
                src="/hero-mockup.png" 
                alt="EasySpeak Dashboard Mockup" 
                className="w-full h-auto rounded-3xl md:rounded-[40px] shadow-2xl shadow-slate-300 border border-slate-200/50 object-cover bg-white"
             />
          </div>

          {/* Features Grid */}
          <div id="features" className="w-full py-20 border-t border-slate-200/60">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything a Teacher Needs</h2>
                <p className="text-slate-500 max-w-xl mx-auto">Built specifically for Special Education workflows, bringing all your student devices under one glass pane.</p>
             </div>
             <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Settings2 size={28} /></div>
                   <h3 className="text-xl font-bold text-slate-800 mb-3">Remote Device Config</h3>
                   <p className="text-slate-500 leading-relaxed">Pre-configure theme, voice model, and layout styles for student tablets before they even connect to the Wi-Fi.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                   <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><BookOpen size={28} /></div>
                   <h3 className="text-xl font-bold text-slate-800 mb-3">District Page Library</h3>
                   <p className="text-slate-500 leading-relaxed">Create communication boards once, store them in the District Library, and push them to any student's device instantly.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Monitor size={28} /></div>
                   <h3 className="text-xl font-bold text-slate-800 mb-3">Student Device Profiles</h3>
                   <p className="text-slate-500 leading-relaxed">View all enrolled student tablets from a single dashboard. Track app versions, monitor storage usage, and assign remote device PINs.</p>
                </div>
             </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="w-full bg-slate-900 text-slate-400 py-12 px-6 mt-20">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 bg-slate-700 text-white rounded flex items-center justify-center font-bold text-xs">Z</div>
                 <span className="font-bold text-slate-300">Zip EasySpeak for Education</span>
              </div>
              <div className="text-sm">© 2026 Zip Solutions. All rights reserved.</div>
              <div className="flex gap-4">
                 <a href="https://zipsolutions.org/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                 <a href="https://zipsolutions.org/" className="hover:text-white transition-colors">Terms of Service</a>
                 <a href="https://github.com/crippit/zipEasySpeakAI/issues" className="hover:text-white transition-colors">Support Center</a>
              </div>
           </div>
        </footer>

        {/* --- LOGIN MODAL W/ ORIGINAL LOGIC --- */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                 onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                 className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                  <X size={20} />
              </button>

              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-inner mx-auto mb-4">Z</div>
              <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome Back</h1>
              <p className="text-center text-slate-500 text-sm mb-8">
                 {isRegistering ? 'Join your district using an invite code' : 'Sign in to manage your caseload'}
              </p>
              
              {loginError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-start gap-2 mb-4 break-words border border-red-200 shadow-sm animate-pulse">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span>{loginError}</span>
                </div>
              )}

              {!isRegistering && (
                 <div className="space-y-3 mb-6">
                    <button onClick={() => handleOAuthLogin('google')} disabled={isLoggingIn} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Sign in with Google
                    </button>
                    <button onClick={() => handleOAuthLogin('microsoft')} disabled={isLoggingIn} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                      <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f35325" d="M1 1h9v9H1z"/><path fill="#81bc06" d="M11 1h9v9h-9z"/><path fill="#05a6f0" d="M1 11h9v9H1z"/><path fill="#ffba08" d="M11 11h9v9h-9z"/></svg>
                      Sign in with Microsoft
                    </button>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or email</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                 </div>
              )}
              
              <form onSubmit={isRegistering ? handleRegisterWithCode : handleLogin} className="space-y-4">
                {isRegistering && (
                   <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Jane Doe"/>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1"><Key size={14} className="text-blue-500"/> District Invite Code</label>
                        <input type="text" required value={regInviteCode} onChange={e => setRegInviteCode(e.target.value)} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-widest text-lg uppercase" placeholder="6-CHAR" maxLength={6}/>
                      </div>
                   </>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                  <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="teacher@school.edu"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                  <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••"/>
                </div>
                <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-2 hover:shadow-lg">
                  {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Join District' : 'Sign In')}
                </button>
              </form>

              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                  <button 
                     type="button" 
                     onClick={() => { setIsRegistering(!isRegistering); setLoginError(''); }} 
                     className="text-sm font-bold text-blue-600 hover:underline"
                  >
                      {isRegistering ? 'Already have an account? Sign In' : 'Have an Invite Code? Sign Up'}
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const getRoleDisplayName = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'district_admin') return 'District Admin';
    return 'Teacher';
  };

  const uniqueOrgIds = Array.from(new Set([
    ...(organizations?.map(org => org.id) || []),
    ...(systemUsers?.map(u => u.orgId).filter(id => id && id !== 'pending') || [])
  ])).sort();

  // --- UI: The Main Dashboard (Protected) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner">Z</div>
          <span className="font-bold text-lg tracking-wide">EasySpeak <span className="text-blue-400 font-normal">for Education</span></span>
          <span className={`ml-4 px-2.5 py-0.5 border rounded-full text-xs font-medium bg-slate-800 border-slate-700 text-slate-300`}>
             {orgDetails?.name || userProfile?.orgId}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <button 
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); markNotifsAsRead(); }} 
                className="relative p-2 text-slate-300 hover:text-white transition-colors rounded-full hover:bg-slate-800"
            >
              <Bell size={20} />
              {unreadNotifCount > 0 && (
                 <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                 <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                    Announcements
                    <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-slate-600 bg-slate-200 p-1 rounded-full"><X size={14}/></button>
                 </div>
                 <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 text-sm">No new announcements.</div>
                    ) : (
                       notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                             <div className="text-sm text-blue-600 font-bold mb-1 leading-tight">{n.title}</div>
                             <div className="text-sm text-slate-700 whitespace-pre-wrap">{n.message}</div>
                             <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                                <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()} • {n.createdBy}
                                {n.targetOrgId === 'all' && <span className="ml-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider text-[8px]">Global</span>}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
            )}
          </div>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <div className="flex items-center gap-3 p-1.5">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold leading-tight">{userProfile?.name || user.email}</div>
              <div className="text-xs text-slate-400">{getRoleDisplayName(userProfile?.role)}</div>
            </div>
            {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-slate-600" referrerPolicy="no-referrer" />
            ) : (
                <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center font-bold uppercase">
                  {(userProfile?.name || user.email || 'U').charAt(0)}
                </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
          <div className="p-4 space-y-1">
            <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users size={20} /> Caseload
            </button>
            <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'library' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <BookOpen size={20} /> Library
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings size={20} /> Settings & Staff
            </button>
            {(userProfile?.role === 'super_admin' || userProfile?.role === 'district_admin') && (
              <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors mt-4 border ${activeTab === 'audit' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}>
                <ShieldAlert size={20} /> Compliance Logs
              </button>
            )}
            {userProfile?.role === 'super_admin' && (
              <button onClick={() => setActiveTab('system_admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors border ${activeTab === 'system_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}>
                <Globe size={20} /> System Admin
              </button>
            )}
          </div>
          <div className="mt-auto p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
          {dataLoading && activeTab !== 'system_admin' && activeTab !== 'audit' && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                 <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          )}

          {activeTab === 'students' && (
            <>
              <div className={`w-full md:w-80 bg-slate-50 border-r border-slate-200 flex-col shrink-0 ${selectedStudent ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-800">Caseload ({visibleStudents?.length || 0})</h2>
                    <button onClick={() => setShowNewStudentModal(true)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors" title="Add New Student">
                      <UserPlus size={18} />
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search students..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {(!visibleStudents || visibleStudents.length === 0) ? (
                      <div className="text-center p-6 text-slate-400 mt-8 border-2 border-dashed border-slate-300 rounded-2xl mx-2">
                          <Users size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-bold text-slate-600">Your caseload is empty.</p>
                          <button onClick={() => setShowNewStudentModal(true)} className="mt-3 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold">Add Student</button>
                      </div>
                  ) : (
                    visibleStudents.map(student => {
                      const schoolName = schools?.find(s => s.id === student.schoolId)?.name || 'Unassigned';
                      return (
                        <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full text-left p-3 rounded-xl transition-all border flex gap-3 ${selectedStudent?.id === student.id ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <img src={createAvatar(notionists, { seed: student.id, backgroundColor: ["b6e3f4","c0aede","d1d4f9","ffdfbf"] }).toDataUri()} alt={student.name} className="w-10 h-10 rounded-full bg-slate-100 shrink-0 border border-slate-200/50 shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 truncate">{student.name}</span>
                              {student.status === 'online' ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider shrink-0 ml-2"><Wifi size={12} /> Syncing</span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-2"><WifiOff size={12} /> Offline</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="flex items-center gap-1 truncate"><Smartphone size={12}/> {student.device}</span>
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] truncate max-w-[100px] shrink-0"><Building size={10}/> {schoolName}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={`flex-1 bg-white overflow-y-auto ${!selectedStudent ? 'hidden md:block' : 'block'}`}>
                {selectedStudent ? (
                  <div className="p-4 sm:p-8 max-w-5xl mx-auto">
                    <button onClick={() => setSelectedStudent(null)} className="md:hidden flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold mb-6 mt-2">
                       <ChevronLeft size={20} /> Back to Caseload
                    </button>
                    {selectedStudent.hasLicense === false && (
                       <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
                          <AlertCircle className="shrink-0 mt-0.5" size={24} />
                          <div>
                             <h4 className="font-bold text-lg">Profile is Unlicensed</h4>
                             <p className="text-sm mt-1">This student cannot pair devices, sync, or receive page updates. Go to <strong>Settings &gt; License Management</strong> to assign an available license to this profile.</p>
                          </div>
                       </div>
                    )}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                           <img src={createAvatar(notionists, { seed: selectedStudent.id, backgroundColor: ["b6e3f4","c0aede","d1d4f9","ffdfbf"] }).toDataUri()} alt={selectedStudent.name} className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-md shadow-slate-200/50" />
                           <h1 className="text-3xl font-bold text-slate-900">{selectedStudent.name}'s Profile</h1>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                           {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') ? (
                               <button onClick={() => { setEditStudentSchoolId(selectedStudent.schoolId || ''); setEditingStudentSchool(selectedStudent); }} className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 border border-slate-200 transition-colors" title="Change School Assignment">
                                   <Building size={16}/> {schools?.find(s => s.id === selectedStudent.schoolId)?.name || 'Assign School'} <Edit2 size={14} className="ml-1 opacity-50"/>
                               </button>
                           ) : (
                               <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 border border-slate-200">
                                   <Building size={16}/> {schools?.find(s => s.id === selectedStudent.schoolId)?.name || 'Unassigned School'}
                               </span>
                           )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><Smartphone size={16} className={selectedStudent.device === 'Unlinked' ? 'text-amber-500' : 'text-slate-600'} /> {selectedStudent.device}</span>
                          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><Clock size={16} className="text-slate-600" /> Last synced: {selectedStudent.lastSync}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleOpenStudentSettings} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-sm">
                          <Settings2 size={18} /> Device Settings
                        </button>
                        <button onClick={() => setShowPushModal(true)} disabled={selectedStudent.device === 'Unlinked' || selectedStudent.hasLicense === false} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Send size={18} /> Push to Device
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><ShieldCheck size={20} className="text-blue-500"/> School-Managed Pages</h3>
                            <button onClick={() => setShowPushModal(true)} disabled={selectedStudent.device === 'Unlinked' || selectedStudent.hasLicense === false} className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">Add from Library</button>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-4">These pages are pushed to {selectedStudent.name}'s device. The student cannot delete or edit these.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {(selectedStudent.pages || [])?.filter(p => p.type === 'managed').map(page => (
                                <div key={page.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm group">
                                  <span className="text-3xl mb-2">{page.icon}</span>
                                  <span className="font-bold text-sm text-slate-800 truncate w-full">{page.label}</span>
                                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRemoveStudentPage(page.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Remove Page"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              ))}
                              {(!selectedStudent.pages || selectedStudent.pages.filter(p => p.type === 'managed').length === 0) && (
                                <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-xl">No school pages pushed yet.</div>
                              )}
                            </div>
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Personal / Parent Pages</h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Read Only</span>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2"><Lock size={14}/> Created by the user/family. You can view these for context, but cannot edit them.</p>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {(selectedStudent.pages || [])?.filter(p => p.type !== 'managed').map(page => (
                                <div key={page.id} className="shrink-0 w-28 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center opacity-80 cursor-not-allowed">
                                  <span className="text-2xl mb-1 grayscale">{page.icon}</span>
                                  <span className="font-medium text-xs text-slate-600 truncate w-full">{page.label}</span>
                                </div>
                              ))}
                              {(!selectedStudent.pages || selectedStudent.pages.filter(p => p.type !== 'managed').length === 0) && (
                                 <div className="text-sm text-slate-400 italic">No personal pages created yet.</div>
                              )}
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
                          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">Device Connection</h3>
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">App Version</span>
                              <span className="text-sm font-bold text-slate-800">{selectedStudent.device === 'Unlinked' ? '-' : 'v1.2 (Up to date)'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Storage Used</span>
                              <span className="text-sm font-bold text-slate-800">{selectedStudent.device === 'Unlinked' ? '-' : '12 MB'}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-200">
                             <h4 className="text-sm font-bold text-slate-700 mb-2">Remote Device PIN</h4>
                             <div className="flex gap-2">
                                 <input type="text" value={remoteDevicePin} onChange={e => setRemoteDevicePin(e.target.value)} placeholder="e.g. 1234" className="w-full p-2 border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 rounded-lg text-sm" />
                                 <button onClick={handleSaveRemotePin} className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">Save</button>
                             </div>
                             <p className="text-[10px] text-slate-500 mt-1 leading-tight">Locks the student out of Edit Mode & Settings.</p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-200">
                            {selectedStudent.device === 'Unlinked' ? (
                               <button onClick={() => setShowPairingModal(true)} disabled={selectedStudent.hasLicense === false} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                                 <QrCode size={18} /> Pair New Device
                               </button>
                            ) : (
                               <button onClick={handleUnlinkDevice} className="w-full py-2.5 bg-white border border-slate-300 text-red-600 font-bold rounded-xl hover:bg-red-50 text-sm transition-colors mb-2">
                                 Unlink Current Device
                               </button>
                            )}
                            {(userProfile?.role === 'super_admin' || userProfile?.role === 'district_admin') && (
                                <button onClick={handleDeleteStudent} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm transition-colors border border-red-200 flex items-center justify-center gap-2 mt-4">
                                   <Trash2 size={16} /> Delete Profile
                                </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <Users size={64} className="mb-4 text-slate-300"/>
                    <p className="text-lg font-bold text-slate-500">Select a student from the sidebar</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'library' && (
            <div className="flex-1 bg-white p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">District Library</h1>
                    <p className="text-slate-500">Create master pages here to push to multiple students.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <input type="file" ref={libraryUploadRef} onChange={handleLibraryUpload} accept=".json" className="hidden" />
                    <button onClick={openTemplateModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 shadow-sm transition-colors">
                      <LayoutGrid size={18} /> Browse Templates
                    </button>
                    <button onClick={() => libraryUploadRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 shadow-sm transition-colors">
                      <Upload size={18} /> Upload JSON
                    </button>
                    <button onClick={() => setShowNewPageModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                      <Plus size={18} /> New Blank Page
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(!library || library.length === 0) ? (
                      <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-bold text-slate-600 mb-1">Your library is empty</h3>
                          <p className="text-sm mb-4">Create your first master page or upload an exported JSON file.</p>
                          <div className="flex justify-center gap-2">
                             <button onClick={() => libraryUploadRef.current?.click()} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Upload JSON</button>
                             <button onClick={() => setShowNewPageModal(true)} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors">Create Page</button>
                          </div>
                      </div>
                  ) : (
                    library?.map(lib => (
                      <div key={lib.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">{lib.icon}</div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingLibraryPage(lib); }} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50" title="Edit Metadata"><Edit2 size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteLibraryPage(lib.id); }} className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50" title="Delete Master Page"><Trash2 size={16}/></button>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1 truncate">{lib.label}</h3>
                        <div className="flex items-center justify-between text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
                          <span className="flex items-center gap-1.5"><LayoutGrid size={14}/> {lib.tileCount || 0} Tiles</span>
                          <span>Edited {lib.lastEdited}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- Bottom Mobile Navigation --- */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around p-3 z-50 pb-safe">
            <button onClick={() => {setActiveTab('students'); setSelectedStudent(null);}} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'students' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
               <Users size={24} />
               <span className="text-[10px] font-medium">Caseload</span>
            </button>
            <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'library' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
               <BookOpen size={24} />
               <span className="text-[10px] font-medium">Library</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
               <Settings size={24} />
               <span className="text-[10px] font-medium">Settings</span>
            </button>
          </nav>

          {activeTab === 'settings' && (
            <div className="flex-1 bg-slate-50 p-8 overflow-y-auto flex flex-col items-center">
                <div className="w-full max-w-4xl">
                    <div className="text-center text-slate-500 mb-8">
                        <Settings size={48} className="mx-auto mb-4 text-slate-300" />
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Settings & Management</h2>
                        <p>Manage your account, licenses, and district roster.</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                       <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">My Profile</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div>
                               <p className="text-xs font-bold uppercase text-slate-400 mb-1">Email Address</p>
                               <p className="font-mono text-sm break-all">{user.email}</p>
                           </div>
                           <div>
                               <p className="text-xs font-bold uppercase text-slate-400 mb-1">Access Role</p>
                               <p className="text-sm font-bold text-indigo-600">{getRoleDisplayName(userProfile?.role)}</p>
                           </div>
                           <div>
                               <p className="text-xs font-bold uppercase text-slate-400 mb-1">Organization / District</p>
                               <p className="text-sm text-slate-700">{orgDetails?.name || userProfile?.orgId}</p>
                           </div>
                       </div>
                    </div>

                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && (
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                             <div>
                               <h3 className="text-lg font-bold text-slate-800">District Device Defaults</h3>
                               <p className="text-sm text-slate-500">Set the default device preferences used for newly created students.</p>
                             </div>
                             <button onClick={handleSaveDistrictDefaults} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                                Save Defaults
                             </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Monitor size={16} className="text-blue-500"/> Theme Mode</label>
                                  <select value={districtTheme} onChange={e => setDistrictTheme(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                      <option value="Light">Light Theme</option>
                                      <option value="Dark">Dark Theme</option>
                                      <option value="System">Auto (System)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Volume2 size={16} className="text-blue-500"/> Voice Model</label>
                                  <select value={districtVoice} onChange={e => setDistrictVoice(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                      <option value="Standard Female">Standard Female</option>
                                      <option value="Standard Male">Standard Male</option>
                                      <option value="Premium Female (US)">Premium Female (US)</option>
                                      <option value="Premium Male (US)">Premium Male (US)</option>
                                      <option value="British Female">British Female</option>
                                      <option value="British Male">British Male</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><LayoutGrid size={16} className="text-blue-500"/> Layout Options</label>
                                  <select value={districtLayout} onChange={e => setDistrictLayout(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                      <option value="Grid">Standard Grid</option>
                                      <option value="List">List View</option>
                                      <option value="Large Icons">Large Icons (Accessibility)</option>
                                  </select>
                              </div>
                          </div>
                       </div>
                    )}

                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && (
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                             <div>
                               <h3 className="text-lg font-bold text-slate-800">Manage Schools</h3>
                               <p className="text-sm text-slate-500">Create schools to organize students and control teacher access.</p>
                             </div>
                             <form onSubmit={handleCreateSchool} className="flex gap-2">
                                <input type="text" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} placeholder="New School Name..." className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]" />
                                <button type="submit" className="px-4 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 transition-colors">Add</button>
                             </form>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {schools?.map(school => (
                                  <div key={school.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
                                      <Building size={18} className="text-slate-400 shrink-0"/>
                                      <div className="font-bold text-slate-700 text-sm truncate">{school.name}</div>
                                  </div>
                              ))}
                              {(!schools || schools.length === 0) && (
                                  <div className="col-span-full p-4 text-center text-sm text-slate-400 border border-dashed border-slate-300 rounded-xl">No schools created yet. Add one above.</div>
                              )}
                          </div>
                       </div>
                    )}

                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && (
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                             <div>
                               <h3 className="text-lg font-bold text-slate-800">License Management</h3>
                               <p className="text-sm text-slate-500">Control which student profiles are active on your billing plan.</p>
                             </div>
                             <div className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm border border-indigo-100">
                                 {availableLicenses} Available
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="p-4 bg-slate-50 text-slate-700 rounded-xl flex flex-col items-center justify-center border border-slate-200">
                                <div className="text-3xl font-black mb-1">{maxLicenses}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Quota</div>
                             </div>
                             <div className="p-4 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center border border-blue-100">
                                <div className="text-3xl font-black mb-1">{activeLicensesCount}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-500">Active Students</div>
                             </div>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden block">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                  <tr>
                                     <th className="p-4 font-bold">Student Profile</th>
                                     <th className="p-4 font-bold">School</th>
                                     <th className="p-4 font-bold text-right">License Assigned</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {students?.map(s => {
                                     const sName = schools?.find(sch => sch.id === s.schoolId)?.name || 'Unassigned';
                                     return (
                                     <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                        <td className="p-4 text-sm text-slate-600">{sName}</td>
                                        <td className="p-4 text-right">
                                           <button onClick={() => handleToggleLicense(s)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${s.hasLicense !== false ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                                              {s.hasLicense !== false ? <><ToggleRight size={20}/> Active</> : <><ToggleLeft size={20}/> Revoked</>}
                                           </button>
                                        </td>
                                     </tr>
                                  )})}
                                  {(!students || students.length === 0) && (
                                     <tr><td colSpan="3" className="p-6 text-center text-slate-400">No students in district yet.</td></tr>
                                  )}
                               </tbody>
                             </table>
                            </div>
                          </div>
                       </div>
                    )}

                    {(userProfile?.role === 'district_admin') && (
                      <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8">
                         <div className="flex justify-between items-center mb-4">
                            <div>
                               <h3 className="text-lg font-bold text-indigo-900">Broadcast Announcement</h3>
                               <p className="text-sm text-indigo-700">Send a notification to staff in your district.</p>
                            </div>
                            <Megaphone className="text-indigo-400" size={32} />
                         </div>
                         <button onClick={() => { setAnnounceTargetOrg(userProfile.orgId); setShowAnnounceModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                            Create Message
                         </button>
                      </div>
                    )}

                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                         <div className="flex justify-between items-center mb-6">
                            <div>
                               <h3 className="text-lg font-bold text-slate-800">District Staff Roster</h3>
                               <p className="text-sm text-slate-500">Manage teachers and their school assignments.</p>
                            </div>
                            <button onClick={() => setShowInviteModal(true)} className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2">
                               <Plus size={16}/> Invite Teacher
                            </button>
                         </div>
                         <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                            {staff?.map(s => (
                               <div key={s.uid} className="p-4 border-b last:border-b-0 border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 uppercase">
                                        {(s.name || s.email || 'U').charAt(0)}
                                     </div>
                                     <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {s.email} {s.uid === user.uid && <span className="text-xs font-normal bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">You</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                            <span className="uppercase tracking-wider font-bold">{getRoleDisplayName(s.role)}</span><span className="mx-2">•</span><span>{s.schools === 'all' ? 'All Schools' : `${s.schools?.length || 0} Schools Assigned`}</span>
                                            {s.role !== 'super_admin' && (
                                                <button onClick={() => { setEditTeacherAllSchools(s.schools === 'all'); setEditTeacherSchoolList(s.schools === 'all' ? [] : (s.schools || [])); setEditingTeacherSchools(s); }} className="ml-2 text-blue-600 hover:text-blue-800 bg-blue-50 p-1 rounded" title="Edit School Assignment"><Edit2 size={12}/></button>
                                            )}
                                        </div>
                                     </div>
                                  </div>
                                  {s.uid !== user.uid && (
                                     <button onClick={() => handleRemoveTeacher(s.uid, s.email)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove from District"><Trash2 size={18}/></button>
                                  )}
                               </div>
                            ))}
                            {(!staff || staff.length === 0) && <div className="p-6 text-center text-slate-400">No other staff members found.</div>}
                         </div>
                         {pendingInvites?.length > 0 && (
                             <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50">
                                 <div className="p-3 border-b border-amber-200 font-bold text-amber-800 text-sm flex items-center gap-2"><Mail size={16}/> Pending Invitations</div>
                                 <table className="w-full text-left text-sm">
                                    <thead><tr className="bg-amber-100/50 text-amber-800 text-xs uppercase tracking-wider border-b border-amber-200"><th className="p-3">Email</th><th className="p-3">Invite Code</th><th className="p-3 text-right">Actions</th></tr></thead>
                                    <tbody>
                                        {pendingInvites.map(inv => (
                                            <tr key={inv.id} className="border-b last:border-b-0 border-amber-100"><td className="p-3 text-amber-900 font-medium">{inv.email}</td><td className="p-3"><span className="font-mono bg-white px-2 py-1 rounded border border-amber-200 font-bold tracking-widest">{inv.code}</span></td><td className="p-3 text-right"><button onClick={() => handleCancelInvite(inv.id)} className="text-amber-600 hover:text-red-600 font-bold text-xs px-3 py-1.5 bg-white hover:bg-red-50 rounded-lg transition-colors shadow-sm">Revoke</button></td></tr>
                                        ))}
                                    </tbody>
                                 </table>
                             </div>
                         )}
                      </div>
                    )}

                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && (
                        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200 mb-8 mt-8">
                            <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle size={20} /> Danger Zone</h3>
                            <p className="text-sm text-red-600 mb-4">Permanently delete your district, all student profiles, teacher accounts, library pages, and audit logs. This action cannot be undone and supports your right-to-be-forgotten compliance.</p>
                            <button onClick={() => { setNukeConfirmText(''); setShowNukeModal(true); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm">Delete District Data</button>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'audit' && (userProfile?.role === 'super_admin' || userProfile?.role === 'district_admin') && (
            <div className="flex-1 bg-white p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><ShieldAlert size={28} /></div>
                  <div><h1 className="text-3xl font-bold text-slate-900">Compliance & Audit Logs</h1><p className="text-slate-500">Immutable records of data access and modifications to support FERPA and COPPA compliance requirements.</p></div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-slate-800 flex items-center gap-2"><History size={18}/> System Activity Log</h2><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{auditLogs?.length || 0} Records</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead><tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200"><th className="p-4 font-bold whitespace-nowrap">Timestamp</th><th className="p-4 font-bold">Action</th><th className="p-4 font-bold">Details</th><th className="p-4 font-bold">Actor</th>{userProfile?.role === 'super_admin' && <th className="p-4 font-bold">District ID</th>}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs?.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td><td className="p-4"><span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{log.action}</span></td><td className="p-4 text-slate-800">{log.details}</td><td className="p-4"><div className="font-medium text-slate-800">{log.actorEmail}</div><div className="text-[10px] text-slate-400 uppercase tracking-wider">{log.actorRole}</div></td>{userProfile?.role === 'super_admin' && <td className="p-4 text-slate-500 font-mono text-xs">{log.orgId}</td>}</tr>
                        ))}
                        {(!auditLogs || auditLogs.length === 0) && <tr><td colSpan={userProfile?.role === 'super_admin' ? 5 : 4} className="p-8 text-center text-slate-400">No audit logs found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system_admin' && userProfile?.role === 'super_admin' && (
            <div className="flex-1 bg-white p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Globe size={28} /></div>
                  <div><h1 className="text-3xl font-bold text-slate-900">System Admin Control Panel</h1><p className="text-slate-500">Manage all accounts and districts across EasySpeak.</p></div>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
                   <div className="p-4 bg-indigo-100/50 border-b border-indigo-200 flex items-center justify-between"><div><h2 className="font-bold text-indigo-900 flex items-center gap-2"><Megaphone size={18}/> Broadcast Announcement</h2><p className="text-xs text-indigo-700 mt-1">Push notifications directly to user dashboards.</p></div></div>
                   <div className="p-4 flex items-center gap-4"><button onClick={() => { setAnnounceTargetOrg('all'); setShowAnnounceModal(true); }} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">Create Global Announcement</button><p className="text-sm text-slate-500 italic">Messages appear instantly in the top-right notification bell.</p></div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18}/> District Licenses</h2></div>
                  <div className="p-4 flex gap-3 border-b border-slate-100 bg-white">
                      <input id="new-org-name" type="text" placeholder="New District Name (e.g. Springfield USD)" className="p-3 border border-slate-300 rounded-xl flex-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <input id="new-org-lic" type="number" placeholder="Total Licenses" className="p-3 border border-slate-300 rounded-xl w-40 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={() => { const name = document.getElementById('new-org-name')?.value; const lic = document.getElementById('new-org-lic')?.value; handleCreateOrganization(name, lic); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">Create District</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                         {uniqueOrgIds?.map(orgId => {
                            const orgData = organizations?.find(o => o.id === orgId) || {};
                            return (
                                <tr key={orgId} className="hover:bg-slate-50 transition-colors">
                                   <td className="p-4"><div className="font-bold text-slate-800">{orgData.name || 'Unnamed District'}</div><div className="text-xs text-slate-400 font-mono">ID: {orgId}</div></td>
                                   <td className="p-4 w-48"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><input id={`lic-${orgId}`} defaultValue={orgData.licenses || 0} type="number" className="p-2 border border-slate-300 rounded-lg w-20 text-sm text-center font-mono outline-none focus:border-blue-500" /><span className="text-xs font-bold text-slate-500 uppercase">Licenses</span></div><div className="text-[10px] text-slate-500 font-bold ml-1">Activated: <span className="text-blue-600">{systemStudents?.filter(s => s.orgId === orgId && s.hasLicense !== false).length || 0}</span></div></div></td>
                                   <td className="p-4 text-right w-48"><div className="flex items-center justify-end gap-2"><button onClick={() => handleUpdateOrgLicense(orgId, document.getElementById(`lic-${orgId}`).value)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors">Save</button><button onClick={() => openSANukeModal(orgId, orgData.name)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Delete District"><Trash2 size={18} /></button></div></td>
                                </tr>
                            );
                         })}
                         {(!uniqueOrgIds || uniqueOrgIds.length === 0) && <tr><td colSpan="3" className="p-8 text-center text-slate-400">No districts have been created yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus size={18}/> Invite District Admin</h2></div>
                  <form onSubmit={handleSuperAdminInvite} className="p-4 flex flex-col md:flex-row gap-3 bg-white">
                      <input type="email" required value={saInviteEmail} onChange={e => setSaInviteEmail(e.target.value)} placeholder="Admin Email Address" className="p-3 border border-slate-300 rounded-xl flex-1 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                      <select required value={saInviteOrgId} onChange={e => setSaInviteOrgId(e.target.value)} className="p-3 border border-slate-300 rounded-xl flex-1 text-sm outline-none focus:ring-2 focus:ring-purple-500"><option value="" disabled>Select District...</option>{organizations?.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select>
                      <button type="submit" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shrink-0">Generate Invite</button>
                  </form>
                  <div className="px-4 pb-4 pt-0 text-xs text-slate-500">Generates an invite code allowing a new user to register as the administrator for the selected district.</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18}/> All Registered Users ({systemUsers?.length || 0})</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200"><th className="p-4 font-bold">User Details</th><th className="p-4 font-bold">Assigned District (orgId)</th><th className="p-4 font-bold">Permissions Role</th><th className="p-4 font-bold text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {systemUsers?.map(sysUser => (
                          <tr key={sysUser.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4"><div className="font-bold text-slate-800">{sysUser.email}</div><div className="text-xs text-slate-500">{sysUser.name || 'No Name'} • {sysUser.uid?.substring(0,8)}...</div></td>
                            <td className="p-4"><select id={`org-${sysUser.uid}`} defaultValue={sysUser.orgId} className="w-full max-w-[200px] p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"><option value="pending">Pending</option>{organizations?.map(o => (<option key={o.id} value={o.id}>{o.name || o.id}</option>))}</select></td>
                            <td className="p-4"><select id={`role-${sysUser.uid}`} defaultValue={sysUser.role} className="w-full max-w-[150px] p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"><option value="teacher">Teacher</option><option value="district_admin">District Admin</option><option value="super_admin">Super Admin</option></select></td>
                            <td className="p-4 text-right"><button onClick={() => handleUpdateSystemUser(sysUser.uid, document.getElementById(`role-${sysUser.uid}`).value, document.getElementById(`org-${sysUser.uid}`).value)} className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-sm transition-colors">Save Changes</button></td>
                          </tr>
                        ))}
                        {(!systemUsers || systemUsers.length === 0) && <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading users...</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- OVERLAY MODALS --- */}
      {showStudentSettingsModal && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">Pre-Configure Device Options</h3>
                          <p className="text-slate-500 text-sm mt-1">Settings for <b>{selectedStudent.name}</b>'s device.</p>
                      </div>
                      <button onClick={() => setShowStudentSettingsModal(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full bg-white shadow-sm"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveStudentSettings} className="p-6 space-y-6 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Monitor size={16} className="text-blue-500"/> Theme Mode</label>
                              <select value={editTheme} onChange={e => setEditTheme(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                  <option value="Light">Light Theme</option>
                                  <option value="Dark">Dark Theme</option>
                                  <option value="System">Auto (System)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Volume2 size={16} className="text-blue-500"/> Voice Model</label>
                              <select value={editVoiceModel} onChange={e => setEditVoiceModel(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                  <option value="Standard Female">Standard Female</option>
                                  <option value="Standard Male">Standard Male</option>
                                  <option value="Premium Female (US)">Premium Female (US)</option>
                                  <option value="Premium Male (US)">Premium Male (US)</option>
                                  <option value="British Female">British Female</option>
                                  <option value="British Male">British Male</option>
                              </select>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><LayoutGrid size={16} className="text-blue-500"/> Layout Options</label>
                              <select value={editLayout} onChange={e => setEditLayout(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                  <option value="Grid">Standard Grid</option>
                                  <option value="List">List View</option>
                                  <option value="Large Icons">Large Icons (Accessibility)</option>
                              </select>
                          </div>
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                          <div className="flex justify-between items-end mb-2">
                              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Sparkles size={16} className="text-purple-500"/> AI Background Context
                              </label>
                              <button type="button" onClick={generateAiContext} disabled={isGeneratingAiContext} className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors disabled:opacity-50">
                                  {isGeneratingAiContext ? <><Loader2 size={12} className="animate-spin"/> Generating ({aiGeneratorProgress}%)...</> : <><Sparkles size={12}/> Auto-Generate</>}
                              </button>
                          </div>
                          <textarea 
                              value={editAiContext} 
                              onChange={e => setEditAiContext(e.target.value)}
                              placeholder="e.g. 8-year old who loves dinosaurs and trucks..."
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px] text-sm"
                          />
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">Used to personalize predictive text hints and emotional matching. Runs 100% offline securely.</p>
                      </div>

                      <div className="pt-4 flex gap-3 border-t border-slate-100">
                          <button type="button" onClick={() => setShowStudentSettingsModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                          <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Save Settings</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {showNewStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold">Add Student</h3><p className="text-blue-100 text-sm mt-1">Create a new profile on your caseload.</p></div>
              <button onClick={() => setShowNewStudentModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Student Name</label><input type="text" required autoFocus value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="e.g. Jane Doe" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Assign to School</label><select required value={newStudentSchoolId} onChange={e => setNewStudentSchoolId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"><option value="" disabled>Select a school...</option>{schools?.map(sch => (<option key={sch.id} value={sch.id}>{sch.name}</option>))}</select>{(!schools || schools.length === 0) && <p className="text-xs text-red-500 mt-1">Your district admin must create schools in Settings first.</p>}</div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowNewStudentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={!schools || schools.length === 0} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">Create Profile</button></div>
            </form>
          </div>
        </div>
      )}

      {editingStudentSchool && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800">Assign School</h3><button onClick={() => setEditingStudentSchool(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full"><X size={20}/></button></div>
                  <form onSubmit={handleUpdateStudentSchool} className="p-6 space-y-4">
                      <p className="text-sm text-slate-600 mb-2">Select a new school for <b>{editingStudentSchool.name}</b>.</p>
                      <select required value={editStudentSchoolId} onChange={e => setEditStudentSchoolId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"><option value="" disabled>Select a school...</option>{schools?.map(sch => <option key={sch.id} value={sch.id}>{sch.name}</option>)}</select>
                      <div className="pt-4 flex gap-3"><button type="button" onClick={() => setEditingStudentSchool(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save</button></div>
                  </form>
              </div>
          </div>
      )}

      {editingTeacherSchools && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center shrink-0"><h3 className="text-xl font-bold text-slate-800">Edit Teacher Access</h3><button onClick={() => setEditingTeacherSchools(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full"><X size={20}/></button></div>
                  <form onSubmit={handleUpdateTeacherSchools} className="p-6 space-y-4 overflow-y-auto">
                      <p className="text-sm text-slate-600 mb-2">Modify school access for <b>{editingTeacherSchools.name || editingTeacherSchools.email}</b>.</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <label className="flex items-center gap-3 mb-3 cursor-pointer border-b border-slate-200 pb-3"><input type="checkbox" checked={editTeacherAllSchools} onChange={e => { setEditTeacherAllSchools(e.target.checked); if(e.target.checked) setEditTeacherSchoolList([]); }} className="w-5 h-5 accent-blue-600" /><span className="font-bold text-slate-800">All Schools in District</span></label>
                          {!editTeacherAllSchools && (
                              <div className="space-y-2 max-h-40 overflow-y-auto">{schools?.map(sch => (<label key={sch.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg"><input type="checkbox" checked={editTeacherSchoolList.includes(sch.id)} onChange={e => { if (e.target.checked) setEditTeacherSchoolList([...editTeacherSchoolList, sch.id]); else setEditTeacherSchoolList(editTeacherSchoolList.filter(id => id !== sch.id)); }} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-slate-700">{sch.name}</span></label>))}</div>
                          )}
                      </div>
                      <div className="pt-2 flex gap-3"><button type="button" onClick={() => setEditingTeacherSchools(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Changes</button></div>
                  </form>
              </div>
          </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div><h3 className="text-xl font-bold">Invite Teacher</h3><p className="text-blue-100 text-sm mt-1">Add a staff member and assign schools.</p></div>
              <button onClick={() => setShowInviteModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleInviteTeacher} className="p-6 space-y-4 overflow-y-auto">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Teacher's Email Address</label><input type="email" required autoFocus value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="teacher@school.edu" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2 border-b border-slate-200 pb-2">School Access</label>
                  <label className="flex items-center gap-3 mb-3 cursor-pointer"><input type="checkbox" checked={inviteAllSchools} onChange={(e) => { setInviteAllSchools(e.target.checked); if (e.target.checked) setInviteSchools([]); }} className="w-5 h-5 accent-blue-600" /><span className="font-bold text-slate-800">All Schools in District</span></label>
                  {!inviteAllSchools && (
                      <div className="space-y-2 pl-2 max-h-40 overflow-y-auto pr-2">{schools?.map(sch => (<label key={sch.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg"><input type="checkbox" checked={inviteSchools.includes(sch.id)} onChange={(e) => { if (e.target.checked) setInviteSchools([...inviteSchools, sch.id]); else setInviteSchools(inviteSchools.filter(id => id !== sch.id)); }} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-slate-700">{sch.name}</span></label>))}{(!schools || schools.length === 0) && <p className="text-xs text-red-500">No schools created yet.</p>}</div>
                  )}
               </div>
               <p className="text-xs text-slate-500">This will generate a 6-character Invite Code that the teacher must use to register their account.</p>
               <div className="pt-2 flex gap-3"><button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Generate Invite</button></div>
            </form>
          </div>
        </div>
      )}

      {showPairingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold">Pair Device</h3><p className="text-slate-400 text-sm mt-1">Linking to {selectedStudent?.name}</p></div>
              <button onClick={() => setShowPairingModal(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 text-center space-y-4">
               <div className="relative w-full aspect-square md:aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  <div className="absolute inset-0 border-[12px] border-black/40 pointer-events-none flex items-center justify-center"><div className="w-3/4 h-3/4 border-2 border-blue-500 rounded-xl relative"><div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 animate-pulse"></div></div></div>
                  {!isStreamReady && (<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4"><Loader2 size={32} className="animate-spin mb-2" /><p className="text-sm">Requesting camera access...</p></div>)}
               </div>
               <p className="text-sm text-slate-600 font-medium">Point your camera at the QR code displayed on the student's device.</p>
               <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or enter manual code</span><div className="flex-grow border-t border-slate-200"></div></div>
               <form onSubmit={handleManualLinkDevice} className="flex gap-2">
                  <input type="text" value={pairingCode} onChange={e => setPairingCode(e.target.value)} placeholder="10-character sync code" maxLength={10} className="flex-1 p-3 border border-slate-300 rounded-xl text-center font-mono font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-blue-500" required />
                  <button type="submit" className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Link</button>
               </form>
            </div>
          </div>
        </div>
      )}

      {showNewPageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold">New Master Page</h3><p className="text-blue-100 text-sm mt-1">Create a layout to share with students.</p></div>
              <button onClick={() => setShowNewPageModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreatePage} className="p-6 space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Page Title</label><input type="text" required value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="e.g. Science Class" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Emoji Icon</label><input type="text" required value={newPageIcon} onChange={e => setNewPageIcon(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-2xl" /></div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowNewPageModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Create Page</button></div>
            </form>
          </div>
        </div>
      )}

      {editingLibraryPage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <div><h3 className="text-xl font-bold text-slate-800">Edit Master Page Info</h3></div>
              <button onClick={() => setEditingLibraryPage(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateLibraryPage} className="p-6 space-y-4">
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Page Title</label><input type="text" required value={editingLibraryPage.label} onChange={e => setEditingLibraryPage({...editingLibraryPage, label: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Emoji Icon</label><input type="text" required value={editingLibraryPage.icon} onChange={e => setEditingLibraryPage({...editingLibraryPage, icon: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-2xl" /></div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setEditingLibraryPage(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold">Push Page to Device</h3><p className="text-blue-100 text-sm mt-1">Send a library page to {selectedStudent?.name}</p></div>
              <button onClick={() => setShowPushModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handlePushPageToStudent} className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Master Page from Library</label>
                  {(!library || library.length === 0) ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm border border-slate-200">Your district library is empty. Go to the Library tab to create or upload a page first.</div>
                  ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {library?.map(lib => (
                              <label key={lib.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedLibraryPageId === lib.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                  <input type="radio" name="pageToPush" value={lib.id} checked={selectedLibraryPageId === lib.id} onChange={(e) => setSelectedLibraryPageId(e.target.value)} className="w-4 h-4 accent-blue-600" required />
                                  <span className="text-2xl">{lib.icon}</span>
                                  <div className="flex-1 min-w-0"><div className="font-bold text-slate-800 truncate">{lib.label}</div><div className="text-xs text-slate-500">{lib.tileCount || 0} Tiles</div></div>
                              </label>
                          ))}
                      </div>
                  )}
               </div>
               <div className="pt-2 flex gap-3 border-t border-slate-100"><button type="button" onClick={() => setShowPushModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={!selectedLibraryPageId || !library || library.length === 0} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"><Send size={18} /> Push to Device</button></div>
            </form>
          </div>
        </div>
      )}

      {showNukeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold flex items-center gap-2"><AlertTriangle size={20} /> Delete District</h3><p className="text-red-100 text-sm mt-1">Irreversible data destruction.</p></div>
              <button onClick={() => setShowNukeModal(false)} className="text-red-200 hover:text-white p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleNukeDistrict} className="p-6 space-y-4">
               <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-medium">You are about to delete <strong>{orgDetails?.name || userProfile?.orgId}</strong>. This will instantly wipe all students, teachers, library pages, and compliance logs.</div>
               <div><label className="block text-sm font-bold text-slate-700 mb-2">Type <strong>{orgDetails?.name || userProfile?.orgId}</strong> to confirm:</label><input type="text" required value={nukeConfirmText} onChange={e => setNukeConfirmText(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" /></div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowNukeModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={isNuking || nukeConfirmText !== (orgDetails?.name || userProfile?.orgId)} className="flex-1 flex justify-center items-center gap-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50">{isNuking ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Permanently Delete</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {showSANukeModal && saNukeTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-red-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold flex items-center gap-2"><AlertTriangle size={20} /> Delete District</h3><p className="text-red-100 text-sm mt-1">Super Admin Override</p></div>
              <button onClick={() => setShowSANukeModal(false)} className="text-red-200 hover:text-white p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSuperAdminNuke} className="p-6 space-y-5">
               <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-medium">You are about to permanently delete <strong>{saNukeTarget.name}</strong> and ALL associated user data.</div>
               <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-200 pb-2"><Key size={16} className="text-indigo-600"/> Security Verification Step</div>
                  <p className="text-xs text-slate-500">To authorize this destruction, enter the 6-digit security code generated below:</p>
                  <div className="text-2xl font-mono tracking-widest font-black text-indigo-600 text-center py-2 bg-white border border-indigo-100 rounded-lg">{saNukeCode}</div>
                  <input type="text" required placeholder="Enter 6-digit code" value={saNukeInputCode} onChange={e => setSaNukeInputCode(e.target.value)} maxLength={6} className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center font-mono text-lg tracking-widest" />
               </div>
               <div><label className="block text-sm font-bold text-slate-700 mb-2">Type <strong>{saNukeTarget.name}</strong> to confirm:</label><input type="text" required value={saNukeInputName} onChange={e => setSaNukeInputName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" /></div>
               <div className="pt-2 flex gap-3"><button type="button" onClick={() => setShowSANukeModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={isNuking || saNukeInputName !== saNukeTarget.name || saNukeInputCode !== saNukeCode} className="flex-1 flex justify-center items-center gap-2 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:opacity-50">{isNuking ? <Loader2 size={18} className="animate-spin" /> : <><Trash2 size={18} /> Delete</>}</button></div>
            </form>
          </div>
        </div>
      )}

      {showAnnounceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold flex items-center gap-2"><Megaphone size={20}/> Broadcast Message</h3><p className="text-indigo-200 text-sm mt-1">Send a notification to staff.</p></div>
              <button onClick={() => setShowAnnounceModal(false)} className="text-indigo-200 hover:text-white p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSendAnnouncement} className="p-6 space-y-4">
               {userProfile?.role === 'super_admin' && (
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target District</label><select required value={announceTargetOrg} onChange={e => setAnnounceTargetOrg(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="all">🌐 GLOBAL (All Districts)</option>{organizations?.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}</select></div>
               )}
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Audience Role</label>
                  <select value={announceTargetRole} onChange={e => setAnnounceTargetRole(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="all">Everyone</option><option value="teacher">Teachers Only</option><option value="district_admin">District Admins Only</option></select>
               </div>
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Message Title</label><input type="text" required autoFocus value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} placeholder="e.g. System Maintenance" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /></div>
               <div><label className="block text-sm font-bold text-slate-700 mb-1">Message Body</label><textarea required rows={4} value={announceMessage} onChange={e => setAnnounceMessage(e.target.value)} placeholder="Type your message here..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" ></textarea></div>
               <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowAnnounceModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"><Send size={18} /> Send</button></div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col md:flex-row">
            {/* Left Sidebar: Template Selection */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
               <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold flex items-center gap-2"><LayoutGrid size={20}/> Preset Library</h3>
                    <p className="text-slate-500 text-sm mt-1">Select a template to preview.</p>
                 </div>
                 <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full md:hidden"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                 {loadingTemplate && availableTemplates.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
                 )}
                 {availableTemplates.map(template => (
                    <button key={template.id} onClick={() => handleSelectTemplate(template)} className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedTemplate?.id === template.id ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${template.color} rounded-xl flex items-center justify-center text-2xl shadow-inner`}>{template.icon}</div>
                          <div>
                             <h4 className="font-bold text-slate-800">{template.label}</h4>
                             <p className="text-xs text-slate-500">{template.tileCount} Tiles {template.pageCount > 1 ? ` • ${template.pageCount} Pages` : ''}</p>
                          </div>
                       </div>
                    </button>
                 ))}
               </div>
            </div>

            {/* Right Area: Preview and Actions */}
            <div className="w-full md:w-2/3 bg-white flex flex-col h-full relative">
               {loadingTemplate && selectedTemplate && !selectedTemplate.tiles && (
                   <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
                       <Loader2 className="animate-spin text-blue-600" size={48} />
                   </div>
               )}
               {selectedTemplate && selectedTemplate.tiles ? (
                 <>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative shadow-sm">
                       <div>
                          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">{selectedTemplate.icon} {selectedTemplate.label}</h3>
                          <p className="text-slate-500 text-sm">Preview mode</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors hidden md:block">Cancel</button>
                          <button onClick={handleSaveTemplate} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"><Plus size={18}/> Add to District</button>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                            {selectedTemplate.tiles.map(tile => (
                               <div key={tile.id} className="aspect-square rounded-2xl border border-slate-200/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center p-2 text-center transition-transform hover:scale-105" style={{ backgroundColor: tile.backgroundColor }}>
                                  <div className="text-4xl sm:text-5xl mb-3 filter drop-shadow-sm">{tile.icon}</div>
                                  <div className="font-bold text-slate-800 text-[13px] sm:text-[15px] leading-tight px-1">{tile.label}</div>
                               </div>
                            ))}
                        </div>
                    </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                     <LayoutGrid size={64} className="mb-4 text-slate-200" />
                     <p className="text-lg font-bold text-slate-500">Select a template</p>
                     <p className="text-sm">Choose from the preset library on the left to preview.</p>
                     <button onClick={() => setShowTemplateModal(false)} className="mt-8 px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors md:hidden">Close</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}