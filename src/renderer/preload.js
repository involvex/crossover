// Via https://github.com/reZach/secure-electron-template
console.log('--- preload.js: START ---');
const electron = require('electron');
const { contextBridge, ipcRenderer, desktopCapturer } = electron;

const config = require( '../config/config.js' )
const { debounce } = require( '../config/utils.js' )
const { play: playSound, preload: preloadSounds } = require( './lib/sounds.js' )

// Require the screen capture script to ensure its IPC listeners are set up


const api = {
	test: 'test',
	config,
	debounce,
	isMacOs: navigator.userAgent.indexOf( 'Mac' ) !== -1,
	isWindows: navigator.userAgent.indexOf( 'Win' ) !== -1,
	playSound,
	preloadSounds,
	desktopCapturer,

	send( channel, ...args ) {

		// Whitelist channels
		const validChannels = new Set( [
			'center_window', 'close_window', 'error', 'focus_window', 'log', 'save_custom_image', 'open_chooser', 'open_settings', 'quit',
            'screen_capture_data', 'screen_capture_error' // Add new channels for screen capture
		] )

		if ( validChannels.has( channel ) ) {

			ipcRenderer.send( channel, ...args )

		} else {

			console.warn( `Renderer refused to send IPC message on ${channel}` )

		}

	},

	receive( channel, func ) {

		const validChannels = new Set( [
			'add_class', 'remove_class', 'notify', 'lock_window', 'preload_sounds', 'play_sound', 'set_crosshair', 'set_info_icon', 'set_properties', 'set_reticle',
            'request_screen_capture' // Add new channel for screen capture request
		] )

		if ( validChannels.has( channel ) ) {

			// Deliberately strip event as it includes `sender`
			ipcRenderer.on( channel, ( event, ...args ) => func( ...args ) )

		} else {

			console.warn( `Renderer refused to receive IPC message on ${channel}` )

		}

	},

}

contextBridge.exposeInMainWorld( 'crossover', api )
console.log('--- preload.js: END ---');
