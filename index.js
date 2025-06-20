const videoUploadForm = document.querySelector("#upload_form");
const resumeButton = document.querySelector("#resume_button");
const pauseButton = document.querySelector("#pause_button");
let isPaused = false, shouldCancel = false;
let current = 0, inFlight = 0;
let LAST_UPLOADED_IDX = -1;

const CONCURRENCY = 5;
let chunks = [], videoFile, NUMBER_OF_CHUNKS;

let failedChunks = [];

pauseButton.addEventListener("click", () => {
  console.log("pause clicked");

  isPaused = true;
})

resumeButton.addEventListener("click", () => {
  console.log("upload resumed");
  isPaused = false;

  uploadHandler(Math.max(LAST_UPLOADED_IDX - CONCURRENCY, 0));
})


videoUploadForm.addEventListener("submit", async event => {
  event.preventDefault();
  const file = videoUploadForm.video_file.files[0];
  videoFile = file;

  if (!videoFile) {
    console.log("no video file present!");
    return;
  }

  const CHUNK_SIZE = 1024 * 1024; // 1 MB
  NUMBER_OF_CHUNKS = Math.ceil(file.size / CHUNK_SIZE);

  chunks = Array.from({ length: NUMBER_OF_CHUNKS }, (_, i) =>
    file.slice(i * CHUNK_SIZE, Math.min(file.size, (i + 1) * CHUNK_SIZE))
  );


  uploadHandler(0);
});


let CONCURRENT_REQ_NUM = 3;

async function uploadHandler(startidx) {
  let start = startidx;

  while (start < NUMBER_OF_CHUNKS) {
    if (isPaused) {
      break;
    }

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



  if (failedChunks.length < 0) {

    let failedChunkPromises = [];
    console.log("uploading failed chunks first..");

    for (let i = 0; i < failedChunks.length; i++) {
      failedChunkPromises.push(
        fetch("http://localhost:8080/upload", {
          method: "POST",
          body: chunks[failedChunks[i]],
          headers: {...headers, "H-chunk-ind": failedChunks[i]},
        })
      )
    }  

    
    const result = await Promise.allSettled(promiseArray);

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


  }


  let promiseArray = [];


  for (let i = 0; i < CONCURRENT_REQ_NUM; i++)
  {
    promiseArray.push(fetch("http://localhost:8000/upload",
      {
        method: "POST",
        body: chunks[startingIdx + i],
        headers: { ...headers, "H-chunk-ind": startingIdx + i },
      }
    ))

  }

  if (isPaused) {
    return;
  }

  const result = await Promise.allSettled(promiseArray);

  CONCURRENT_REQ_NUM = temp;

  for (let i = 0; i < result.length; i++)
  {
    if (result[i].status == "fulfilled") 
    {
      LAST_UPLOADED_IDX = startingIdx + i;
      console.log(`successfully uploaded ${startingIdx + i + 1}th chunk`);
    } else {
      console.log(`failed to upload ${startingIdx + i + 1}th chunk, pushed to failed chunks`);
      failedChunks.push(startingIdx + i);
    }
  }


  // debugger;
}


