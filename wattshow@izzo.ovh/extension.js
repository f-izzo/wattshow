const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

const Clutter = imports.gi.Clutter

const FILE_PATH = "/sys/class/power_supply/BAT0/power_now";

let meta;
let wattmeter;
let label;
let interval;

// WattMeter object
function WattMeter(metadata)
{
    this.meta = metadata;
    this._init();
}

// WattMeter methods
WattMeter.prototype =
{
    __proto__: PanelMenu.Button.prototype,
        _init: function()
        {

            log("Executing init function");
            this.filePath = FILE_PATH;

            //Button ui
            PanelMenu.Button.prototype._init.call(this, St.Align.START);
            this.mainBox = null;
            log('test');
            this.buttonText = new St.Label({text:_("(...)"), y_align: Clutter.ActorAlign.CENTER});
            this.actor.add_actor(this.buttonText);
            log('Init refreshing');
            this._refresh();
            this.connect('activate',function()
            {
                this._refresh();
            });

        },

        _refresh: function()
        {
            //log('refreshing')

            let temp = this.buttonText;
            let power = 0;
            let power_text = '';

            // Sync
            if (checkFile(this.filePath) == 1)
            {
                power = Shell.get_file_contents_utf8_sync(this.filePath);
            }
            else
            {
                log('Error reading file ' + this.filePath);
            }
            power=power/1000000;
            power=power.toFixed(2);
            power_text=power.toString();
            temp.set_text(power_text+'w');

            return true;
        },

        _enable: function()
        {
            if (!this.interval) {
                this.interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000,
                                            Lang.bind(this, this._refresh));
            }
        },

        _disable: function()
        {
            GLib.source_remove(this.interval)
            this.interval = null;
        }
}

function checkFile(filename)
{
    //Checks for the existance of a file
    if (GLib.file_test(filename, GLib.FileTest.EXISTS))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

// Shell entry points
function init(metadata)
{
        meta = metadata;
}

function enable()
{
    wattmeter = new WattMeter(meta);
    wattmeter._enable();
    Main.panel.addToStatusArea('wattmeter', wattmeter);
}

function disable()
{
    wattmeter._disable();
    wattmeter.destroy();
    wattmeter = null;
}
