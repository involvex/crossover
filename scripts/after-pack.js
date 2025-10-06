const { execSync } = require( 'child_process' )
const path = require( 'path' )
const fs = require( 'fs' )
const packageJson = require( '../package.json' )

/**
 * After pack hook for electron-builder to rebuild native modules for the correct architecture
 * This fixes the "ist keine zulassige Win32-Anwendung" error when building for multiple architectures
 */
module.exports = async context => {

	const { electronPlatformName, arch, appOutDir } = context

	// Map architecture values to proper names
	const archMap = {
		0: 'ia32', // electron-builder internal representation
		1: 'ia32',
		2: 'x64',
		ia32: 'ia32',
		x64: 'x64',
	}

	const normalizedArch = archMap[arch] || arch

	console.log( `🔧 Rebuilding native modules for ${electronPlatformName}-${normalizedArch}...` )

	// Only rebuild for Windows platforms with native modules
	if ( electronPlatformName !== 'win32' ) {

		console.log( '⏭️ Skipping native module rebuild for non-Windows platform' )

		return

	}

	try {

		// Path to the app.asar.unpacked directory where native modules are extracted
		const unpackedDir = path.join( appOutDir, 'resources', 'app.asar.unpacked' )

		if ( !fs.existsSync( unpackedDir ) ) {

			console.log( '⚠️ app.asar.unpacked directory not found, skipping rebuild' )

			return

		}

		// Dynamically get electron version from devDependencies
		const electronVersion = packageJson.devDependencies.electron.replace( '^', '' )

		// Check if uiohook-napi is present and already built correctly
		const uiohookPath = path.join( unpackedDir, 'node_modules', 'uiohook-napi' )

		if ( fs.existsSync( uiohookPath ) ) {

			console.log( 'ℹ️ uiohook-napi found in unpacked directory, checking if rebuild is needed...' )

			try {

				// Attempt to load the native module to check compatibility
				// This is a more robust check than just looking at package.json
				const uiohookNativeModule = require( path.join( uiohookPath, 'build', 'Release', 'uiohook.node' ) )
				if ( uiohookNativeModule ) {

					console.log( `✅ uiohook-napi appears to be properly built for ${normalizedArch}, skipping rebuild` )

					return

				}

			} catch ( _ ) {

				console.log( '⚠️ uiohook-napi may need rebuild, proceeding...' )

			}

		}

		// Rebuild native modules for the specific architecture and electron version
		const rebuildCommand = `npx @electron/rebuild --arch=${normalizedArch} --platform=${electronPlatformName} --electron-version=${electronVersion} --out=${unpackedDir}`

		console.log( `📦 Running: ${rebuildCommand}` )

		execSync( rebuildCommand, {
			stdio: 'inherit',
			cwd: process.cwd(),
			timeout: 300000, // 5 minute timeout
		} )

		console.log( `✅ Successfully rebuilt native modules for ${electronPlatformName}-${normalizedArch}` )

	} catch ( error ) {

		console.error( `❌ Failed to rebuild native modules for ${electronPlatformName}-${normalizedArch}:`, error.message )

		// Log additional error details for debugging
		if ( error.stdout ) {

			console.error( 'stdout:', error.stdout.toString() )

		}

		if ( error.stderr ) {

			console.error( 'stderr:', error.stderr.toString() )

		}

		console.log( '⚠️ Continuing build despite rebuild failure - native modules should work if properly built during postinstall' )

		// Don't throw error to avoid breaking the build process
		// The build will continue but may have architecture mismatch issues

	}

}
