const { shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("./log.cjs");
const preferences = require("./preferences.mjs");
const sound = require("./sound.mjs");
const windows = require("./windows.mjs");
const { is } = require("./util.mjs");
const dialog = require("./dialog.mjs");
const config = require("../config/config.mjs");
const { RELEASES_URL } = config;
const notification = require("./notification.mjs");
const dock = require("./dock.mjs");

const FOUR_HOURS = 1000 * 60 * 60 * 4;

const install = () => autoUpdater.quitAndInstall();

const onDownloadProgress = (progressObject) => {
	try {
		let message = "Download speed: " + progressObject.bytesPerSecond;
		message = message + " - Downloaded " + progressObject.percent + "%";
		message =
			message +
			" (" +
			progressObject.transferred +
			"/" +
			progressObject.total +
			")";
		log.info(message);

		// Dock progress bar
		windows.setProgress(progressObject.percent / 100);
	} catch (error) {
		log.error(error);
	}
};

const onUpdateAvailable = () => {
	try {
		sound.play("UPDATE");
		windows.win?.webContents.send("set_info_icon", "info");

		if (is.linux) {
			dialog.openUpdateDialog(() => {
				// AutoUpdater.downloadUpdate()
				shell.openExternal(RELEASES_URL);
			});
		}
	} catch (error) {
		log.error(error);
	}
};

const onUpdateDownloaded = () => {
	try {
		windows.setProgress(-1);
		dock.setBadge("!");
		notification({
			title: "CrossOver has been Updated",
			body: "Relaunch to take effect",
		});
		// sound.play( 'DONE' ) // uncomment if we make notification silent
	} catch (error) {
		log.error(error);
	}
};

const update = async () => {
	// Comment this before publishing your first version.
	// It's commented out as it throws an error if there are no published versions.

	// We trycatch here because appx throws errors
	try {
		const { checkboxTrue } = await import("../config/utils.mjs");
		if (checkboxTrue(preferences.value("app.updates"), "updates")) {
			log.info("Setting: Automatic Updates");

			autoUpdater.logger = log;
			autoUpdater.on("update-available", autoUpdate.onUpdateAvailable);

			if (is.linux) {
				return;
			}

			autoUpdater.on("download-progress", autoUpdate.onDownloadProgress);

			autoUpdater.on("update-downloaded", autoUpdate.onUpdateDownloaded);

			setInterval(() => {
				autoUpdater.checkForUpdates();
			}, FOUR_HOURS);

			autoUpdater.checkForUpdatesAndNotify();
		}
	} catch (error) {
		log.error(error);
	}
};

const autoUpdate = {
	install,
	onDownloadProgress,
	onUpdateAvailable,
	onUpdateDownloaded,
	update,
};
module.exports = autoUpdate;
