const http = require('http');

async function postAlert(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("=== Testing Zone Alert Deduplication & Incident Reason ===");
  const testAlert1 = {
    cameraKey: "CAM-SG89D3",
    eventType: "ZONE_ENTRY",
    category: "RESTRICTED_ZONE_ENTRY",
    zoneName: "Server Room Vault",
    trackId: 101,
    message: "Person entered Server Room Vault.",
    reason: "Target #101 entered restricted boundary [Server Room Vault] without authorization."
  };

  console.log("\n1. Sending initial Zone Entry alert for Target #101...");
  const res1 = await postAlert(testAlert1);
  console.log("Response 1:", {
    success: res1.success,
    duplicate: res1.duplicate,
    reason: res1.data?.reason,
    category: res1.data?.category,
    message: res1.data?.message
  });

  console.log("\n2. Sending immediate repeat Zone Dwell alert (simulating same person in zone with new track/dwell)...");
  const testAlert2 = {
    cameraKey: "CAM-SG89D3",
    eventType: "ZONE_DWELL",
    category: "ZONE_LOITERING_DWELL",
    zoneName: "Server Room Vault",
    trackId: 102, // ByteTrack ID drift / flip simulation
    message: "Person loitering in Server Room Vault (12s dwell).",
    reason: "Target #102 remained stationary in [Server Room Vault] for 12s, exceeding maximum allowed dwell limit."
  };

  const res2 = await postAlert(testAlert2);
  console.log("Response 2:", {
    success: res2.success,
    duplicate: res2.duplicate,
    message: res2.message
  });

  if (res1.success && !res1.duplicate && res2.duplicate === true) {
    console.log("\n SUCCESS: First alert created with reason, second alert correctly suppressed by 30s zone cooldown!");
  } else {
    console.log("\n⚠️ Check responses above for unexpected status.");
  }
}

run().catch(console.error);
