const { ipcRenderer, desktopCapturer } = require('electron');

ipcRenderer.on('request_screen_capture', async (event, captureRect, primaryDisplayId) => {
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        console.log('Available screen sources:', sources);
        console.log('Primary display ID from main process:', primaryDisplayId);
        const primaryScreenSource = sources[0];

        if (!primaryScreenSource) {
            console.warn('Primary screen source not found.');
            ipcRenderer.send('screen_capture_error', 'Primary screen source not found.');
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: primaryScreenSource.id,
                    minWidth: captureRect.width,
                    minHeight: captureRect.height,
                    maxWidth: 8000, // Set a high max to get full resolution
                    maxHeight: 8000,
                }
            }
        });

        const video = document.createElement('video');
        video.style.position = 'fixed';
        video.style.top = '-10000px';
        video.style.left = '-10000px';
        document.body.append(video);

        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();

            const canvas = document.createElement('canvas');
            canvas.width = captureRect.width;
            canvas.height = captureRect.height;
            const ctx = canvas.getContext('2d');

            // Draw the specified portion of the video onto the canvas
            ctx.drawImage(video, captureRect.x, captureRect.y, captureRect.width, captureRect.height, 0, 0, captureRect.width, captureRect.height);

            const imageData = ctx.getImageData(0, 0, captureRect.width, captureRect.height);

            // Send the image data back to the main process
            ipcRenderer.send('screen_capture_data', {
                data: Array.from(imageData.data),
                width: imageData.width,
                height: imageData.height
            });

            // Stop the video stream and remove the video element
            stream.getTracks().forEach(track => track.stop());
            video.remove();
        };
        video.onerror = (e) => {
            ipcRenderer.send('screen_capture_error', 'Error with video element for screen capture.');
            stream.getTracks().forEach(track => track.stop());
            video.remove();
        }

    } catch (error) {
        console.error('Error during screen capture in renderer:', error);
        ipcRenderer.send('screen_capture_error', error.message);
    }
});
