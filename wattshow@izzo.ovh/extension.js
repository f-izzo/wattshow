const Clutter = imports.gi.Clutter
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const FILE_PATH = "/sys/class/power_supply/BAT0/power_now";

let wattmeter = null;

// Shell entry points
function init() {
}

function enable() {
    wattmeter = new WattMeter();
    Main.panel.addToStatusArea('wattmeter', wattmeter);
}

function disable()
{
    wattmeter.destroy();
    wattmeter = null;
}

// WattMeter object
var WattMeter = GObject.registerClass(
    class WattMeter extends PanelMenu.Button {
        _init() {
            super._init(St.Align.START);

            this.buttonText = new St.Label({text:_("(...)"), y_align: Clutter.ActorAlign.CENTER});
            this.add_actor(this.buttonText);
            this.interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, this._refresh.bind(this));
            this._refresh();
        }

        destroy() {
            GLib.source_remove(this.interval)

            super.destroy();
        }

        _refresh() {
            let power = 0;

            if (GLib.file_test(FILE_PATH, GLib.FileTest.EXISTS)) {
                power = Shell.get_file_contents_utf8_sync(FILE_PATH);
            } else {
                log('Error reading file ' + FILE_PATH);
            }

            this.buttonText.set_text((power / 1000000).toFixed(2).toString() + 'w');

            return true;
        }
    }
);
