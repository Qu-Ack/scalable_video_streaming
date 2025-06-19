const videoUploadForm = document.querySelector("#upload_form");
let isPaused = false, shouldCancel = false;
let current = 0, inFlight = 0;

const CONCURRENCY = 3;
let chunks = [], videoFile, NUMBER_OF_CHUNKS;

let failedChunks = [];

document.querySelector("#pause_button").onclick = () => isPaused = true;
document.querySelector("#resume_button").onclick = () => { isPaused = false; pump(); };

videoUploadForm.addEventListener("submit", async event => {
  event.preventDefault();
  const file = videoUploadForm.video_file.files[0];
  videoFile = file;
  const CHUNK_SIZE = 1024 * 1024; // 1 MB
  NUMBER_OF_CHUNKS = Math.ceil(file.size / CHUNK_SIZE);

  chunks = Array.from({ length: NUMBER_OF_CHUNKS }, (_, i) =>
    file.slice(i * CHUNK_SIZE, Math.min(file.size, (i + 1) * CHUNK_SIZE))
  );

  current = inFlight = 0;
  shouldCancel = false;
  uploadHandler();
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

let CONCURRENT_REQ_NUM = 3;

async  function uploadHandler() {
  let start = 0;


  while (start < NUMBER_OF_CHUNKS) {
    await ConcurrentChunkUpload(start, CONCURRENT_REQ_NUM);
    start += CONCURRENT_REQ_NUM;
  }

}


async function ConcurrentChunkUpload(startingIdx) {
  let temp = CONCURRENT_REQ_NUM;

  while (startingIdx + CONCURRENT_REQ_NUM - 1 >= chunks.length) {
    CONCURRENT_REQ_NUM--; 
  }

  let headers = {
    "Content-Type": "application/octet-stream",
    "H-video-id": `${videoFile.name}_${videoFile.size}`,
    "H-chunk-number": NUMBER_OF_CHUNKS,
    "H-chunk-ind": -1,
    "H-file-type": videoFile.type
  };

  let promiseArray = [];

  for (let i = 0; i < CONCURRENT_REQ_NUM; i++)
  {
    let fetchPromise = fetch("http://localhost:8000/upload",
      {
        method: "POST",
        body: chunks[startingIdx + i],
        headers: { ...headers, "H-chunk-ind": startingIdx + i },
      }
    )

    promiseArray.push(fetchPromise);
  }

  const result = await Promise.allSettled(promiseArray);

  CONCURRENT_REQ_NUM = temp;

  for (let i = 0; i < result.length; i++)
  {
    if (result[i].status == "fulfilled") 
    {
      console.log(`successfully uploaded ${startingIdx + i + 1}th chunk`);
    } else {
      console.log(`failed to upload ${startingIdx + i + 1}th chunk, pushed to failed chunks`);
      failedChunks.push(startingIdx + i);
    }
  }


  // debugger;
}


