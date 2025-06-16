const videoUploadForm = document.querySelector("#upload_form");


videoUploadForm.addEventListener("submit", function(event){
    event.preventDefault();
    const uploadFormData = new FormData(videoUploadForm);
    console.log(uploadFormData.get("video_file"));
})
