const ByteArray = imports.byteArray
const Clutter = imports.gi.Clutter
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject
const Gio = imports.gi.Gio;
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

function loadFile(path, cancellable = null) {
    const file = Gio.File.new_for_path(path);
    return new Promise((resolve, reject) => {
        file.load_contents_async(cancellable, (source_object, res) => {
            try {
                const [,contents,] = source_object.load_contents_finish(res);
                resolve(ByteArray.toString(contents));
            } catch (e) {
                reject(e);
            }
        });
    });
}

async function getPower(cancellable = null) {
    const power = parseInt(await loadFile(FILE_PATH, cancellable));
    return power / 1000000;
}

// WattMeter object
var WattMeter = GObject.registerClass(
    class WattMeter extends PanelMenu.Button {
        _init() {
            super._init(St.Align.START);

            this.buttonText = new St.Label({text:_("(...)"), y_align: Clutter.ActorAlign.CENTER});
            this.add_actor(this.buttonText);
            this.cancellable = new Gio.Cancellable();
            this.interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, this._refresh.bind(this));
            this._refresh();
        }

        destroy() {
            GLib.source_remove(this.interval)
            this.cancellable.cancel();

            super.destroy();
        }

        _refresh() {
            getPower(this.cancellable).then(power => {
                this.buttonText.set_text(power.toFixed(2).toString() + 'w');
            }).catch(e => log(e.toString()));

            return true;
        }
    }
);
