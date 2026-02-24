import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, query, where, onSnapshot, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
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
  Mail
} from 'lucide-react';

/**
 * FIREBASE INITIALIZATION
 */
const firebaseConfig = {
  apiKey: "AIzaSy" + "ArrlwfXCglM" + "op8RBLKbphZhtJ" + "JJ4leYJI",
  authDomain: "easyspeakai.firebaseapp.com",
  projectId: "easyspeakai",
  storageBucket: "easyspeakai.firebasestorage.app",
  messagingSenderId: "866097074609",
  appId: "1:866097074609:web:0215ce7948c97289512d90"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  // --- Auth State ---
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Dashboard Data State ---
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [library, setLibrary] = useState([]);
  const [staff, setStaff] = useState([]); 
  const [pendingInvites, setPendingInvites] = useState([]); // Pending Invites
  const [orgDetails, setOrgDetails] = useState(null); // Current District's Info
  
  // --- Super Admin State ---
  const [systemUsers, setSystemUsers] = useState([]); 
  const [organizations, setOrganizations] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // --- Modals State ---
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [editingLibraryPage, setEditingLibraryPage] = useState(null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('📄');

  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // --- Push to Student State ---
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedLibraryPageId, setSelectedLibraryPageId] = useState('');

  // --- Refs ---
  const libraryUploadRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
            // --- NEW USER CREATION: HARD REJECT IF NOT INVITED ---
            try {
                // Fetch invites by email
                const qInvite = query(collection(db, 'invites'), where('email', '==', currentUser.email.toLowerCase()));
                const inviteDocs = await getDocs(qInvite);
                
                // Filter for pending status in memory
                const pendingInvite = inviteDocs.docs.find(doc => doc.data().status === 'pending');
                
                if (pendingInvite) {
                    const assignedOrgId = pendingInvite.data().orgId;
                    const assignedRole = pendingInvite.data().role || 'teacher';
                    
                    // Create Profile
                    const newProfile = {
                      email: currentUser.email,
                      name: currentUser.displayName || '',
                      role: assignedRole, 
                      orgId: assignedOrgId, 
                      createdAt: new Date().toISOString()
                    };
                    await setDoc(userRef, newProfile);
                    setUserProfile(newProfile);
                    setUser(currentUser);

                    // Mark invite as accepted
                    await updateDoc(doc(db, 'invites', pendingInvite.id), { status: 'accepted' });
                } else {
                    // HARD REJECT
                    console.warn("Unauthorized access attempt by:", currentUser.email);
                    await signOut(auth);
                    setLoginError(`Access Denied: The email ${currentUser.email} has not been invited to a school district. Please contact your administrator.`);
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
      setOrgDetails(null);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    const orgId = userProfile.orgId;

    // Listen to District / Organization License Data
    const unsubOrg = onSnapshot(doc(db, 'organizations', orgId), (docSnap) => {
       if (docSnap.exists()) setOrgDetails(docSnap.data());
       else setOrgDetails(null);
    }, (error) => console.error("Org listener error:", error));

    // Listen to Students Collection
    const qStudents = query(collection(db, 'students'), where('orgId', '==', orgId));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentData);
      
      // Auto-update selected student if it changes
      setSelectedStudent(prev => {
        if (!prev) return studentData.length > 0 ? studentData[0] : null;
        const updated = studentData.find(s => s.id === prev.id);
        return updated || studentData[0] || null;
      });
    }, (error) => console.error("Students listener error:", error));

    // Listen to Library Collection
    const qLibrary = query(collection(db, 'library'), where('orgId', '==', orgId));
    const unsubLibrary = onSnapshot(qLibrary, (snapshot) => {
      const libData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLibrary(libData);
    }, (error) => console.error("Library listener error:", error));

    // Listen to Staff (Users in same Org)
    const qStaff = query(collection(db, 'users'), where('orgId', '==', orgId));
    const unsubStaff = onSnapshot(qStaff, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setStaff(staffData);
    }, (error) => console.error("Staff listener error:", error));

    // Listen to Pending Invites (Filter in memory to avoid Firebase compound index requirement)
    const qInvites = query(collection(db, 'invites'), where('orgId', '==', orgId));
    const unsubInvites = onSnapshot(qInvites, (snapshot) => {
      const inviteData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(inv => inv.status === 'pending');
        
      setPendingInvites(inviteData);
      setDataLoading(false);
    }, (error) => {
      console.error("Invites listener error:", error);
      setDataLoading(false);
    });

    return () => {
      unsubOrg();
      unsubStudents();
      unsubLibrary();
      unsubStaff();
      unsubInvites();
    };
  }, [userProfile]);

  // 3. Super Admin: Fetch all users and organizations across the entire system
  useEffect(() => {
    if (userProfile?.role === 'super_admin') {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setSystemUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      }, (error) => console.error("Users listener error:", error));
      
      const unsubOrgs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
        setOrganizations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => console.error("Organizations listener error:", error));
      
      return () => {
         unsubUsers();
         unsubOrgs();
      };
    }
  }, [userProfile]);

  // 4. Camera Stream Lifecycle for Pairing Modal
  useEffect(() => {
    if (showPairingModal) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable", err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [showPairingModal]);


  // --- ACTIONS ---

  // Invite a New Teacher
  const handleInviteTeacher = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !userProfile?.orgId) return;

    try {
        await addDoc(collection(db, 'invites'), {
            email: inviteEmail.trim().toLowerCase(),
            orgId: userProfile.orgId,
            role: 'teacher',
            invitedBy: user.email,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        
        setShowInviteModal(false);
        setInviteEmail('');
        alert(`Invitation registered for ${inviteEmail}! They will automatically join your district when they log in.`);
    } catch (err) {
        console.error("Error inviting teacher:", err);
        alert("Failed to send invitation. Check console for permissions.");
    }
  };

  // Cancel an Invitation
  const handleCancelInvite = async (inviteId) => {
    if (window.confirm("Are you sure you want to cancel this invitation?")) {
        try {
            await deleteDoc(doc(db, 'invites', inviteId));
        } catch (err) {
            console.error("Error canceling invite:", err);
            alert("Failed to cancel invite.");
        }
    }
  };

  // Calculated License Metrics
  const activeLicensesCount = students.filter(s => s.hasLicense !== false).length; // defaults true for legacy
  const maxLicenses = orgDetails?.licenses || 0;
  const availableLicenses = Math.max(0, maxLicenses - activeLicensesCount);

  // Toggle a Student's License Status
  const handleToggleLicense = async (student) => {
    const currentStatus = student.hasLicense !== false; 

    // If trying to turn ON, verify there is space
    if (!currentStatus && maxLicenses > 0 && activeLicensesCount >= maxLicenses) {
        alert("You do not have enough available licenses in your district quota. Please revoke a license from another student or contact support to upgrade.");
        return;
    }

    try {
        await updateDoc(doc(db, 'students', student.id), {
            hasLicense: !currentStatus
        });
    } catch (e) {
        console.error("Failed to update license:", e);
        alert("Failed to update license.");
    }
  };

  // Create a new Student Profile
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !userProfile?.orgId) return;

    // Check License Limits - allow creation, but flag as unlicensed if full
    const canAssignLicense = maxLicenses === 0 || activeLicensesCount < maxLicenses;

    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName.trim(),
        orgId: userProfile.orgId,
        device: 'Unlinked',
        status: 'offline',
        lastSync: 'Never',
        pages: [],
        hasLicense: canAssignLicense
      });
      setShowNewStudentModal(false);
      setNewStudentName('');

      if (!canAssignLicense) {
          alert(`Profile created! However, your district is out of available licenses, so this profile is currently Unlicensed. You can manage licenses in the Settings tab.`);
      }
    } catch (err) {
      console.error("Error creating student:", err);
      alert("Failed to create student.");
    }
  };

  // Connect Device to Student Profile
  const handleManualLinkDevice = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !pairingCode) return;
    
    const code = pairingCode.trim().toUpperCase(); // Ensure uppercase matching
    if (code.length !== 10) {
      return alert("Please enter a valid 10-character alphanumeric sync code.");
    }
    
    try {
       // 1. Verify the code exists in the temporary database
       const codeRef = doc(db, 'pairing_codes', code);
       const codeSnap = await getDoc(codeRef);
       const codeData = codeSnap.data();

       if (!codeSnap.exists() || codeData?.status !== 'pending') {
           return alert("Invalid or expired pairing code. Please generate a new one on the student's device.");
       }

       // Pull device info if provided by the client app
       const detectedDevice = codeData.deviceName || "Linked Device";

       // 2. Update the Dashboard UI to show it's linked
       await updateDoc(doc(db, 'students', selectedStudent.id), {
          device: detectedDevice,
          status: 'online',
          lastSync: 'Just now'
       });

       // 3. THE MAGIC HANDSHAKE: Tell the iPad which student profile it belongs to!
       await updateDoc(codeRef, {
           status: 'linked',
           studentId: selectedStudent.id,
           orgId: userProfile.orgId
       });

       setShowPairingModal(false);
       setPairingCode('');
       alert(`Successfully linked ${detectedDevice} to ${selectedStudent.name}!`);
    } catch(err) {
       console.error("Failed to link device", err);
       alert("Error communicating with database.");
    }
  };

  // Unlink Device from Student
  const handleUnlinkDevice = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`Are you sure you want to unlink the current device? The student will lose access until you pair a new one.`)) return;

    try {
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        device: 'Unlinked',
        status: 'offline',
        lastSync: 'Never'
      });
    } catch (error) {
      console.error("Error unlinking device:", error);
    }
  };

  // Delete Student Profile
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    const confirmMessage = `WARNING: Are you sure you want to permanently delete the profile for "${selectedStudent.name}"? \n\nThis will instantly wipe all managed pages from their device, sever their connection, and free up 1 district license. This action CANNOT be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteDoc(doc(db, 'students', selectedStudent.id));
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student profile.");
    }
  };

  // Upload an exported Page JSON to the Library
  const handleLibraryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        let pageToImport = null;

        if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
           pageToImport = data.pages[0]; 
        } else if (data.id && data.tiles) {
           pageToImport = data; 
        }

        if (!pageToImport) throw new Error("File does not contain valid EasySpeak page data.");

        await addDoc(collection(db, 'library'), {
          orgId: userProfile.orgId,
          label: pageToImport.label || "Imported Page",
          icon: pageToImport.icon || "📄",
          color: pageToImport.color || "bg-slate-100",
          tileCount: pageToImport.tiles ? pageToImport.tiles.length : 0,
          tiles: pageToImport.tiles || [],
          lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
        
        alert("Page imported successfully!");
      } catch (err) {
        console.error(err);
        alert("Error importing page: " + err.message);
      } finally {
        if (libraryUploadRef.current) libraryUploadRef.current.value = '';
      }
    };
  };

  // Push a Master Page to a Student's Profile
  const handlePushPageToStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedLibraryPageId) return;

    const pageToPush = library.find(p => p.id === selectedLibraryPageId);
    if (!pageToPush) return;

    try {
      const studentRef = doc(db, 'students', selectedStudent.id);
      
      // Construct the new page payload for the student
      const newStudentPage = {
         id: `managed_${pageToPush.id}_${Date.now()}`, // Unique ID for their local array
         label: pageToPush.label,
         icon: pageToPush.icon,
         color: pageToPush.color || "bg-slate-100",
         tiles: pageToPush.tiles || [],
         type: 'managed' // Tags it as read-only on their device
      };

      const updatedPages = [...(selectedStudent.pages || []), newStudentPage];

      await updateDoc(studentRef, {
        pages: updatedPages,
        lastSync: 'Just now (Update Pushed)'
      });

      setShowPushModal(false);
      setSelectedLibraryPageId('');
      alert(`Successfully pushed "${pageToPush.label}" to ${selectedStudent.name}!`);
    } catch (error) {
      console.error("Error pushing page:", error);
      alert("Failed to push page to device.");
    }
  };

  // Remove a managed page from a student's profile
  const handleRemoveStudentPage = async (pageIdToRemove) => {
    if (!selectedStudent) return;
    if (!window.confirm("Are you sure you want to remove this page from the student's device? It will be deleted on their next sync.")) return;

    try {
      const studentRef = doc(db, 'students', selectedStudent.id);
      const updatedPages = (selectedStudent.pages || []).filter(p => p.id !== pageIdToRemove);
      
      await updateDoc(studentRef, {
        pages: updatedPages,
        lastSync: 'Just now (Page Removed)'
      });
    } catch (error) {
      console.error("Error removing page:", error);
      alert("Failed to remove page.");
    }
  };

  // Create a new (Blank) Master Page in the Library
  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    
    try {
      await addDoc(collection(db, 'library'), {
        orgId: userProfile.orgId,
        label: newPageTitle,
        icon: newPageIcon || '📄',
        color: 'bg-slate-100',
        tileCount: 0,
        tiles: [],
        lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      setShowNewPageModal(false);
      setNewPageTitle('');
      setNewPageIcon('📄');
    } catch(err) {
      console.error("Error creating page:", err);
      alert("Failed to create master page.");
    }
  };

  // Update existing Library Page Metadata
  const handleUpdateLibraryPage = async (e) => {
    e.preventDefault();
    if (!editingLibraryPage) return;

    try {
      await updateDoc(doc(db, 'library', editingLibraryPage.id), {
        label: editingLibraryPage.label,
        icon: editingLibraryPage.icon,
        lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      setEditingLibraryPage(null);
    } catch(err) {
      console.error("Error updating page:", err);
      alert("Failed to update master page.");
    }
  };

  // Delete a Master Page from the Library
  const handleDeleteLibraryPage = async (id) => {
    if (window.confirm("Are you sure you want to delete this master page? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'library', id));
      } catch (err) {
        console.error("Error deleting page:", err);
        alert("Failed to delete page.");
      }
    }
  };

  // Super Admin: Update User
  const handleUpdateSystemUser = async (uid, newRole, newOrgId) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        orgId: newOrgId.trim()
      });
      alert('User updated successfully!');
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Failed to update user. Check console for details.');
    }
  };

  // Super Admin: Create New District
  const handleCreateOrganization = async (name, licensesStr) => {
    if (!name || !name.trim()) return alert("Organization name cannot be empty.");
    const cleanName = name.trim();
    const licenses = parseInt(licensesStr) || 0;
    
    try {
      await addDoc(collection(db, 'organizations'), { 
        name: cleanName,
        licenses: licenses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
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

  // Super Admin: Update Existing District Licenses
  const handleUpdateOrgLicense = async (orgId, licensesStr) => {
    const licenses = parseInt(licensesStr) || 0;
    
    try {
      await updateDoc(doc(db, 'organizations', orgId), { 
        licenses: licenses,
        updatedAt: new Date().toISOString()
      });
      
      alert(`Successfully updated licenses!`);
    } catch (error) {
      console.error("Error updating licenses:", error);
      alert('Failed to update licenses. Check console for details.');
    }
  };

  // --- AUTH ACTIONS ---
  const handleAuthError = (error) => {
    console.error(error);
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      setLoginError(`Domain Blocked! Add "${currentDomain}" to your Firebase Console under Authentication -> Settings -> Authorized Domains.`);
    } else {
      setLoginError(error.message.replace('Firebase: ', ''));
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      handleAuthError(error);
      setIsLoggingIn(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    const provider = new OAuthProvider('microsoft.com');
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      handleAuthError(error);
      setIsLoggingIn(false);
    }
  };

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
         handleAuthError(error);
      }
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
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

  // --- UI: Login Screen ---
  if (!user) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-3xl text-white shadow-inner mx-auto mb-6">Z</div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Teacher Dashboard</h1>
          <p className="text-center text-slate-500 text-sm mb-8">Sign in with your district credentials</p>
          
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-start gap-2 mb-4 break-words">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
            <button 
              onClick={handleMicrosoftLogin}
              disabled={isLoggingIn}
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f35325" d="M1 1h9v9H1z"/><path fill="#81bc06" d="M11 1h9v9h-9z"/><path fill="#05a6f0" d="M1 11h9v9H1z"/><path fill="#ffba08" d="M11 11h9v9h-9z"/></svg>
              Sign in with Microsoft
            </button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="teacher@school.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Helper to format role displays
  const getRoleDisplayName = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'district_admin') return 'District Admin';
    return 'Teacher';
  };

  const uniqueOrgIds = Array.from(new Set([
    ...organizations.map(org => org.id),
    ...systemUsers.map(u => u.orgId).filter(id => id && id !== 'pending')
  ])).sort();

  // --- UI: The Main Dashboard (Protected) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner">Z</div>
          <span className="font-bold text-lg tracking-wide">EasySpeak <span className="text-blue-400 font-normal">for Education</span></span>
          <span className={`ml-4 px-2.5 py-0.5 border rounded-full text-xs font-medium ${userProfile?.orgId === 'pending' ? 'bg-amber-900/50 border-amber-700 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            {userProfile?.orgId === 'pending' ? 'Pending District Approval' : (orgDetails?.name || userProfile?.orgId)}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-3 p-1.5">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold leading-tight">{userProfile?.name || user.email}</div>
              <div className="text-xs text-slate-400">{getRoleDisplayName(userProfile?.role)}</div>
            </div>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center font-bold uppercase">
              {(userProfile?.name || user.email || 'U').charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20">
          <div className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={20} /> My Students
            </button>
            <button 
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'library' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BookOpen size={20} /> District Library
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings size={20} /> Settings & Staff
            </button>
            
            {/* Super Admin Only Tab */}
            {userProfile?.role === 'super_admin' && (
              <button 
                onClick={() => setActiveTab('system_admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors mt-4 border ${activeTab === 'system_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-slate-600 hover:bg-slate-50 border-transparent'}`}
              >
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

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden relative">
          
          {dataLoading && userProfile?.orgId !== 'pending' && activeTab !== 'system_admin' && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                 <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          )}

          {/* Active Tab Logic */}
          {activeTab === 'students' && (
            <>
              {/* Student List Column */}
              <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-slate-800">Caseload ({students.length})</h2>
                    <button 
                       onClick={() => setShowNewStudentModal(true)} 
                       disabled={userProfile?.orgId === 'pending'} 
                       className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50" 
                       title="Add New Student"
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search students..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {students.length === 0 ? (
                      <div className="text-center p-6 text-slate-400 mt-8 border-2 border-dashed border-slate-300 rounded-2xl mx-2">
                          <Users size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-bold text-slate-600">Your caseload is empty.</p>
                          <button onClick={() => setShowNewStudentModal(true)} className="mt-3 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold">Add Student</button>
                      </div>
                  ) : (
                    students.map(student => (
                      <button 
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${selectedStudent?.id === student.id ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{student.name}</span>
                          {student.hasLicense === false ? (
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded">Unlicensed</span>
                          ) : student.status === 'online' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider"><Wifi size={12} /> Syncing</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><WifiOff size={12} /> Offline</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Smartphone size={14} className={student.hasLicense === false ? 'text-red-400' : ''}/> {student.hasLicense === false ? 'Action Required' : student.device}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Student Detail View */}
              <div className="flex-1 bg-white overflow-y-auto">
                {selectedStudent ? (
                  <div className="p-8 max-w-5xl mx-auto">
                    
                    {selectedStudent.hasLicense === false && (
                       <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
                          <AlertCircle className="shrink-0 mt-0.5" size={24} />
                          <div>
                             <h4 className="font-bold text-lg">Profile is Unlicensed</h4>
                             <p className="text-sm mt-1">This student cannot pair devices, sync, or receive page updates. Go to <strong>Settings &gt; License Management</strong> to assign an available license to this profile.</p>
                          </div>
                       </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedStudent.name}'s Profile</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                             <Smartphone size={16} className={selectedStudent.device === 'Unlinked' ? 'text-amber-500' : 'text-slate-600'} /> 
                             {selectedStudent.device}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><Clock size={16} className="text-slate-600" /> Last synced: {selectedStudent.lastSync}</span>
                        </div>
                      </div>
                      <button 
                         onClick={() => setShowPushModal(true)}
                         disabled={selectedStudent.device === 'Unlinked' || selectedStudent.hasLicense === false}
                         className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         title={selectedStudent.hasLicense === false ? "License required" : selectedStudent.device === 'Unlinked' ? "Pair a device first to push updates" : ""}
                      >
                        <Send size={18} /> Push to Device
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left Column: Pages */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* Managed Pages */}
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><ShieldCheck size={20} className="text-blue-500"/> School-Managed Pages</h3>
                            <button onClick={() => setShowPushModal(true)} disabled={selectedStudent.device === 'Unlinked' || selectedStudent.hasLicense === false} className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">Add from Library</button>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-4">These pages are pushed to {selectedStudent.name}'s device. The student cannot delete or edit these.</p>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {(selectedStudent.pages || []).filter(p => p.type === 'managed').map(page => (
                                <div key={page.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm group">
                                  <span className="text-3xl mb-2">{page.icon}</span>
                                  <span className="font-bold text-sm text-slate-800 truncate w-full">{page.label}</span>
                                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRemoveStudentPage(page.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Remove Page"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              ))}
                              {(selectedStudent.pages || []).filter(p => p.type === 'managed').length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-xl">
                                  No school pages pushed yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </section>

                        {/* Local/Parent Pages (Read Only) */}
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Personal / Parent Pages</h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Read Only</span>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2"><Lock size={14}/> Created by the user/family. You can view these for context, but cannot edit them.</p>
                            
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {(selectedStudent.pages || []).filter(p => p.type !== 'managed').map(page => (
                                <div key={page.id} className="shrink-0 w-28 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center opacity-80 cursor-not-allowed">
                                  <span className="text-2xl mb-1 grayscale">{page.icon}</span>
                                  <span className="font-medium text-xs text-slate-600 truncate w-full">{page.label}</span>
                                </div>
                              ))}
                              {(selectedStudent.pages || []).filter(p => p.type !== 'managed').length === 0 && (
                                 <div className="text-sm text-slate-400 italic">No personal pages created yet.</div>
                              )}
                            </div>
                          </div>
                        </section>

                      </div>

                      {/* Right Column: Device Info & Quick Actions */}
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

                          <div className="mt-6 pt-4 border-t border-slate-200">
                            {selectedStudent.device === 'Unlinked' ? (
                               <button 
                                  onClick={() => setShowPairingModal(true)} 
                                  disabled={selectedStudent.hasLicense === false}
                                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                               >
                                 <QrCode size={18} /> Pair New Device
                               </button>
                            ) : (
                               <button onClick={handleUnlinkDevice} className="w-full py-2.5 bg-white border border-slate-300 text-red-600 font-bold rounded-xl hover:bg-red-50 text-sm transition-colors mb-2">
                                 Unlink Current Device (Allows Re-linking)
                               </button>
                            )}
                            <p className="text-[10px] text-slate-400 text-center leading-tight mb-6">If a device is lost or wiped, Unlink it here first to free up the slot for a new device.</p>
                            
                            {/* NEW: Permanent Delete Button */}
                            <button 
                               onClick={handleDeleteStudent} 
                               className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm transition-colors border border-red-200 flex items-center justify-center gap-2"
                            >
                               <Trash2 size={16} /> Delete Profile
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <Users size={64} className="mb-4 text-slate-300"/>
                    <p className="text-lg font-bold text-slate-500">
                       {userProfile?.orgId === 'pending' && userProfile?.role !== 'super_admin' ? 'Waiting for district approval...' : 'Select a student from the sidebar'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Library Tab Prototype */}
          {activeTab === 'library' && (
            <div className="flex-1 bg-white p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">District Library</h1>
                    <p className="text-slate-500">Create master pages here to push to multiple students.</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full md:w-auto">
                    {/* Hidden File Input for JSON Upload */}
                    <input 
                       type="file" 
                       ref={libraryUploadRef} 
                       onChange={handleLibraryUpload} 
                       accept=".json" 
                       className="hidden" 
                    />
                    <button 
                      onClick={() => libraryUploadRef.current?.click()}
                      disabled={userProfile?.orgId === 'pending'}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Upload size={18} /> Upload JSON
                    </button>
                    <button 
                      onClick={() => setShowNewPageModal(true)}
                      disabled={userProfile?.orgId === 'pending'} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Plus size={18} /> New Blank Page
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {library.length === 0 ? (
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
                    library.map(lib => (
                      <div key={lib.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            {lib.icon}
                          </div>
                          
                          {/* Actions */}
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

          {/* Settings Tab Prototype */}
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

                    {/* District Licensing Display */}
                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && userProfile?.orgId !== 'pending' && (
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

                          {/* License Assignment Table */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                               <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                  <tr>
                                     <th className="p-4 font-bold">Student Profile</th>
                                     <th className="p-4 font-bold">Device Status</th>
                                     <th className="p-4 font-bold text-right">License Assigned</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {students.map(s => (
                                     <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                        <td className="p-4 text-sm text-slate-600">{s.device}</td>
                                        <td className="p-4 text-right">
                                           <button 
                                              onClick={() => handleToggleLicense(s)}
                                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${s.hasLicense !== false ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                           >
                                              {s.hasLicense !== false ? (
                                                  <><ToggleRight size={20}/> Active</>
                                              ) : (
                                                  <><ToggleLeft size={20}/> Revoked</>
                                              )}
                                           </button>
                                        </td>
                                     </tr>
                                  ))}
                                  {students.length === 0 && (
                                     <tr><td colSpan="3" className="p-6 text-center text-slate-400">No students in your caseload yet.</td></tr>
                                  )}
                               </tbody>
                            </table>
                          </div>

                       </div>
                    )}

                    {/* District Staff Roster (Admin Only) */}
                    {(userProfile?.role === 'district_admin' || userProfile?.role === 'super_admin') && userProfile?.orgId !== 'pending' && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                         <div className="flex justify-between items-center mb-6">
                            <div>
                               <h3 className="text-lg font-bold text-slate-800">District Staff Roster</h3>
                               <p className="text-sm text-slate-500">Teachers linked to {orgDetails?.name || userProfile?.orgId}</p>
                            </div>
                            <button 
                               onClick={() => setShowInviteModal(true)} 
                               className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                            >
                               <Plus size={16}/> Invite Teacher
                            </button>
                         </div>
                         
                         <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {staff.map(s => (
                               <div key={s.uid} className="p-4 border-b last:border-b-0 border-slate-100 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 uppercase">
                                        {(s.name || s.email || 'U').charAt(0)}
                                     </div>
                                     <div>
                                        <div className="font-bold text-slate-800">{s.email} {s.uid === user.uid && <span className="text-xs font-normal text-blue-500 ml-1">(You)</span>}</div>
                                        <div className="text-xs text-slate-500">{getRoleDisplayName(s.role)}</div>
                                     </div>
                                  </div>
                                  
                                  {s.uid !== user.uid && (
                                     <button className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Remove from District">
                                         <Trash2 size={18}/>
                                     </button>
                                  )}
                               </div>
                            ))}
                            {staff.length === 0 && (
                                <div className="p-6 text-center text-slate-400">No other staff members found.</div>
                            )}
                         </div>

                         {/* Pending Invites List */}
                         {pendingInvites.length > 0 && (
                             <div className="mt-4 border border-amber-200 rounded-xl overflow-hidden bg-amber-50">
                                 <div className="p-3 border-b border-amber-100 font-bold text-amber-800 text-sm flex items-center gap-2">
                                     <Mail size={16}/> Pending Invitations
                                 </div>
                                 {pendingInvites.map(inv => (
                                     <div key={inv.id} className="p-3 border-b last:border-b-0 border-amber-100 flex justify-between items-center text-sm">
                                         <div className="text-amber-900">{inv.email}</div>
                                         <button onClick={() => handleCancelInvite(inv.id)} className="text-amber-600 hover:text-red-600 font-bold text-xs px-3 py-1.5 bg-amber-100 hover:bg-red-100 rounded-lg transition-colors">Cancel</button>
                                     </div>
                                 ))}
                             </div>
                         )}

                      </div>
                    )}
                </div>
            </div>
          )}

          {/* Super Admin / System Admin Tab */}
          {activeTab === 'system_admin' && userProfile?.role === 'super_admin' && (
            <div className="flex-1 bg-white p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                  <div className="p-3 bg-purple-100 text-purple-700 rounded-xl"><Globe size={28} /></div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">System Admin Control Panel</h1>
                    <p className="text-slate-500">Manage all accounts and districts across EasySpeak.</p>
                  </div>
                </div>

                {/* --- Organization / Licensing Manager --- */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18}/> District Licenses</h2>
                  </div>
                  
                  <div className="p-4 flex gap-3 border-b border-slate-100 bg-white">
                      <input 
                         id="new-org-name" 
                         type="text" 
                         placeholder="New District Name (e.g. Springfield USD)" 
                         className="p-3 border border-slate-300 rounded-xl flex-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      <input 
                         id="new-org-lic" 
                         type="number" 
                         placeholder="Total Licenses" 
                         className="p-3 border border-slate-300 rounded-xl w-40 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      <button 
                         onClick={() => {
                            const name = document.getElementById('new-org-name')?.value;
                            const lic = document.getElementById('new-org-lic')?.value;
                            handleCreateOrganization(name, lic);
                         }} 
                         className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                      >
                         Create District
                      </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-100">
                         {uniqueOrgIds.map(orgId => {
                            const orgData = organizations.find(o => o.id === orgId) || {};
                            return (
                                <tr key={orgId} className="hover:bg-slate-50 transition-colors">
                                   <td className="p-4">
                                      <div className="font-bold text-slate-800">{orgData.name || 'Unnamed District'}</div>
                                      <div className="text-xs text-slate-400 font-mono">ID: {orgId}</div>
                                   </td>
                                   <td className="p-4 w-48">
                                      <div className="flex items-center gap-2">
                                         <input 
                                            id={`lic-${orgId}`} 
                                            defaultValue={orgData.licenses || 0} 
                                            type="number" 
                                            className="p-2 border border-slate-300 rounded-lg w-20 text-sm text-center font-mono outline-none focus:border-blue-500" 
                                         />
                                         <span className="text-xs font-bold text-slate-500 uppercase">Licenses</span>
                                      </div>
                                   </td>
                                   <td className="p-4 text-right w-32">
                                      <button 
                                         onClick={() => handleUpdateOrgLicense(orgId, document.getElementById(`lic-${orgId}`).value)} 
                                         className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                                      >
                                         Save
                                      </button>
                                   </td>
                                </tr>
                            );
                         })}
                         {uniqueOrgIds.length === 0 && (
                            <tr><td colSpan="3" className="p-8 text-center text-slate-400">No districts have been created yet.</td></tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* --- User Roster Manager --- */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18}/> All Registered Users ({systemUsers.length})</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="p-4 font-bold">User Details</th>
                          <th className="p-4 font-bold">Assigned District (orgId)</th>
                          <th className="p-4 font-bold">Permissions Role</th>
                          <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {systemUsers.map(sysUser => (
                          <tr key={sysUser.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-800">{sysUser.email}</div>
                              <div className="text-xs text-slate-500">{sysUser.name || 'No Name'} • {sysUser.uid.substring(0,8)}...</div>
                            </td>
                            <td className="p-4">
                              <select 
                                id={`org-${sysUser.uid}`}
                                defaultValue={sysUser.orgId} 
                                className="w-full max-w-[200px] p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                              >
                                <option value="pending">Pending</option>
                                {organizations.map(o => (
                                  <option key={o.id} value={o.id}>{o.name || o.id}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-4">
                              <select 
                                id={`role-${sysUser.uid}`}
                                defaultValue={sysUser.role}
                                className="w-full max-w-[150px] p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                              >
                                <option value="teacher">Teacher</option>
                                <option value="district_admin">District Admin</option>
                                <option value="super_admin">Super Admin</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => handleUpdateSystemUser(
                                  sysUser.uid, 
                                  document.getElementById(`role-${sysUser.uid}`).value, 
                                  document.getElementById(`org-${sysUser.uid}`).value
                                )}
                                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-sm transition-colors"
                              >
                                Save Changes
                              </button>
                            </td>
                          </tr>
                        ))}
                        {systemUsers.length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400">Loading users...</td>
                          </tr>
                        )}
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

      {/* 1. New Student Profile Modal */}
      {showNewStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Add Student</h3>
                <p className="text-blue-100 text-sm mt-1">Create a new profile on your caseload.</p>
              </div>
              <button onClick={() => setShowNewStudentModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Student Name</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={newStudentName} 
                    onChange={e => setNewStudentName(e.target.value)} 
                    placeholder="e.g. Jane Doe" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
               </div>
               
               <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-start gap-2 mt-4">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>Adding a student attempts to assign <strong>1 License</strong> from your district quota. If no licenses are available, the profile will be created as "Unlicensed".</p>
               </div>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowNewStudentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Create Profile</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Invite Teacher Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Invite Teacher</h3>
                <p className="text-blue-100 text-sm mt-1">Add a staff member to your district.</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleInviteTeacher} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Teacher's Email Address</label>
                  <input 
                    type="email" 
                    required 
                    autoFocus
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="teacher@school.edu" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
               </div>
               
               <p className="text-sm text-slate-500">When they sign in with this email, they will automatically be assigned to <b>{orgDetails?.name || userProfile?.orgId}</b>.</p>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Send Invite</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Pairing / Live Camera Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Pair Device</h3>
                <p className="text-slate-400 text-sm mt-1">Linking to {selectedStudent?.name}</p>
              </div>
              <button onClick={() => setShowPairingModal(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 text-center space-y-4">
               {/* Camera View */}
               <div className="relative w-full aspect-square md:aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  {/* Overlay scanning bracket */}
                  <div className="absolute inset-0 border-[12px] border-black/40 pointer-events-none flex items-center justify-center">
                     <div className="w-3/4 h-3/4 border-2 border-blue-500 rounded-xl relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 animate-pulse"></div>
                     </div>
                  </div>
                  {!streamRef.current && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <p className="text-sm">Requesting camera access...</p>
                     </div>
                  )}
               </div>
               
               <p className="text-sm text-slate-600 font-medium">Point your camera at the QR code displayed on the student's device.</p>
               
               <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-200"></div>
                 <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or enter manual code</span>
                 <div className="flex-grow border-t border-slate-200"></div>
               </div>

               <form onSubmit={handleManualLinkDevice} className="flex gap-2">
                  <input 
                     type="text" 
                     value={pairingCode}
                     onChange={e => setPairingCode(e.target.value)}
                     placeholder="10-character sync code" 
                     maxLength={10}
                     className="flex-1 p-3 border border-slate-300 rounded-xl text-center font-mono font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-blue-500" 
                     required
                  />
                  <button type="submit" className="px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Link</button>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. New Blank Master Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">New Master Page</h3>
                <p className="text-blue-100 text-sm mt-1">Create a layout to share with students.</p>
              </div>
              <button onClick={() => setShowNewPageModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreatePage} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Page Title</label>
                  <input 
                    type="text" 
                    required 
                    value={newPageTitle} 
                    onChange={e => setNewPageTitle(e.target.value)} 
                    placeholder="e.g. Science Class" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Emoji Icon</label>
                  <input 
                    type="text" 
                    required 
                    value={newPageIcon} 
                    onChange={e => setNewPageIcon(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-2xl" 
                  />
               </div>
               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowNewPageModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Create Page</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Existing Library Page Metadata Modal */}
      {editingLibraryPage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit Master Page Info</h3>
              </div>
              <button onClick={() => setEditingLibraryPage(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleUpdateLibraryPage} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Page Title</label>
                  <input 
                    type="text" 
                    required 
                    value={editingLibraryPage.label} 
                    onChange={e => setEditingLibraryPage({...editingLibraryPage, label: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Emoji Icon</label>
                  <input 
                    type="text" 
                    required 
                    value={editingLibraryPage.icon} 
                    onChange={e => setEditingLibraryPage({...editingLibraryPage, icon: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-2xl" 
                  />
               </div>
               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingLibraryPage(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">Save Changes</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Push Master Page to Student Modal */}
      {showPushModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Push Page to Device</h3>
                <p className="text-blue-100 text-sm mt-1">Send a library page to {selectedStudent?.name}</p>
              </div>
              <button onClick={() => setShowPushModal(false)} className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePushPageToStudent} className="p-6 space-y-6">
               
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Master Page from Library</label>
                  {library.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm border border-slate-200">
                          Your district library is empty. Go to the Library tab to create or upload a page first.
                      </div>
                  ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {library.map(lib => (
                              <label 
                                key={lib.id} 
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedLibraryPageId === lib.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                              >
                                  <input 
                                      type="radio" 
                                      name="pageToPush" 
                                      value={lib.id} 
                                      checked={selectedLibraryPageId === lib.id}
                                      onChange={(e) => setSelectedLibraryPageId(e.target.value)}
                                      className="w-4 h-4 accent-blue-600"
                                      required
                                  />
                                  <span className="text-2xl">{lib.icon}</span>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 truncate">{lib.label}</div>
                                      <div className="text-xs text-slate-500">{lib.tileCount || 0} Tiles</div>
                                  </div>
                              </label>
                          ))}
                      </div>
                  )}
               </div>

               <div className="pt-2 flex gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowPushModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={!selectedLibraryPageId || library.length === 0} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                      <Send size={18} /> Push to Device
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Camera Icon for the button
function ScanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}