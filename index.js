const videoUploadForm = document.querySelector("#upload_form");
let isPaused = false, shouldCancel = false;
let current = 0, inFlight = 0;

const CONCURRENCY = 8;
let chunks = [], videoFile, NUMBER_OF_CHUNKS;

document.querySelector("#pause_button").onclick = () => isPaused = true;
document.querySelector("#resume_button").onclick = () => { isPaused = false; pump(); };

videoUploadForm.addEventListener("submit", async event => {
  event.preventDefault();
  const file = videoUploadForm.video_file.files[0];
  videoFile = file;
  const CHUNK_SIZE = 1024 * 1024; // 1 MB
  NUMBER_OF_CHUNKS = Math.ceil(file.size / CHUNK_SIZE);

  // Split file into chunks
  chunks = Array.from({ length: NUMBER_OF_CHUNKS }, (_, i) =>
    file.slice(i * CHUNK_SIZE, Math.min(file.size, (i + 1) * CHUNK_SIZE))
  );

  current = inFlight = 0;
  shouldCancel = false;
  pump();
});

async function pump() {
  if (shouldCancel) {
    console.log("Upload cancelled");
    return;
  }
  while (!isPaused && inFlight < CONCURRENCY && current < NUMBER_OF_CHUNKS) {
    uploadOne(current++);
  }
}

async function uploadOne(idx) {
  inFlight++;
  const chunk = chunks[idx];
  const headers = {
    "Content-Type": "application/octet-stream",
    "H-video-id": `${videoFile.name}_${videoFile.size}`,
    "H-chunk-number": NUMBER_OF_CHUNKS,
    "H-chunk-ind": idx,
    "H-file-type": videoFile.type
  };

  try {
    const res = await fetch('http://localhost:8000/upload', {
      method: 'POST', headers, body: chunk
    });
    if (!res.ok) console.error(`Chunk ${idx} failed`);
    else console.log(`Chunk ${idx} uploaded`);
  } catch (err) {
    console.error(`Chunk ${idx} error:`, err);
    current = Math.min(current, idx); // retry later
  } finally {
    inFlight--;
    if (current < NUMBER_OF_CHUNKS) pump();
    else if (inFlight === 0) console.log("All chunks done!");
  }
}
