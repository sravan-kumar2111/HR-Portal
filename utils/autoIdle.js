// Browser-side auto idle helper.
// Use this in the front-end to detect 5 minutes of inactivity,
// auto-start idle, and require manual end with a selected reason.

const ALLOWED_IDLE_REASONS = [
  "Break",
  "Washroom",
  "Drinking Water",
  "Meeting",
  "Doubts",
  "Others"
];

function createAutoIdleTracker({
  employeeId,
  idleDelayMs = 5 * 60 * 1000,
  startIdlePath = "/startIdleTime",
  endIdlePath = "/endIdleTime",
  onIdleStarted = () => {},
  onIdleEnded = () => {},
  onError = (err) => { console.error(err); }
} = {}) {
  let idleTimer = null;
  let idleActive = false;

  if (!employeeId) {
    throw new Error("employeeId is required");
  }

  const apiPost = async (path, body) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed ${res.status}: ${text}`);
    }
    return res.json();
  };

  const resetTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }

    if (!idleActive) {
      idleTimer = setTimeout(async () => {
        try {
          await apiPost(startIdlePath, { employeeId });
          idleActive = true;
          onIdleStarted();
        } catch (err) {
          onError(err);
        }
      }, idleDelayMs);
    }
  };

  const activityEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart"
  ];

  const handleUserActivity = () => {
    if (!idleActive) {
      resetTimer();
    }
  };

  const startListening = () => {
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, true);
    });
    resetTimer();
  };

  const stopListening = () => {
    activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, handleUserActivity, true);
    });
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const endIdle = async (reason) => {
    if (!idleActive) {
      return;
    }

    if (!reason || !ALLOWED_IDLE_REASONS.includes(reason)) {
      throw new Error(`reason must be one of: ${ALLOWED_IDLE_REASONS.join(", ")}`);
    }

    const result = await apiPost(endIdlePath, {
      employeeId,
      reason
    });
    idleActive = false;
    resetTimer();
    onIdleEnded(result);
    return result;
  };

  return {
    start: startListening,
    stop: stopListening,
    endIdle,
    isIdleActive: () => idleActive,
    ALLOWED_IDLE_REASONS
  };
}

module.exports = {
  createAutoIdleTracker,
  ALLOWED_IDLE_REASONS
};
