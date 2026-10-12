import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import App from './App.jsx';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
    background: '#f3f6fb',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#172033',
  },
  card: {
    width: '100%',
    maxWidth: 470,
    boxSizing: 'border-box',
    padding: 30,
    background: '#fff',
    border: '1px solid #e3e8f0',
    borderRadius: 18,
    boxShadow: '0 12px 36px rgba(25,45,80,.08)',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 13px',
    border: '1px solid #cbd5e1',
    borderRadius: 9,
    fontSize: 15,
    marginTop: 6,
  },
  button: {
    width: '100%',
    padding: 13,
    border: 0,
    borderRadius: 9,
    background: '#2457d6',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondary: {
    border: 0,
    background: 'transparent',
    color: '#2457d6',
    cursor: 'pointer',
    padding: '8px 0',
    fontSize: 14,
  },
};

const roleNames = {
  student: 'Student',
  proctor: 'Proctor',
  in_charge: 'Event In-Charge',
  admin: 'Administrator',
};

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // The login form is displayed immediately.
  const [mode, setMode] = useState('login');
  const [selectedRole, setSelectedRole] = useState('student');

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [groupName, setGroupName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [editProfile, setEditProfile] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function clearMessages() {
    setError('');
    setMessage('');
  }

  async function loadProfile(userId) {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, roll_number, role, group_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!data) {
      throw new Error(
        'Your profile was not found. Check your Supabase profile-creation trigger.'
      );
    }

    setProfile(data);
    setFullName(data.full_name || '');
    setRollNumber(data.roll_number || '');
    setGroupName(data.group_name || '');

    return data;
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!active) return;

        const currentSession = data.session || null;
        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load your account.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setEditProfile(false);
        setLoading(false);
        return;
      }

      // Defer database queries until after the auth callback.
      Promise.resolve().then(async () => {
        if (!active) return;

        setLoading(true);

        try {
          await loadProfile(nextSession.user.id);
        } catch (err) {
          if (active) {
            setError(err.message || 'Could not load your profile.');
          }
        } finally {
          if (active) setLoading(false);
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function chooseRole(role) {
    setSelectedRole(role);
    clearMessages();
  }

  function startSignup(role) {
    setSelectedRole(role);
    setMode('signup');
    setFullName('');
    setRollNumber('');
    setGroupName('');
    setPassword('');
    clearMessages();
  }

  function startLogin(role = selectedRole) {
    setSelectedRole(role);
    setMode('login');
    setPassword('');
    clearMessages();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }

        if (!rollNumber.trim()) {
          throw new Error(
            selectedRole === 'student'
              ? 'Please enter your college roll number.'
              : 'Please enter your staff ID.'
          );
        }

        if (!groupName.trim()) {
          throw new Error('Please enter your class or assigned group.');
        }

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.');
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              roll_number: rollNumber.trim(),
              group_name: groupName.trim(),
              role: selectedRole,
            },
          },
        });

        if (signupError) throw signupError;

        if (data.session) {
          setMessage('Account created. Loading your dashboard...');
        } else {
          setMode('login');
          setPassword('');
          setMessage(
            'Registration received. Verify your email if required, then log in.'
          );
        }
      } else if (mode === 'login') {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;

        // Verify the saved role before allowing the selected login type.
        const { data: savedProfile, error: lookupError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (lookupError) {
          await supabase.auth.signOut();
          throw lookupError;
        }

        if (!savedProfile) {
          await supabase.auth.signOut();
          throw new Error(
            'Your profile was not found. Check your Supabase setup.'
          );
        }

        if (savedProfile.role !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error(
            `This account is registered as ${
              roleNames[savedProfile.role] || savedProfile.role
            }. Please select the correct account type.`
          );
        }
      } else if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: window.location.origin,
          }
        );

        if (resetError) throw resetError;

        setMessage(
          'If an account exists for that email, a password-reset link will be sent.'
        );
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    clearMessages();

    if (!session?.user || !fullName.trim() || !rollNumber.trim()) {
      setError('Please enter your name and ID.');
      return;
    }

    setBusy(true);

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          roll_number: rollNumber.trim(),
          group_name: groupName.trim() || null,
        })
        .eq('id', session.user.id)
        .select('id, full_name, roll_number, role, group_name')
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      setEditProfile(false);
      setMessage('Your details have been updated.');
    } catch (err) {
      setError(`Could not save your details: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    clearMessages();

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) setError(logoutError.message);
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading your TechPermit account...</p>
      </main>
    );
  }

  // Authenticated user: preserve the existing dashboard.
  if (session && profile) {
    const isStudent = profile.role === 'student';

    return (
      <div>
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 18px',
            background: '#fff',
            borderBottom: '1px solid #e3e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
          }}
        >
          <div>
            <strong>{profile.full_name || 'Name not set'}</strong>
            {' · '}
            <strong>
              {isStudent ? 'Roll No: ' : 'Staff ID: '}
              {profile.roll_number || 'Not set'}
            </strong>

            <div style={{ color: '#64748b', marginTop: 4 }}>
              {roleNames[profile.role] || 'Student'}
              {profile.group_name ? ` · ${profile.group_name}` : ''}
              {' · '}
              {session.user.email}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={styles.secondary}
              onClick={() => {
                setFullName(profile.full_name || '');
                setRollNumber(profile.roll_number || '');
                setGroupName(profile.group_name || '');
                setEditProfile(!editProfile);
                clearMessages();
              }}
            >
              {editProfile ? 'Cancel edit' : 'Edit my details'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{ ...styles.secondary, fontWeight: 700 }}
            >
              Log out
            </button>
          </div>
        </header>

        {error && (
          <p role="alert" style={{ padding: 12, color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {message && (
          <p role="status" style={{ padding: 12, color: '#166534' }}>
            {message}
          </p>
        )}

        {editProfile && (
          <form
            onSubmit={saveProfile}
            style={{
              ...styles.card,
              maxWidth: 500,
              margin: '20px auto',
            }}
          >
            <h2>Update your details</h2>

            <label style={{ display: 'block', marginBottom: 16 }}>
              Full name
              <input
                style={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              {isStudent ? 'College roll number' : 'Staff ID'}
              <input
                style={styles.input}
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              {isStudent ? 'Class / Group' : 'Assigned student group'}
              <input
                style={styles.input}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </label>

            <button type="submit" disabled={busy} style={styles.button}>
              {busy ? 'Saving...' : 'Save details'}
            </button>
          </form>
        )}

        <App user={profile} />
      </div>
    );
  }

  const roleTitle = roleNames[selectedRole];

  // Single login/registration page with role choices always visible.
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            background: '#e9efff',
            color: '#2457d6',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: 20,
            marginBottom: 18,
          }}
        >
          TP
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 29 }}>TechPermit</h1>

        <p style={{ color: '#64748b', lineHeight: 1.5, marginTop: 0 }}>
          Technical Event Participation Approval Portal
        </p>

        <h2 style={{ fontSize: 21, marginTop: 25 }}>
          {mode === 'signup'
            ? `Create ${selectedRole} account`
            : mode === 'reset'
            ? 'Reset your password'
            : 'Welcome back!'}
        </h2>

        <p style={{ color: '#64748b', fontSize: 14 }}>
          {mode === 'signup'
            ? 'Fill in your details to register.'
            : mode === 'reset'
            ? 'Enter your email to receive a reset link.'
            : 'Choose your account type to continue.'}
        </p>

        {/* Student / Proctor selection directly on the login page */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            margin: '18px 0 22px',
          }}
        >
          {[
            { role: 'student', icon: '🎓', title: 'Student' },
            { role: 'proctor', icon: '🧑‍🏫', title: 'Proctor' },
          ].map((item) => {
            const active = selectedRole === item.role;

            return (
              <button
                key={item.role}
                type="button"
                onClick={() => chooseRole(item.role)}
                style={{
                  padding: '14px 8px',
                  borderRadius: 11,
                  border: active ? '2px solid #2457d6' : '1px solid #cbd5e1',
                  background: active ? '#eff4ff' : '#fff',
                  color: active ? '#2457d6' : '#475569',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{ display: 'block', fontSize: 25, marginBottom: 5 }}
                >
                  {item.icon}
                </span>
                {item.title}
                {active ? ' ✓' : ''}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={{ display: 'block', marginBottom: 15 }}>
                Full name
                <input
                  style={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>

              <label style={{ display: 'block', marginBottom: 15 }}>
                {selectedRole === 'student'
                  ? 'College roll number'
                  : 'Staff ID'}
                <input
                  style={styles.input}
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  maxLength={50}
                  required
                />
              </label>

              <label style={{ display: 'block', marginBottom: 15 }}>
                {selectedRole === 'student'
                  ? 'Class / Group'
                  : 'Assigned student group'}
                <input
                  style={styles.input}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. CSE-A"
                  maxLength={100}
                  required
                />
              </label>
            </>
          )}

          <label style={{ display: 'block', marginBottom: 15 }}>
            College email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          {mode !== 'reset' && (
            <label style={{ display: 'block', marginBottom: 19 }}>
              Password
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                minLength={mode === 'signup' ? 8 : undefined}
                required
              />
              {mode === 'signup' && (
                <small style={{ color: '#64748b' }}>
                  At least 8 characters.
                </small>
              )}
            </label>
          )}

          {error && (
            <p
              role="alert"
              style={{
                color: '#b91c1c',
                background: '#fef2f2',
                padding: 10,
                borderRadius: 8,
                fontSize: 13,
                overflowWrap: 'anywhere',
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              style={{
                color: '#166534',
                background: '#f0fdf4',
                padding: 10,
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              ...styles.button,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? 'Please wait...'
              : mode === 'login'
              ? `Login as ${roleTitle}`
              : mode === 'signup'
              ? `Register as ${roleTitle}`
              : 'Send reset link'}
          </button>
        </form>

        {mode === 'login' && (
          <div style={{ marginTop: 13, textAlign: 'right' }}>
            <button
              type="button"
              style={styles.secondary}
              onClick={() => {
                setMode('reset');
                clearMessages();
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            paddingTop: 15,
            borderTop: '1px solid #e3e8f0',
            display: 'grid',
            gap: 10,
          }}
        >
          {mode === 'login' ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, color: '#475569' }}>
                  New student?
                </span>
                <button
                  type="button"
                  style={{ ...styles.secondary, fontWeight: 700 }}
                  onClick={() => startSignup('student')}
                >
                  Student Register →
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, color: '#475569' }}>
                  New proctor?
                </span>
                <button
                  type="button"
                  style={{ ...styles.secondary, fontWeight: 700 }}
                  onClick={() => startSignup('proctor')}
                >
                  Proctor Register →
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              style={styles.secondary}
              onClick={() => startLogin()}
            >
              ← Back to login
            </button>
          )}
        </div>

        {mode === 'signup' && (
          <p
            style={{
              fontSize: 12,
              color: '#64748b',
              marginTop: 18,
              lineHeight: 1.5,
            }}
          >
            Registration is open for both account types. Enter the correct group
            so requests can be routed properly.
          </p>
        )}
      </section>
    </main>
  );
}
