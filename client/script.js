// Client-side script.js
document.getElementById("overleafForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting the usual way

    const projectUrl = document.getElementById("projectUrl").value;

    // Show the loader
    const loader = document.getElementById("loader");
    loader.style.display = 'block';

    // Prepare the data to be sent in the POST request
    const data = { url: projectUrl };

    // Send a POST request to the backend using Fetch API
    fetch(`https://fresh-leaf-production.up.railway.app/download-resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob(); // Return the response as a Blob
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob); // Create a URL for the Blob
        const a = document.createElement('a'); // Create an anchor element
        a.href = url; // Set the href to the Blob URL
        a.download = 'resume.pdf'; // Set the file name for the download
        document.body.appendChild(a); // Append to the body
        a.click(); // Trigger the download
        a.remove(); // Remove the anchor element
        window.URL.revokeObjectURL(url); // Release the Blob URL
        console.log("File downloaded successfully.");
    })
    .catch(error => {
        console.error('Error:', error); // Log any errors
    })
    .finally(() => {
        // Hide the loader after the fetch operation
        loader.style.display = 'none';
    });
});
