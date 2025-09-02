const { ipcMain, screen } = require( 'electron' )
const preferences = require( './preferences' ).init()
const windows = require( './windows' )
const set = require( './set' ) // To update crosshair color

let detectionInterval
const DETECTION_INTERVAL_MS = 100 // Check every 100ms
const CAPTURE_SIZE = 50 // Capture a 50x50 pixel area around the crosshair

// Define the red color range for enemy health bars (adjust as needed)
const RED_MIN = 180
const RED_MAX = 255
const GREEN_MAX = 80
const BLUE_MAX = 80

const isRed = ( r, g, b ) =>
	r >= RED_MIN && r <= RED_MAX && g <= GREEN_MAX && b <= BLUE_MAX

// This function will be called by the IPC handler when image data is received from the renderer
const analyzeImageData = imageData => {

	const pixels = new Uint8ClampedArray( imageData.data ) // Convert Buffer to Uint8ClampedArray

	let redPixelCount = 0
	for ( let i = 0; i < pixels.length; i += 4 ) {

		const r = pixels[i]
		const g = pixels[i + 1]
		const b = pixels[i + 2]
		if ( isRed( r, g, b ) ) {

			redPixelCount++

		}

	}

	const totalPixels = CAPTURE_SIZE * CAPTURE_SIZE
	const redPixelPercentage = ( redPixelCount / totalPixels ) * 100

	const ENEMY_THRESHOLD_PERCENTAGE = 5 // If more than 5% of pixels are red, consider it an enemy

	if ( redPixelPercentage >= ENEMY_THRESHOLD_PERCENTAGE ) {

		set.rendererProperties( { '--reticle-fill-color': 'red' }, windows.win ) // Change to red

	} else {

		// Revert to original color
		set.rendererProperties(
			{ '--reticle-fill-color': preferences.value( 'crosshair.color' ) },
			windows.win,
		)

	}

}

// Placeholder for AI detection
const startAIDetection = () => {

	console.log( 'AI Detection started (future implementation)' )
	// In a real scenario, this would involve loading and running an AI model
	// For now, it just logs a message and doesn't change the crosshair color
	set.rendererProperties(
		{ '--reticle-fill-color': preferences.value( 'crosshair.color' ) },
		windows.win,
	)

}

const startDetection = () => {

	if ( detectionInterval ) {

		clearInterval( detectionInterval )

	}

	detectionInterval = setInterval( () => {

		const detectionMode = preferences.value( 'crosshair.detectionMode' )

		if ( detectionMode === 'off' ) {

			// If detection is off, ensure crosshair is original color and stop interval
			set.rendererProperties(
				{ '--reticle-fill-color': preferences.value( 'crosshair.color' ) },
				windows.win,
			)
			clearInterval( detectionInterval )
			detectionInterval = null

			return

		}

		if ( detectionMode === 'pixel' ) {

			const crosshairX = preferences.value( 'crosshair.positionX' )
			const crosshairY = preferences.value( 'crosshair.positionY' )

			if ( crosshairX === null || crosshairY === null ) {

				return // Crosshair position not set

			}

			const primaryDisplay = screen.getPrimaryDisplay()
			const { width, height } = primaryDisplay.size

			const captureRect = {
				x: Math.max( 0, crosshairX - CAPTURE_SIZE / 2 ),
				y: Math.max( 0, crosshairY - CAPTURE_SIZE / 2 ),
				width: CAPTURE_SIZE,
				height: CAPTURE_SIZE,
			}

			captureRect.x = Math.min( captureRect.x, width - CAPTURE_SIZE )
			captureRect.y = Math.min( captureRect.y, height - CAPTURE_SIZE )

			// Request screen capture from the renderer process, passing primaryDisplay.id
			windows.win.webContents.send(
				'request_screen_capture',
				captureRect,
				primaryDisplay.id,
			)

		} else if ( detectionMode === 'ai' ) {

			startAIDetection()

		}

	}, DETECTION_INTERVAL_MS )

}

const stopDetection = () => {

	if ( detectionInterval ) {

		clearInterval( detectionInterval )
		detectionInterval = null

	}

}

module.exports = {
	startDetection,
	stopDetection,
	analyzeImageData, // Export this to be called by the IPC handler in main.js
}
