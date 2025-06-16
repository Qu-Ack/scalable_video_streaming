const videoUploadForm = document.querySelector("#upload_form");



// divide the file in chunks;
// send each chunk with it's own fetch request;






videoUploadForm.addEventListener("submit", function(event){
    event.preventDefault();
    const uploadFormData = new FormData(videoUploadForm);


    const CHUNKSIZE = 1024;
    let START = 0;
    const videoFile = uploadFormData.get("video_file");
    const NUMBER_OF_CHUNKS = Math.ceil(videoFile.size / CHUNKSIZE)

    let chunks = [];

    for (let i = 0; i < NUMBER_OF_CHUNKS; i++) {
        const end = Math.min(START + CHUNKSIZE, videoFile.size);
        const chunk = videoFile.slice(START, end);
        chunks.push(chunk);
        START = end; 
    }

    console.log(chunks);

})
