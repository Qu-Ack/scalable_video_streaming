const videoUploadForm = document.querySelector("#upload_form");



// divide the file in chunks;
// send each chunk with it's own fetch request;






videoUploadForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const uploadFormData = new FormData(videoUploadForm);


    const CHUNKSIZE = 1024;
    let START = 0;
    const videoFile = uploadFormData.get("video_file");
    console.log(videoFile);
    const NUMBER_OF_CHUNKS = Math.ceil(videoFile.size / CHUNKSIZE)

    let chunks = [];

    for (let i = 0; i < NUMBER_OF_CHUNKS; i++) {
        const end = Math.min(START + CHUNKSIZE, videoFile.size);
        const chunk = videoFile.slice(START, end);
        chunks.push(chunk);
        START = end;
    }


    for (let i = 0; i < chunks.length; i++) {

        const metadata = {
            "Content-Type": "text/plain",
            "H-video-id": `${videoFile.name}_${videoFile.size}`,
            "H-chunk-number": NUMBER_OF_CHUNKS,
            "H-chunk-ind": i,
        }; 

        try {
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                headers: metadata,
                body: chunks[i]

            });
            if (!response.ok) console.log(`Error uploading chunk #${i}`);
            else console.log(`Uploaded chunk #${i}`);
        } catch (err) {
            console.error(`Error on chunk #${i}:`, err);
        }
    }



    console.log(chunks);

})
